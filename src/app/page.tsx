import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          CAP 55 Scoring
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Real-time scoring system for CAP 55 endurance racing events
        </p>
        <div className="space-y-4">
          <Link
            href="/login"
            className="btn-primary btn-lg w-full block"
          >
            Judge Login
          </Link>
        </div>
      </div>
    </main>
  )
}
