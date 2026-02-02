'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getPendingSyncCount,
  syncPendingScores,
  subscribeSyncStatus,
} from '@/lib/offline/sync'

interface UseOfflineResult {
  isOnline: boolean
  pendingSyncCount: number
  isSyncing: boolean
  lastSyncError: string | null
  sync: () => Promise<void>
}

export function useOffline(): UseOfflineResult {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncError, setLastSyncError] = useState<string | null>(null)

  // Initialize online status
  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Auto-sync when coming back online
      syncPendingScores().catch(console.error)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load initial pending count and subscribe to updates
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Get initial count
    getPendingSyncCount().then(setPendingSyncCount).catch(console.error)

    // Subscribe to sync status updates
    const unsubscribe = subscribeSyncStatus(setPendingSyncCount)

    return unsubscribe
  }, [])

  // Auto-sync when online and there are pending items
  useEffect(() => {
    if (!isOnline || pendingSyncCount === 0 || isSyncing) return

    const syncTimeout = setTimeout(() => {
      syncPendingScores().catch(console.error)
    }, 1000) // Debounce sync attempts

    return () => clearTimeout(syncTimeout)
  }, [isOnline, pendingSyncCount, isSyncing])

  const sync = useCallback(async () => {
    if (isSyncing) return

    setIsSyncing(true)
    setLastSyncError(null)

    try {
      const result = await syncPendingScores()
      if (result.errors.length > 0) {
        setLastSyncError(result.errors.join(', '))
      }
    } catch (e) {
      setLastSyncError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing])

  return {
    isOnline,
    pendingSyncCount,
    isSyncing,
    lastSyncError,
    sync,
  }
}
