'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Athlete, AthleteInsert, AthleteWithScores } from '@/lib/supabase/types'
import {
  getAthletes as fetchAthletes,
  insertAthlete,
  updateAthlete as patchAthlete,
  deleteAthlete as removeAthlete,
} from '@/lib/supabase/queries'

interface UseAthletesOptions {
  eventId: string
  raceType?: 'singles' | 'doubles'
  heatNumber?: number
  includeScores?: boolean
  realtime?: boolean
}

export function useAthletes({
  eventId,
  raceType,
  heatNumber,
  includeScores = false,
  realtime = false,
}: UseAthletesOptions) {
  const [athletes, setAthletes] = useState<AthleteWithScores[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const loadAthletes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchAthletes(supabase, {
        eventId,
        raceType,
        heatNumber,
        includeScores,
      })
      setAthletes(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load athletes')
    }

    setLoading(false)
  }, [eventId, raceType, heatNumber, includeScores, supabase])

  useEffect(() => {
    loadAthletes()
  }, [loadAthletes])

  // Real-time subscription
  useEffect(() => {
    if (!realtime) return

    const channel = supabase
      .channel('athletes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'athletes',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          loadAthletes()
        }
      )

    // Also subscribe to score changes when includeScores is enabled
    if (includeScores) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
        },
        () => {
          loadAthletes()
        }
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [realtime, eventId, supabase, loadAthletes, includeScores])

  const addAthlete = async (athlete: AthleteInsert) => {
    const data = await insertAthlete(supabase, athlete)
    await loadAthletes()
    return data
  }

  const updateAthlete = async (athleteId: string, updates: Partial<Athlete>) => {
    const data = await patchAthlete(supabase, athleteId, updates)
    await loadAthletes()
    return data
  }

  const deleteAthlete = async (athleteId: string) => {
    await removeAthlete(supabase, athleteId)
    await loadAthletes()
  }

  return {
    athletes,
    loading,
    error,
    refresh: loadAthletes,
    addAthlete,
    updateAthlete,
    deleteAthlete,
  }
}
