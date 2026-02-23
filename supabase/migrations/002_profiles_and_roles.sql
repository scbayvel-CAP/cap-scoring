-- CAP 55 Scoring System - Profiles & Role-Based Access Control
-- Run this in your Supabase SQL Editor

-- ============================================================
-- 1. Create profiles table
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'judge' CHECK (role IN ('admin', 'judge')),
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read profiles (needed for role checks)
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT TO authenticated
  USING (true);

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Only admins can modify profiles
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 2. Helper function: is_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, email)
  VALUES (NEW.id, 'judge', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 4. Backfill profiles for existing users
-- ============================================================
INSERT INTO profiles (id, role, email)
SELECT id, 'judge', email
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. Replace permissive write policies on events with admin-only
-- ============================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON events;

-- Admin-only write policies for events
CREATE POLICY "Admins can create events" ON events
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update events" ON events
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete events" ON events
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================
-- 6. Replace permissive write policies on athletes with admin-only
-- ============================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated users can create athletes" ON athletes;
DROP POLICY IF EXISTS "Authenticated users can update athletes" ON athletes;
DROP POLICY IF EXISTS "Authenticated users can delete athletes" ON athletes;

-- Admin-only write policies for athletes
CREATE POLICY "Admins can create athletes" ON athletes
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update athletes" ON athletes
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete athletes" ON athletes
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================
-- 7. Scores remain writable by all authenticated users
--    (Both admins and judges need to enter scores)
--    These policies already exist from 001, so no changes needed.
-- ============================================================

-- ============================================================
-- MANUAL STEP: Promote your account to admin
-- Run this after the migration, replacing with your email:
--
--   UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
--
-- ============================================================
