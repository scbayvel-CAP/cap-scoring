import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Athlete, Score, STATIONS } from './supabase/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistance(meters: number): string {
  return meters.toLocaleString() + 'm'
}

export function metersToPoints(meters: number): number {
  return Math.floor(meters / 250)
}

export function formatPoints(points: number): string {
  return `${points} pts`
}

export function getDisplayName(athlete: Athlete): string {
  if (athlete.team_name) {
    return athlete.team_name
  }
  if (athlete.first_name) {
    return athlete.last_name
      ? `${athlete.first_name} ${athlete.last_name}`
      : athlete.first_name
  }
  return 'Unnamed Team'
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

// Sort athletes by total points (meters / 250, descending)
export function sortByTotalDistance(
  athletes: Array<Athlete & { scores: Score[] }>
): Array<Athlete & { scores: Score[]; totalDistance: number; totalPoints: number; rank: number }> {
  const withTotals = athletes.map(athlete => ({
    ...athlete,
    totalDistance: calculateTotalDistance(athlete.scores),
    totalPoints: metersToPoints(calculateTotalDistance(athlete.scores)),
  }))

  withTotals.sort((a, b) => b.totalPoints - a.totalPoints)

  return withTotals.map((athlete, index) => ({
    ...athlete,
    rank: index + 1,
  }))
}

// Generate a list of hours (1-6)
export function getHeatNumbers(): number[] {
  return Array.from({ length: 6 }, (_, i) => i + 1)
}

// Generate a list of stations (Row only = station 1)
export function getStationNumbers(): number[] {
  return [1]
}
