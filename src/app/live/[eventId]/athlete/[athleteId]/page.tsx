'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'
import { Event, AthleteWithScores } from '@/lib/supabase/types'
import {
  getDisplayName,
  metersToPoints,
  formatPoints,
  formatDistance,
  getHeatNumbers,
} from '@/lib/utils'

export default function AthleteResultPage() {
  const params = useParams()
  const eventId = params.eventId as string
  const athleteId = params.athleteId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [teamAthletes, setTeamAthletes] = useState<AthleteWithScores[]>([])
  const [allTeams, setAllTeams] = useState<AthleteWithScores[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const supabase = createClient()

  const loadData = useCallback(async () => {
    // Load event
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single() as unknown as { data: Event | null }

    if (eventData) setEvent(eventData)

    // Load this athlete to get bib_number
    const { data: athleteData } = await supabase
      .from('athletes')
      .select('*, scores(*)')
      .eq('id', athleteId)
      .single() as unknown as { data: AthleteWithScores | null }

    if (athleteData) {
      // Load all athlete records with this bib_number (one per hour)
      const { data: teamData } = await supabase
        .from('athletes')
        .select('*, scores(*)')
        .eq('event_id', eventId)
        .eq('bib_number', athleteData.bib_number)
        .order('heat_number') as unknown as { data: AthleteWithScores[] | null }

      if (teamData) {
        setTeamAthletes(teamData)
      }

      // Load all athletes for ranking
      const { data: allData } = await supabase
        .from('athletes')
        .select('*, scores(*)')
        .eq('event_id', eventId) as unknown as { data: AthleteWithScores[] | null }

      if (allData) {
        setAllTeams(allData)
      }
    }

    setLastUpdate(new Date())
    setLoading(false)
  }, [eventId, athleteId, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('athlete-scores-changes')
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

  // Calculate ranking by grouping all athletes by bib
  const calculateRanking = () => {
    const bibMap = new Map<string, number>()
    for (const a of allTeams) {
      const score = a.scores.find(s => s.station === 1)
      const meters = score?.distance_meters || 0
      bibMap.set(a.bib_number, (bibMap.get(a.bib_number) || 0) + meters)
    }

    const sorted = Array.from(bibMap.entries())
      .map(([bib, meters]) => ({ bib, points: metersToPoints(meters) }))
      .sort((a, b) => b.points - a.points)

    const currentBib = teamAthletes[0]?.bib_number
    const rank = sorted.findIndex(t => t.bib === currentBib) + 1
    return { rank, total: sorted.length }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-primary-600 text-white py-6">
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-primary-100">Loading...</p>
          </div>
        </header>
      </div>
    )
  }

  if (teamAthletes.length === 0 || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h1>
          <p className="text-gray-600 mb-4">The team you are looking for does not exist.</p>
          <Link href={`/live/${eventId}`} className="text-primary-600 hover:underline">
            Back to Leaderboard
          </Link>
        </div>
      </div>
    )
  }

  const hours = getHeatNumbers()
  const teamName = getDisplayName(teamAthletes[0])
  const bibNumber = teamAthletes[0].bib_number

  // Build hour scores
  const hourData = hours.map(h => {
    const hourAthlete = teamAthletes.find(a => a.heat_number === h)
    const score = hourAthlete?.scores.find(s => s.station === 1)
    return {
      hour: h,
      meters: score?.distance_meters || 0,
      points: metersToPoints(score?.distance_meters || 0),
      hasScore: !!score,
    }
  })

  const totalMeters = hourData.reduce((sum, h) => sum + h.meters, 0)
  const totalPoints = metersToPoints(totalMeters)
  const { rank: currentRank, total: totalTeams } = calculateRanking()
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-600 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href={`/live/${eventId}`}
            className="inline-flex items-center text-primary-100 hover:text-white mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Leaderboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">{event.name}</h1>
          <p className="text-primary-100 mt-1">
            {new Date(event.date).toLocaleDateString('en-AU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Team Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  {teamName}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  #{bibNumber}
                </span>
              </div>
            </div>

            {/* Ranking Badge */}
            <div className="text-center">
              <div
                className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${
                  currentRank === 1
                    ? 'bg-yellow-400 text-yellow-900'
                    : currentRank === 2
                    ? 'bg-gray-300 text-gray-800'
                    : currentRank === 3
                    ? 'bg-orange-300 text-orange-900'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                #{currentRank}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                of {totalTeams} teams
              </p>
            </div>
          </div>
        </div>

        {/* Total Points */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-sm p-6 mb-6 text-white">
          <p className="text-primary-100 text-sm uppercase tracking-wide mb-1">Total Points</p>
          <p className="text-4xl sm:text-5xl font-bold">{formatPoints(totalPoints)}</p>
          <p className="text-primary-200 text-sm mt-1">{formatDistance(totalMeters)} rowed</p>
        </div>

        {/* Hour Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hour Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {hourData.map(({ hour, meters, points, hasScore }) => (
              <div
                key={hour}
                className={`rounded-lg p-4 text-center ${
                  hasScore ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <p className="text-sm font-medium text-gray-600 mb-1">Hour {hour}</p>
                {hasScore ? (
                  <>
                    <p className="text-xl font-bold text-green-700">
                      {formatPoints(points)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDistance(meters)}</p>
                  </>
                ) : (
                  <p className="text-xl font-bold text-gray-400">--</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* QR Code for sharing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Share Results</h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <QRCodeSVG value={currentUrl} size={120} />
            </div>
            <div>
              <p className="text-gray-600 mb-2">
                Scan this QR code to view these results on another device.
              </p>
              <p className="text-sm text-gray-500">
                Results update in real-time as scores are entered.
              </p>
            </div>
          </div>
        </div>

        {lastUpdate && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}

        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>CAP Scoring System</p>
        </footer>
      </main>
    </div>
  )
}
