'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavigationProps {
  eventId?: string
  eventName?: string
}

export function Navigation({ eventId, eventName }: NavigationProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="font-bold text-xl text-gray-900">
              CAP 55
            </Link>
            {eventName && (
              <>
                <span className="text-gray-300">/</span>
                <span className="text-gray-600">{eventName}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {eventId && (
              <>
                <Link
                  href={`/events/${eventId}`}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Overview
                </Link>
                <Link
                  href={`/events/${eventId}/athletes`}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Athletes
                </Link>
                <Link
                  href={`/events/${eventId}/scoring`}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Scoring
                </Link>
                <Link
                  href={`/events/${eventId}/leaderboard`}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Leaderboard
                </Link>
                <span className="text-gray-300">|</span>
              </>
            )}
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
