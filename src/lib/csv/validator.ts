import { AGE_CATEGORIES } from '@/lib/supabase/types'
import {
  SinglesCSVRow,
  DoublesCSVRow,
  ValidationError,
} from './types'

const VALID_GENDERS = ['male', 'female']
const VALID_DOUBLES_CATEGORIES = ['men', 'women', 'mixed']
const MIN_HEAT = 1
const MAX_HEAT = 12

/**
 * Validate a singles CSV row
 */
export function validateSinglesRow(
  row: SinglesCSVRow,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = []
  const rowNum = rowIndex + 2 // +2 for 1-indexed + header row

  // Bib number - required
  if (!row.bib_number || row.bib_number.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'bib_number',
      message: 'Bib number is required',
    })
  }

  // Heat number - required, 1-12
  const heatNum = parseInt(row.heat_number, 10)
  if (!row.heat_number || row.heat_number.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'heat_number',
      message: 'Heat number is required',
    })
  } else if (isNaN(heatNum) || heatNum < MIN_HEAT || heatNum > MAX_HEAT) {
    errors.push({
      row: rowNum,
      field: 'heat_number',
      message: `Heat number must be between ${MIN_HEAT} and ${MAX_HEAT}`,
      value: row.heat_number,
    })
  }

  // First name - required
  if (!row.first_name || row.first_name.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'first_name',
      message: 'First name is required',
    })
  }

  // Last name - required
  if (!row.last_name || row.last_name.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'last_name',
      message: 'Last name is required',
    })
  }

  // Gender - required, must be male/female
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

  // Age category - required, must match AGE_CATEGORIES
  if (!row.age_category || row.age_category.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'age_category',
      message: 'Age category is required',
    })
  } else if (!AGE_CATEGORIES.includes(row.age_category.trim() as any)) {
    errors.push({
      row: rowNum,
      field: 'age_category',
      message: `Invalid age category. Must be one of: ${AGE_CATEGORIES.join(', ')}`,
      value: row.age_category,
    })
  }

  return errors
}

/**
 * Validate a doubles CSV row
 */
export function validateDoublesRow(
  row: DoublesCSVRow,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = []
  const rowNum = rowIndex + 2 // +2 for 1-indexed + header row

  // Bib number - required
  if (!row.bib_number || row.bib_number.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'bib_number',
      message: 'Bib number is required',
    })
  }

  // Heat number - required, 1-12
  const heatNum = parseInt(row.heat_number, 10)
  if (!row.heat_number || row.heat_number.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'heat_number',
      message: 'Heat number is required',
    })
  } else if (isNaN(heatNum) || heatNum < MIN_HEAT || heatNum > MAX_HEAT) {
    errors.push({
      row: rowNum,
      field: 'heat_number',
      message: `Heat number must be between ${MIN_HEAT} and ${MAX_HEAT}`,
      value: row.heat_number,
    })
  }

  // Team name - required
  if (!row.team_name || row.team_name.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'team_name',
      message: 'Team name is required',
    })
  }

  // Doubles category - required, must be men/women/mixed
  const normalizedCategory = row.doubles_category?.toLowerCase().trim()
  if (!row.doubles_category || row.doubles_category.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'doubles_category',
      message: 'Doubles category is required',
    })
  } else if (!VALID_DOUBLES_CATEGORIES.includes(normalizedCategory)) {
    errors.push({
      row: rowNum,
      field: 'doubles_category',
      message: 'Doubles category must be "men", "women", or "mixed"',
      value: row.doubles_category,
    })
  }

  // Partner 1 fields
  if (!row.partner1_first_name || row.partner1_first_name.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'partner1_first_name',
      message: 'Partner 1 first name is required',
    })
  }

  if (!row.partner1_last_name || row.partner1_last_name.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'partner1_last_name',
      message: 'Partner 1 last name is required',
    })
  }

  const normalizedP1Gender = row.partner1_gender?.toLowerCase().trim()
  if (!row.partner1_gender || row.partner1_gender.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'partner1_gender',
      message: 'Partner 1 gender is required',
    })
  } else if (!VALID_GENDERS.includes(normalizedP1Gender)) {
    errors.push({
      row: rowNum,
      field: 'partner1_gender',
      message: 'Partner 1 gender must be "male" or "female"',
      value: row.partner1_gender,
    })
  }

  // Partner 2 fields
  if (!row.partner2_first_name || row.partner2_first_name.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'partner2_first_name',
      message: 'Partner 2 first name is required',
    })
  }

  if (!row.partner2_last_name || row.partner2_last_name.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'partner2_last_name',
      message: 'Partner 2 last name is required',
    })
  }

  const normalizedP2Gender = row.partner2_gender?.toLowerCase().trim()
  if (!row.partner2_gender || row.partner2_gender.trim() === '') {
    errors.push({
      row: rowNum,
      field: 'partner2_gender',
      message: 'Partner 2 gender is required',
    })
  } else if (!VALID_GENDERS.includes(normalizedP2Gender)) {
    errors.push({
      row: rowNum,
      field: 'partner2_gender',
      message: 'Partner 2 gender must be "male" or "female"',
      value: row.partner2_gender,
    })
  }

  return errors
}

/**
 * Check for duplicate bib numbers within the CSV and against existing athletes
 */
export function checkDuplicateBibs(
  rows: (SinglesCSVRow | DoublesCSVRow)[],
  existingBibs: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = []
  const seenBibs = new Map<string, number>() // bib -> first row number

  rows.forEach((row, index) => {
    const bibNumber = row.bib_number?.trim()
    if (!bibNumber) return // Skip empty bibs (handled by row validation)

    const rowNum = index + 2 // +2 for 1-indexed + header row

    // Check against existing athletes in event
    if (existingBibs.has(bibNumber)) {
      errors.push({
        row: rowNum,
        field: 'bib_number',
        message: `Bib number already exists in this event`,
        value: bibNumber,
      })
    }

    // Check for duplicates within CSV
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
