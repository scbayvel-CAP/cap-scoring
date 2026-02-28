export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          name: string
          date: string
          location: string | null
          status: 'draft' | 'active' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          date: string
          location?: string | null
          status?: 'draft' | 'active' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          date?: string
          location?: string | null
          status?: 'draft' | 'active' | 'completed'
          created_at?: string
        }
        Relationships: []
      }
      athletes: {
        Row: {
          id: string
          event_id: string
          race_type: 'singles' | 'doubles'
          heat_number: number
          bib_number: string
          first_name: string | null
          last_name: string | null
          gender: 'male' | 'female' | null
          age_category: string | null
          team_name: string | null
          partner1_first_name: string | null
          partner1_last_name: string | null
          partner1_gender: 'male' | 'female' | null
          partner2_first_name: string | null
          partner2_last_name: string | null
          partner2_gender: 'male' | 'female' | null
          doubles_category: 'men' | 'women' | 'mixed' | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          race_type: 'singles' | 'doubles'
          heat_number: number
          bib_number: string
          first_name?: string | null
          last_name?: string | null
          gender?: 'male' | 'female' | null
          age_category?: string | null
          team_name?: string | null
          partner1_first_name?: string | null
          partner1_last_name?: string | null
          partner1_gender?: 'male' | 'female' | null
          partner2_first_name?: string | null
          partner2_last_name?: string | null
          partner2_gender?: 'male' | 'female' | null
          doubles_category?: 'men' | 'women' | 'mixed' | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          race_type?: 'singles' | 'doubles'
          heat_number?: number
          bib_number?: string
          first_name?: string | null
          last_name?: string | null
          gender?: 'male' | 'female' | null
          age_category?: string | null
          team_name?: string | null
          partner1_first_name?: string | null
          partner1_last_name?: string | null
          partner1_gender?: 'male' | 'female' | null
          partner2_first_name?: string | null
          partner2_last_name?: string | null
          partner2_gender?: 'male' | 'female' | null
          doubles_category?: 'men' | 'women' | 'mixed' | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'athletes_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'judge'
          email: string | null
          assigned_station: number | null
          created_at: string
        }
        Insert: {
          id: string
          role?: 'admin' | 'judge'
          email?: string | null
          assigned_station?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'judge'
          email?: string | null
          assigned_station?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      scores: {
        Row: {
          id: string
          athlete_id: string
          station: number
          distance_meters: number
          recorded_by: string | null
          recorded_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          station: number
          distance_meters: number
          recorded_by?: string | null
          recorded_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          station?: number
          distance_meters?: number
          recorded_by?: string | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'scores_athlete_id_fkey'
            columns: ['athlete_id']
            isOneToOne: false
            referencedRelation: 'athletes'
            referencedColumns: ['id']
          }
        ]
      }
      score_audit_log: {
        Row: {
          id: string
          score_id: string | null
          athlete_id: string
          event_id: string
          station: number
          action: 'created' | 'updated' | 'deleted'
          old_value: number | null
          new_value: number | null
          changed_by: string | null
          changed_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          score_id?: string | null
          athlete_id: string
          event_id: string
          station: number
          action: 'created' | 'updated' | 'deleted'
          old_value?: number | null
          new_value?: number | null
          changed_by?: string | null
          changed_at?: string
          metadata?: Record<string, unknown>
        }
        Update: {
          id?: string
          score_id?: string | null
          athlete_id?: string
          event_id?: string
          station?: number
          action?: 'created' | 'updated' | 'deleted'
          old_value?: number | null
          new_value?: number | null
          changed_by?: string | null
          changed_at?: string
          metadata?: Record<string, unknown>
        }
        Relationships: [
          {
            foreignKeyName: 'score_audit_log_athlete_id_fkey'
            columns: ['athlete_id']
            isOneToOne: false
            referencedRelation: 'athletes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'score_audit_log_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          }
        ]
      }
      score_photos: {
        Row: {
          id: string
          score_id: string | null
          athlete_id: string
          event_id: string
          station: number
          storage_path: string
          ai_extracted_value: number | null
          ai_confidence: number | null
          ai_raw_response: Record<string, unknown> | null
          judge_final_value: number | null
          uploaded_by: string | null
          uploaded_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          score_id?: string | null
          athlete_id: string
          event_id: string
          station: number
          storage_path: string
          ai_extracted_value?: number | null
          ai_confidence?: number | null
          ai_raw_response?: Record<string, unknown> | null
          judge_final_value?: number | null
          uploaded_by?: string | null
          uploaded_at?: string
          metadata?: Record<string, unknown>
        }
        Update: {
          id?: string
          score_id?: string | null
          athlete_id?: string
          event_id?: string
          station?: number
          storage_path?: string
          ai_extracted_value?: number | null
          ai_confidence?: number | null
          ai_raw_response?: Record<string, unknown> | null
          judge_final_value?: number | null
          uploaded_by?: string | null
          uploaded_at?: string
          metadata?: Record<string, unknown>
        }
        Relationships: [
          {
            foreignKeyName: 'score_photos_athlete_id_fkey'
            columns: ['athlete_id']
            isOneToOne: false
            referencedRelation: 'athletes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'score_photos_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'score_photos_score_id_fkey'
            columns: ['score_id']
            isOneToOne: false
            referencedRelation: 'scores'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience types
export type Event = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type Athlete = Database['public']['Tables']['athletes']['Row']
export type AthleteInsert = Database['public']['Tables']['athletes']['Insert']
export type Score = Database['public']['Tables']['scores']['Row']
export type ScoreInsert = Database['public']['Tables']['scores']['Insert']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserRole = Profile['role']
export type ScoreAuditLog = Database['public']['Tables']['score_audit_log']['Row']
export type ScoreAuditLogInsert = Database['public']['Tables']['score_audit_log']['Insert']
export type AuditAction = ScoreAuditLog['action']
export type ScorePhoto = Database['public']['Tables']['score_photos']['Row']
export type ScorePhotoInsert = Database['public']['Tables']['score_photos']['Insert']

// Extended types with relations
export type AthleteWithScores = Athlete & {
  scores: Score[]
}

// Station names mapping
export const STATIONS = {
  1: 'Run',
  2: 'Row',
  3: 'Bike',
  4: 'Ski',
} as const

export const AGE_CATEGORIES = [
  '18-24',
  '25-29',
  '30-34',
  '35-39',
  '40-44',
  '45-49',
  '50-54',
  '55-59',
  '60-64',
  '65+',
] as const

export type AgeCategory = typeof AGE_CATEGORIES[number]
