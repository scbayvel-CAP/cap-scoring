import {
  SinglesCSVRow,
  DoublesCSVRow,
  SINGLES_HEADERS,
  DOUBLES_HEADERS,
} from './types'

/**
 * Parse raw CSV string into rows
 */
export function parseCSV(csvString: string): string[][] {
  const lines = csvString.trim().split(/\r?\n/)
  return lines.map((line) => parseCSVLine(line))
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

/**
 * Detect race type from CSV headers
 */
export function detectRaceType(
  headers: string[]
): 'singles' | 'doubles' | null {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim())

  // Check for doubles-specific headers
  const hasTeamName = normalizedHeaders.includes('team_name')
  const hasDoublesCategory = normalizedHeaders.includes('doubles_category')
  const hasPartner1 = normalizedHeaders.includes('partner1_first_name')

  if (hasTeamName && hasDoublesCategory && hasPartner1) {
    return 'doubles'
  }

  // Check for singles-specific headers
  const hasFirstName = normalizedHeaders.includes('first_name')
  const hasLastName = normalizedHeaders.includes('last_name')
  const hasGender = normalizedHeaders.includes('gender')
  const hasAgeCategory = normalizedHeaders.includes('age_category')

  if (hasFirstName && hasLastName && hasGender && hasAgeCategory) {
    return 'singles'
  }

  return null
}

/**
 * Create a header to index map for efficient parsing
 */
function createHeaderMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>()
  headers.forEach((header, index) => {
    map.set(header.toLowerCase().trim(), index)
  })
  return map
}

/**
 * Get value from row using header map
 */
function getValue(
  row: string[],
  headerMap: Map<string, number>,
  header: string
): string {
  const index = headerMap.get(header.toLowerCase())
  return index !== undefined ? row[index] || '' : ''
}

/**
 * Parse CSV string into singles rows
 */
export function parseSinglesCSV(csvString: string): SinglesCSVRow[] {
  const rows = parseCSV(csvString)
  if (rows.length < 2) return []

  const headers = rows[0]
  const headerMap = createHeaderMap(headers)
  const dataRows = rows.slice(1)

  return dataRows
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => ({
      bib_number: getValue(row, headerMap, 'bib_number'),
      heat_number: getValue(row, headerMap, 'heat_number'),
      first_name: getValue(row, headerMap, 'first_name'),
      last_name: getValue(row, headerMap, 'last_name'),
      gender: getValue(row, headerMap, 'gender'),
      age_category: getValue(row, headerMap, 'age_category'),
    }))
}

/**
 * Parse CSV string into doubles rows
 */
export function parseDoublesCSV(csvString: string): DoublesCSVRow[] {
  const rows = parseCSV(csvString)
  if (rows.length < 2) return []

  const headers = rows[0]
  const headerMap = createHeaderMap(headers)
  const dataRows = rows.slice(1)

  return dataRows
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => ({
      bib_number: getValue(row, headerMap, 'bib_number'),
      heat_number: getValue(row, headerMap, 'heat_number'),
      team_name: getValue(row, headerMap, 'team_name'),
      doubles_category: getValue(row, headerMap, 'doubles_category'),
      partner1_first_name: getValue(row, headerMap, 'partner1_first_name'),
      partner1_last_name: getValue(row, headerMap, 'partner1_last_name'),
      partner1_gender: getValue(row, headerMap, 'partner1_gender'),
      partner2_first_name: getValue(row, headerMap, 'partner2_first_name'),
      partner2_last_name: getValue(row, headerMap, 'partner2_last_name'),
      partner2_gender: getValue(row, headerMap, 'partner2_gender'),
    }))
}

/**
 * Generate CSV template for singles
 */
export function generateSinglesTemplate(): string {
  const headers = SINGLES_HEADERS.join(',')
  const exampleRow = '101,1,John,Smith,male,30-34'
  return `${headers}\n${exampleRow}`
}

/**
 * Generate CSV template for doubles
 */
export function generateDoublesTemplate(): string {
  const headers = DOUBLES_HEADERS.join(',')
  const exampleRow = '201,1,Team Alpha,mixed,John,Smith,male,Jane,Doe,female'
  return `${headers}\n${exampleRow}`
}
