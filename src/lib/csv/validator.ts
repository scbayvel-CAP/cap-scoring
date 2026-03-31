import {
  SinglesCSVRow,
  DoublesCSVRow,
  TeamCSVRow,
  ValidationError,
} from './types'

const VALID_GENDERS = ['male', 'female']
const VALID_DOUBLES_CATEGORIES = ['men', 'women', 'mixed']
const MIN_HEAT = 1
const MAX_HEAT = 6

/**
 * Validate a team CSV row (new format)
 */
export function validateTeamRow(
  row: TeamCSVRow,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = []
  const rowNum = rowIndex + 2

  if (!row.bib_number || row.bib_number.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'bib_number',
      message: 'Bib number is required',
    })
  }

  if (!row.team_name || row.team_name.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'team_name',
      message: 'Team name is required',
    })
  }

  return errors
}

/**
 * Validate a singles CSV row (legacy)
 */
export function validateSinglesRow(
  row: SinglesCSVRow,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = []
  const rowNum = rowIndex + 2

  if (!row.bib_number || row.bib_number.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'bib_number',
      message: 'Bib number is required',
    })
  }

  const heatNum = parseInt(row.heat_number, 10)
  if (!row.heat_number || row.heat_number.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'heat_number',
      message: 'Hour number is required',
    })
  } else if (isNaN(heatNum) || heatNum < MIN_HEAT || heatNum > MAX_HEAT) {
    errors.push({
      row: rowNum,
      field: 'heat_number',
      message: `Hour number must be between ${MIN_HEAT} and ${MAX_HEAT}`,
      value: row.heat_number,
    })
  }

  if (!row.first_name || row.first_name.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'first_name',
      message: 'First name is required',
    })
  }

  if (!row.last_name || row.last_name.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'last_name',
      message: 'Last name is required',
    })
  }

  const normalizedGender = row.gender?.toLowerCase().trim()
  if (!row.gender || row.gender.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'gender',
      message: 'Gender is required',
    })
  } else if (!VALID_GENDERS.includes(normalizedGender)) {
    errors.push({
      row: rowNum,
      field: 'gender',
      message: 'Gender must be "male" or "female"',
      value: row.gender,
    })
  }

  // Age category - optional in team format
  // Accept any value if provided
  return errors
}

/**
 * Validate a doubles CSV row (legacy)
 */
export function validateDoublesRow(
  row: DoublesCSVRow,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = []
  const rowNum = rowIndex + 2

  if (!row.bib_number || row.bib_number.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'bib_number',
      message: 'Bib number is required',
    })
  }

  const heatNum = parseInt(row.heat_number, 10)
  if (!row.heat_number || row.heat_number.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'heat_number',
      message: 'Hour number is required',
    })
  } else if (isNaN(heatNum) || heatNum < MIN_HEAT || heatNum > MAX_HEAT) {
    errors.push({
      row: rowNum,
      field: 'heat_number',
      message: `Hour number must be between ${MIN_HEAT} and ${MAX_HEAT}`,
      value: row.heat_number,
    })
  }

  if (!row.team_name || row.team_name.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'team_name',
      message: 'Team name is required',
    })
  }

  const normalizedCategory = row.doubles_category?.toLowerCase().trim()
  if (!row.doubles_category || row.doubles_category.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'doubles_category',
      message: 'Category is required',
    })
  } else if (!VALID_DOUBLES_CATEGORIES.includes(normalizedCategory)) {
    errors.push({
      row: rowNum,
      field: 'doubles_category',
      message: 'Category must be "men", "women", or "mixed"',
      value: row.doubles_category,
    })
  }

  if (!row.partner1_first_name || row.partner1_first_name.trim() === '') {
    errors.push({ row: rowNum, field: 'partner1_first_name', message: 'Partner 1 first name is required' })
  }
  if (!row.partner1_last_name || row.partner1_last_name.trim() === '') {
    errors.push({ row: rowNum, field: 'partner1_last_name', message: 'Partner 1 last name is required' })
  }
  if (!row.partner2_first_name || row.partner2_first_name.trim() === '') {
    errors.push({ row: rowNum, field: 'partner2_first_name', message: 'Partner 2 first name is required' })
  }
  if (!row.partner2_last_name || row.partner2_last_name.trim() === '') {
    errors.push({ row: rowNum, field: 'partner2_last_name', message: 'Partner 2 last name is required' })
  }

  return errors
}

/**
 * Check for duplicate bib numbers within the CSV and against existing athletes
 */
export function checkDuplicateBibs(
  rows: (SinglesCSVRow | DoublesCSVRow | TeamCSVRow)[],
  existingBibs: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = []
  const seenBibs = new Map<string, number>()

  rows.forEach((row, index) => {
    const bibNumber = row.bib_number?.trim()
    if (!bibNumber) return

    const rowNum = index + 2

    if (existingBibs.has(bibNumber)) {
      errors.push({
        row: rowNum,
        field: 'bib_number',
        message: `Bib number already exists in this event`,
        value: bibNumber,
      })
    }

    const firstOccurrence = seenBibs.get(bibNumber)
    if (firstOccurrence !== undefined) {
      errors.push({
        row: rowNum,
        field: 'bib_number',
        message: `Duplicate bib number (first seen on row ${firstOccurrence})`,
        value: bibNumber,
      })
    } else {
      seenBibs.set(bibNumber, rowNum)
    }
  })

  return errors
}

/**
 * Validate all singles rows
 */
export function validateSinglesCSV(
  rows: SinglesCSVRow[],
  existingBibs: Set<string>
): ValidationError[] {
  const rowErrors = rows.flatMap((row, index) =>
    validateSinglesRow(row, index)
  )
  const duplicateErrors = checkDuplicateBibs(rows, existingBibs)
  return [...rowErrors, ...duplicateErrors]
}

/**
 * Validate all doubles rows
 */
export function validateDoublesCSV(
  rows: DoublesCSVRow[],
  existingBibs: Set<string>
): ValidationError[] {
  const rowErrors = rows.flatMap((row, index) =>
    validateDoublesRow(row, index)
  )
  const duplicateErrors = checkDuplicateBibs(rows, existingBibs)
  return [...rowErrors, ...duplicateErrors]
}

/**
 * Validate all team rows
 */
export function validateTeamCSV(
  rows: TeamCSVRow[],
  existingBibs: Set<string>
): ValidationError[] {
  const rowErrors = rows.flatMap((row, index) =>
    validateTeamRow(row, index)
  )
  const duplicateErrors = checkDuplicateBibs(rows, existingBibs)
  return [...rowErrors, ...duplicateErrors]
}
