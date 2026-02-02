import { createClient } from '@/lib/supabase/client'
import { Score, ScoreInsert } from '@/lib/supabase/types'
import { getOfflineDb, LocalScore, PendingSync, isIndexedDBAvailable } from './db'

// Event emitter for sync status updates
type SyncEventCallback = (pendingCount: number) => void
const syncListeners: Set<SyncEventCallback> = new Set()

export function subscribeSyncStatus(callback: SyncEventCallback): () => void {
  syncListeners.add(callback)
  return () => syncListeners.delete(callback)
}

function notifySyncListeners(count: number) {
  syncListeners.forEach((cb) => cb(count))
}

// Get count of pending sync items
export async function getPendingSyncCount(): Promise<number> {
  if (!isIndexedDBAvailable()) return 0
  const db = getOfflineDb()
  return db.pendingSync.count()
}

// Save score locally and queue for sync
export async function saveScoreLocally(
  athleteId: string,
  station: number,
  distanceMeters: number,
  recordedBy: string | null
): Promise<void> {
  if (!isIndexedDBAvailable()) {
    throw new Error('Offline storage not available')
  }

  const db = getOfflineDb()
  const now = new Date().toISOString()
  const scoreId = `local-${athleteId}-${station}-${Date.now()}`

  // Save to local scores table (for immediate display)
  const localScore: LocalScore = {
    id: scoreId,
    athlete_id: athleteId,
    station,
    distance_meters: distanceMeters,
    recorded_by: recordedBy,
    recorded_at: now,
  }

  // Use compound index to find existing local score for this athlete+station
  const existing = await db.scores
    .where('[athlete_id+station]')
    .equals([athleteId, station])
    .first()

  if (existing) {
    // Update existing
    await db.scores.update(existing.id, {
      distance_meters: distanceMeters,
      recorded_by: recordedBy,
      recorded_at: now,
    })
  } else {
    // Insert new
    await db.scores.add(localScore)
  }

  // Remove any existing pending sync for this athlete+station (replace with new value)
  await db.pendingSync.where('[athlete_id+station]').equals([athleteId, station]).delete()

  // Add to pending sync queue
  const pendingItem: PendingSync = {
    athlete_id: athleteId,
    station,
    distance_meters: distanceMeters,
    recorded_by: recordedBy,
    created_at: now,
    attempts: 0,
  }

  await db.pendingSync.add(pendingItem)

  // Notify listeners of updated pending count
  const count = await getPendingSyncCount()
  notifySyncListeners(count)
}

// Save multiple scores locally
export async function saveScoresLocally(
  scores: { athleteId: string; station: number; distanceMeters: number }[],
  recordedBy: string | null
): Promise<void> {
  for (const score of scores) {
    await saveScoreLocally(score.athleteId, score.station, score.distanceMeters, recordedBy)
  }
}

// Get local scores for athletes
export async function getLocalScores(athleteIds: string[]): Promise<LocalScore[]> {
  if (!isIndexedDBAvailable()) return []
  if (athleteIds.length === 0) return []

  const db = getOfflineDb()
  return db.scores.where('athlete_id').anyOf(athleteIds).toArray()
}

