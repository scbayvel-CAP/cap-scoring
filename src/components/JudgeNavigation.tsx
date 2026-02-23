'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface JudgeNavigationProps {
  eventName?: string
  stationName?: string
  showBackToEvents?: boolean
}

export function JudgeNavigation({ eventName, stationName, showBackToEvents }: JudgeNavigationProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleBackToEvents = () => {
    router.push('/dashboard')
  }

  return (
    <nav className="bg-night-green border-b border-smoke">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            {showBackToEvents ? (
              <button
                onClick={handleBackToEvents}
                className="flex items-center gap-2 text-eggshell hover:text-chalk transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-mono text-sm uppercase tracking-wider">Events</span>
              </button>
            ) : (
              <span className="font-mono font-light text-xl text-chalk tracking-wider">
                <span className="text-olive">{'////'}</span>CAP
              </span>
            )}
            {eventName && (
              <>
                <span className="text-battleship">/</span>
                <span className="text-eggshell text-sm font-medium">{eventName}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {stationName && (
              <span className="text-sm font-mono px-3 py-1 rounded-full bg-olive/30 text-chalk uppercase tracking-wider">
                {stationName}
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
