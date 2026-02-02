'use client'

import Link from 'next/link'
import { Athlete, Score, STATIONS } from '@/lib/supabase/types'
import {
  getDisplayName,
  formatDistance,
  calculateTotalDistance,
  hasCompletedStation,
  sortByTotalDistance,
} from '@/lib/utils'

interface LeaderboardProps {
  athletes: Array<Athlete & { scores: Score[] }>
  eventId?: string
  showAthleteLinks?: boolean
}

export function Leaderboard({ athletes, eventId, showAthleteLinks = false }: LeaderboardProps) {
  const rankedAthletes = sortByTotalDistance(athletes)

  if (rankedAthletes.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No athletes match the selected filters</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden p-0">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="table-th w-16">Rank</th>
            <th className="table-th">Athlete</th>
            {Object.entries(STATIONS).map(([num, name]) => (
              <th
                key={num}
                className="table-th-center w-16"
                title={name}
              >
                {name.charAt(0)}
              </th>
            ))}
            <th className="table-th-right">Total</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rankedAthletes.map((athlete) => (
            <tr
              key={athlete.id}
              className={athlete.rank <= 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    athlete.rank === 1
                      ? 'bg-yellow-400 text-yellow-900'
                      : athlete.rank === 2
                      ? 'bg-gray-300 text-gray-800'
                      : athlete.rank === 3
                      ? 'bg-orange-300 text-orange-900'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {athlete.rank}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div>
                  {showAthleteLinks && eventId ? (
                    <Link
                      href={`/live/${eventId}/athlete/${athlete.id}`}
                      className="font-medium text-primary-600 hover:text-primary-800 hover:underline"
                    >
                      {getDisplayName(athlete)}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-900">
                      {getDisplayName(athlete)}
                    </span>
                  )}
                  <span className="ml-2 text-sm text-gray-500">
                    #{athlete.bib_number}
                  </span>
                </div>
                {athlete.race_type === 'singles' ? (
                  <span className="text-xs text-gray-500">
                    {athlete.gender === 'male' ? 'M' : 'F'} / {athlete.age_category}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">
                    {athlete.doubles_category}
                  </span>
                )}
              </td>
              {Object.keys(STATIONS).map((stationNum) => {
                const completed = hasCompletedStation(athlete.scores, parseInt(stationNum))
                return (
                  <td
                    key={stationNum}
                    className="px-4 py-3 whitespace-nowrap text-center"
                  >
                    {completed ? (
                      <span className="text-green-600 text-lg">&#10003;</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                )
              })}
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <span className="font-bold text-lg text-gray-900">
                  {formatDistance(athlete.totalDistance)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
