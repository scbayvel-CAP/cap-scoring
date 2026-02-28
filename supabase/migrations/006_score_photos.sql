-- Migration: Add score_photos table for photo-first AI scoring
-- Photos of machine displays are captured, AI-read, and stored as proof

CREATE TABLE IF NOT EXISTS score_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    score_id UUID REFERENCES scores(id) ON DELETE SET NULL,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    station INTEGER NOT NULL CHECK (station >= 1 AND station <= 4),
    storage_path TEXT NOT NULL,
    ai_extracted_value INTEGER,          -- Distance in meters read by AI
    ai_confidence NUMERIC(3,2),          -- 0.00 to 1.00
    ai_raw_response JSONB,               -- Full AI response for debugging
    judge_final_value INTEGER,           -- What the judge actually submitted
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb   -- Additional context (bib, heat, etc.)
);

-- Indexes for common queries
CREATE INDEX idx_score_photos_athlete ON score_photos(athlete_id);
CREATE INDEX idx_score_photos_event ON score_photos(event_id);
CREATE INDEX idx_score_photos_score ON score_photos(score_id);
CREATE INDEX idx_score_photos_uploaded_at ON score_photos(uploaded_at DESC);
CREATE INDEX idx_score_photos_event_station ON score_photos(event_id, station);

-- Enable RLS
ALTER TABLE score_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view photos
CREATE POLICY "Authenticated users can view score photos"
    ON score_photos
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Authenticated users can upload photos
CREATE POLICY "Authenticated users can insert score photos"
    ON score_photos
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Authenticated users can update their own photos (for linking score_id)
CREATE POLICY "Authenticated users can update score photos"
    ON score_photos
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Only admins can delete photos
CREATE POLICY "Admins can delete score photos"
    ON score_photos
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMENT ON TABLE score_photos IS 'Photos of machine displays captured during scoring for AI reading and proof';
COMMENT ON COLUMN score_photos.ai_extracted_value IS 'Distance in meters extracted by OpenAI Vision';
COMMENT ON COLUMN score_photos.ai_confidence IS 'AI confidence score from 0.00 to 1.00';
COMMENT ON COLUMN score_photos.judge_final_value IS 'The value the judge actually submitted (may differ from AI reading)';
