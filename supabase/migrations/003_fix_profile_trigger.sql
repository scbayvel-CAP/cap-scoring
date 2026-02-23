-- CAP 55 Scoring System - Fix Profile Trigger
-- Run this in your Supabase SQL Editor
--
-- This fixes the trigger that auto-creates profiles when users sign up.
-- The issue is that the trigger was blocked by RLS policies even with SECURITY DEFINER.

-- ============================================================
-- 1. Drop and recreate the trigger function with proper permissions
-- ============================================================

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more robust trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email)
  VALUES (NEW.id, 'judge', NEW.email)
  ON CONFLICT (id) DO NOTHING;  -- Silently skip if profile already exists
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. Grant necessary permissions to the trigger function
-- ============================================================
-- The auth service needs permission to insert into profiles
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT, UPDATE ON public.profiles TO supabase_auth_admin;

-- ============================================================
-- 3. Add a policy that allows the service role to manage profiles
-- ============================================================
-- Drop existing service policy if any
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

-- Create a policy for service role operations
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- The above policy combined with service role will allow the setup script
-- to create profiles without issues.

-- ============================================================
-- Verification: Test that you can insert a profile
-- ============================================================
-- After running this migration, run the setup-accounts script again.
