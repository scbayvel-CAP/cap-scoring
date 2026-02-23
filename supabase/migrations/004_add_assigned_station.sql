-- Add assigned_station column to profiles table
-- This locks judges to specific stations to prevent accidental score entry errors

-- Add the column (nullable to support admin accounts which can access all stations)
ALTER TABLE profiles
ADD COLUMN assigned_station INTEGER;

-- Add a check constraint to ensure valid station numbers (1-4)
ALTER TABLE profiles
ADD CONSTRAINT valid_station_number
CHECK (assigned_station IS NULL OR (assigned_station >= 1 AND assigned_station <= 4));

-- Add comment for documentation
COMMENT ON COLUMN profiles.assigned_station IS
'Station number (1=Run, 2=Row, 3=Bike, 4=Ski) that this judge is assigned to. NULL for admin accounts.';

-- Update existing judge accounts with station assignments
-- 2 judges per station:
-- Judges 1-2 -> Station 1 (Run)
-- Judges 3-4 -> Station 2 (Row)
-- Judges 5-6 -> Station 3 (Bike)
-- Judges 7-8 -> Station 4 (Ski)
UPDATE profiles
SET assigned_station = 1
WHERE email IN ('judge1@cap-race.com', 'judge2@cap-race.com');

UPDATE profiles
SET assigned_station = 2
WHERE email IN ('judge3@cap-race.com', 'judge4@cap-race.com');

UPDATE profiles
SET assigned_station = 3
WHERE email IN ('judge5@cap-race.com', 'judge6@cap-race.com');

UPDATE profiles
SET assigned_station = 4
WHERE email IN ('judge7@cap-race.com', 'judge8@cap-race.com');
