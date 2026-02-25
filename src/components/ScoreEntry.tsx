'use client'

import { useState, useEffect, useRef } from 'react'
import { Athlete, Score } from '@/lib/supabase/types'
import { getDisplayName, getScoreForStation } from '@/lib/utils'
import { getStationColor } from './StationTabs'

type CardStatus = 'empty' | 'editing' | 'saved' | 'changed'

interface ScoreEntryProps {
  athlete: Athlete
  station: number
  scores: Score[]
  onChange: (athleteId: string, distance: number | null) => void
  onEnterPress?: () => void
}

export function ScoreEntry({ athlete, station, scores, onChange, onEnterPress }: ScoreEntryProps) {
  const existingScore = getScoreForStation(scores, station)
  const [value, setValue] = useState<string>(
    existingScore ? existingScore.distance_meters.toString() : ''
  )
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const stationColor = getStationColor(station)

  useEffect(() => {
    setValue(existingScore ? existingScore.distance_meters.toString() : '')
  }, [existingScore])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    if (newValue === '') {
      onChange(athlete.id, null)
    } else {
      const parsed = parseInt(newValue, 10)
      if (!isNaN(parsed) && parsed >= 0) {
        onChange(athlete.id, parsed)
      }
    }
  }

  const handleCardClick = () => {
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onEnterPress) {
      e.preventDefault()
      onEnterPress()
    }
  }

  const hasChange = value !== '' && value !== (existingScore?.distance_meters?.toString() || '')

  // Determine card status
  const getStatus = (): CardStatus => {
    if (isFocused) return 'editing'
    if (hasChange) return 'changed'
    if (existingScore) return 'saved'
    return 'empty'
  }

  const status = getStatus()

  // Get border style based on status
  const getBorderStyle = () => {
    switch (status) {
      case 'editing':
        return { borderColor: stationColor, borderWidth: '2px' }
      case 'saved':
        return { borderColor: '#059669', borderWidth: '2px' }
      case 'changed':
        return { borderColor: '#F59E0B', borderWidth: '2px' }
      default:
        return {}
    }
  }

  const getCardClass = () => {
    const base = 'score-card cursor-pointer'
    switch (status) {
      case 'editing':
        return `${base} score-card-editing`
      case 'saved':
        return `${base} score-card-saved`
      case 'changed':
        return `${base} border-2 border-warning`
      default:
        return `${base} score-card-empty`
    }
  }

  return (
    <div
      className={getCardClass()}
      style={status === 'editing' ? getBorderStyle() : undefined}
      onClick={handleCardClick}
    >
      {/* Athlete info row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-night-green text-chalk font-bold text-lg">
            {athlete.bib_number}
          </span>
          <span className="text-lg font-medium text-night-green">
            {getDisplayName(athlete)}
          </span>
        </div>

        {/* Status badge */}
        {status === 'saved' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Saved
          </span>
        )}
        {status === 'changed' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Pending
          </span>
        )}
      </div>

      {/* Score input row */}
      <div className="relative">
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className="w-full h-14 px-4 pr-12 text-right text-2xl font-bold bg-ivory border border-eggshell rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all font-mono tabular-nums"
          style={{ '--tw-ring-color': stationColor } as React.CSSProperties}
          placeholder="0"
          min="0"
          enterKeyHint="next"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-battleship font-medium">
          m
        </span>
      </div>
    </div>
  )
}
