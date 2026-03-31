/**
 * Setup script to create judge and admin accounts for CAP Scoring System
 *
 * Prerequisites:
 * 1. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file
 *    (Find it in Supabase Dashboard > Settings > API > service_role key)
 *
 * Run with:
 *   npx tsx scripts/setup-accounts.ts
 *
 * This will create:
 * - 1 admin account: admin@cap-race.com
 * - 8 judge accounts: judge1@cap-race.com through judge8@cap-race.com
 *   (All judges score Row — no station locking)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceRoleKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nMake sure these are set in your .env.local file')
  process.exit(1)
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Account configuration
const DEFAULT_PASSWORD = 'CAP55race!'  // Change this before sharing with judges

// All judges score Row (station 1) — no station locking needed
const accounts: Array<{ email: string; role: 'admin' | 'judge'; assigned_station: number | null }> = [
  // Admin account (no station restriction)
  { email: 'admin@cap-race.com', role: 'admin', assigned_station: null },
  // All judges — no station assignment (all score Row)
  { email: 'judge1@cap-race.com', role: 'judge', assigned_station: null },
  { email: 'judge2@cap-race.com', role: 'judge', assigned_station: null },
  { email: 'judge3@cap-race.com', role: 'judge', assigned_station: null },
  { email: 'judge4@cap-race.com', role: 'judge', assigned_station: null },
  { email: 'judge5@cap-race.com', role: 'judge', assigned_station: null },
  { email: 'judge6@cap-race.com', role: 'judge', assigned_station: null },
  { email: 'judge7@cap-race.com', role: 'judge', assigned_station: null },
  { email: 'judge8@cap-race.com', role: 'judge', assigned_station: null },
]

async function checkProfilesTable(): Promise<boolean> {
  const { error } = await supabase.from('profiles').select('id').limit(1)

  if (error && error.message.includes('relation "public.profiles" does not exist')) {
    return false
  }
  return true
}

async function createAccount(
  email: string,
  role: 'admin' | 'judge',
  assigned_station: number | null
): Promise<boolean> {
  // First check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users.find(u => u.email === email)

  if (existingUser) {
    console.log(`  ⏭️  ${email} already exists, updating profile...`)

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({ id: existingUser.id, email, role, assigned_station }, { onConflict: 'id' })

    if (updateError) {
      console.error(`  ❌ Failed to update profile for ${email}:`, updateError.message)
      return false
    }
    console.log(`  ✅ Updated ${email} - ${role}`)
    return true
  }

  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { role },
  })

  if (createError) {
    console.error(`  ❌ Failed to create ${email}:`, createError.message)
    return false
  }

  if (!user.user) {
    console.error(`  ❌ No user returned for ${email}`)
    return false
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.user.id, email, role, assigned_station }, { onConflict: 'id' })

  if (profileError) {
    if (profileError.message.includes('does not exist')) {
      console.log(`  ⚠️  Created ${email} (profiles table missing - run migration 002)`)
      return true
    }
    console.error(`  ❌ Failed to set profile for ${email}:`, profileError.message)
    return false
  }

  console.log(`  ✅ Created ${email} - ${role}`)
  return true
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║          CAP Scoring - Account Setup Script               ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  const hasProfilesTable = await checkProfilesTable()
  if (!hasProfilesTable) {
    console.log('⚠️  WARNING: profiles table does not exist!')
    console.log('   Run migration 002_profiles_and_roles.sql in Supabase SQL Editor')
    console.log('   Users will be created but without role-based access control.')
    console.log('')
  }

  console.log(`Creating accounts with password: ${DEFAULT_PASSWORD}`)
  console.log('(You can change this in the script before running)')
  console.log('')

  let created = 0
  let failed = 0

  console.log('Creating admin account...')
  const adminAccount = accounts.find(a => a.role === 'admin')!
  if (await createAccount(adminAccount.email, 'admin', adminAccount.assigned_station)) {
    created++
  } else {
    failed++
  }

  console.log('')
  console.log('Creating judge accounts (all judges score Row)...')
  for (const account of accounts.filter(a => a.role === 'judge')) {
    if (await createAccount(account.email, 'judge', account.assigned_station)) {
      created++
    } else {
      failed++
    }
  }

  console.log('')
  console.log('════════════════════════════════════════════════════════════')
  console.log(`Complete! ${created} accounts created/updated, ${failed} failed`)
  console.log('')
  console.log('Account Credentials:')
  console.log('────────────────────────────────────────────────────────────')
  console.log(`Admin:    admin@cap-race.com / ${DEFAULT_PASSWORD}`)
  console.log(`Judges:   judge1-8@cap-race.com / ${DEFAULT_PASSWORD}`)
  console.log('')
  console.log('All judges score Row (no station locking)')
  console.log('')
  console.log('Login at: https://cap-scoring.vercel.app/login')
  console.log('════════════════════════════════════════════════════════════')
}

main().catch(console.error)
