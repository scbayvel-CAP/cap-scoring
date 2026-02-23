import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/lib/supabase/types'

export interface UserProfile {
  role: UserRole
  userId: string
  assignedStation: number | null
}

export async function getUserRole(): Promise<UserProfile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, assigned_station')
    .eq('id', user.id)
    .single() as unknown as { data: { role: UserRole; assigned_station: number | null } | null }

  if (!profile) return null

  return {
    role: profile.role,
    userId: user.id,
    assignedStation: profile.assigned_station
  }
}

export async function requireAdmin(): Promise<{ role: 'admin'; userId: string }> {
  const result = await getUserRole()

  if (!result || result.role !== 'admin') {
    redirect('/dashboard')
  }

  return { role: 'admin', userId: result.userId }
}
