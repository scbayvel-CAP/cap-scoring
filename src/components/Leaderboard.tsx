'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Athlete, Score, STATIONS } from '@/lib/supabase/types'
import {
  getDisplayName,
  formatDistance,
  getScoreForStation,
  sortByTotalDistance,
} from '@/lib/utils'

interface LeaderboardProps {
  athletes: Array<Athlete & { scores: Score[] }>
  eventId?: string
}

export function Leaderboard({ athletes, eventId }: LeaderboardProps) {
  const router = useRouter()
  const rankedAthletes = sortByTotalDistance(athletes)

  if (rankedAthletes.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No athletes match the selected filters</p>
      </div>
    )
  }

  const handleRowClick = (athleteId: string) => {
    if (eventId) {
      router.push(`/live/${eventId}/athlete/${athleteId}`)
    }
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
                className="table-th-center"
                title={name}
              >
                {name}
              </th>
            ))}
            <th className="table-th-right">Total</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rankedAthletes.map((athlete) => (
            <tr
              key={athlete.id}
              onClick={() => handleRowClick(athlete.id)}
              className={`${athlete.rank <= 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'} ${eventId ? 'cursor-pointer' : ''}`}
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
                  <span className="font-medium text-night-green">
                    {getDisplayName(athlete)}
                  </span>
                  <span className="ml-2 text-sm text-battleship">
                    #{athlete.bib_number}
                  </span>
                </div>
                {athlete.race_type === 'singles' ? (
                  <span className="text-xs text-battleship">
                    {athlete.gender === 'male' ? 'M' : 'F'} / {athlete.age_category}
                  </span>
                ) : (
                  <span className="text-xs text-battleship">
                    {athlete.doubles_category}
                  </span>
                )}
              </td>
              {Object.keys(STATIONS).map((stationNum) => {
                const score = getScoreForStation(athlete.scores, parseInt(stationNum))
                return (
                  <td
                    key={stationNum}
                    className="px-4 py-3 whitespace-nowrap text-center"
                  >
                    {score ? (
                      <span className="text-sm font-medium text-night-green">
                        {formatDistance(score.distance_meters)}
                      </span>
                    ) : (
                      <span className="text-battleship">-</span>
                    )}
                  </td>
                )
              })}
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <span className="font-bold text-lg text-night-green">
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
