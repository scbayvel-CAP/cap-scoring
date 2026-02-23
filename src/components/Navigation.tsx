'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/hooks/useRole'

interface NavigationProps {
  eventId?: string
  eventName?: string
}

export function Navigation({ eventId, eventName }: NavigationProps) {
  const router = useRouter()
  const supabase = createClient()
  const { role, loading, isAdmin } = useRole()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-night-green border-b border-smoke">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="font-mono font-light text-xl text-chalk tracking-wider">
              <span className="text-olive">{'////'}</span>CAP
            </Link>
            {eventName && (
              <>
                <span className="text-battleship">/</span>
                <span className="text-eggshell text-sm">{eventName}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {eventId && (
              <>
                <Link
                  href={`/events/${eventId}`}
                  className="text-sm text-eggshell hover:text-chalk font-mono uppercase tracking-wider"
                >
                  Overview
                </Link>
                {isAdmin && (
                  <Link
                    href={`/events/${eventId}/athletes`}
                    className="text-sm text-eggshell hover:text-chalk font-mono uppercase tracking-wider"
                  >
                    Athletes
                  </Link>
                )}
                <Link
                  href={`/events/${eventId}/scoring`}
                  className="text-sm text-eggshell hover:text-chalk font-mono uppercase tracking-wider"
                >
                  Scoring
                </Link>
                <Link
                  href={`/events/${eventId}/leaderboard`}
                  className="text-sm text-eggshell hover:text-chalk font-mono uppercase tracking-wider"
                >
                  Leaderboard
                </Link>
                <span className="text-battleship">|</span>
              </>
            )}
            {isAdmin && (
              <>
                <Link
                  href="/admin/judges"
                  className="text-sm text-eggshell hover:text-chalk font-mono uppercase tracking-wider"
                >
                  Judges
                </Link>
                <span className="text-battleship">|</span>
              </>
            )}
            {!loading && role && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-olive/30 text-chalk uppercase tracking-wider">
                {role}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="text-sm text-eggshell hover:text-chalk font-mono uppercase tracking-wider"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
