-- Migration: Add score audit log table
-- This table tracks all changes to scores for accountability and dispute resolution

-- Create the score_audit_log table
CREATE TABLE IF NOT EXISTS score_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    score_id UUID REFERENCES scores(id) ON DELETE SET NULL,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    station INTEGER NOT NULL CHECK (station >= 1 AND station <= 4),
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
    old_value INTEGER,  -- Previous distance in meters (null for 'created')
    new_value INTEGER,  -- New distance in meters (null for 'deleted')
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb  -- For any additional context
);

-- Create indexes for common queries
CREATE INDEX idx_audit_log_athlete ON score_audit_log(athlete_id);
CREATE INDEX idx_audit_log_event ON score_audit_log(event_id);
CREATE INDEX idx_audit_log_changed_at ON score_audit_log(changed_at DESC);
CREATE INDEX idx_audit_log_changed_by ON score_audit_log(changed_by);

-- Enable RLS
ALTER TABLE score_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view audit logs (for transparency)
CREATE POLICY "Authenticated users can view audit logs"
    ON score_audit_log
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only the system can insert audit logs (via service role or triggers)
-- For now, we'll allow authenticated users to insert (the app will handle this)
CREATE POLICY "Authenticated users can insert audit logs"
    ON score_audit_log
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: No one can update or delete audit logs (immutable)
-- (No UPDATE or DELETE policies = no modifications allowed)

-- Add comment for documentation
COMMENT ON TABLE score_audit_log IS 'Immutable audit trail of all score changes';
COMMENT ON COLUMN score_audit_log.action IS 'Type of change: created, updated, or deleted';
COMMENT ON COLUMN score_audit_log.old_value IS 'Previous distance in meters (null for created)';
COMMENT ON COLUMN score_audit_log.new_value IS 'New distance in meters (null for deleted)';
COMMENT ON COLUMN score_audit_log.metadata IS 'Additional context like undo reason, batch import, etc.';
