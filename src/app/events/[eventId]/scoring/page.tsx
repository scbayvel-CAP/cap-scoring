'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { JudgeNavigation } from '@/components/JudgeNavigation'
import { HeatSelector } from '@/components/HeatSelector'
import { ScoreEntry } from '@/components/ScoreEntry'
import { UndoToast } from '@/components/UndoToast'
import { RangeWarningModal } from '@/components/RangeWarningModal'
import { PageErrorBoundary } from '@/components/ErrorBoundary'
import { Skeleton, SkeletonScoreEntryList } from '@/components/Skeleton'
import { Athlete, Event, ScoreInsert, ScoreAuditLogInsert } from '@/lib/supabase/types'
import { getStationName, getDisplayName } from '@/lib/utils'
import { validateScores, ScoreWarning } from '@/lib/validation/ranges'
import { logScoreChanges } from '@/lib/supabase/queries'
import { useScores } from '@/hooks/useScores'
import { useOffline } from '@/hooks/useOffline'
import { useRole } from '@/hooks/useRole'

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

  // Track last submission for undo functionality
  const [lastSubmission, setLastSubmission] = useState<{
    athleteIds: string[]
    station: number
    count: number
  } | null>(null)

  // Range warning state
  const [scoreWarnings, setScoreWarnings] = useState<ScoreWarning[]>([])
  const [showWarningModal, setShowWarningModal] = useState(false)

  // Refs for auto-advancing between athlete inputs
  const athleteInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  const supabase = createClient()
  const { isOnline, pendingSyncCount } = useOffline()
  const { assignedStation, isAdmin, loading: roleLoading } = useRole()

  // If user has an assigned station (judge), lock them to it
  const isStationLocked = assignedStation !== null
  const effectiveStation = isStationLocked ? assignedStation : station

  // Get athlete IDs for the scores hook
  const athleteIds = useMemo(() => athletes.map((a) => a.id), [athletes])

  // Use the offline-enabled scores hook
  const {
    scores,
    isOffline: scoresOffline,
    upsertScores,
    deleteScores,
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

  // Build the list of scores to submit
  const buildScoresToUpsert = useCallback((): ScoreInsert[] => {
    const scoresToUpsert: ScoreInsert[] = []
    for (const [athleteId, distance] of Object.entries(pendingScores)) {
      if (distance !== null && distance >= 0) {
        scoresToUpsert.push({
          athlete_id: athleteId,
          station: effectiveStation,
          distance_meters: distance,
          recorded_by: null,
        })
      }
    }
    return scoresToUpsert
  }, [pendingScores, effectiveStation])

  // Check for range warnings before submitting
  const handleSubmitClick = () => {
    setMessage(null)
    const scoresToUpsert = buildScoresToUpsert()

    if (scoresToUpsert.length === 0) {
      setMessage({ type: 'error', text: 'No scores to submit' })
      return
    }

    // Validate scores and check for warnings
    const scoresToValidate = scoresToUpsert.map((s) => {
      const athlete = athletes.find((a) => a.id === s.athlete_id)
      return {
        athleteId: s.athlete_id,
        athleteName: athlete ? getDisplayName(athlete) : 'Unknown',
        distance: s.distance_meters,
      }
    })

    const warnings = validateScores(scoresToValidate, effectiveStation)

    if (warnings.length > 0) {
      setScoreWarnings(warnings)
      setShowWarningModal(true)
    } else {
      handleConfirmedSubmit()
    }
  }

  // Actually submit the scores (called directly or after warning confirmation)
  const handleConfirmedSubmit = async () => {
    setSaving(true)
    setShowWarningModal(false)
    setScoreWarnings([])

    try {
      const scoresToUpsert = buildScoresToUpsert()

      if (scoresToUpsert.length === 0) {
        setMessage({ type: 'error', text: 'No scores to submit' })
        setSaving(false)
        return
      }

      // Get existing scores to determine if this is create or update
      const existingScoresMap = new Map(
        scores
          .filter((s) => s.station === effectiveStation)
          .map((s) => [s.athlete_id, s.distance_meters])
      )

      // Get current user for audit log
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id || null

      // Use the offline-enabled upsert
      await upsertScores(scoresToUpsert)

      // Log audit entries (only when online)
      if (isOnline && !scoresOffline) {
        const auditEntries: ScoreAuditLogInsert[] = scoresToUpsert.map((s) => {
          const oldValue = existingScoresMap.get(s.athlete_id)
          return {
            athlete_id: s.athlete_id,
            event_id: eventId,
            station: effectiveStation,
            action: oldValue !== undefined ? 'updated' : 'created',
            old_value: oldValue ?? null,
            new_value: s.distance_meters,
            changed_by: userId,
          }
        })

        // Log in background - don't block the UI
        logScoreChanges(supabase, auditEntries).catch(console.error)

        setLastSubmission({
          athleteIds: scoresToUpsert.map((s) => s.athlete_id),
          station: effectiveStation,
          count: scoresToUpsert.length,
        })
        // Hide the regular success message - UndoToast will show instead
        setMessage(null)
      } else {
        setMessage({
          type: 'info',
          text: `${scoresToUpsert.length} scores saved locally. Will sync when online.`,
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

  const handleCancelWarning = () => {
    setShowWarningModal(false)
    setScoreWarnings([])
  }

  const athleteScores = (athleteId: string) => {
    return scores.filter((s) => s.athlete_id === athleteId)
  }

  const hasChanges = Object.values(pendingScores).some((v) => v !== null)

  // Focus the next athlete's input when Enter is pressed
  const focusNextAthlete = useCallback((currentAthleteId: string) => {
    const currentIndex = athletes.findIndex(a => a.id === currentAthleteId)
    if (currentIndex >= 0 && currentIndex < athletes.length - 1) {
      const nextAthlete = athletes[currentIndex + 1]
      // Use a small timeout to let the current input finish processing
      setTimeout(() => {
        const nextInput = document.querySelector(`[data-athlete-id="${nextAthlete.id}"] input`) as HTMLInputElement
        nextInput?.focus()
        nextInput?.select()
      }, 50)
    }
  }, [athletes])

  const handleUndo = useCallback(async () => {
    if (!lastSubmission) return

    try {
      // Get scores before deleting (for audit log)
      const scoresToDelete = scores.filter(
        (s) => lastSubmission.athleteIds.includes(s.athlete_id) && s.station === lastSubmission.station
      )

      await deleteScores(lastSubmission.athleteIds, lastSubmission.station)

      // Log audit entries for deleted scores (only when online)
      if (isOnline && !scoresOffline) {
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData.user?.id || null

        const auditEntries: ScoreAuditLogInsert[] = scoresToDelete.map((s) => ({
          athlete_id: s.athlete_id,
          event_id: eventId,
          station: lastSubmission.station,
          action: 'deleted' as const,
          old_value: s.distance_meters,
          new_value: null,
          changed_by: userId,
          metadata: { reason: 'undo' },
        }))

        logScoreChanges(supabase, auditEntries).catch(console.error)
      }

      setMessage({
        type: 'info',
        text: `${lastSubmission.count} score(s) undone`,
      })
      setLastSubmission(null)
      await refreshScores()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to undo scores',
      })
    }
  }, [lastSubmission, deleteScores, refreshScores, scores, isOnline, scoresOffline, supabase, eventId])

  const handleDismissUndo = useCallback(() => {
    setLastSubmission(null)
  }, [])

  if ((loading && !event) || roleLoading) {
    return (
      <div>
        {isAdmin ? <Navigation /> : <JudgeNavigation />}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-6" />

          <div className="card mb-6">
            <div className="flex flex-wrap gap-4">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <div className="flex space-x-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
              <div>
                <Skeleton className="h-4 w-12 mb-2" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>

          <SkeletonScoreEntryList count={6} />

          <div className="mt-8">
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div>
      {isAdmin ? (
        <Navigation eventId={eventId} eventName={event?.name} />
      ) : (
        <JudgeNavigation
          eventName={event?.name}
          stationName={getStationName(effectiveStation)}
          showBackToEvents
        />
      )}
      <PageErrorBoundary pageName="Scoring">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page header with station indicator */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-night-green mb-2">
            Enter Scores
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="station-badge-locked">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {getStationName(effectiveStation)}
            </span>
            {isStationLocked && (
              <span className="text-sm text-battleship flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Assigned station
              </span>
            )}
          </div>
        </div>

        <HeatSelector
          raceType={raceType}
          heatNumber={heatNumber}
          station={effectiveStation}
          stationLocked={isStationLocked}
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
            {/* Athlete score entry list with better spacing */}
            <div className="space-y-4">
              {athletes.map((athlete, index) => (
                <div key={athlete.id} data-athlete-id={athlete.id}>
                  <ScoreEntry
                    athlete={athlete}
                    station={effectiveStation}
                    scores={athleteScores(athlete.id)}
                    onChange={handleScoreChange}
                    onEnterPress={index < athletes.length - 1 ? () => focusNextAthlete(athlete.id) : undefined}
                  />
                </div>
              ))}
            </div>

            {/* Submit button - fixed at bottom with safe area padding */}
            <div className="sticky bottom-0 pt-4 pb-6 -mx-4 px-4 bg-gradient-to-t from-ivory via-ivory to-transparent">
              <button
                onClick={handleSubmitClick}
                disabled={saving || !hasChanges}
                className="btn-primary btn-lg w-full shadow-lg"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  `Submit ${Object.values(pendingScores).filter(v => v !== null).length} Score${Object.values(pendingScores).filter(v => v !== null).length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </>
        )}

        {lastSubmission && (
          <UndoToast
            message={`${lastSubmission.count} score(s) submitted`}
            duration={60}
            onUndo={handleUndo}
            onDismiss={handleDismissUndo}
          />
        )}

        {showWarningModal && (
          <RangeWarningModal
            warnings={scoreWarnings}
            onConfirm={handleConfirmedSubmit}
            onCancel={handleCancelWarning}
            isSubmitting={saving}
          />
        )}
      </main>
      </PageErrorBoundary>
    </div>
  )
}
