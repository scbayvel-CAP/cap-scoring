'use client'

import { useRouter } from 'next/navigation'
import { Athlete, Score } from '@/lib/supabase/types'
import {
  getDisplayName,
  metersToPoints,
  formatPoints,
  getHeatNumbers,
} from '@/lib/utils'

interface LeaderboardProps {
  athletes: Array<Athlete & { scores: Score[] }>
  eventId?: string
}

/**
 * Group athletes by bib_number, aggregate per-hour scores.
 * Each team has up to 6 athlete records (one per hour), same bib_number.
 * Score is always station=1 (Row).
 */
function buildTeamLeaderboard(athletes: Array<Athlete & { scores: Score[] }>) {
  const hours = getHeatNumbers()

  // Group by bib_number
  const teamMap = new Map<string, {
    displayName: string
    bibNumber: string
    athleteIds: string[]
    hourScores: Map<number, number> // hour -> meters
    totalMeters: number
    totalPoints: number
  }>()

  for (const athlete of athletes) {
    const bib = athlete.bib_number
    if (!teamMap.has(bib)) {
      teamMap.set(bib, {
        displayName: getDisplayName(athlete),
        bibNumber: bib,
        athleteIds: [],
        hourScores: new Map(),
        totalMeters: 0,
        totalPoints: 0,
      })
    }
    const team = teamMap.get(bib)!
    team.athleteIds.push(athlete.id)

    // Get score for this hour (station is always 1)
    const score = athlete.scores.find(s => s.station === 1)
    if (score) {
      team.hourScores.set(athlete.heat_number, score.distance_meters)
    }
  }

  // Calculate totals
  Array.from(teamMap.values()).forEach(team => {
    let totalMeters = 0
    Array.from(team.hourScores.values()).forEach(meters => {
      totalMeters += meters
    })
    team.totalMeters = totalMeters
    team.totalPoints = metersToPoints(totalMeters)
  })

  // Sort by total points descending
  const sorted = Array.from(teamMap.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints
  )

  return sorted.map((team, index) => ({
    ...team,
    rank: index + 1,
    hours,
  }))
}

export function Leaderboard({ athletes, eventId }: LeaderboardProps) {
  const router = useRouter()
  const hours = getHeatNumbers()
  const teams = buildTeamLeaderboard(athletes)

  if (teams.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No teams match the selected filters</p>
      </div>
    )
  }

  const handleRowClick = (athleteIds: string[]) => {
    if (eventId && athleteIds.length > 0) {
      router.push(`/live/${eventId}/athlete/${athleteIds[0]}`)
    }
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-th w-16">Rank</th>
              <th className="table-th">Team</th>
              {hours.map((h) => (
                <th key={h} className="table-th-center" title={`Hour ${h}`}>
                  H{h}
                </th>
              ))}
              <th className="table-th-right">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teams.map((team) => (
              <tr
                key={team.bibNumber}
                onClick={() => handleRowClick(team.athleteIds)}
                className={`${team.rank <= 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'} ${eventId ? 'cursor-pointer' : ''}`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      team.rank === 1
                        ? 'bg-yellow-400 text-yellow-900'
                        : team.rank === 2
                        ? 'bg-gray-300 text-gray-800'
                        : team.rank === 3
                        ? 'bg-orange-300 text-orange-900'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {team.rank}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div>
                    <span className="font-medium text-night-green">
                      {team.displayName}
                    </span>
                    <span className="ml-2 text-sm text-battleship">
                      #{team.bibNumber}
                    </span>
                  </div>
                </td>
                {hours.map((h) => {
                  const meters = team.hourScores.get(h)
                  return (
                    <td
                      key={h}
                      className="px-4 py-3 whitespace-nowrap text-center"
                    >
                      {meters !== undefined ? (
                        <span className="text-sm font-medium text-night-green">
                          {metersToPoints(meters)}
                        </span>
                      ) : (
                        <span className="text-battleship">-</span>
                      )}
                    </td>
                  )
                })}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="font-bold text-lg text-night-green">
                    {formatPoints(team.totalPoints)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
