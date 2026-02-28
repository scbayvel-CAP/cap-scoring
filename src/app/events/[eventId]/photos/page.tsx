'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { PhotoLightbox } from '@/components/PhotoLightbox'
import { Skeleton } from '@/components/Skeleton'
import { Event, Athlete, ScorePhoto, STATIONS } from '@/lib/supabase/types'
import { getDisplayName, getStationName } from '@/lib/utils'
import { useRole } from '@/hooks/useRole'

interface PhotoWithAthlete extends ScorePhoto {
  athlete?: Athlete
  signedUrl?: string
}

export default function PhotoReviewPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [photos, setPhotos] = useState<PhotoWithAthlete[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStation, setFilterStation] = useState<number | null>(null)
  const [filterHeat, setFilterHeat] = useState<string | null>(null)
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoWithAthlete | null>(null)

  const supabase = createClient()
  const { isAdmin, loading: roleLoading } = useRole()

  const loadData = useCallback(async () => {
    setLoading(true)

    try {
      // Load event
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventData) setEvent(eventData as unknown as Event)

      // Load photos with athlete data
      let query = supabase
        .from('score_photos')
        .select('*')
        .eq('event_id', eventId)
        .order('uploaded_at', { ascending: false })

      if (filterStation) {
        query = query.eq('station', filterStation)
      }

      const { data: photosData } = await query

      if (photosData && photosData.length > 0) {
        // Get unique athlete IDs
        const athleteIds = Array.from(new Set((photosData as ScorePhoto[]).map(p => p.athlete_id)))

        // Load athletes
        const { data: athletesData } = await supabase
          .from('athletes')
          .select('*')
          .in('id', athleteIds)

        const athleteMap = new Map(
          ((athletesData || []) as unknown as Athlete[]).map(a => [a.id, a])
        )

        // Generate signed URLs and attach athletes
        const photosWithDetails: PhotoWithAthlete[] = await Promise.all(
          (photosData as unknown as ScorePhoto[]).map(async (photo) => {
            const { data: signedData } = await supabase.storage
              .from('score-photos')
              .createSignedUrl(photo.storage_path, 3600)

            return {
              ...photo,
              athlete: athleteMap.get(photo.athlete_id),
              signedUrl: signedData?.signedUrl || undefined,
            }
          })
        )

        // Filter by heat if needed
        const filtered = filterHeat
          ? photosWithDetails.filter(p => {
              const meta = p.metadata as Record<string, unknown>
              return meta?.heat_number?.toString() === filterHeat
            })
          : photosWithDetails

        setPhotos(filtered)
      } else {
        setPhotos([])
      }
    } catch (err) {
      console.error('Error loading photos:', err)
    }

    setLoading(false)
  }, [eventId, filterStation, filterHeat, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (roleLoading) {
    return (
      <div>
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
        </main>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div>
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-red-600">Admin access required</p>
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navigation eventId={eventId} eventName={event?.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-night-green mb-6">Score Photos</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Station filter */}
          <div>
            <label className="block text-sm font-medium text-battleship mb-1">Station</label>
            <select
              value={filterStation || ''}
              onChange={(e) => setFilterStation(e.target.value ? parseInt(e.target.value) : null)}
              className="input"
            >
              <option value="">All Stations</option>
              {Object.entries(STATIONS).map(([num, name]) => (
                <option key={num} value={num}>{name}</option>
              ))}
            </select>
          </div>

          {/* Heat filter */}
          <div>
            <label className="block text-sm font-medium text-battleship mb-1">Heat</label>
            <select
              value={filterHeat || ''}
              onChange={(e) => setFilterHeat(e.target.value || null)}
              className="input"
            >
              <option value="">All Heats</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                <option key={h} value={h}>Heat {h}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <p className="text-sm text-battleship">
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Photo grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-battleship">No photos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => {
              const meta = photo.metadata as Record<string, unknown>
              return (
                <div
                  key={photo.id}
                  className="card p-0 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setLightboxPhoto(photo)}
                >
                  {/* Photo thumbnail */}
                  <div className="h-40 bg-eggshell">
                    {photo.signedUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.signedUrl}
                        alt={`Score photo for ${photo.athlete ? getDisplayName(photo.athlete) : 'athlete'}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-battleship">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-night-green text-chalk text-xs font-bold">
                          {photo.athlete?.bib_number || '?'}
                        </span>
                        <span className="text-sm font-medium text-night-green truncate">
                          {photo.athlete ? getDisplayName(photo.athlete) : 'Unknown'}
                        </span>
                      </div>
                      <span className="text-xs text-battleship">
                        {getStationName(photo.station)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-battleship">
                      <span>Heat {String(meta?.heat_number ?? '?')}</span>
                      <span>{new Date(photo.uploaded_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightboxPhoto && lightboxPhoto.signedUrl && (
        <PhotoLightbox
          imageUrl={lightboxPhoto.signedUrl}
          athleteName={lightboxPhoto.athlete ? getDisplayName(lightboxPhoto.athlete) : 'Unknown'}
          bibNumber={lightboxPhoto.athlete?.bib_number || '?'}
          station={getStationName(lightboxPhoto.station)}
          timestamp={lightboxPhoto.uploaded_at}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </div>
  )
}
