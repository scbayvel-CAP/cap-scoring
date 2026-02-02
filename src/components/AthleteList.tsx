'use client'

import { Athlete } from '@/lib/supabase/types'
import { getDisplayName } from '@/lib/utils'

interface AthleteListProps {
  athletes: Athlete[]
  onEdit: (athlete: Athlete) => void
  onDelete: (athleteId: string) => void
  onShowQR?: (athlete: Athlete) => void
}

export function AthleteList({ athletes, onEdit, onDelete, onShowQR }: AthleteListProps) {
  if (athletes.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No athletes found</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden p-0">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="table-th">Bib</th>
            <th className="table-th">Name</th>
            <th className="table-th">Type</th>
            <th className="table-th">Heat</th>
            <th className="table-th">Category</th>
            <th className="table-th-right">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {athletes.map((athlete) => (
            <tr key={athlete.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                #{athlete.bib_number}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {getDisplayName(athlete)}
                {athlete.race_type === 'doubles' && (
                  <span className="block text-xs text-gray-500">
                    {athlete.partner1_first_name} {athlete.partner1_last_name} &{' '}
                    {athlete.partner2_first_name} {athlete.partner2_last_name}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  athlete.race_type === 'singles'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {athlete.race_type === 'singles' ? 'Singles' : 'Doubles'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                Heat {athlete.heat_number}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {athlete.race_type === 'singles' ? (
                  <>
                    {athlete.gender === 'male' ? 'M' : 'F'} / {athlete.age_category}
                  </>
                ) : (
                  athlete.doubles_category?.charAt(0).toUpperCase() + (athlete.doubles_category?.slice(1) || '')
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                {onShowQR && (
                  <button
                    onClick={() => onShowQR(athlete)}
                    className="text-gray-600 hover:text-gray-900 mr-3"
                    title="Show QR Code"
                  >
                    QR
                  </button>
                )}
                <button
                  onClick={() => onEdit(athlete)}
                  className="text-primary-600 hover:text-primary-900 mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(athlete.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
