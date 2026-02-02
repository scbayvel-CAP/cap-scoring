'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { HeatSelector } from '@/components/HeatSelector'
import { ScoreEntry } from '@/components/ScoreEntry'
import { Athlete, Event, ScoreInsert } from '@/lib/supabase/types'
import { getStationName } from '@/lib/utils'
import { useScores } from '@/hooks/useScores'
import { useOffline } from '@/hooks/useOffline'

export default function ScoringPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const [raceType, setRaceType] = useState<'singles' | 'doubles'>('singles')
  const [heatNumber, setHeatNumber] = useState(1)
  const [station, setStation] = useState(1)

  // Local score changes (before submission)
  const [pendingScores, setPendingScores] = useState<Record<string, number | null>>({})

  const supabase = createClient()
  const { isOnline, pendingSyncCount } = useOffline()

  // Get athlete IDs for the scores hook
  const athleteIds = useMemo(() => athletes.map((a) => a.id), [athletes])

  // Use the offline-enabled scores hook
  const {
    scores,
    isOffline: scoresOffline,
    upsertScores,
    refresh: refreshScores,
  } = useScores({
    athleteIds,
    localFirst: true,
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    setMessage(null)

    try {
      // Load event
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single() as unknown as { data: Event | null }

      if (eventData) setEvent(eventData)

      // Load athletes for this heat
      const { data: athletesData } = await supabase
        .from('athletes')
        .select('*')
        .eq('event_id', eventId)
        .eq('race_type', raceType)
        .eq('heat_number', heatNumber)
        .order('bib_number') as unknown as { data: Athlete[] | null }

      if (athletesData) {
        setAthletes(athletesData)
      } else {
        setAthletes([])
      }
    } catch (err) {
      console.error('Error loading data:', err)
      if (!isOnline) {
        setMessage({ type: 'info', text: 'Offline mode - some data may be unavailable' })
      }
    }

    setPendingScores({})
    setLoading(false)
  }, [eventId, raceType, heatNumber, supabase, isOnline])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleScoreChange = (athleteId: string, distance: number | null) => {
    setPendingScores((prev) => ({
      ...prev,
      [athleteId]: distance,
    }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const scoresToUpsert: ScoreInsert[] = []

      for (const [athleteId, distance] of Object.entries(pendingScores)) {
        if (distance !== null && distance >= 0) {
          scoresToUpsert.push({
            athlete_id: athleteId,
            station,
            distance_meters: distance,
            recorded_by: null, // Will be filled by the hook
          })
        }
      }

      if (scoresToUpsert.length === 0) {
        setMessage({ type: 'error', text: 'No scores to submit' })
        setSaving(false)
        return
      }

      // Use the offline-enabled upsert
      await upsertScores(scoresToUpsert)

      if (!isOnline || scoresOffline) {
        setMessage({
          type: 'info',
          text: `${scoresToUpsert.length} scores saved locally. Will sync when online.`,
        })
      } else {
        setMessage({
          type: 'success',
          text: `${scoresToUpsert.length} scores submitted successfully`,
        })
      }

      setPendingScores({})
      await refreshScores()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to submit scores',
      })
    } finally {
      setSaving(false)
    }
  }

  const athleteScores = (athleteId: string) => {
    return scores.filter((s) => s.athlete_id === athleteId)
  }

  const hasChanges = Object.values(pendingScores).some((v) => v !== null)

  if (loading && !event) {
    return (
      <div>
        <Navigation />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navigation eventId={eventId} eventName={event?.name} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Enter Scores - {getStationName(station)}
        </h1>

        <HeatSelector
          raceType={raceType}
          heatNumber={heatNumber}
          station={station}
          onRaceTypeChange={(type) => {
            setRaceType(type)
            setPendingScores({})
          }}
          onHeatChange={(heat) => {
            setHeatNumber(heat)
            setPendingScores({})
          }}
          onStationChange={(s) => {
            setStation(s)
            setPendingScores({})
          }}
        />

        {message && (
          <div
            className={`p-4 rounded-md mb-6 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : message.type === 'info'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {!isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>Offline mode:</strong> Scores will be saved locally and synced when connection is restored.
              {pendingSyncCount > 0 && ` (${pendingSyncCount} pending)`}
            </span>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading athletes...</p>
        ) : athletes.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">
              No athletes in {raceType} Heat {heatNumber}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {athletes.map((athlete) => (
                <ScoreEntry
                  key={athlete.id}
                  athlete={athlete}
                  station={station}
                  scores={athleteScores(athlete.id)}
                  onChange={handleScoreChange}
                />
              ))}
            </div>

            <div className="mt-8 sticky bottom-4">
              <button
                onClick={handleSubmit}
                disabled={saving || !hasChanges}
                className="btn-primary btn-lg w-full"
              >
                {saving ? 'Submitting...' : 'Submit Scores'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
