-- CAP 55 Scoring System - Initial Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Athletes table (includes doubles teams)
CREATE TABLE athletes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  race_type TEXT NOT NULL CHECK (race_type IN ('singles', 'doubles')),
  heat_number INTEGER NOT NULL CHECK (heat_number >= 1 AND heat_number <= 12),
  bib_number TEXT NOT NULL,

  -- Singles fields
  first_name TEXT,
  last_name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  age_category TEXT,

  -- Doubles fields (NULL for singles)
  team_name TEXT,
  partner1_first_name TEXT,
  partner1_last_name TEXT,
  partner1_gender TEXT CHECK (partner1_gender IN ('male', 'female')),
  partner2_first_name TEXT,
  partner2_last_name TEXT,
  partner2_gender TEXT CHECK (partner2_gender IN ('male', 'female')),
  doubles_category TEXT CHECK (doubles_category IN ('men', 'women', 'mixed')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, bib_number)
);

-- Scores table (one row per athlete per station)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  station INTEGER NOT NULL CHECK (station >= 1 AND station <= 4),
  distance_meters INTEGER NOT NULL CHECK (distance_meters >= 0),
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(athlete_id, station)
);

-- Indexes for performance
CREATE INDEX idx_athletes_event_heat ON athletes(event_id, heat_number);
CREATE INDEX idx_athletes_event_type_gender_age ON athletes(event_id, race_type, gender, age_category);
CREATE INDEX idx_athletes_event_type_doubles ON athletes(event_id, race_type, doubles_category);
CREATE INDEX idx_scores_athlete ON scores(athlete_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Events: Authenticated users can read all events, only authenticated users can insert/update
CREATE POLICY "Anyone can view events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update events" ON events
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Athletes: Anyone can view, authenticated users can manage
CREATE POLICY "Anyone can view athletes" ON athletes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create athletes" ON athletes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update athletes" ON athletes
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete athletes" ON athletes
  FOR DELETE TO authenticated
  USING (true);

-- Scores: Anyone can view, authenticated users can manage
CREATE POLICY "Anyone can view scores" ON scores
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create scores" ON scores
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update scores" ON scores
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for scores table
ALTER PUBLICATION supabase_realtime ADD TABLE scores;
ALTER PUBLICATION supabase_realtime ADD TABLE athletes;
