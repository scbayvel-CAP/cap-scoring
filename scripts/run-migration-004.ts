/**
 * Run migration 004: Add assigned_station to profiles
 *
 * This script connects to Supabase and runs the migration to add
 * the assigned_station column and update existing judge accounts.
 *
 * Run with: npx tsx scripts/run-migration-004.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Station assignments for judges
const stationAssignments: Record<string, number> = {
  'judge1@cap-race.com': 1,
  'judge2@cap-race.com': 1,
  'judge3@cap-race.com': 1,
  'judge4@cap-race.com': 2,
  'judge5@cap-race.com': 2,
  'judge6@cap-race.com': 2,
  'judge7@cap-race.com': 3,
  'judge8@cap-race.com': 3,
  'judge9@cap-race.com': 3,
  'judge10@cap-race.com': 4,
  'judge11@cap-race.com': 4,
  'judge12@cap-race.com': 4,
}

async function checkColumnExists(): Promise<boolean> {
  // Try to select the column - if it fails, column doesn't exist
  const { error } = await supabase
    .from('profiles')
    .select('assigned_station')
    .limit(1)

  return !error
}

async function runMigration() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     Migration 004: Add assigned_station to profiles        ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  // Check if column already exists
  const columnExists = await checkColumnExists()

  if (!columnExists) {
    console.log('❌ The assigned_station column does not exist yet.')
    console.log('')
    console.log('Please run this SQL in the Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/epfjmbnvtvsnpuaramjj/sql')
    console.log('')
    console.log('─'.repeat(60))
    console.log(`
ALTER TABLE profiles
ADD COLUMN assigned_station INTEGER;

ALTER TABLE profiles
ADD CONSTRAINT valid_station_number
CHECK (assigned_station IS NULL OR (assigned_station >= 1 AND assigned_station <= 4));
`)
    console.log('─'.repeat(60))
    console.log('')
    console.log('After running the SQL, run this script again to assign stations.')
    process.exit(1)
  }

  console.log('✅ Column assigned_station exists')
  console.log('')
  console.log('Updating station assignments...')

  let updated = 0
  let skipped = 0

  for (const [email, station] of Object.entries(stationAssignments)) {
    const { error } = await supabase
      .from('profiles')
      .update({ assigned_station: station })
      .eq('email', email)

    if (error) {
      console.log(`  ⚠️  ${email}: ${error.message}`)
      skipped++
    } else {
      console.log(`  ✅ ${email} → Station ${station}`)
      updated++
    }
  }

  // Set admin to null (no station restriction)
  const { error: adminError } = await supabase
    .from('profiles')
    .update({ assigned_station: null })
    .eq('email', 'admin@cap-race.com')

  if (!adminError) {
    console.log(`  ✅ admin@cap-race.com → No restriction`)
    updated++
  }

  console.log('')
  console.log('════════════════════════════════════════════════════════════')
  console.log(`Complete! ${updated} profiles updated, ${skipped} skipped`)
  console.log('')
  console.log('Station Assignments:')
  console.log('  Station 1 (Run):  judge1, judge2, judge3')
  console.log('  Station 2 (Row):  judge4, judge5, judge6')
  console.log('  Station 3 (Bike): judge7, judge8, judge9')
  console.log('  Station 4 (Ski):  judge10, judge11, judge12')
  console.log('  Admin:            No restriction (can score any station)')
  console.log('════════════════════════════════════════════════════════════')
}

runMigration().catch(console.error)
