'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { Leaderboard } from '@/components/Leaderboard'
import { AGE_CATEGORIES } from '@/lib/supabase/types'
import { useAthletes } from '@/hooks/useAthletes'
import { useEvent } from '@/hooks/useEvent'

export default function LeaderboardPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const { event } = useEvent(eventId)
  const { athletes, loading } = useAthletes({
    eventId,
    includeScores: true,
    realtime: true,
  })

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Filters
  const [raceType, setRaceType] = useState<'singles' | 'doubles'>('singles')
  const [gender, setGender] = useState<'all' | 'male' | 'female'>('all')
  const [ageCategory, setAgeCategory] = useState<string>('all')
  const [doublesCategory, setDoublesCategory] = useState<'all' | 'men' | 'women' | 'mixed'>('all')

  // Update timestamp when athletes change (via real-time)
  useEffect(() => {
    if (athletes.length > 0) {
      setLastUpdate(new Date())
    }
  }, [athletes])

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
      <div>
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navigation eventId={eventId} eventName={event?.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="card mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="label">Race Type</label>
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
                  <label className="label">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'all' | 'male' | 'female')}
                    className="select"
                  >
                    <option value="all">All Genders</option>
                    <option value="male">Men</option>
                    <option value="female">Women</option>
                  </select>
                </div>
                <div>
                  <label className="label">Age Category</label>
                  <select
                    value={ageCategory}
                    onChange={(e) => setAgeCategory(e.target.value)}
                    className="select"
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
                <label className="label">Category</label>
                <select
                  value={doublesCategory}
                  onChange={(e) =>
                    setDoublesCategory(e.target.value as 'all' | 'men' | 'women' | 'mixed')
                  }
                  className="select"
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

        <Leaderboard athletes={filteredAthletes} />
      </main>
    </div>
  )
}
