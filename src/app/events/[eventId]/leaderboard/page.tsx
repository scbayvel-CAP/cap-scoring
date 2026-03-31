'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { Leaderboard } from '@/components/Leaderboard'
import { PageErrorBoundary } from '@/components/ErrorBoundary'
import { Skeleton, SkeletonLeaderboard } from '@/components/Skeleton'
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

  useEffect(() => {
    if (athletes.length > 0) {
      setLastUpdate(new Date())
    }
  }, [athletes])

  const handleExportCSV = () => {
    if (!event || athletes.length === 0) return

    const csvContent = generateLeaderboardCSV(athletes, { event })
    const filename = generateExportFilename(event.name, 'csv')
    downloadCSV(csvContent, filename)
  }

  const handleExportPDF = () => {
    if (!event || athletes.length === 0) return
    generateLeaderboardPDF(athletes, { event })
  }

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
                  disabled={athletes.length === 0}
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
                  disabled={athletes.length === 0}
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

        <div className="text-sm text-gray-500 mb-4">
          Showing {athletes.length} teams
        </div>

        <Leaderboard athletes={athletes} eventId={eventId} />
      </main>
      </PageErrorBoundary>
    </div>
  )
}
