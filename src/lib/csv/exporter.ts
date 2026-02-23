import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Athlete, Score, Event, STATIONS } from '@/lib/supabase/types'
import {
  getDisplayName,
  calculateTotalDistance,
  sortByTotalDistance,
  getScoreForStation,
} from '@/lib/utils'

type RankedAthlete = Athlete & { scores: Score[]; totalDistance: number; rank: number }

interface ExportOptions {
  event: Event
  raceType: 'singles' | 'doubles'
  filters?: {
    gender?: 'all' | 'male' | 'female'
    ageCategory?: string
    doublesCategory?: 'all' | 'men' | 'women' | 'mixed'
  }
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

export function generateLeaderboardCSV(
  athletes: Array<Athlete & { scores: Score[] }>,
  options: ExportOptions
): string {
  const rankedAthletes = sortByTotalDistance(athletes)
  const { event, raceType, filters } = options

  const lines: string[] = []

  // Header row with event info
  lines.push(`# CAP 55 Leaderboard Export`)
  lines.push(`# Event: ${event.name}`)
  lines.push(`# Date: ${event.date}`)
  lines.push(`# Race Type: ${raceType === 'singles' ? 'Singles' : 'Doubles'}`)

  if (raceType === 'singles') {
    if (filters?.gender && filters.gender !== 'all') {
      lines.push(`# Gender Filter: ${filters.gender === 'male' ? 'Men' : 'Women'}`)
    }
    if (filters?.ageCategory && filters.ageCategory !== 'all') {
      lines.push(`# Age Category: ${filters.ageCategory}`)
    }
  } else {
    if (filters?.doublesCategory && filters.doublesCategory !== 'all') {
      lines.push(`# Category: ${filters.doublesCategory}`)
    }
  }

  lines.push(`# Exported: ${new Date().toISOString()}`)
  lines.push(`# Total Athletes: ${rankedAthletes.length}`)
  lines.push('')

  // Column headers
  if (raceType === 'singles') {
    lines.push(
      generateCSVRow([
        'Rank',
        'Name',
        'Bib',
        'Gender',
        'Age Category',
        'Heat',
        'Run (m)',
        'Row (m)',
        'Bike (m)',
        'Ski (m)',
        'Total (m)',
      ])
    )
  } else {
    lines.push(
      generateCSVRow([
        'Rank',
        'Team Name',
        'Bib',
        'Category',
        'Partner 1',
        'Partner 2',
        'Heat',
        'Run (m)',
        'Row (m)',
        'Bike (m)',
        'Ski (m)',
        'Total (m)',
      ])
    )
  }

  // Data rows
  for (const athlete of rankedAthletes) {
    const runScore = getScoreForStation(athlete.scores, 1)?.distance_meters ?? ''
    const rowScore = getScoreForStation(athlete.scores, 2)?.distance_meters ?? ''
    const bikeScore = getScoreForStation(athlete.scores, 3)?.distance_meters ?? ''
    const skiScore = getScoreForStation(athlete.scores, 4)?.distance_meters ?? ''

    if (raceType === 'singles') {
      lines.push(
        generateCSVRow([
          athlete.rank,
          getDisplayName(athlete),
          athlete.bib_number,
          athlete.gender === 'male' ? 'M' : 'F',
          athlete.age_category,
          athlete.heat_number,
          runScore,
          rowScore,
          bikeScore,
          skiScore,
          athlete.totalDistance,
        ])
      )
    } else {
      const partner1Name = `${athlete.partner1_first_name || ''} ${athlete.partner1_last_name || ''}`.trim()
      const partner2Name = `${athlete.partner2_first_name || ''} ${athlete.partner2_last_name || ''}`.trim()

      lines.push(
        generateCSVRow([
          athlete.rank,
          athlete.team_name,
          athlete.bib_number,
          athlete.doubles_category,
          partner1Name,
          partner2Name,
          athlete.heat_number,
          runScore,
          rowScore,
          bikeScore,
          skiScore,
          athlete.totalDistance,
        ])
      )
    }
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
  raceType: 'singles' | 'doubles',
  format: 'csv' | 'pdf'
): string {
  const sanitizedEventName = eventName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const timestamp = new Date().toISOString().split('T')[0]
  return `${sanitizedEventName}-${raceType}-leaderboard-${timestamp}.${format}`
}

export function generateLeaderboardPDF(
  athletes: Array<Athlete & { scores: Score[] }>,
  options: ExportOptions
): void {
  const rankedAthletes = sortByTotalDistance(athletes)
  const { event, raceType, filters } = options

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  // Header
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('CAP 55 Leaderboard', pageWidth / 2, 15, { align: 'center' })

  // Event info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(event.name, pageWidth / 2, 22, { align: 'center' })

  let subtitle = `${raceType === 'singles' ? 'Singles' : 'Doubles'} | ${event.date}`
  if (raceType === 'singles') {
    if (filters?.gender && filters.gender !== 'all') {
      subtitle += ` | ${filters.gender === 'male' ? 'Men' : 'Women'}`
    }
    if (filters?.ageCategory && filters.ageCategory !== 'all') {
      subtitle += ` | ${filters.ageCategory}`
    }
  } else {
    if (filters?.doublesCategory && filters.doublesCategory !== 'all') {
      subtitle += ` | ${filters.doublesCategory}`
    }
  }
  doc.setFontSize(10)
  doc.text(subtitle, pageWidth / 2, 28, { align: 'center' })

  // Build table data
  const headers = raceType === 'singles'
    ? ['Rank', 'Name', 'Bib', 'Gender', 'Age', 'Heat', 'Run', 'Row', 'Bike', 'Ski', 'Total']
    : ['Rank', 'Team', 'Bib', 'Category', 'Heat', 'Run', 'Row', 'Bike', 'Ski', 'Total']

  const body = rankedAthletes.map((athlete) => {
    const runScore = getScoreForStation(athlete.scores, 1)?.distance_meters ?? '-'
    const rowScore = getScoreForStation(athlete.scores, 2)?.distance_meters ?? '-'
    const bikeScore = getScoreForStation(athlete.scores, 3)?.distance_meters ?? '-'
    const skiScore = getScoreForStation(athlete.scores, 4)?.distance_meters ?? '-'

    if (raceType === 'singles') {
      return [
        athlete.rank,
        getDisplayName(athlete),
        athlete.bib_number,
        athlete.gender === 'male' ? 'M' : 'F',
        athlete.age_category || '-',
        athlete.heat_number,
        runScore,
        rowScore,
        bikeScore,
        skiScore,
        `${athlete.totalDistance}m`,
      ]
    } else {
      return [
        athlete.rank,
        athlete.team_name || '-',
        athlete.bib_number,
        athlete.doubles_category || '-',
        athlete.heat_number,
        runScore,
        rowScore,
        bikeScore,
        skiScore,
        `${athlete.totalDistance}m`,
      ]
    }
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
      fillColor: [48, 48, 41], // CAP brand color #303029
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 }, // Rank
      1: { cellWidth: raceType === 'singles' ? 45 : 50 }, // Name/Team
      2: { halign: 'center', cellWidth: 15 }, // Bib
      3: { halign: 'center', cellWidth: 18 }, // Gender/Category
      ...(raceType === 'singles' ? { 4: { halign: 'center', cellWidth: 18 } } : {}), // Age
      [raceType === 'singles' ? 5 : 4]: { halign: 'center', cellWidth: 12 }, // Heat
      [raceType === 'singles' ? 6 : 5]: { halign: 'right', cellWidth: 18 }, // Run
      [raceType === 'singles' ? 7 : 6]: { halign: 'right', cellWidth: 18 }, // Row
      [raceType === 'singles' ? 8 : 7]: { halign: 'right', cellWidth: 18 }, // Bike
      [raceType === 'singles' ? 9 : 8]: { halign: 'right', cellWidth: 18 }, // Ski
      [raceType === 'singles' ? 10 : 9]: { halign: 'right', cellWidth: 22, fontStyle: 'bold' }, // Total
    },
    didDrawPage: (data) => {
      // Footer
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

  // Save
  const filename = generateExportFilename(event.name, raceType, 'pdf')
  doc.save(filename)
}
