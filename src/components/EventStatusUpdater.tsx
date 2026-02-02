'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Event } from '@/lib/supabase/types'

interface EventStatusUpdaterProps {
  eventId: string
  currentStatus: Event['status']
}

export function EventStatusUpdater({ eventId, currentStatus }: EventStatusUpdaterProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleStatusChange = async (newStatus: Event['status']) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus } as never)
        .eq('id', eventId)

      if (error) throw error
      setStatus(newStatus)
      router.refresh()
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusStyles = (s: Event['status']) => {
    const base = 'px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors'
    if (s === status) {
      const styles = {
        draft: 'bg-gray-700 text-white',
        active: 'bg-green-600 text-white',
        completed: 'bg-blue-600 text-white',
      }
      return `${base} ${styles[s]}`
    }
    return `${base} bg-gray-100 text-gray-600 hover:bg-gray-200`
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500 mr-2">Status:</span>
      {(['draft', 'active', 'completed'] as const).map((s) => (
        <button
          key={s}
          onClick={() => handleStatusChange(s)}
          disabled={loading || s === status}
          className={getStatusStyles(s)}
        >
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>
  )
}
