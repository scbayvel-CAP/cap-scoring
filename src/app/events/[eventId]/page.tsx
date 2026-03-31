import { createClient } from '@/lib/supabase/server'
import { Navigation } from '@/components/Navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EventStatusUpdater } from '@/components/EventStatusUpdater'
import { Event, Athlete } from '@/lib/supabase/types'
import { getUserRole } from '@/lib/auth/role'

interface PageProps {
  params: Promise<{ eventId: string }>
}

export default async function EventPage({ params }: PageProps) {
  const { eventId } = await params
  const supabase = await createClient()
  const userRole = await getUserRole()
  const isAdmin = userRole?.role === 'admin'

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single() as unknown as { data: Event | null, error: Error | null }

  if (error || !event) {
    notFound()
  }

  // Get athlete counts
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, bib_number, heat_number')
    .eq('event_id', eventId) as unknown as { data: Pick<Athlete, 'id' | 'bib_number' | 'heat_number'>[] | null }

  // Count unique teams (by bib_number)
  const uniqueTeams = new Set(athletes?.map(a => a.bib_number)).size

  // Get unique hours used
  const hoursUsed = new Set(athletes?.map(a => a.heat_number)).size

  // Get score counts
  const { count: scoresCount } = await supabase
    .from('scores')
    .select('id', { count: 'exact' })
    .in('athlete_id', athletes?.map(a => a.id) || [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div>
      <Navigation eventId={event.id} eventName={event.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
              <p className="text-gray-500 mt-1">
                {formatDate(event.date)}
                {event.location && ` • ${event.location}`}
              </p>
            </div>
            {isAdmin && (
              <EventStatusUpdater eventId={event.id} currentStatus={event.status} />
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Teams</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{uniqueTeams}</p>
            <p className="text-sm text-gray-500">{hoursUsed} hours</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Athlete Records</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {athletes?.length || 0}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Scores Recorded</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{scoresCount || 0}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {isAdmin && (
            <Link
              href={`/events/${event.id}/athletes`}
              className="card hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-900">Manage Teams</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add, edit, and assign teams to hours
              </p>
            </Link>
          )}
          <Link
            href={`/events/${event.id}/scoring`}
            className="card hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-900">Enter Scores</h2>
            <p className="text-sm text-gray-500 mt-1">
              Record rowing distances for each hour
            </p>
          </Link>
          <Link
            href={`/events/${event.id}/leaderboard`}
            className="card hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-900">View Leaderboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              See rankings and live updates
            </p>
          </Link>
          {isAdmin && (
            <Link
              href={`/events/${event.id}/photos`}
              className="card hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-900">Score Photos</h2>
              <p className="text-sm text-gray-500 mt-1">
                Review photos of machine displays
              </p>
            </Link>
          )}
          {isAdmin && (
            <Link
              href={`/events/${event.id}/audit-log`}
              className="card hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
              <p className="text-sm text-gray-500 mt-1">
                Track all score changes and edits
              </p>
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
