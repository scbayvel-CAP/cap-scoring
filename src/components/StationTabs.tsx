'use client'

interface StationTabsProps {
  currentStation: number
  onStationChange: (station: number) => void
}

const STATIONS = [
  { id: 1, name: 'Run' },
  { id: 2, name: 'Row' },
  { id: 3, name: 'Bike' },
  { id: 4, name: 'Ski' },
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
            className={`station-tab ${isActive ? 'active' : ''}`}
            aria-pressed={isActive}
          >
            {station.name}
          </button>
        )
      })}
    </div>
  )
}
