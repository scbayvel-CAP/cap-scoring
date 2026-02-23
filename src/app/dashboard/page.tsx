import { createClient } from '@/lib/supabase/server'
import { Navigation } from '@/components/Navigation'
import { JudgeNavigation } from '@/components/JudgeNavigation'
import Link from 'next/link'
import { Event } from '@/lib/supabase/types'
import { getUserRole } from '@/lib/auth/role'
import { getStationName } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const userRole = await getUserRole()
  const isAdmin = userRole?.role === 'admin'
  const isJudge = userRole?.role === 'judge'
  const assignedStation = userRole?.assignedStation

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false }) as unknown as { data: Event[] | null, error: Error | null }

  // For judges, only show active events
  const displayEvents = isJudge
    ? events?.filter(e => e.status === 'active')
    : events

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: Event['status']) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // Simplified judge view
  if (isJudge) {
    return (
      <div className="min-h-screen bg-ivory">
        <JudgeNavigation stationName={assignedStation ? getStationName(assignedStation) : undefined} />
        <main className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-night-green mb-2">Select Event</h1>
            {assignedStation && (
              <p className="text-battleship">
                You are assigned to <span className="font-semibold text-night-green">{getStationName(assignedStation)}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              Error loading events: {error.message}
            </div>
          )}

          {displayEvents && displayEvents.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-500">No active events available</p>
              <p className="text-sm text-battleship mt-2">Please wait for an admin to activate an event</p>
            </div>
          )}

          {displayEvents && displayEvents.length > 0 && (
            <div className="space-y-4">
              {displayEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}/scoring`}
                  className="block card hover:shadow-md hover:border-night-green transition-all p-6"
                >
                  <h2 className="text-xl font-semibold text-night-green mb-1">
                    {event.name}
                  </h2>
                  <p className="text-battleship">
                    {formatDate(event.date)}
                    {event.location && ` • ${event.location}`}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-olive font-medium">Tap to enter scores →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  // Admin view (unchanged)
  return (
    <div>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <div className="flex gap-3">
            {isAdmin && (
              <Link href="/admin/judges" className="btn-secondary">
                Manage Judges
              </Link>
            )}
            {isAdmin && (
              <Link href="/events/new" className="btn-primary">
                Create Event
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            Error loading events: {error.message}
          </div>
        )}

        {events && events.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No events yet</p>
            {isAdmin && (
              <Link href="/events/new" className="btn-primary">
                Create Your First Event
              </Link>
            )}
          </div>
        )}

        {events && events.length > 0 && (
          <div className="grid gap-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {event.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {formatDate(event.date)}
                      {event.location && ` • ${event.location}`}
                    </p>
                  </div>
                  {getStatusBadge(event.status)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
