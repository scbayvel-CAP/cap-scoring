'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Athlete, AthleteInsert, AGE_CATEGORIES } from '@/lib/supabase/types'
import { getHeatNumbers } from '@/lib/utils'

interface AthleteFormState {
  raceType: 'singles' | 'doubles'
  heatNumber: number
  bibNumber: string
  // Singles fields
  firstName: string
  lastName: string
  gender: 'male' | 'female' | ''
  ageCategory: string
  // Doubles fields
  teamName: string
  partner1FirstName: string
  partner1LastName: string
  partner1Gender: 'male' | 'female' | ''
  partner2FirstName: string
  partner2LastName: string
  partner2Gender: 'male' | 'female' | ''
  doublesCategory: 'men' | 'women' | 'mixed' | ''
}

function getInitialFormState(athlete?: Athlete): AthleteFormState {
  return {
    raceType: athlete?.race_type || 'singles',
    heatNumber: athlete?.heat_number || 1,
    bibNumber: athlete?.bib_number || '',
    firstName: athlete?.first_name || '',
    lastName: athlete?.last_name || '',
    gender: athlete?.gender || '',
    ageCategory: athlete?.age_category || '',
    teamName: athlete?.team_name || '',
    partner1FirstName: athlete?.partner1_first_name || '',
    partner1LastName: athlete?.partner1_last_name || '',
    partner1Gender: athlete?.partner1_gender || '',
    partner2FirstName: athlete?.partner2_first_name || '',
    partner2LastName: athlete?.partner2_last_name || '',
    partner2Gender: athlete?.partner2_gender || '',
    doublesCategory: athlete?.doubles_category || '',
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
      const data: AthleteInsert = {
        event_id: eventId,
        race_type: form.raceType,
        heat_number: form.heatNumber,
        bib_number: form.bibNumber,
        first_name: form.raceType === 'singles' ? form.firstName : null,
        last_name: form.raceType === 'singles' ? form.lastName : null,
        gender: form.raceType === 'singles' && form.gender ? form.gender : null,
        age_category: form.raceType === 'singles' ? form.ageCategory : null,
        team_name: form.raceType === 'doubles' ? form.teamName : null,
        partner1_first_name: form.raceType === 'doubles' ? form.partner1FirstName : null,
        partner1_last_name: form.raceType === 'doubles' ? form.partner1LastName : null,
        partner1_gender: form.raceType === 'doubles' && form.partner1Gender ? form.partner1Gender : null,
        partner2_first_name: form.raceType === 'doubles' ? form.partner2FirstName : null,
        partner2_last_name: form.raceType === 'doubles' ? form.partner2LastName : null,
        partner2_gender: form.raceType === 'doubles' && form.partner2Gender ? form.partner2Gender : null,
        doubles_category: form.raceType === 'doubles' && form.doublesCategory ? form.doublesCategory : null,
      }

      if (athlete) {
        const { error } = await supabase
          .from('athletes')
          .update(data as never)
          .eq('id', athlete.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('athletes').insert(data as never)
        if (error) throw error
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save athlete')
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Race Type *</label>
          <select
            value={form.raceType}
            onChange={(e) => updateForm('raceType', e.target.value as 'singles' | 'doubles')}
            className="select"
            disabled={!!athlete}
          >
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
          </select>
        </div>
        <div>
          <label className="label">Heat Number *</label>
          <select
            value={form.heatNumber}
            onChange={(e) => updateForm('heatNumber', Number(e.target.value))}
            className="select"
          >
            {getHeatNumbers().map((h) => (
              <option key={h} value={h}>
                Heat {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Bib Number *</label>
        <input
          type="text"
          value={form.bibNumber}
          onChange={(e) => updateForm('bibNumber', e.target.value)}
          className="input"
          placeholder="101"
          required
        />
      </div>

      {form.raceType === 'singles' ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateForm('firstName', e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateForm('lastName', e.target.value)}
                className="input"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Gender *</label>
              <select
                value={form.gender}
                onChange={(e) => updateForm('gender', e.target.value as 'male' | 'female')}
                className="select"
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="label">Age Category *</label>
              <select
                value={form.ageCategory}
                onChange={(e) => updateForm('ageCategory', e.target.value)}
                className="select"
                required
              >
                <option value="">Select category</option>
                {AGE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="label">Team Name *</label>
            <input
              type="text"
              value={form.teamName}
              onChange={(e) => updateForm('teamName', e.target.value)}
              className="input"
              placeholder="Team Awesome"
              required
            />
          </div>
          <div>
            <label className="label">Category *</label>
            <select
              value={form.doublesCategory}
              onChange={(e) => updateForm('doublesCategory', e.target.value as 'men' | 'women' | 'mixed')}
              className="select"
              required
            >
              <option value="">Select category</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-700 mb-3">Partner 1</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">First Name *</label>
                <input
                  type="text"
                  value={form.partner1FirstName}
                  onChange={(e) => updateForm('partner1FirstName', e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input
                  type="text"
                  value={form.partner1LastName}
                  onChange={(e) => updateForm('partner1LastName', e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Gender *</label>
                <select
                  value={form.partner1Gender}
                  onChange={(e) => updateForm('partner1Gender', e.target.value as 'male' | 'female')}
                  className="select"
                  required
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-700 mb-3">Partner 2</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">First Name *</label>
                <input
                  type="text"
                  value={form.partner2FirstName}
                  onChange={(e) => updateForm('partner2FirstName', e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input
                  type="text"
                  value={form.partner2LastName}
                  onChange={(e) => updateForm('partner2LastName', e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Gender *</label>
                <select
                  value={form.partner2Gender}
                  onChange={(e) => updateForm('partner2Gender', e.target.value as 'male' | 'female')}
                  className="select"
                  required
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : athlete ? 'Update Athlete' : 'Add Athlete'}
        </button>
      </div>
    </form>
  )
}
