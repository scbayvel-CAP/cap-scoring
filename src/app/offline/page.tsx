'use client'

import { useEffect, useState } from 'react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-night-green flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-chalk rounded-2xl flex items-center justify-center mb-6">
            <span className="text-night-green text-4xl font-bold font-mono">55</span>
          </div>
          <h1 className="text-chalk text-2xl font-mono font-bold mb-2">
            You&apos;re Offline
          </h1>
          <p className="text-battleship text-sm">
            No internet connection detected
          </p>
        </div>

        <div className="bg-smoke rounded-lg p-6 mb-6">
          <p className="text-chalk text-sm mb-4">
            Don&apos;t worry - your scores are saved locally and will sync automatically when you reconnect.
          </p>
          <div className="flex items-center justify-center gap-2 text-olive text-xs">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isOnline ? 'Connection restored' : 'Waiting for connection...'}</span>
          </div>
        </div>

        <button
          onClick={handleRetry}
          className="btn-primary w-full"
        >
          {isOnline ? 'Go Back Online' : 'Try Again'}
        </button>

        <p className="text-battleship text-xs mt-6">
          CAP 55 Scoring System
        </p>
      </div>
    </div>
  )
}
