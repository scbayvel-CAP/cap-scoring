import { Event, Athlete, Score, AthleteWithScores, AthleteInsert, ScoreInsert } from './types'
import { createClient } from './client'

type SupabaseClient = ReturnType<typeof createClient>

// Type helper for query results
type QueryResult<T> = { data: T | null; error: Error | null }

// Event queries
export async function getEvent(supabase: SupabaseClient, eventId: string): Promise<Event | null> {
  const result = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single() as unknown as QueryResult<Event>

  if (result.error) throw result.error
  return result.data
}

export async function updateEvent(
  supabase: SupabaseClient,
  eventId: string,
  updates: Partial<Event>
): Promise<Event | null> {
  const result = await supabase
    .from('events')
    .update(updates as never)
    .eq('id', eventId)
    .select()
    .single() as unknown as QueryResult<Event>

  if (result.error) throw result.error
  return result.data
}

// Athlete queries
export interface GetAthletesOptions {
  eventId: string
  raceType?: 'singles' | 'doubles'
  heatNumber?: number
  includeScores?: boolean
}

export async function getAthletes(
  supabase: SupabaseClient,
  options: GetAthletesOptions
): Promise<AthleteWithScores[]> {
  const { eventId, raceType, heatNumber, includeScores } = options

  let query = supabase
    .from('athletes')
    .select(includeScores ? '*, scores(*)' : '*')
    .eq('event_id', eventId)
    .order('heat_number')
    .order('bib_number')

  if (raceType) {
    query = query.eq('race_type', raceType)
  }

  if (heatNumber) {
    query = query.eq('heat_number', heatNumber)
  }

  const result = await query as unknown as QueryResult<AthleteWithScores[]>

  if (result.error) throw result.error

  // Normalize athletes to always have scores array
  return (result.data || []).map((athlete) => ({
    ...athlete,
    scores: Array.isArray(athlete.scores) ? athlete.scores : [],
  }))
}

export async function insertAthlete(
  supabase: SupabaseClient,
  athlete: AthleteInsert
): Promise<Athlete> {
  const result = await supabase
    .from('athletes')
    .insert(athlete as never)
    .select()
    .single() as unknown as QueryResult<Athlete>

  if (result.error) throw result.error
  if (!result.data) throw new Error('Failed to insert athlete')
  return result.data
}

export async function updateAthlete(
  supabase: SupabaseClient,
  athleteId: string,
  updates: Partial<Athlete>
): Promise<Athlete> {
  const result = await supabase
    .from('athletes')
    .update(updates as never)
    .eq('id', athleteId)
    .select()
    .single() as unknown as QueryResult<Athlete>

  if (result.error) throw result.error
  if (!result.data) throw new Error('Failed to update athlete')
  return result.data
}

export async function deleteAthlete(
  supabase: SupabaseClient,
  athleteId: string
): Promise<void> {
  const { error } = await supabase.from('athletes').delete().eq('id', athleteId)

  if (error) throw error
}

// Score queries
export async function getScores(
  supabase: SupabaseClient,
  athleteIds: string[]
): Promise<Score[]> {
  if (athleteIds.length === 0) return []

  const result = await supabase
    .from('scores')
    .select('*')
    .in('athlete_id', athleteIds) as unknown as QueryResult<Score[]>

  if (result.error) throw result.error
  return result.data || []
}

export async function upsertScores(
  supabase: SupabaseClient,
  scores: ScoreInsert[]
): Promise<Score[]> {
  const result = await supabase
    .from('scores')
    .upsert(scores as never[], { onConflict: 'athlete_id,station' })
    .select() as unknown as QueryResult<Score[]>

  if (result.error) throw result.error
  return result.data || []
}
