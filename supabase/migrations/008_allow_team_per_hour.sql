-- Migration 008: Allow one athlete record per team per hour
--
-- The old constraint UNIQUE(event_id, bib_number) only allowed one record
-- per bib per event. The new format needs one record per bib per HOUR
-- so teams appear in all 6 hours for scoring.
--
-- Run this manually in Supabase SQL Editor

-- Drop the old unique constraint
ALTER TABLE athletes DROP CONSTRAINT IF EXISTS athletes_event_id_bib_number_key;

-- Add new unique constraint: one record per bib per hour per event
ALTER TABLE athletes ADD CONSTRAINT athletes_event_bib_hour_key
  UNIQUE(event_id, bib_number, heat_number);

-- Backfill: For any team that only has records for some hours,
-- create records for the missing hours (1-6)
INSERT INTO athletes (event_id, race_type, heat_number, bib_number, first_name, last_name, gender, age_category, team_name)
SELECT DISTINCT
  a.event_id,
  a.race_type,
  h.hour,
  a.bib_number,
  a.first_name,
  a.last_name,
  a.gender,
  a.age_category,
  a.team_name
FROM athletes a
CROSS JOIN (VALUES (1),(2),(3),(4),(5),(6)) AS h(hour)
WHERE NOT EXISTS (
  SELECT 1 FROM athletes a2
  WHERE a2.event_id = a.event_id
    AND a2.bib_number = a.bib_number
    AND a2.heat_number = h.hour
)
AND a.heat_number = (
  SELECT MIN(a3.heat_number) FROM athletes a3
  WHERE a3.event_id = a.event_id AND a3.bib_number = a.bib_number
);
