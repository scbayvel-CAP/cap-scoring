'use client'

import { getStationColor } from './StationTabs'

interface ScoringProgressProps {
  scored: number
  total: number
  station: number
}

export function ScoringProgress({ scored, total, station }: ScoringProgressProps) {
  const percentage = total > 0 ? (scored / total) * 100 : 0
  const stationColor = getStationColor(station)
  const isComplete = scored === total && total > 0

  return (
    <div className="px-4 py-3 bg-chalk border-b border-eggshell">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-battleship">
          {scored} of {total} scored
        </span>
        {isComplete && (
          <span className="flex items-center gap-1 text-sm font-semibold text-success">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Complete
          </span>
        )}
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: stationColor,
          }}
        />
      </div>
    </div>
  )
}
