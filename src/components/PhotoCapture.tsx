'use client'

import { useState, useRef, useCallback } from 'react'

export type PhotoCaptureState = 'idle' | 'captured' | 'uploading' | 'done' | 'error'

export interface PhotoResult {
  photoId: string
  thumbnailUrl: string | null
}

interface PhotoCaptureProps {
  athleteId: string
  eventId: string
  station: number
  bibNumber: string
  heatNumber: number
  disabled?: boolean
  state: PhotoCaptureState
  onStateChange: (state: PhotoCaptureState) => void
  photoResult?: PhotoResult | null
  onPhotoResultChange: (result: PhotoResult | null) => void
}

async function compressImageClientSide(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      const maxSize = 1200
      let { width, height } = img

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize
          width = maxSize
        } else {
          width = (width / height) * maxSize
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        0.85
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

export function PhotoCapture({
  athleteId,
  eventId,
  station,
  bibNumber,
  heatNumber,
  disabled = false,
  state,
  onStateChange,
  photoResult,
  onPhotoResultChange,
}: PhotoCaptureProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create local thumbnail preview
    const localUrl = URL.createObjectURL(file)
    setThumbnailUrl(localUrl)
    onStateChange('captured')
    setErrorMessage(null)

    try {
      onStateChange('uploading')

      // Compress client-side before upload
      const compressed = await compressImageClientSide(file)

      // Upload
      const formData = new FormData()
      formData.append('image', compressed, 'photo.jpg')
      formData.append('athleteId', athleteId)
      formData.append('eventId', eventId)
      formData.append('station', station.toString())
      formData.append('bibNumber', bibNumber)
      formData.append('heatNumber', heatNumber.toString())

      const response = await fetch('/api/photos/capture', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Upload failed')
      }

      const result: PhotoResult = await response.json()

      // Use server thumbnail if available, otherwise keep local
      if (result.thumbnailUrl) {
        URL.revokeObjectURL(localUrl)
        setThumbnailUrl(result.thumbnailUrl)
      }

      onPhotoResultChange(result)
      onStateChange('done')
    } catch (err) {
      console.error('Photo capture error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to upload photo')
      onStateChange('error')
    }

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [athleteId, eventId, station, bibNumber, heatNumber, onStateChange, onPhotoResultChange])

  const handleRetake = useCallback(() => {
    if (thumbnailUrl) {
      URL.revokeObjectURL(thumbnailUrl)
    }
    setThumbnailUrl(null)
    setErrorMessage(null)
    onPhotoResultChange(null)
    onStateChange('idle')
    // Trigger file input
    fileInputRef.current?.click()
  }, [thumbnailUrl, onStateChange, onPhotoResultChange])

  const handleCameraClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  // Hidden file input for camera access
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      onChange={handleFileChange}
      className="hidden"
      aria-label="Take photo of display"
    />
  )

  // Idle state - show camera button
  if (state === 'idle') {
    return (
      <div>
        {fileInput}
        <button
          type="button"
          onClick={handleCameraClick}
          disabled={disabled}
          className="w-full h-14 flex items-center justify-center gap-3 rounded-lg font-semibold text-lg transition-all"
          style={{
            backgroundColor: disabled ? '#D1D5DB' : '#303029',
            color: disabled ? '#9CA3AF' : '#FFFFF9',
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Photograph Display
        </button>
      </div>
    )
  }

  // Processing states (captured, uploading)
  if (state === 'captured' || state === 'uploading') {
    return (
      <div>
        {fileInput}
        <div className="flex items-center gap-3">
          {/* Thumbnail with spinner overlay */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-eggshell flex-shrink-0">
            {thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt="Captured display"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-night-green">
              {state === 'captured' ? 'Processing...' : 'Uploading...'}
            </p>
            <p className="text-xs text-battleship">Saving photo for verification</p>
          </div>
        </div>
      </div>
    )
  }

  // Done state - thumbnail with green checkmark + retake
  if (state === 'done' && photoResult) {
    return (
      <div>
        {fileInput}
        <div className="flex items-center gap-3">
          {/* Thumbnail with green checkmark */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-eggshell flex-shrink-0">
            {thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt="Captured display"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-tl-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            {/* Retake button */}
            <button
              type="button"
              onClick={handleRetake}
              className="absolute top-0 right-0 w-5 h-5 bg-black/60 rounded-bl-lg flex items-center justify-center hover:bg-black/80 transition-colors"
              title="Retake photo"
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-green-600 font-medium">Photo saved</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (state === 'error') {
    return (
      <div>
        {fileInput}
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-eggshell flex-shrink-0">
            {thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt="Captured display"
                className="w-full h-full object-cover opacity-60"
              />
            )}
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-red-500 rounded-tl-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-red-600">{errorMessage || 'Failed to upload photo'}</p>
            <button
              type="button"
              onClick={handleRetake}
              className="text-sm font-medium text-night-green underline mt-1"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
