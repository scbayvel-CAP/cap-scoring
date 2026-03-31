'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { JudgeNavigation } from '@/components/JudgeNavigation'
import { HeatSelector } from '@/components/HeatSelector'
import { ScoringProgress } from '@/components/ScoringProgress'
import { ScoreEntry } from '@/components/ScoreEntry'
import { RangeWarningModal } from '@/components/RangeWarningModal'
import { PageErrorBoundary } from '@/components/ErrorBoundary'
import { Skeleton, SkeletonScoreEntryList } from '@/components/Skeleton'
import { Athlete, Event, ScoreInsert, ScoreAuditLogInsert } from '@/lib/supabase/types'
import { getDisplayName } from '@/lib/utils'
import { validateScores, ScoreWarning } from '@/lib/validation/ranges'
import { logScoreChanges, linkPhotosToScores } from '@/lib/supabase/queries'
import { PhotoCaptureState, PhotoResult } from '@/components/PhotoCapture'
import { useScores } from '@/hooks/useScores'
import { useOffline } from '@/hooks/useOffline'
import { useRole } from '@/hooks/useRole'

const STATION = 1 // Always Row

export default function ScoringPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const [heatNumber, setHeatNumber] = useState(1)

  // Local score changes (before submission)
  const [pendingScores, setPendingScores] = useState<Record<string, number | null>>({})

  // Photo states per athlete
  const [photoStates, setPhotoStates] = useState<Record<string, PhotoCaptureState>>({})
  const [photoResults, setPhotoResults] = useState<Record<string, PhotoResult | null>>({})

  // Range warning state
  const [scoreWarnings, setScoreWarnings] = useState<ScoreWarning[]>([])
  const [showWarningModal, setShowWarningModal] = useState(false)

  const supabase = createClient()
  const { isOnline, pendingSyncCount } = useOffline()
  const { isAdmin, loading: roleLoading } = useRole()

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

      // Load ALL athletes for this event
      const { data: allAthletes } = await supabase
        .from('athletes')
        .select('*')
        .eq('event_id', eventId)
        .eq('race_type', 'singles')
        .order('bib_number') as unknown as { data: Athlete[] | null }

      if (allAthletes && allAthletes.length > 0) {
        // Get athletes for this hour
        let hourAthletes = allAthletes.filter(a => a.heat_number === heatNumber)

        // If no records exist for this hour, auto-create them from existing teams
        if (hourAthletes.length === 0) {
          // Get unique teams by bib_number
          const seen = new Set<string>()
          const uniqueTeams = allAthletes.filter(a => {
            if (seen.has(a.bib_number)) return false
            seen.add(a.bib_number)
            return true
          })

          // Create missing hour records
          const newRecords = uniqueTeams.map(team => ({
            event_id: eventId,
            race_type: 'singles' as const,
            heat_number: heatNumber,
            bib_number: team.bib_number,
            first_name: team.first_name,
            last_name: team.last_name,
            gender: team.gender,
            age_category: team.age_category,
            team_name: team.team_name,
          }))

          const { data: inserted } = await supabase
            .from('athletes')
            .insert(newRecords as never)
            .select() as unknown as { data: Athlete[] | null }

          hourAthletes = inserted || []
        }

        setAthletes(hourAthletes)
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
    setPhotoStates({})
    setPhotoResults({})
    setLoading(false)
  }, [eventId, heatNumber, supabase, isOnline])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleScoreChange = (athleteId: string, distance: number | null) => {
    setPendingScores((prev) => ({
      ...prev,
      [athleteId]: distance,
    }))
  }

  const handlePhotoStateChange = (athleteId: string, state: PhotoCaptureState) => {
    setPhotoStates((prev) => ({ ...prev, [athleteId]: state }))
  }

  const handlePhotoResultChange = (athleteId: string, result: PhotoResult | null) => {
    setPhotoResults((prev) => ({ ...prev, [athleteId]: result }))
  }

  // Build the list of scores to submit
  const buildScoresToUpsert = useCallback((): ScoreInsert[] => {
    const scoresToUpsert: ScoreInsert[] = []
    for (const [athleteId, distance] of Object.entries(pendingScores)) {
      if (distance !== null && distance >= 0) {
        scoresToUpsert.push({
          athlete_id: athleteId,
          station: STATION,
          distance_meters: distance,
          recorded_by: null,
        })
      }
    }
    return scoresToUpsert
  }, [pendingScores])

  // Check if all athletes have scores (either saved or pending)
  const getMissingScoreAthletes = useCallback(() => {
    return athletes.filter((athlete) => {
      const savedScore = scores.find(
        (s) => s.athlete_id === athlete.id && s.station === STATION
      )
      const pendingScore = pendingScores[athlete.id]
      return savedScore === undefined && (pendingScore === null || pendingScore === undefined)
    })
  }, [athletes, scores, pendingScores])

  // Advance to next hour
  const advanceToNextHour = useCallback(() => {
    if (heatNumber < 6) {
      setHeatNumber(heatNumber + 1)
    }
  }, [heatNumber])

  // Check for range warnings before submitting
  const handleSubmitClick = () => {
    setMessage(null)

    const missingAthletes = getMissingScoreAthletes()
    if (missingAthletes.length > 0) {
      const names = missingAthletes.slice(0, 3).map(a => getDisplayName(a)).join(', ')
      const remaining = missingAthletes.length > 3 ? ` and ${missingAthletes.length - 3} more` : ''
      setMessage({
        type: 'error',
        text: `All teams must have scores. Missing: ${names}${remaining}`
      })
      return
    }

    const scoresToUpsert = buildScoresToUpsert()

    if (scoresToUpsert.length === 0) {
      advanceToNextHour()
      return
    }

    const scoresToValidate = scoresToUpsert.map((s) => {
      const athlete = athletes.find((a) => a.id === s.athlete_id)
      return {
        athleteId: s.athlete_id,
        athleteName: athlete ? getDisplayName(athlete) : 'Unknown',
        distance: s.distance_meters,
      }
    })

    const warnings = validateScores(scoresToValidate, STATION)

    if (warnings.length > 0) {
      setScoreWarnings(warnings)
      setShowWarningModal(true)
    } else {
      handleConfirmedSubmit()
    }
  }

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

      const existingScoresMap = new Map(
        scores
          .filter((s) => s.station === STATION)
          .map((s) => [s.athlete_id, s.distance_meters])
      )

      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id || null

      const upsertedScores = await upsertScores(scoresToUpsert)

      // Link photos to scores (only when online)
      if (isOnline && !scoresOffline && upsertedScores) {
        const photoMappings: Array<{ photoId: string; scoreId: string }> = []
        for (const score of upsertedScores) {
          const result = photoResults[score.athlete_id]
          if (result?.photoId) {
            photoMappings.push({ photoId: result.photoId, scoreId: score.id })
          }
        }
        if (photoMappings.length > 0) {
          for (const mapping of photoMappings) {
            const score = upsertedScores.find(s => s.id === mapping.scoreId)
            if (score) {
              supabase
                .from('score_photos')
                .update({ judge_final_value: score.distance_meters } as never)
                .eq('id', mapping.photoId)
                .then(() => {})
            }
          }
          linkPhotosToScores(supabase, photoMappings).catch(console.error)
        }
      }

      // Log audit entries (only when online)
      if (isOnline && !scoresOffline) {
        const auditEntries: ScoreAuditLogInsert[] = scoresToUpsert.map((s) => {
          const oldValue = existingScoresMap.get(s.athlete_id)
          return {
            athlete_id: s.athlete_id,
            event_id: eventId,
            station: STATION,
            action: oldValue !== undefined ? 'updated' : 'created',
            old_value: oldValue ?? null,
            new_value: s.distance_meters,
            changed_by: userId,
          }
        })

        logScoreChanges(supabase, auditEntries).catch(console.error)
      }

      if (!isOnline || scoresOffline) {
        setMessage({
          type: 'info',
          text: `${scoresToUpsert.length} scores saved locally. Will sync when online.`,
        })
      } else {
        setMessage({
          type: 'success',
          text: `${scoresToUpsert.length} score(s) submitted`,
        })
      }

      setPendingScores({})
      setPhotoStates({})
      setPhotoResults({})
      await refreshScores()

      advanceToNextHour()
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
      setTimeout(() => {
        const nextInput = document.querySelector(`[data-athlete-id="${nextAthlete.id}"] input`) as HTMLInputElement
        nextInput?.focus()
        nextInput?.select()
      }, 50)
    }
  }, [athletes])


  if ((loading && !event) || roleLoading) {
    return (
      <div>
        {isAdmin ? <Navigation /> : <JudgeNavigation />}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="card mb-6">
            <div className="flex flex-wrap gap-4">
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

  // Calculate scoring progress
  const scoredCount = athletes.filter((athlete) => {
    const score = scores.find((s) => s.athlete_id === athlete.id && s.station === STATION)
    return score !== undefined
  }).length

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      {isAdmin ? (
        <Navigation eventId={eventId} eventName={event?.name} />
      ) : (
        <JudgeNavigation
          eventName={event?.name}
          showBackToEvents
        />
      )}
      <PageErrorBoundary pageName="Scoring">

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Online/Offline indicator */}
        {!isOnline && (
          <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 bg-amber-50 text-amber-700 rounded-lg text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
            </svg>
            Offline mode
          </div>
        )}

        {/* Hour selector */}
        <div className="mb-4 -mx-4">
          <HeatSelector
            heatNumber={heatNumber}
            onHeatChange={(hour) => {
              setHeatNumber(hour)
              setPendingScores({})
              setPhotoStates({})
              setPhotoResults({})
            }}
          />
        </div>

        {/* Progress bar */}
        {athletes.length > 0 && (
          <div className="mb-6 -mx-4">
            <ScoringProgress
              scored={scoredCount}
              total={athletes.length}
            />
          </div>
        )}

        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : message.type === 'info'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading teams...</p>
        ) : athletes.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">
              No teams in Hour {heatNumber}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {athletes.map((athlete, index) => (
                <div key={athlete.id} data-athlete-id={athlete.id}>
                  <ScoreEntry
                    athlete={athlete}
                    station={STATION}
                    scores={athleteScores(athlete.id)}
                    onChange={handleScoreChange}
                    onEnterPress={index < athletes.length - 1 ? () => focusNextAthlete(athlete.id) : undefined}
                    requirePhoto
                    {...(isOnline ? {
                      eventId,
                      heatNumber,
                      photoState: photoStates[athlete.id] || 'idle',
                      onPhotoStateChange: (state: PhotoCaptureState) => handlePhotoStateChange(athlete.id, state),
                      photoResult: photoResults[athlete.id] || null,
                      onPhotoResultChange: (result: PhotoResult | null) => handlePhotoResultChange(athlete.id, result),
                    } : {})}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Sticky submit footer */}
      {athletes.length > 0 && (
        <div className="sticky bottom-0 z-40 p-4 bg-chalk border-t border-eggshell shadow-lg">
          <div className="max-w-3xl mx-auto">
            {!isOnline && (
              <div className="flex items-center justify-center gap-2 mb-3 py-2 px-4 bg-amber-50 text-amber-700 rounded-lg text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
                </svg>
                Offline - scores will sync when connected
              </div>
            )}

            {(() => {
              const missingCount = getMissingScoreAthletes().length
              const allScored = missingCount === 0
              const isLastHour = heatNumber === 6
              const nextHourLabel = heatNumber < 6 ? `Hour ${heatNumber + 1}` : null

              const isDisabled = saving || !allScored || (isLastHour && !hasChanges)

              return (
                <button
                  onClick={handleSubmitClick}
                  disabled={isDisabled}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-all shadow-md"
                  style={{
                    backgroundColor: isDisabled ? '#D1D5DB' : '#1A1A1A',
                    color: isDisabled ? '#9CA3AF' : '#FFFFFF',
                    minHeight: '56px',
                  }}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : !allScored ? (
                    `${missingCount} Team${missingCount !== 1 ? 's' : ''} Missing Scores`
                  ) : hasChanges ? (
                    nextHourLabel ? `Submit & Continue to ${nextHourLabel}` : 'Submit Scores'
                  ) : (
                    nextHourLabel ? `Continue to ${nextHourLabel}` : 'All Hours Complete'
                  )}
                </button>
              )
            })()}
          </div>
        </div>
      )}

      {/* Range warning modal */}
      {showWarningModal && (
        <RangeWarningModal
          warnings={scoreWarnings}
          onConfirm={handleConfirmedSubmit}
          onCancel={handleCancelWarning}
          isSubmitting={saving}
        />
      )}
      </PageErrorBoundary>
    </div>
  )
}
