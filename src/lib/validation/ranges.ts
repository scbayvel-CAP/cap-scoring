// Distance range configuration for Row station (in meters)
export const STATION_RANGES = {
  1: { // Row
    name: 'Row',
    min: 0,
    max: 60000,    // absolute max before warning of typo
    typical: { min: 500, max: 30000 },
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
