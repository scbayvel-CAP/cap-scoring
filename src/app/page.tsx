import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CAPLogo } from '@/components/CAPLogo'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-night-green">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <CAPLogo textColor="#FFFFF9" height={56} />
          <p className="font-mono text-xs text-battleship uppercase tracking-[0.3em] mt-4">
            Team Endurance Racing
          </p>
        </div>
        <p className="text-lg text-eggshell mb-12">
          Six hours. Row for distance. Every meter counts.
        </p>
        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-block bg-olive text-night-green px-8 py-4 font-mono text-sm uppercase tracking-wider hover:bg-eggshell transition-colors"
          >
            Judge Login
          </Link>
        </div>
        <div className="mt-16 pt-8 border-t border-battleship/30">
          <p className="font-mono text-xs text-battleship uppercase tracking-wider">
            Scoring System
          </p>
        </div>
      </div>
    </main>
  )
}
