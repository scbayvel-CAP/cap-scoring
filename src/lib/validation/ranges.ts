import { STATIONS } from '@/lib/supabase/types'

// Distance range configuration per station (in meters)
// These are sensible defaults for a time-capped endurance event
// Adjust based on your specific event format
export const STATION_RANGES = {
  1: { // Run
    name: 'Run',
    min: 500,      // Minimum realistic distance
    max: 15000,    // ~15km max for a time block
    typical: { min: 2000, max: 10000 }, // Typical range
  },
  2: { // Row
    name: 'Row',
    min: 500,
    max: 12000,    // ~12km max on rowing machine
    typical: { min: 1500, max: 8000 },
  },
  3: { // Bike
    name: 'Bike',
    min: 1000,
    max: 30000,    // ~30km max for cycling
    typical: { min: 5000, max: 20000 },
  },
  4: { // Ski
    name: 'Ski',
    min: 500,
    max: 12000,    // ~12km max on ski erg
    typical: { min: 1500, max: 8000 },
  },
} as const

export type WarningLevel = 'none' | 'warning' | 'error'

export interface RangeValidationResult {
  level: WarningLevel
  message: string | null
  value: number
  station: number
}

export function validateDistance(
  distance: number,
  station: number
): RangeValidationResult {
  const range = STATION_RANGES[station as keyof typeof STATION_RANGES]

  if (!range) {
    return { level: 'none', message: null, value: distance, station }
  }

  // Zero or negative - definitely an error
  if (distance <= 0) {
    return {
      level: 'error',
      message: `Distance must be greater than 0`,
      value: distance,
      station,
    }
  }

  // Below absolute minimum - likely a typo (missing digits)
  if (distance < range.min) {
    return {
      level: 'warning',
      message: `${distance}m seems very low for ${range.name}. Did you mean ${distance * 10}m or ${distance * 100}m?`,
      value: distance,
      station,
    }
  }

  // Above absolute maximum - likely a typo (extra digit)
  if (distance > range.max) {
    return {
      level: 'warning',
      message: `${distance}m seems very high for ${range.name}. Did you mean ${Math.round(distance / 10)}m?`,
      value: distance,
      station,
    }
  }

  // Below typical range - unusual but possible
  if (distance < range.typical.min) {
    return {
      level: 'warning',
      message: `${distance}m is below typical range for ${range.name} (usually ${range.typical.min}m+). Continue anyway?`,
      value: distance,
      station,
    }
  }

  // Above typical range - unusual but possible
  if (distance > range.typical.max) {
    return {
      level: 'warning',
      message: `${distance}m is above typical range for ${range.name} (usually up to ${range.typical.max}m). Continue anyway?`,
      value: distance,
      station,
    }
  }

  return { level: 'none', message: null, value: distance, station }
}

export interface ScoreWarning {
  athleteId: string
  athleteName: string
  distance: number
  station: number
  level: WarningLevel
  message: string
}

export function validateScores(
  scores: Array<{ athleteId: string; athleteName: string; distance: number }>,
  station: number
): ScoreWarning[] {
  const warnings: ScoreWarning[] = []

  for (const score of scores) {
    const result = validateDistance(score.distance, station)
    if (result.level !== 'none' && result.message) {
      warnings.push({
        athleteId: score.athleteId,
        athleteName: score.athleteName,
        distance: score.distance,
        station,
        level: result.level,
        message: result.message,
      })
    }
  }

  return warnings
}
