import { createClient } from '@/lib/supabase/server'
import { Navigation } from '@/components/Navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EventStatusUpdater } from '@/components/EventStatusUpdater'
import { Event, Athlete } from '@/lib/supabase/types'

interface PageProps {
  params: Promise<{ eventId: string }>
}

export default async function EventPage({ params }: PageProps) {
  const { eventId } = await params
  const supabase = await createClient()

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
    .select('id, race_type, heat_number')
    .eq('event_id', eventId) as unknown as { data: Pick<Athlete, 'id' | 'race_type' | 'heat_number'>[] | null }

  const singlesCount = athletes?.filter(a => a.race_type === 'singles').length || 0
  const doublesCount = athletes?.filter(a => a.race_type === 'doubles').length || 0

  // Get unique heat numbers
  const singlesHeats = new Set(
    athletes?.filter(a => a.race_type === 'singles').map(a => a.heat_number)
  ).size
  const doublesHeats = new Set(
    athletes?.filter(a => a.race_type === 'doubles').map(a => a.heat_number)
  ).size

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
            <EventStatusUpdater eventId={event.id} currentStatus={event.status} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Singles Athletes</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{singlesCount}</p>
            <p className="text-sm text-gray-500">{singlesHeats} heats</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Doubles Teams</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{doublesCount}</p>
            <p className="text-sm text-gray-500">{doublesHeats} heats</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Total Participants</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {singlesCount + doublesCount}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Scores Recorded</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{scoresCount || 0}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href={`/events/${event.id}/athletes`}
            className="card hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-900">Manage Athletes</h2>
            <p className="text-sm text-gray-500 mt-1">
              Add, edit, and assign athletes to heats
            </p>
          </Link>
          <Link
            href={`/events/${event.id}/scoring`}
            className="card hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-900">Enter Scores</h2>
            <p className="text-sm text-gray-500 mt-1">
              Record distances for each station
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
        </div>
      </main>
    </div>
  )
}
