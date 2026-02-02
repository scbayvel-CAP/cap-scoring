import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Athlete, Score, STATIONS } from './supabase/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistance(meters: number): string {
  return meters.toLocaleString() + 'm'
}

export function getDisplayName(athlete: Athlete): string {
  if (athlete.race_type === 'singles') {
    return `${athlete.first_name} ${athlete.last_name}`
  }
  return athlete.team_name || 'Unnamed Team'
}

export function getStationName(station: number): string {
  return STATIONS[station as keyof typeof STATIONS] || `Station ${station}`
}

export function calculateTotalDistance(scores: Score[]): number {
  return scores.reduce((total, score) => total + score.distance_meters, 0)
}

export function getCompletedStations(scores: Score[]): number[] {
  return scores.map(s => s.station).sort((a, b) => a - b)
}

export function hasCompletedStation(scores: Score[], station: number): boolean {
  return scores.some(s => s.station === station)
}

export function getScoreForStation(scores: Score[], station: number): Score | undefined {
  return scores.find(s => s.station === station)
}

// Sort athletes by total distance (descending)
export function sortByTotalDistance(
  athletes: Array<Athlete & { scores: Score[] }>
): Array<Athlete & { scores: Score[]; totalDistance: number; rank: number }> {
  const withTotals = athletes.map(athlete => ({
    ...athlete,
    totalDistance: calculateTotalDistance(athlete.scores),
  }))

  withTotals.sort((a, b) => b.totalDistance - a.totalDistance)

  return withTotals.map((athlete, index) => ({
    ...athlete,
    rank: index + 1,
  }))
}

// Generate a list of heats (1-12)
export function getHeatNumbers(): number[] {
  return Array.from({ length: 12 }, (_, i) => i + 1)
}

// Generate a list of stations (1-4)
export function getStationNumbers(): number[] {
  return [1, 2, 3, 4]
}
