'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Score, ScoreInsert } from '@/lib/supabase/types'
import {
  getLocalScores,
  saveScoresLocally,
  cacheScoresFromServer,
  syncPendingScores,
} from '@/lib/offline/sync'
import { LocalScore, isIndexedDBAvailable } from '@/lib/offline/db'
import { getScores as fetchScores, upsertScores as saveScores } from '@/lib/supabase/queries'

interface UseScoresOptions {
  athleteIds: string[]
  realtime?: boolean
  localFirst?: boolean // Enable local-first mode (default: true)
}

// Convert LocalScore to Score format
function localToScore(local: LocalScore): Score {
  return {
    id: local.id,
    athlete_id: local.athlete_id,
    station: local.station,
    distance_meters: local.distance_meters,
    recorded_by: local.recorded_by,
    recorded_at: local.recorded_at,
  }
}

// Merge local and server scores, preferring local for pending items
function mergeScores(localScores: LocalScore[], serverScores: Score[]): Score[] {
  const merged = new Map<string, Score>()

  // Add server scores first
  for (const score of serverScores) {
    const key = `${score.athlete_id}-${score.station}`
    merged.set(key, score)
  }

  // Override with local scores (they may have pending changes)
  for (const local of localScores) {
    const key = `${local.athlete_id}-${local.station}`
    // Only override if local score is newer or pending sync
    const existing = merged.get(key)
    if (!existing || local.recorded_at > existing.recorded_at) {
      merged.set(key, localToScore(local))
    }
  }

  return Array.from(merged.values())
}

export function useScores({ athleteIds, realtime = false, localFirst = true }: UseScoresOptions) {
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  const supabase = createClient()
  const mountedRef = useRef(true)

  // Load scores from local DB first, then server
  const loadScores = useCallback(async () => {
    if (athleteIds.length === 0) {
      setScores([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let localScores: LocalScore[] = []
    let serverScores: Score[] = []
    let serverError: Error | null = null

    // Load from local DB first (instant)
    if (localFirst && isIndexedDBAvailable()) {
      try {
        localScores = await getLocalScores(athleteIds)
        // Show local data immediately
        if (localScores.length > 0 && mountedRef.current) {
          setScores(localScores.map(localToScore))
        }
      } catch (e) {
        console.warn('Failed to load local scores:', e)
      }
    }

    // Then try to load from server
    try {
      serverScores = await fetchScores(supabase, athleteIds)
      setIsOffline(false)

      // Cache server scores locally
      if (localFirst && isIndexedDBAvailable()) {
        await cacheScoresFromServer(serverScores)
      }
    } catch (e) {
      // Network error - we're likely offline
      setIsOffline(true)
      if (localScores.length === 0) {
        serverError = e as Error
      }
    }

    if (!mountedRef.current) return

    // Merge local and server scores
    if (localFirst && localScores.length > 0) {
      const merged = mergeScores(localScores, serverScores)
      setScores(merged)
    } else if (serverScores.length > 0) {
      setScores(serverScores)
    }

    if (serverError && localScores.length === 0) {
      setError(serverError.message)
    }

    setLoading(false)
  }, [athleteIds, supabase, localFirst])

  useEffect(() => {
    mountedRef.current = true
    loadScores()
    return () => {
      mountedRef.current = false
    }
  }, [loadScores])

  // Real-time subscription
  useEffect(() => {
    if (!realtime || athleteIds.length === 0) return

    const channel = supabase
      .channel('scores-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
        },
        (payload) => {
          const score = payload.new as Score
          if (athleteIds.includes(score.athlete_id)) {
            loadScores()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [realtime, athleteIds, supabase, loadScores])

  // Upsert scores - saves locally first, then syncs
  const upsertScores = async (newScores: ScoreInsert[]) => {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id || null

    const scoresWithUser = newScores.map((score) => ({
      ...score,
      recorded_by: score.recorded_by || userId,
    }))

    // Save locally first (for offline support)
    if (localFirst && isIndexedDBAvailable()) {
      try {
        await saveScoresLocally(
          scoresWithUser.map((s) => ({
            athleteId: s.athlete_id,
            station: s.station,
            distanceMeters: s.distance_meters,
          })),
          userId
        )

        // Update local state immediately (optimistic update)
        const now = new Date().toISOString()
        const optimisticScores = scoresWithUser.map((s) => ({
          id: `local-${s.athlete_id}-${s.station}-${Date.now()}`,
          athlete_id: s.athlete_id,
          station: s.station,
          distance_meters: s.distance_meters,
          recorded_by: userId,
          recorded_at: now,
        }))

        setScores((prev) => {
          const updated = [...prev]
          for (const newScore of optimisticScores) {
            const existingIndex = updated.findIndex(
              (s) => s.athlete_id === newScore.athlete_id && s.station === newScore.station
            )
            if (existingIndex >= 0) {
              updated[existingIndex] = newScore
            } else {
              updated.push(newScore)
            }
          }
          return updated
        })
      } catch (e) {
        console.error('Failed to save scores locally:', e)
      }
    }

    // Try to sync to server
    try {
      const data = await saveScores(supabase, scoresWithUser)
      // Server sync succeeded - reload to get server IDs
      await loadScores()
      return data
    } catch (e) {
      if (localFirst && isIndexedDBAvailable()) {
        // Offline or server error - attempt background sync
        console.warn('Server unreachable, scores queued for sync')
        syncPendingScores().catch(console.error)
        return null
      }
      throw e
    }
  }

  const getScoreForAthlete = (athleteId: string, station: number) => {
    return scores.find((s) => s.athlete_id === athleteId && s.station === station)
  }

  const getScoresForAthlete = (athleteId: string) => {
    return scores.filter((s) => s.athlete_id === athleteId)
  }

  return {
    scores,
    loading,
    error,
    isOffline,
    refresh: loadScores,
    upsertScores,
    getScoreForAthlete,
    getScoresForAthlete,
  }
}
