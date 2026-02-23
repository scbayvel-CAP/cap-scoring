'use client'

import { ScoreWarning } from '@/lib/validation/ranges'
import { getStationName } from '@/lib/utils'

interface RangeWarningModalProps {
  warnings: ScoreWarning[]
  onConfirm: () => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function RangeWarningModal({
  warnings,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: RangeWarningModalProps) {
  if (warnings.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-yellow-600"
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
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">
                Review Flagged Scores
              </h3>
              <p className="text-sm text-yellow-700">
                {warnings.length} score{warnings.length !== 1 ? 's' : ''} may need attention
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
          <div className="space-y-4">
            {warnings.map((warning, index) => (
              <div
                key={`${warning.athleteId}-${index}`}
                className={`p-4 rounded-lg border ${
                  warning.level === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {warning.level === 'error' ? (
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {warning.athleteName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {getStationName(warning.station)}: <strong>{warning.distance}m</strong>
                    </p>
                    <p className={`text-sm mt-1 ${
                      warning.level === 'error' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {warning.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer - stacked buttons on mobile for larger touch targets */}
        <div className="bg-gray-50 border-t px-6 py-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-4 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50 text-base font-medium"
            style={{ minHeight: '52px' }}
          >
            Go Back & Edit
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 active:scale-[0.98] transition-all disabled:opacity-50 text-base font-semibold"
            style={{ minHeight: '52px' }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Anyway'}
          </button>
        </div>
      </div>
    </div>
  )
}
