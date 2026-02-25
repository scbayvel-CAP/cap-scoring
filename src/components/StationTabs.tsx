'use client'

import { getStationName } from '@/lib/utils'

interface StationTabsProps {
  currentStation: number
  onStationChange: (station: number) => void
}

const STATIONS = [
  { id: 1, name: 'Run', colorClass: 'station-tab-run' },
  { id: 2, name: 'Row', colorClass: 'station-tab-row' },
  { id: 3, name: 'Bike', colorClass: 'station-tab-bike' },
  { id: 4, name: 'Ski', colorClass: 'station-tab-ski' },
]

export function StationTabs({ currentStation, onStationChange }: StationTabsProps) {
  return (
    <div className="flex gap-2 p-4 bg-chalk border-b border-eggshell">
      {STATIONS.map((station) => {
        const isActive = currentStation === station.id
        return (
          <button
            key={station.id}
            onClick={() => onStationChange(station.id)}
            className={`station-tab ${station.colorClass} ${isActive ? 'active' : ''}`}
            aria-pressed={isActive}
          >
            {station.name}
          </button>
        )
      })}
    </div>
  )
}

// Station color mapping for use in other components
export const STATION_COLORS = {
  1: { name: 'Run', color: '#E85D04', bgClass: 'bg-station-run', textClass: 'text-station-run' },
  2: { name: 'Row', color: '#0077B6', bgClass: 'bg-station-row', textClass: 'text-station-row' },
  3: { name: 'Bike', color: '#7B2CBF', bgClass: 'bg-station-bike', textClass: 'text-station-bike' },
  4: { name: 'Ski', color: '#2D6A4F', bgClass: 'bg-station-ski', textClass: 'text-station-ski' },
} as const

export function getStationColor(station: number): string {
  return STATION_COLORS[station as keyof typeof STATION_COLORS]?.color || '#303029'
}

export function getStationBgClass(station: number): string {
  return STATION_COLORS[station as keyof typeof STATION_COLORS]?.bgClass || 'bg-night-green'
}

export function getStationTextClass(station: number): string {
  return STATION_COLORS[station as keyof typeof STATION_COLORS]?.textClass || 'text-night-green'
}
