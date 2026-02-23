'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-ivory">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-mono font-light text-3xl text-night-green tracking-wider">
            <span className="text-olive">{'////'}</span>CAP
          </Link>
          <p className="text-battleship mt-2 font-mono text-xs uppercase tracking-wider">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="p-3 rounded-md text-sm font-mono bg-red-100 text-red-800">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="judge@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full font-mono uppercase tracking-wider"
          >
            {loading ? 'Please wait...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  )
}
