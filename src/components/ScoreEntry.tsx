'use client'

import { useState, useEffect } from 'react'
import { Athlete, Score } from '@/lib/supabase/types'
import { getDisplayName, getScoreForStation } from '@/lib/utils'

interface ScoreEntryProps {
  athlete: Athlete
  station: number
  scores: Score[]
  onChange: (athleteId: string, distance: number | null) => void
}

export function ScoreEntry({ athlete, station, scores, onChange }: ScoreEntryProps) {
  const existingScore = getScoreForStation(scores, station)
  const [value, setValue] = useState<string>(
    existingScore ? existingScore.distance_meters.toString() : ''
  )

  useEffect(() => {
    setValue(existingScore ? existingScore.distance_meters.toString() : '')
  }, [existingScore])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    if (newValue === '') {
      onChange(athlete.id, null)
    } else {
      const parsed = parseInt(newValue, 10)
      if (!isNaN(parsed) && parsed >= 0) {
        onChange(athlete.id, parsed)
      }
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-medium text-gray-700">
            #{athlete.bib_number}
          </span>
          <span className="ml-3 text-gray-900">
            {getDisplayName(athlete)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={value}
            onChange={handleChange}
            className="input w-32 text-right"
            placeholder="0"
            min="0"
          />
          <span className="text-gray-500">m</span>
          {existingScore && (
            <span className="text-xs text-green-600 ml-2">Saved</span>
          )}
        </div>
      </div>
    </div>
  )
}
