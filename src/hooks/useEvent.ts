'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Event } from '@/lib/supabase/types'
import { getEvent, updateEvent as patchEvent } from '@/lib/supabase/queries'

export function useEvent(eventId: string) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getEvent(supabase, eventId)
        setEvent(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load event')
      }

      setLoading(false)
    }

    loadEvent()
  }, [eventId, supabase])

  const updateEvent = async (updates: Partial<Event>) => {
    const data = await patchEvent(supabase, eventId, updates)
    setEvent(data)
    return data
  }

  return { event, loading, error, updateEvent }
}
