-- Migration 007: Update constraints for hour-based Row-only format
--
-- Changes:
-- 1. Update heat_number constraint: 1-6 (was 1-12)
-- 2. Update station constraint: always 1 (Row only)
-- 3. Set all judge assigned_station to NULL (no station locking)
--
-- Run this manually in Supabase SQL Editor

-- Drop existing constraints if they exist
ALTER TABLE athletes DROP CONSTRAINT IF EXISTS athletes_heat_number_check;
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_station_check;
ALTER TABLE score_audit_log DROP CONSTRAINT IF EXISTS score_audit_log_station_check;
ALTER TABLE score_photos DROP CONSTRAINT IF EXISTS score_photos_station_check;

-- Add new constraints
ALTER TABLE athletes ADD CONSTRAINT athletes_heat_number_check
  CHECK (heat_number >= 1 AND heat_number <= 6);

ALTER TABLE scores ADD CONSTRAINT scores_station_check
  CHECK (station = 1);

ALTER TABLE score_audit_log ADD CONSTRAINT score_audit_log_station_check
  CHECK (station = 1);

ALTER TABLE score_photos ADD CONSTRAINT score_photos_station_check
  CHECK (station = 1);

-- Remove station assignments from all judges (all score Row now)
UPDATE profiles SET assigned_station = NULL WHERE role = 'judge';
