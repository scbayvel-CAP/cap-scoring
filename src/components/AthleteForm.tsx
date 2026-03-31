'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Athlete, AthleteInsert } from '@/lib/supabase/types'
import { getHeatNumbers } from '@/lib/utils'

interface AthleteFormState {
  bibNumber: string
  teamName: string
}

function getInitialFormState(athlete?: Athlete): AthleteFormState {
  return {
    bibNumber: athlete?.bib_number || '',
    teamName: athlete?.first_name || athlete?.team_name || '',
  }
}

interface AthleteFormProps {
  eventId: string
  athlete?: Athlete
  onSave: () => void
  onCancel: () => void
}

export function AthleteForm({ eventId, athlete, onSave, onCancel }: AthleteFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<AthleteFormState>(() => getInitialFormState(athlete))

  const updateForm = <K extends keyof AthleteFormState>(field: K, value: AthleteFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (athlete) {
        // Editing: update all records with this bib_number in the event
        const { error } = await supabase
          .from('athletes')
          .update({
            bib_number: form.bibNumber,
            first_name: form.teamName,
          } as never)
          .eq('event_id', eventId)
          .eq('bib_number', athlete.bib_number)
        if (error) throw error
      } else {
        // Creating: insert 6 records (one per hour) with the same bib_number
        const hours = getHeatNumbers()
        const records: AthleteInsert[] = hours.map((hour) => ({
          event_id: eventId,
          race_type: 'singles' as const,
          heat_number: hour,
          bib_number: form.bibNumber,
          first_name: form.teamName,
          last_name: null,
          gender: null,
          age_category: null,
          team_name: null,
        }))

        const { error } = await supabase.from('athletes').insert(records as never)
        if (error) throw error
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="label">Bib Number *</label>
        <input
          type="text"
          value={form.bibNumber}
          onChange={(e) => updateForm('bibNumber', e.target.value)}
          className="input"
          placeholder="101"
          required
          disabled={!!athlete}
        />
        {athlete && (
          <p className="text-xs text-battleship mt-1">Bib number cannot be changed after creation</p>
        )}
      </div>

      <div>
        <label className="label">Team Name *</label>
        <input
          type="text"
          value={form.teamName}
          onChange={(e) => updateForm('teamName', e.target.value)}
          className="input"
          placeholder="Team Alpha"
          required
        />
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : athlete ? 'Update Team' : 'Add Team'}
        </button>
      </div>
    </form>
  )
}
