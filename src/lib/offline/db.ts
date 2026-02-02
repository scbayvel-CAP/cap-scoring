import Dexie, { Table } from 'dexie'

// Local score record (mirrors Supabase scores table)
export interface LocalScore {
  id: string
  athlete_id: string
  station: number
  distance_meters: number
  recorded_by: string | null
  recorded_at: string
}

// Pending sync record - scores that need to be synced to server
export interface PendingSync {
  id?: number // Auto-increment local ID
  athlete_id: string
  station: number
  distance_meters: number
  recorded_by: string | null
  created_at: string // When queued for sync
  attempts: number // Number of sync attempts
  last_error?: string // Last sync error message
}

// Sync status for tracking
export interface SyncStatus {
  key: string // 'lastSync' or similar
  value: string
}

class CapScoringDatabase extends Dexie {
  scores!: Table<LocalScore, string>
  pendingSync!: Table<PendingSync, number>
  syncStatus!: Table<SyncStatus, string>

  constructor() {
    super('cap-scoring-offline')

    this.version(1).stores({
      // scores indexed by id, with compound index for athlete+station lookups
      scores: 'id, athlete_id, station, [athlete_id+station]',
      // pendingSync with auto-increment id, indexed by athlete+station for conflict resolution
      pendingSync: '++id, [athlete_id+station], created_at',
      // syncStatus key-value store
      syncStatus: 'key',
    })
  }
}

// Singleton instance
let db: CapScoringDatabase | null = null

export function getOfflineDb(): CapScoringDatabase {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only available in the browser')
  }

  if (!db) {
    db = new CapScoringDatabase()
  }

  return db
}

// Check if IndexedDB is available
export function isIndexedDBAvailable(): boolean {
  if (typeof window === 'undefined') return false
  return 'indexedDB' in window
}
