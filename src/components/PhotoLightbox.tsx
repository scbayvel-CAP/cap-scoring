'use client'

import { useEffect, useCallback } from 'react'

interface PhotoLightboxProps {
  imageUrl: string
  athleteName: string
  bibNumber: string
  station: string
  timestamp: string
  onClose: () => void
}

export function PhotoLightbox({
  imageUrl,
  athleteName,
  bibNumber,
  station,
  timestamp,
  onClose,
}: PhotoLightboxProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="font-semibold text-lg">
            [{bibNumber}] {athleteName}
          </p>
          <p className="text-sm text-white/70">
            {station} &middot; {new Date(timestamp).toLocaleString()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Image area (pinch-to-zoom via touch-action) */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-auto"
        style={{ touchAction: 'pinch-zoom' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Score photo for ${athleteName}`}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
    </div>
  )
}
