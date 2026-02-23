'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { bulkInsertAthletes } from '@/lib/supabase/queries'
import { AthleteInsert } from '@/lib/supabase/types'
import {
  SinglesCSVRow,
  DoublesCSVRow,
  ValidationError,
} from '@/lib/csv/types'
import {
  parseCSV,
  detectRaceType,
  parseSinglesCSV,
  parseDoublesCSV,
  generateSinglesTemplate,
  generateDoublesTemplate,
} from '@/lib/csv/parser'
import {
  validateSinglesCSV,
  validateDoublesCSV,
} from '@/lib/csv/validator'

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete'

interface CSVImportModalProps {
  eventId: string
  existingBibs: Set<string>
  onClose: () => void
  onImportComplete: () => void
}

export default function CSVImportModal({
  eventId,
  existingBibs,
  onClose,
  onImportComplete,
}: CSVImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [error, setError] = useState<string | null>(null)
  const [raceType, setRaceType] = useState<'singles' | 'doubles' | null>(null)
  const [singlesRows, setSinglesRows] = useState<SinglesCSVRow[]>([])
  const [doublesRows, setDoublesRows] = useState<DoublesCSVRow[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [importResult, setImportResult] = useState<{
    successCount: number
    failureCount: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      processCSV(content)
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsText(file)
  }

  const processCSV = (content: string) => {
    const rows = parseCSV(content)
    if (rows.length < 2) {
      setError('CSV file must have at least a header row and one data row')
      return
    }

    const detectedType = detectRaceType(rows[0])
    if (!detectedType) {
      setError(
        'Could not detect CSV format. Please ensure your CSV has the correct headers for singles or doubles.'
      )
      return
    }

    setRaceType(detectedType)

    if (detectedType === 'singles') {
      const parsed = parseSinglesCSV(content)
      setSinglesRows(parsed)
      const errors = validateSinglesCSV(parsed, existingBibs)
      setValidationErrors(errors)
    } else {
      const parsed = parseDoublesCSV(content)
      setDoublesRows(parsed)
      const errors = validateDoublesCSV(parsed, existingBibs)
      setValidationErrors(errors)
    }

    setStep('preview')
  }

  const downloadTemplate = (type: 'singles' | 'doubles') => {
    const content =
      type === 'singles' ? generateSinglesTemplate() : generateDoublesTemplate()
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_template.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (validationErrors.length > 0) return

    setStep('importing')
    setError(null)

    try {
      const supabase = createClient()
      const athletesToInsert: AthleteInsert[] = []

      if (raceType === 'singles') {
        for (const row of singlesRows) {
          athletesToInsert.push({
            event_id: eventId,
            race_type: 'singles',
            bib_number: row.bib_number.trim(),
            heat_number: parseInt(row.heat_number, 10),
            first_name: row.first_name.trim(),
            last_name: row.last_name.trim(),
            gender: row.gender.toLowerCase().trim() as 'male' | 'female',
            age_category: row.age_category.trim(),
            // Null out doubles fields
            team_name: null,
            partner1_first_name: null,
            partner1_last_name: null,
            partner1_gender: null,
            partner2_first_name: null,
            partner2_last_name: null,
            partner2_gender: null,
            doubles_category: null,
          })
        }
      } else {
        for (const row of doublesRows) {
          athletesToInsert.push({
            event_id: eventId,
            race_type: 'doubles',
            bib_number: row.bib_number.trim(),
            heat_number: parseInt(row.heat_number, 10),
            team_name: row.team_name.trim(),
            doubles_category: row.doubles_category.toLowerCase().trim() as
              | 'men'
              | 'women'
              | 'mixed',
            partner1_first_name: row.partner1_first_name.trim(),
            partner1_last_name: row.partner1_last_name.trim(),
            partner1_gender: row.partner1_gender.toLowerCase().trim() as
              | 'male'
              | 'female',
            partner2_first_name: row.partner2_first_name.trim(),
            partner2_last_name: row.partner2_last_name.trim(),
            partner2_gender: row.partner2_gender.toLowerCase().trim() as
              | 'male'
              | 'female',
            // Null out singles fields
            first_name: null,
            last_name: null,
            gender: null,
            age_category: null,
          })
        }
      }

      const result = await bulkInsertAthletes(supabase, athletesToInsert)
      setImportResult({
        successCount: result.successCount,
        failureCount: result.failureCount,
      })
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
      setStep('preview')
    }
  }

  const handleClose = () => {
    if (step === 'complete' && importResult && importResult.successCount > 0) {
      onImportComplete()
    }
    onClose()
  }

  const rowCount = raceType === 'singles' ? singlesRows.length : doublesRows.length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-eggshell flex items-center justify-between">
          <h2 className="text-xl font-bold text-night-green">Import Athletes from CSV</h2>
          <button
            onClick={handleClose}
            className="text-battleship hover:text-night-green"
            disabled={step === 'importing'}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-night-green mb-2">
                  Upload CSV File
                </h3>
                <p className="text-battleship text-sm mb-4">
                  Upload a CSV file with athlete data. The system will
                  automatically detect if it&apos;s a singles or doubles format.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Choose File
                </button>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </div>

              <div className="border-t border-eggshell pt-6">
                <h3 className="text-lg font-semibold text-night-green mb-2">
                  Download Template
                </h3>
                <p className="text-battleship text-sm mb-4">
                  Download a template CSV file with the correct headers and an
                  example row.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadTemplate('singles')}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Singles Template
                  </button>
                  <button
                    onClick={() => downloadTemplate('doubles')}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Doubles Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-night-green">
                    Preview Import
                  </h3>
                  <p className="text-battleship text-sm">
                    Detected format:{' '}
                    <span className="font-medium capitalize">{raceType}</span>
                    {' | '}
                    {rowCount} row{rowCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStep('upload')
                    setSinglesRows([])
                    setDoublesRows([])
                    setValidationErrors([])
                    setRaceType(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="text-sm text-battleship hover:text-night-green underline"
                >
                  Upload different file
                </button>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">
                    Validation Errors ({validationErrors.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationErrors.slice(0, 20).map((err, idx) => (
                        <li key={idx}>
                          Row {err.row}: {err.field} - {err.message}
                          {err.value && (
                            <span className="text-red-500">
                              {' '}
                              (value: &quot;{err.value}&quot;)
                            </span>
                          )}
                        </li>
                      ))}
                      {validationErrors.length > 20 && (
                        <li className="font-medium">
                          ... and {validationErrors.length - 20} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-eggshell rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  {raceType === 'singles' ? (
                    <table className="w-full text-sm">
                      <thead className="bg-ivory">
                        <tr>
                          <th className="table-th">Bib</th>
                          <th className="table-th">Heat</th>
                          <th className="table-th">First Name</th>
                          <th className="table-th">Last Name</th>
                          <th className="table-th">Gender</th>
                          <th className="table-th">Age Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {singlesRows.slice(0, 10).map((row, idx) => (
                          <tr
                            key={idx}
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-ivory/50'}
                          >
                            <td className="table-td">{row.bib_number}</td>
                            <td className="table-td">{row.heat_number}</td>
                            <td className="table-td">{row.first_name}</td>
                            <td className="table-td">{row.last_name}</td>
                            <td className="table-td">{row.gender}</td>
                            <td className="table-td">{row.age_category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-ivory">
                        <tr>
                          <th className="table-th">Bib</th>
                          <th className="table-th">Heat</th>
                          <th className="table-th">Team Name</th>
                          <th className="table-th">Category</th>
                          <th className="table-th">Partner 1</th>
                          <th className="table-th">Partner 2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doublesRows.slice(0, 10).map((row, idx) => (
                          <tr
                            key={idx}
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-ivory/50'}
                          >
                            <td className="table-td">{row.bib_number}</td>
                            <td className="table-td">{row.heat_number}</td>
                            <td className="table-td">{row.team_name}</td>
                            <td className="table-td">{row.doubles_category}</td>
                            <td className="table-td">
                              {row.partner1_first_name} {row.partner1_last_name}
                            </td>
                            <td className="table-td">
                              {row.partner2_first_name} {row.partner2_last_name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                {rowCount > 10 && (
                  <div className="px-4 py-2 bg-ivory text-sm text-battleship border-t border-eggshell">
                    Showing first 10 of {rowCount} rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-night-green border-t-transparent mb-4"></div>
              <p className="text-night-green font-medium">
                Importing {rowCount} athlete{rowCount !== 1 ? 's' : ''}...
              </p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && importResult && (
            <div className="flex flex-col items-center justify-center py-12">
              {importResult.failureCount === 0 ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-night-green mb-2">
                    Import Complete
                  </h3>
                  <p className="text-battleship">
                    Successfully imported {importResult.successCount} athlete
                    {importResult.successCount !== 1 ? 's' : ''}.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-night-green mb-2">
                    Import Partially Complete
                  </h3>
                  <p className="text-battleship mb-2">
                    {importResult.successCount} athlete
                    {importResult.successCount !== 1 ? 's' : ''} imported
                    successfully.
                  </p>
                  <p className="text-red-600">
                    {importResult.failureCount} athlete
                    {importResult.failureCount !== 1 ? 's' : ''} failed to
                    import.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-eggshell flex justify-end gap-3">
          {step === 'upload' && (
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          )}

          {step === 'preview' && (
            <>
              <button onClick={handleClose} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={validationErrors.length > 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {rowCount} Athlete{rowCount !== 1 ? 's' : ''}
              </button>
            </>
          )}

          {step === 'complete' && (
            <button onClick={handleClose} className="btn-primary">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
