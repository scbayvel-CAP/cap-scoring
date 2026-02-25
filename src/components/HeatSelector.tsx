'use client'

import { getHeatNumbers } from '@/lib/utils'

interface HeatSelectorProps {
  raceType: 'singles' | 'doubles'
  heatNumber: number
  station: number
  stationLocked?: boolean
  onRaceTypeChange: (type: 'singles' | 'doubles') => void
  onHeatChange: (heat: number) => void
  onStationChange: (station: number) => void
}

export function HeatSelector({
  raceType,
  heatNumber,
  onRaceTypeChange,
  onHeatChange,
}: HeatSelectorProps) {
  const heats = getHeatNumbers()

  return (
    <div className="bg-chalk border-b border-eggshell">
      {/* Race Type Toggle */}
      <div className="px-4 pt-4 pb-3">
        <label className="label mb-2">Race Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => onRaceTypeChange('singles')}
            className={`heat-btn flex-1 ${raceType === 'singles' ? 'active' : ''}`}
          >
            Singles
          </button>
          <button
            onClick={() => onRaceTypeChange('doubles')}
            className={`heat-btn flex-1 ${raceType === 'doubles' ? 'active' : ''}`}
          >
            Doubles
          </button>
        </div>
      </div>

      {/* Heat Selector - Horizontally scrollable */}
      <div className="px-4 pb-4">
        <label className="label mb-2">Heat</label>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {heats.map((heat) => (
            <button
              key={heat}
              onClick={() => onHeatChange(heat)}
              className={`heat-btn ${heatNumber === heat ? 'active' : ''}`}
            >
              {heat}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
