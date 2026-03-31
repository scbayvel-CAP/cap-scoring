import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Athlete, Score, Event } from '@/lib/supabase/types'
import {
  getDisplayName,
  metersToPoints,
  formatPoints,
  getHeatNumbers,
} from '@/lib/utils'

interface ExportOptions {
  event: Event
}

function escapeCSVField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

function generateCSVRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(escapeCSVField).join(',')
}

/**
 * Build team data grouped by bib_number with per-hour scores
 */
function buildTeamData(athletes: Array<Athlete & { scores: Score[] }>) {
  const hours = getHeatNumbers()

  const teamMap = new Map<string, {
    displayName: string
    bibNumber: string
    hourScores: Map<number, number>
    totalMeters: number
    totalPoints: number
  }>()

  for (const athlete of athletes) {
    const bib = athlete.bib_number
    if (!teamMap.has(bib)) {
      teamMap.set(bib, {
        displayName: getDisplayName(athlete),
        bibNumber: bib,
        hourScores: new Map(),
        totalMeters: 0,
        totalPoints: 0,
      })
    }
    const team = teamMap.get(bib)!
    const score = athlete.scores.find(s => s.station === 1)
    if (score) {
      team.hourScores.set(athlete.heat_number, score.distance_meters)
    }
  }

  Array.from(teamMap.values()).forEach(team => {
    let totalMeters = 0
    Array.from(team.hourScores.values()).forEach(meters => {
      totalMeters += meters
    })
    team.totalMeters = totalMeters
    team.totalPoints = metersToPoints(totalMeters)
  })

  const sorted = Array.from(teamMap.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints
  )

  return sorted.map((team, index) => ({
    ...team,
    rank: index + 1,
    hours,
  }))
}

export function generateLeaderboardCSV(
  athletes: Array<Athlete & { scores: Score[] }>,
  options: ExportOptions
): string {
  const teams = buildTeamData(athletes)
  const hours = getHeatNumbers()
  const { event } = options

  const lines: string[] = []

  lines.push(`# CAP Leaderboard Export`)
  lines.push(`# Event: ${event.name}`)
  lines.push(`# Date: ${event.date}`)
  lines.push(`# Exported: ${new Date().toISOString()}`)
  lines.push(`# Total Teams: ${teams.length}`)
  lines.push(`# Points: 1 point per 250m rowed`)
  lines.push('')

  // Column headers
  const headerFields: (string | number)[] = ['Rank', 'Team', 'Bib']
  for (const h of hours) {
    headerFields.push(`H${h} (pts)`)
  }
  headerFields.push('Total (pts)', 'Total (m)')
  lines.push(generateCSVRow(headerFields))

  // Data rows
  for (const team of teams) {
    const fields: (string | number | null | undefined)[] = [
      team.rank,
      team.displayName,
      team.bibNumber,
    ]
    for (const h of hours) {
      const meters = team.hourScores.get(h)
      fields.push(meters !== undefined ? metersToPoints(meters) : '')
    }
    fields.push(team.totalPoints, team.totalMeters)
    lines.push(generateCSVRow(fields))
  }

  return lines.join('\n')
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function generateExportFilename(
  eventName: string,
  format: 'csv' | 'pdf'
): string {
  const sanitizedEventName = eventName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const timestamp = new Date().toISOString().split('T')[0]
  return `${sanitizedEventName}-leaderboard-${timestamp}.${format}`
}

export function generateLeaderboardPDF(
  athletes: Array<Athlete & { scores: Score[] }>,
  options: ExportOptions
): void {
  const teams = buildTeamData(athletes)
  const hours = getHeatNumbers()
  const { event } = options

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  // Header
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('CAP Leaderboard', pageWidth / 2, 15, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(event.name, pageWidth / 2, 22, { align: 'center' })

  doc.setFontSize(10)
  doc.text(`${event.date} | 1 point per 250m`, pageWidth / 2, 28, { align: 'center' })

  // Build table
  const headers = ['Rank', 'Team', 'Bib']
  for (const h of hours) {
    headers.push(`H${h}`)
  }
  headers.push('Total')

  const body = teams.map((team) => {
    const row: (string | number)[] = [
      team.rank,
      team.displayName,
      team.bibNumber,
    ]
    for (const h of hours) {
      const meters = team.hourScores.get(h)
      row.push(meters !== undefined ? metersToPoints(meters) : '-')
    }
    row.push(`${team.totalPoints} pts`)
    return row
  })

  autoTable(doc, {
    head: [headers],
    body,
    startY: 33,
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [48, 48, 41],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 50 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'right', cellWidth: 16 },
      4: { halign: 'right', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 16 },
      6: { halign: 'right', cellWidth: 16 },
      7: { halign: 'right', cellWidth: 16 },
      8: { halign: 'right', cellWidth: 16 },
      9: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
    },
    didDrawPage: (data) => {
      const pageHeight = doc.internal.pageSize.getHeight()
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Generated: ${new Date().toLocaleString()} | Page ${data.pageNumber}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    },
  })

  const filename = generateExportFilename(event.name, 'pdf')
  doc.save(filename)
}