// Sync pending scores to server
export async function syncPendingScores(): Promise<{
  synced: number
  failed: number
  errors: string[]
}> {
  if (!isIndexedDBAvailable()) {
    return { synced: 0, failed: 0, errors: ['Offline storage not available'] }
  }

  const db = getOfflineDb()
  const pendingItems = await db.pendingSync.toArray()

  if (pendingItems.length === 0) {
    return { synced: 0, failed: 0, errors: [] }
  }

  const supabase = createClient()
  let synced = 0
  let failed = 0
  const errors: string[] = []

  // Group by unique athlete_id+station (take most recent)
  const uniqueScores = new Map<string, PendingSync>()
  for (const item of pendingItems) {
    const key = `${item.athlete_id}-${item.station}`
    const existing = uniqueScores.get(key)
    if (!existing || item.created_at > existing.created_at) {
      uniqueScores.set(key, item)
    }
  }

  // Convert to upsert format
  const scoresToUpsert: ScoreInsert[] = Array.from(uniqueScores.values()).map((item) => ({
    athlete_id: item.athlete_id,
    station: item.station,
    distance_meters: item.distance_meters,
    recorded_by: item.recorded_by,
  }))

  try {
    const { data, error } = await supabase
      .from('scores')
      .upsert(scoresToUpsert as never[], {
        onConflict: 'athlete_id,station',
      })
      .select()

    if (error) {
      // Mark all as failed with error
      for (const item of pendingItems) {
        if (item.id) {
          await db.pendingSync.update(item.id, {
            attempts: item.attempts + 1,
            last_error: error.message,
          })
        }
      }
      failed = pendingItems.length
      errors.push(error.message)
    } else {
      // Success - update local scores with server data and remove from pending
      const serverScores = data as Score[]

      for (const serverScore of serverScores) {
        // Update local score with server ID
        const localExisting = await db.scores
          .where('[athlete_id+station]')
          .equals([serverScore.athlete_id, serverScore.station])
          .first()

        if (localExisting) {
          await db.scores.delete(localExisting.id)
        }

        // Insert server version
        await db.scores.add({
          id: serverScore.id,
          athlete_id: serverScore.athlete_id,
          station: serverScore.station,
          distance_meters: serverScore.distance_meters,
          recorded_by: serverScore.recorded_by,
          recorded_at: serverScore.recorded_at,
        })
      }

      // Remove synced items from pending queue
      const syncedKeys = new Set(
        serverScores.map((s) => `${s.athlete_id}-${s.station}`)
      )

      for (const item of pendingItems) {
        const key = `${item.athlete_id}-${item.station}`
        if (syncedKeys.has(key) && item.id) {
          await db.pendingSync.delete(item.id)
          synced++
        }
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown sync error'
    errors.push(message)
    failed = pendingItems.length
  }

  // Notify listeners of updated pending count
  const count = await getPendingSyncCount()
  notifySyncListeners(count)

  // Update last sync time
  await db.syncStatus.put({ key: 'lastSync', value: new Date().toISOString() })

  return { synced, failed, errors }
}

// Cache server scores locally (for offline read)
export async function cacheScoresFromServer(scores: Score[]): Promise<void> {
  if (!isIndexedDBAvailable()) return
  if (scores.length === 0) return

  const db = getOfflineDb()

  for (const score of scores) {
    // Check if there's a pending sync for this score (don't overwrite local changes)
    const hasPending = await db.pendingSync
      .where('[athlete_id+station]')
      .equals([score.athlete_id, score.station])
      .count()

    if (hasPending > 0) {
      // Skip - local change takes precedence
      continue
    }

    // Update or insert server score
    const existing = await db.scores
      .where('[athlete_id+station]')
      .equals([score.athlete_id, score.station])
      .first()

    if (existing) {
      await db.scores.update(existing.id, {
        id: score.id,
        distance_meters: score.distance_meters,
        recorded_by: score.recorded_by,
        recorded_at: score.recorded_at,
      })
    } else {
      await db.scores.add({
        id: score.id,
        athlete_id: score.athlete_id,
        station: score.station,
        distance_meters: score.distance_meters,
        recorded_by: score.recorded_by,
        recorded_at: score.recorded_at,
      })
    }
  }
}

// Clear all local data (for logout or reset)
export async function clearOfflineData(): Promise<void> {
  if (!isIndexedDBAvailable()) return

  const db = getOfflineDb()
  await db.scores.clear()
  await db.pendingSync.clear()
  await db.syncStatus.clear()

  notifySyncListeners(0)
}

// Get last sync time
export async function getLastSyncTime(): Promise<string | null> {
  if (!isIndexedDBAvailable()) return null

  const db = getOfflineDb()
  const status = await db.syncStatus.get('lastSync')
  return status?.value || null
}
