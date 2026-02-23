// CSV row types for parsing
export interface SinglesCSVRow {
  bib_number: string
  heat_number: string
  first_name: string
  last_name: string
  gender: string
  age_category: string
}

export interface DoublesCSVRow {
  bib_number: string
  heat_number: string
  team_name: string
  doubles_category: string
  partner1_first_name: string
  partner1_last_name: string
  partner1_gender: string
  partner2_first_name: string
  partner2_last_name: string
  partner2_gender: string
}

// Validation error type
export interface ValidationError {
  row: number
  field: string
  message: string
  value?: string
}

// Parsed CSV result
export interface ParsedCSVResult<T> {
  rows: T[]
  errors: ValidationError[]
  raceType: 'singles' | 'doubles'
}

// Import result from bulk insert
export interface ImportResult {
  successCount: number
  failureCount: number
  errors: Array<{
    row: number
    bibNumber: string
    error: string
  }>
}

// Expected headers for each CSV type
export const SINGLES_HEADERS = [
  'bib_number',
  'heat_number',
  'first_name',
  'last_name',
  'gender',
  'age_category',
] as const

export const DOUBLES_HEADERS = [
  'bib_number',
  'heat_number',
  'team_name',
  'doubles_category',
  'partner1_first_name',
  'partner1_last_name',
  'partner1_gender',
  'partner2_first_name',
  'partner2_last_name',
  'partner2_gender',
] as const

export type SinglesHeader = (typeof SINGLES_HEADERS)[number]
export type DoublesHeader = (typeof DOUBLES_HEADERS)[number]
