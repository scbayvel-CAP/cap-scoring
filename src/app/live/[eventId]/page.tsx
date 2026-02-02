'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Leaderboard } from '@/components/Leaderboard'
import { Athlete, Event, Score, AGE_CATEGORIES, AthleteWithScores } from '@/lib/supabase/types'

export default function PublicLeaderboardPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [athletes, setAthletes] = useState<AthleteWithScores[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Filters
  const [raceType, setRaceType] = useState<'singles' | 'doubles'>('singles')
  const [gender, setGender] = useState<'all' | 'male' | 'female'>('all')
  const [ageCategory, setAgeCategory] = useState<string>('all')
  const [doublesCategory, setDoublesCategory] = useState<'all' | 'men' | 'women' | 'mixed'>('all')

  const supabase = createClient()

  const loadData = useCallback(async () => {
    // Load event
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single() as unknown as { data: Event | null }

    if (eventData) setEvent(eventData)

    // Load all athletes with their scores
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

  // Filter athletes
  const filteredAthletes = athletes.filter((athlete) => {
    if (athlete.race_type !== raceType) return false

    if (raceType === 'singles') {
      if (gender !== 'all' && athlete.gender !== gender) return false
      if (ageCategory !== 'all' && athlete.age_category !== ageCategory) return false
    } else {
      if (doublesCategory !== 'all' && athlete.doubles_category !== doublesCategory) return false
    }

    return true
  })

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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Race Type</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setRaceType('singles')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    raceType === 'singles'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Singles
                </button>
                <button
                  onClick={() => setRaceType('doubles')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    raceType === 'doubles'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Doubles
                </button>
              </div>
            </div>

            {raceType === 'singles' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'all' | 'male' | 'female')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="all">All Genders</option>
                    <option value="male">Men</option>
                    <option value="female">Women</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Category</label>
                  <select
                    value={ageCategory}
                    onChange={(e) => setAgeCategory(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="all">All Ages</option>
                    {AGE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={doublesCategory}
                  onChange={(e) =>
                    setDoublesCategory(e.target.value as 'all' | 'men' | 'women' | 'mixed')
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          Showing {filteredAthletes.length} {raceType === 'singles' ? 'athletes' : 'teams'}
        </div>

        <Leaderboard athletes={filteredAthletes} eventId={eventId} showAthleteLinks />

        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>CAP 55 Scoring System</p>
        </footer>
      </main>
    </div>
  )
}
