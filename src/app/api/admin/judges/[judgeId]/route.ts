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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ judgeId: string }> }
) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { judgeId } = await params

  // Prevent self-deletion
  if (judgeId === admin.id) {
    return NextResponse.json(
      { error: 'Cannot delete your own account' },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient.auth.admin.deleteUser(judgeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
