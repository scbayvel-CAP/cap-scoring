'use client'

import { useState, useEffect, useCallback } from 'react'

interface UndoToastProps {
  message: string
  duration?: number // Duration in seconds (default: 60)
  onUndo: () => void
  onDismiss: () => void
}

export function UndoToast({
  message,
  duration = 60,
  onUndo,
  onDismiss,
}: UndoToastProps) {
  const [remainingTime, setRemainingTime] = useState(duration)
  const [isUndoing, setIsUndoing] = useState(false)

  useEffect(() => {
    if (remainingTime <= 0) {
      onDismiss()
      return
    }

    const timer = setInterval(() => {
      setRemainingTime((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [remainingTime, onDismiss])

  const handleUndo = useCallback(async () => {
    setIsUndoing(true)
    try {
      await onUndo()
    } catch (error) {
      console.error('Undo failed:', error)
    }
    setIsUndoing(false)
  }, [onUndo])

  const progressPercentage = (remainingTime / duration) * 100

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 safe-area-inset-bottom">
      <div className="bg-night-green text-chalk rounded-xl shadow-lg overflow-hidden">
        {/* Progress bar at top for visibility */}
        <div className="h-1.5 bg-battleship/30">
          <div
            className="h-full bg-olive transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="p-4">
          {/* Message row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-olive/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-olive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-base font-medium flex-1">{message}</span>
            <span className="text-sm text-olive tabular-nums font-mono">
              {remainingTime}s
            </span>
          </div>
          {/* Button row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleUndo}
              disabled={isUndoing}
              className="flex-1 px-4 py-3 bg-olive text-night-green text-base font-semibold rounded-lg hover:bg-eggshell active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ minHeight: '48px' }}
            >
              {isUndoing ? 'Undoing...' : 'Undo'}
            </button>
            <button
              onClick={onDismiss}
              className="p-3 hover:bg-white/10 rounded-lg transition-colors"
              style={{ minWidth: '48px', minHeight: '48px' }}
              aria-label="Dismiss"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
