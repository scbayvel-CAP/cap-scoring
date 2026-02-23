'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { PageErrorBoundary } from '@/components/ErrorBoundary'
import { Skeleton, SkeletonTable } from '@/components/Skeleton'
import { Event } from '@/lib/supabase/types'
import { getAuditLog, getAuditLogCount, AuditLogEntry } from '@/lib/supabase/queries'
import { getStationName, getDisplayName } from '@/lib/utils'
import { useRole } from '@/hooks/useRole'

const PAGE_SIZE = 50

export default function AuditLogPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  // Filters
  const [stationFilter, setStationFilter] = useState<number | null>(null)

  const supabase = createClient()
  const { isAdmin, loading: roleLoading } = useRole()

  const loadData = useCallback(async () => {
    setLoading(true)

    try {
      // Load event
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventData) setEvent(eventData as Event)

      // Load audit log entries
      const options = {
        eventId,
        station: stationFilter || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }

      const [auditEntries, count] = await Promise.all([
        getAuditLog(supabase, options),
        getAuditLogCount(supabase, options),
      ])

      setEntries(auditEntries)
      setTotalCount(count)
    } catch (err) {
      console.error('Error loading audit log:', err)
    }

    setLoading(false)
  }, [eventId, stationFilter, page, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Redirect non-admins
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.push(`/events/${eventId}`)
    }
  }, [isAdmin, roleLoading, router, eventId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Created
          </span>
        )
      case 'updated':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Updated
          </span>
        )
      case 'deleted':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Deleted
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {action}
          </span>
        )
    }
  }

  const getAthleteDisplay = (entry: AuditLogEntry) => {
    if (entry.athlete) {
      const athlete = entry.athlete as any
      if (athlete.race_type === 'doubles') {
        return `${athlete.bib_number} - ${athlete.team_name || 'Doubles Team'}`
      }
      return `${athlete.bib_number} - ${athlete.first_name || ''} ${athlete.last_name || ''}`.trim()
    }
    return 'Unknown Athlete'
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  if (roleLoading || (!isAdmin && !roleLoading)) {
    return (
      <div>
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>

          <Skeleton className="h-4 w-96 mb-6" />

          <div className="card mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-40" />
              </div>
              <div className="flex-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <SkeletonTable rows={10} columns={7} />
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navigation eventId={eventId} eventName={event?.name} />
      <PageErrorBoundary pageName="Audit Log">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Score Audit Log</h1>
          <button
            onClick={() => router.push(`/events/${eventId}`)}
            className="btn-secondary"
          >
            Back to Event
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Complete history of all score changes for accountability and dispute resolution.
        </p>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Station
              </label>
              <select
                value={stationFilter || ''}
                onChange={(e) => {
                  setStationFilter(e.target.value ? parseInt(e.target.value) : null)
                  setPage(0)
                }}
                className="input w-40"
              >
                <option value="">All Stations</option>
                <option value="1">Station 1 (Run)</option>
                <option value="2">Station 2 (Row)</option>
                <option value="3">Station 3 (Bike)</option>
                <option value="4">Station 4 (Ski)</option>
              </select>
            </div>
            <div className="flex-1" />
            <div className="text-sm text-gray-500">
              {totalCount} total entries
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        {loading ? (
          <p className="text-gray-500">Loading audit log...</p>
        ) : entries.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No audit log entries found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Athlete
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Station
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Old Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Changed By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(entry.changed_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getAthleteDisplay(entry)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getStationName(entry.station)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getActionBadge(entry.action)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {entry.old_value !== null ? `${entry.old_value}m` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {entry.new_value !== null ? `${entry.new_value}m` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {entry.changer_email || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
      </PageErrorBoundary>
    </div>
  )
}
