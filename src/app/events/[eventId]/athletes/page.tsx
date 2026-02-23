'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { AthleteForm } from '@/components/AthleteForm'
import { AthleteList } from '@/components/AthleteList'
import { AthleteQRModal } from '@/components/AthleteQRModal'
import CSVImportModal from '@/components/CSVImportModal'
import { PageErrorBoundary } from '@/components/ErrorBoundary'
import { Skeleton, SkeletonAthleteList } from '@/components/Skeleton'
import { Athlete } from '@/lib/supabase/types'
import { getHeatNumbers } from '@/lib/utils'
import { useAthletes } from '@/hooks/useAthletes'
import { useEvent } from '@/hooks/useEvent'
import { useRole } from '@/hooks/useRole'

export default function AthletesPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string

  const { isAdmin, loading: roleLoading } = useRole()
  const { event } = useEvent(eventId)
  const { athletes, loading, deleteAthlete, refresh } = useAthletes({
    eventId,
    realtime: true,
  })

  const [showForm, setShowForm] = useState(false)
  const [editingAthlete, setEditingAthlete] = useState<Athlete | undefined>()
  const [qrAthlete, setQrAthlete] = useState<Athlete | undefined>()
  const [showImportModal, setShowImportModal] = useState(false)

  const [filterRaceType, setFilterRaceType] = useState<'all' | 'singles' | 'doubles'>('all')
  const [filterHeat, setFilterHeat] = useState<number | 'all'>('all')

  // Redirect judges to event overview
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.push(`/events/${eventId}`)
    }
  }, [roleLoading, isAdmin, router, eventId])

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

  if (loading || roleLoading) {
    return (
      <div>
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>

          <div className="card mb-6">
            <div className="flex flex-wrap gap-4">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div>
                <Skeleton className="h-4 w-12 mb-2" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>

          <Skeleton className="h-4 w-48 mb-4" />
          <SkeletonAthleteList count={8} />
        </main>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div>
      <Navigation eventId={eventId} eventName={event?.name} />
      <PageErrorBoundary pageName="Athletes">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Athletes</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Import CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Add Athlete
            </button>
          </div>
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

        {showImportModal && (
          <CSVImportModal
            eventId={eventId}
            existingBibs={new Set(athletes.map((a) => a.bib_number))}
            onClose={() => setShowImportModal(false)}
            onImportComplete={() => {
              setShowImportModal(false)
              refresh()
            }}
          />
        )}
      </main>
      </PageErrorBoundary>
    </div>
  )
}
