'use client'

import { getHeatNumbers, getStationNumbers, getStationName } from '@/lib/utils'
import { Select } from '@/components/ui/Select'

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
  station,
  stationLocked = false,
  onRaceTypeChange,
  onHeatChange,
  onStationChange,
}: HeatSelectorProps) {
  return (
    <div className="card mb-6">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[150px]">
          <Select
            label="Race Type"
            value={raceType}
            onChange={(e) => onRaceTypeChange(e.target.value as 'singles' | 'doubles')}
          >
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
          </Select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <Select
            label="Heat"
            value={heatNumber}
            onChange={(e) => onHeatChange(Number(e.target.value))}
          >
            {getHeatNumbers().map((h) => (
              <option key={h} value={h}>
                Heat {h}
              </option>
            ))}
          </Select>
        </div>
        {!stationLocked && (
          <div className="flex-1 min-w-[150px]">
            <Select
              label="Station"
              value={station}
              onChange={(e) => onStationChange(Number(e.target.value))}
            >
              {getStationNumbers().map((s) => (
                <option key={s} value={s}>
                  {getStationName(s)}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
