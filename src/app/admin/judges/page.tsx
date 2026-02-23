'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navigation } from '@/components/Navigation'
import { useRole } from '@/hooks/useRole'
import { useRouter } from 'next/navigation'

interface Judge {
  id: string
  email: string | null
  created_at: string
}

export default function JudgesPage() {
  const { isAdmin, loading: roleLoading } = useRole()
  const router = useRouter()

  const [judges, setJudges] = useState<Judge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchJudges = useCallback(async () => {
    const res = await fetch('/api/admin/judges')
    if (res.ok) {
      const data = await res.json()
      setJudges(data.judges)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.push('/dashboard')
      return
    }
    if (!roleLoading && isAdmin) {
      fetchJudges()
    }
  }, [roleLoading, isAdmin, router, fetchJudges])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setCreating(true)

    try {
      const res = await fetch('/api/admin/judges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setSuccess(`Judge account created for ${email}`)
      setEmail('')
      setPassword('')
      fetchJudges()
    } catch {
      setError('Failed to create judge account')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (judgeId: string, judgeEmail: string | null) => {
    if (!confirm(`Delete judge account ${judgeEmail || judgeId}? This cannot be undone.`)) {
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/judges/${judgeId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setSuccess(`Judge account deleted`)
      fetchJudges()
    } catch {
      setError('Failed to delete judge account')
    }
  }

  if (roleLoading || loading) {
    return (
      <div>
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Manage Judges</h1>

        {/* Create Judge Form */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Judge Account</h2>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="judge-email" className="label">
                Email
              </label>
              <input
                id="judge-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="judge@example.com"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="judge-password" className="label">
                Password
              </label>
              <input
                id="judge-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="btn-primary whitespace-nowrap"
              >
                {creating ? 'Creating...' : 'Create Judge'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-md text-sm bg-red-100 text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 rounded-md text-sm bg-olive/20 text-night-green">
              {success}
            </div>
          )}
        </div>

        {/* Judges List */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Judge Accounts ({judges.length})
          </h2>

          {judges.length === 0 ? (
            <p className="text-gray-500 text-sm">No judge accounts yet.</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {judges.map((judge) => (
                <div
                  key={judge.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {judge.email || 'No email'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created{' '}
                      {new Date(judge.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(judge.id, judge.email)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
