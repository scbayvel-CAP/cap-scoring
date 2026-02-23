import { Event, Athlete, Score, AthleteWithScores, AthleteInsert, ScoreInsert, ScoreAuditLog, ScoreAuditLogInsert, AuditAction } from './types'
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

// Bulk insert athletes - batch insert in groups of 50
export interface BulkInsertResult {
  successCount: number
  failureCount: number
  errors: Array<{
    index: number
    bibNumber: string
    error: string
  }>
}

export async function bulkInsertAthletes(
  supabase: SupabaseClient,
  athletes: AthleteInsert[]
): Promise<BulkInsertResult> {
  const BATCH_SIZE = 50
  const result: BulkInsertResult = {
    successCount: 0,
    failureCount: 0,
    errors: [],
  }

  // Process in batches
  for (let i = 0; i < athletes.length; i += BATCH_SIZE) {
    const batch = athletes.slice(i, i + BATCH_SIZE)

    try {
      const { data, error } = await supabase
        .from('athletes')
        .insert(batch as never[])
        .select()

      if (error) {
        // If batch fails, try inserting individually to identify which rows failed
        for (let j = 0; j < batch.length; j++) {
          const athlete = batch[j]
          try {
            await supabase
              .from('athletes')
              .insert(athlete as never)
              .select()
              .single()
            result.successCount++
          } catch (individualError) {
            result.failureCount++
            result.errors.push({
              index: i + j,
              bibNumber: athlete.bib_number,
              error: individualError instanceof Error ? individualError.message : 'Unknown error',
            })
          }
        }
      } else {
        result.successCount += data?.length || batch.length
      }
    } catch (batchError) {
      // If entire batch throws, try individual inserts
      for (let j = 0; j < batch.length; j++) {
        const athlete = batch[j]
        try {
          await supabase
            .from('athletes')
            .insert(athlete as never)
            .select()
            .single()
          result.successCount++
        } catch (individualError) {
          result.failureCount++
          result.errors.push({
            index: i + j,
            bibNumber: athlete.bib_number,
            error: individualError instanceof Error ? individualError.message : 'Unknown error',
          })
        }
      }
    }
  }

  return result
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

export async function deleteScores(
  supabase: SupabaseClient,
  athleteIds: string[],
  station: number
): Promise<void> {
  if (athleteIds.length === 0) return

  const { error } = await supabase
    .from('scores')
    .delete()
    .in('athlete_id', athleteIds)
    .eq('station', station)

  if (error) throw error
}

// Audit Log queries
export async function logScoreChange(
  supabase: SupabaseClient,
  entry: ScoreAuditLogInsert
): Promise<void> {
  const { error } = await supabase
    .from('score_audit_log')
    .insert(entry as never)

  if (error) {
    console.error('Failed to log score change:', error)
    // Don't throw - audit logging shouldn't break the main operation
  }
}

export async function logScoreChanges(
  supabase: SupabaseClient,
  entries: ScoreAuditLogInsert[]
): Promise<void> {
  if (entries.length === 0) return

  const { error } = await supabase
    .from('score_audit_log')
    .insert(entries as never[])

  if (error) {
    console.error('Failed to log score changes:', error)
  }
}

export interface GetAuditLogOptions {
  eventId?: string
  athleteId?: string
  station?: number
  changedBy?: string
  limit?: number
  offset?: number
}

export interface AuditLogEntry extends ScoreAuditLog {
  athlete?: Athlete
  changer_email?: string
}

export async function getAuditLog(
  supabase: SupabaseClient,
  options: GetAuditLogOptions = {}
): Promise<AuditLogEntry[]> {
  const { eventId, athleteId, station, changedBy, limit = 100, offset = 0 } = options

  let query = supabase
    .from('score_audit_log')
    .select(`
      *,
      athlete:athletes(id, bib_number, first_name, last_name, team_name, race_type),
      changer:profiles!score_audit_log_changed_by_fkey(email)
    `)
    .order('changed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  if (athleteId) {
    query = query.eq('athlete_id', athleteId)
  }

  if (station) {
    query = query.eq('station', station)
  }

  if (changedBy) {
    query = query.eq('changed_by', changedBy)
  }

  const result = await query as unknown as QueryResult<AuditLogEntry[]>

  if (result.error) throw result.error

  // Flatten the changer email
  return (result.data || []).map((entry) => ({
    ...entry,
    changer_email: (entry as any).changer?.email || null,
  }))
}

export async function getAuditLogCount(
  supabase: SupabaseClient,
  options: GetAuditLogOptions = {}
): Promise<number> {
  const { eventId, athleteId, station, changedBy } = options

  let query = supabase
    .from('score_audit_log')
    .select('id', { count: 'exact', head: true })

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  if (athleteId) {
    query = query.eq('athlete_id', athleteId)
  }

  if (station) {
    query = query.eq('station', station)
  }

  if (changedBy) {
    query = query.eq('changed_by', changedBy)
  }

  const { count, error } = await query

  if (error) throw error
  return count || 0
}
