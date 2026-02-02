'use client'

import { useOffline } from '@/hooks/useOffline'

export function OfflineIndicator() {
  const { isOnline, pendingSyncCount, isSyncing, lastSyncError, sync } = useOffline()

  // Don't show anything if online with no pending items
  if (isOnline && pendingSyncCount === 0 && !lastSyncError) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-yellow-500 text-yellow-950 px-4 py-2 rounded-lg shadow-lg mb-2 flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
            />
          </svg>
          <span className="font-medium">Offline Mode</span>
        </div>
      )}

      {/* Pending sync indicator */}
      {pendingSyncCount > 0 && (
        <div
          className={`${
            isOnline ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-100'
          } px-4 py-2 rounded-lg shadow-lg flex items-center gap-3`}
        >
          {isSyncing ? (
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          )}

          <span className="font-medium">
            {isSyncing
              ? 'Syncing...'
              : `${pendingSyncCount} score${pendingSyncCount > 1 ? 's' : ''} pending`}
          </span>

          {isOnline && !isSyncing && (
            <button
              onClick={sync}
              className="ml-2 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
            >
              Sync Now
            </button>
          )}
        </div>
      )}

      {/* Sync error */}
      {lastSyncError && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg mt-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm">{lastSyncError}</span>
        </div>
      )}
    </div>
  )
}
