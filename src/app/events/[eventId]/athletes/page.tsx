'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { AthleteForm } from '@/components/AthleteForm'
import { AthleteList } from '@/components/AthleteList'
import { AthleteQRModal } from '@/components/AthleteQRModal'
import { Athlete } from '@/lib/supabase/types'
import { getHeatNumbers } from '@/lib/utils'
import { useAthletes } from '@/hooks/useAthletes'
import { useEvent } from '@/hooks/useEvent'

export default function AthletesPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const { event } = useEvent(eventId)
  const { athletes, loading, deleteAthlete, refresh } = useAthletes({
    eventId,
    realtime: true,
  })

  const [showForm, setShowForm] = useState(false)
  const [editingAthlete, setEditingAthlete] = useState<Athlete | undefined>()
  const [qrAthlete, setQrAthlete] = useState<Athlete | undefined>()

  const [filterRaceType, setFilterRaceType] = useState<'all' | 'singles' | 'doubles'>('all')
  const [filterHeat, setFilterHeat] = useState<number | 'all'>('all')

  const handleSave = () => {
    setShowForm(false)
    setEditingAthlete(undefined)
    refresh()
  }

  const handleEdit = (athlete: Athlete) => {
    setEditingAthlete(athlete)
    setShowForm(true)
  }

  const handleDelete = async (athleteId: string) => {
    if (!confirm('Are you sure you want to delete this athlete? All their scores will also be deleted.')) {
      return
    }

    await deleteAthlete(athleteId)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingAthlete(undefined)
  }

  const filteredAthletes = athletes.filter((athlete) => {
    if (filterRaceType !== 'all' && athlete.race_type !== filterRaceType) {
      return false
    }
    if (filterHeat !== 'all' && athlete.heat_number !== filterHeat) {
      return false
    }
    return true
  })

  if (loading) {
    return (
      <div>
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navigation eventId={eventId} eventName={event?.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Athletes</h1>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Add Athlete
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingAthlete ? 'Edit Athlete' : 'Add Athlete'}
              </h2>
              <AthleteForm
                eventId={eventId}
                athlete={editingAthlete}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          </div>
        )}

        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="label">Race Type</label>
              <select
                value={filterRaceType}
                onChange={(e) => setFilterRaceType(e.target.value as 'all' | 'singles' | 'doubles')}
                className="select"
              >
                <option value="all">All Types</option>
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
              </select>
            </div>
            <div>
              <label className="label">Heat</label>
              <select
                value={filterHeat}
                onChange={(e) => setFilterHeat(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="select"
              >
                <option value="all">All Heats</option>
                {getHeatNumbers().map((h) => (
                  <option key={h} value={h}>
                    Heat {h}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          Showing {filteredAthletes.length} of {athletes.length} athletes
        </div>

        <AthleteList
          athletes={filteredAthletes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onShowQR={setQrAthlete}
        />

        {qrAthlete && (
          <AthleteQRModal
            athlete={qrAthlete}
            eventId={eventId}
            onClose={() => setQrAthlete(undefined)}
          />
        )}
      </main>
    </div>
  )
}
