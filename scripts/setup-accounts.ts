/**
 * Setup script to create judge and admin accounts for CAP 55 Scoring System
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
 *   (2 judges per station, locked to their assigned station)
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

// Station assignments (2 judges per station, locked to their station):
// Station 1 (Run): Judges 1-2
// Station 2 (Row): Judges 3-4
// Station 3 (Bike): Judges 5-6
// Station 4 (Ski): Judges 7-8
const accounts: Array<{ email: string; role: 'admin' | 'judge'; assigned_station: number | null }> = [
  // Admin account (no station restriction - can access all stations)
  { email: 'admin@cap-race.com', role: 'admin', assigned_station: null },
  // Station 1 - Run (judges 1-2)
  { email: 'judge1@cap-race.com', role: 'judge', assigned_station: 1 },
  { email: 'judge2@cap-race.com', role: 'judge', assigned_station: 1 },
  // Station 2 - Row (judges 3-4)
  { email: 'judge3@cap-race.com', role: 'judge', assigned_station: 2 },
  { email: 'judge4@cap-race.com', role: 'judge', assigned_station: 2 },
  // Station 3 - Bike (judges 5-6)
  { email: 'judge5@cap-race.com', role: 'judge', assigned_station: 3 },
  { email: 'judge6@cap-race.com', role: 'judge', assigned_station: 3 },
  // Station 4 - Ski (judges 7-8)
  { email: 'judge7@cap-race.com', role: 'judge', assigned_station: 4 },
  { email: 'judge8@cap-race.com', role: 'judge', assigned_station: 4 },
]

async function checkProfilesTable(): Promise<boolean> {
  // Check if the profiles table exists
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

    // Update their profile (role and station assignment)
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({ id: existingUser.id, email, role, assigned_station }, { onConflict: 'id' })

    if (updateError) {
      console.error(`  ❌ Failed to update profile for ${email}:`, updateError.message)
      return false
    }
    const stationInfo = assigned_station ? ` (Station ${assigned_station})` : ''
    console.log(`  ✅ Updated ${email} - ${role}${stationInfo}`)
    return true
  }

  // Create user in Supabase Auth (without triggering profile creation)
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true, // Auto-confirm email so they can log in immediately
    user_metadata: { role }, // Store role in metadata too
  })

  if (createError) {
    console.error(`  ❌ Failed to create ${email}:`, createError.message)
    return false
  }

  if (!user.user) {
    console.error(`  ❌ No user returned for ${email}`)
    return false
  }

  // Create the profile manually with service role (bypasses RLS)
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.user.id, email, role, assigned_station }, { onConflict: 'id' })

  if (profileError) {
    // If profiles table doesn't exist, the user is still created
    if (profileError.message.includes('does not exist')) {
      console.log(`  ⚠️  Created ${email} (profiles table missing - run migration 002)`)
      return true
    }
    console.error(`  ❌ Failed to set profile for ${email}:`, profileError.message)
    return false
  }

  const stationInfo = assigned_station ? ` (Station ${assigned_station})` : ''
  console.log(`  ✅ Created ${email} - ${role}${stationInfo}`)
  return true
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║          CAP 55 Scoring - Account Setup Script             ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  // Check if profiles table exists
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
  console.log('Creating judge accounts with station assignments...')
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
  console.log(`Password: ${DEFAULT_PASSWORD}`)
  console.log('')
  console.log('Station Assignments (judges are LOCKED to their station):')
  console.log('  Station 1 (Run):  judge1, judge2')
  console.log('  Station 2 (Row):  judge3, judge4')
  console.log('  Station 3 (Bike): judge5, judge6')
  console.log('  Station 4 (Ski):  judge7, judge8')
  console.log('')
  console.log('Login at: https://cap-scoring.vercel.app/login')
  console.log('════════════════════════════════════════════════════════════')
}

main().catch(console.error)
