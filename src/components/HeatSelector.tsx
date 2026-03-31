'use client'

import { getHeatNumbers } from '@/lib/utils'

interface HeatSelectorProps {
  heatNumber: number
  onHeatChange: (hour: number) => void
}

export function HeatSelector({
  heatNumber,
  onHeatChange,
}: HeatSelectorProps) {
  const hours = getHeatNumbers()

  return (
    <div className="bg-chalk border-b border-eggshell">
      {/* Hour Selector */}
      <div className="px-4 py-4">
        <label className="label mb-2">Hour</label>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {hours.map((hour) => (
            <button
              key={hour}
              onClick={() => onHeatChange(hour)}
              className={`heat-btn ${heatNumber === hour ? 'active' : ''}`}
            >
              {hour}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
