'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Leaderboard } from '@/components/Leaderboard'
import { Event, AthleteWithScores } from '@/lib/supabase/types'

export default function PublicLeaderboardPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [athletes, setAthletes] = useState<AthleteWithScores[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single() as unknown as { data: Event | null }

    if (eventData) setEvent(eventData)

    const { data: athletesData } = await supabase
      .from('athletes')
      .select('*, scores(*)')
      .eq('event_id', eventId)
      .order('bib_number') as unknown as { data: AthleteWithScores[] | null }

    if (athletesData) {
      setAthletes(athletesData)
    }

    setLastUpdate(new Date())
    setLoading(false)
  }, [eventId, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('public-scores-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
        },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadData])

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-primary-600 text-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
        </header>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600">The event you are looking for does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{event.name}</h1>
              <p className="text-primary-100 mt-1">
                {new Date(event.date).toLocaleDateString('en-AU', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {event.location && ` • ${event.location}`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {event.status === 'active' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white">
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                  Live
                </span>
              )}
              {lastUpdate && (
                <span className="text-sm text-primary-200">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-gray-500 mb-4">
          Showing {athletes.length} teams
        </div>

        <Leaderboard athletes={athletes} eventId={eventId} />

        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>CAP Scoring System</p>
        </footer>
      </main>
    </div>
  )
}
