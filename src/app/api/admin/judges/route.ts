import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function verifyAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null }

  if (!profile || profile.role !== 'admin') return null

  return user
}

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: judges, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'judge')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ judges })
}

export async function POST(request: Request) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ user: data.user })
}
