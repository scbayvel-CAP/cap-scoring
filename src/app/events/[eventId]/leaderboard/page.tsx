'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { Leaderboard } from '@/components/Leaderboard'
import { PageErrorBoundary } from '@/components/ErrorBoundary'
import { Skeleton, SkeletonLeaderboard } from '@/components/Skeleton'
import { AGE_CATEGORIES } from '@/lib/supabase/types'
import { useAthletes } from '@/hooks/useAthletes'
import { useEvent } from '@/hooks/useEvent'
import { useRole } from '@/hooks/useRole'
import {
  generateLeaderboardCSV,
  generateLeaderboardPDF,
  downloadCSV,
  generateExportFilename,
} from '@/lib/csv/exporter'

export default function LeaderboardPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const { event } = useEvent(eventId)
  const { athletes, loading } = useAthletes({
    eventId,
    includeScores: true,
    realtime: true,
  })
  const { isAdmin } = useRole()

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

  const handleExportCSV = () => {
    if (!event || filteredAthletes.length === 0) return

    const csvContent = generateLeaderboardCSV(filteredAthletes, {
      event,
      raceType,
      filters: raceType === 'singles'
        ? { gender, ageCategory }
        : { doublesCategory },
    })

    const filename = generateExportFilename(event.name, raceType, 'csv')
    downloadCSV(csvContent, filename)
  }

  const handleExportPDF = () => {
    if (!event || filteredAthletes.length === 0) return

    generateLeaderboardPDF(filteredAthletes, {
      event,
      raceType,
      filters: raceType === 'singles'
        ? { gender, ageCategory }
        : { doublesCategory },
    })
  }

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
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-40" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
            </div>
          </div>

          <div className="card mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <div className="flex space-x-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>

          <Skeleton className="h-4 w-32 mb-4" />
          <SkeletonLeaderboard rows={10} />
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navigation eventId={eventId} eventName={event?.name} />
      <PageErrorBoundary pageName="Leaderboard">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={handleExportCSV}
                  disabled={filteredAthletes.length === 0}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={filteredAthletes.length === 0}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  PDF
                </button>
              </>
            )}
          </div>
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
      </PageErrorBoundary>
    </div>
  )
}
