'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/lib/supabase/types'

interface UserProfile {
  role: UserRole
  assignedStation: number | null
}

export function useRole() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, assigned_station')
        .eq('id', user.id)
        .single() as unknown as { data: { role: UserRole; assigned_station: number | null } | null }

      if (profileData) {
        setProfile({
          role: profileData.role,
          assignedStation: profileData.assigned_station
        })
      }

      setLoading(false)
    }

    fetchProfile()
  }, [])

  return {
    role: profile?.role ?? null,
    assignedStation: profile?.assignedStation ?? null,
    loading,
    isAdmin: profile?.role === 'admin',
    isJudge: profile?.role === 'judge',
  }
}
