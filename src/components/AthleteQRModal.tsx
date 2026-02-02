'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Athlete } from '@/lib/supabase/types'
import { getDisplayName } from '@/lib/utils'
import { generateQRPrintTemplate } from '@/lib/printTemplate'

interface AthleteQRModalProps {
  athlete: Athlete
  eventId: string
  onClose: () => void
}

export function AthleteQRModal({ athlete, eventId, onClose }: AthleteQRModalProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const athleteUrl = `${baseUrl}/live/${eventId}/athlete/${athlete.id}`

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const qrCodeHtml = document.getElementById('athlete-qr-code')?.outerHTML || ''
      const html = generateQRPrintTemplate({
        athleteName: getDisplayName(athlete),
        bibNumber: athlete.bib_number,
        qrCodeHtml,
      })
      printWindow.document.write(html)
      printWindow.document.close()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{getDisplayName(athlete)}</h2>
            <p className="text-sm text-gray-500">Bib #{athlete.bib_number}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200" id="athlete-qr-code">
            <QRCodeSVG value={athleteUrl} size={200} />
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mb-6">
          Athletes can scan this QR code to view their live results on their phone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
