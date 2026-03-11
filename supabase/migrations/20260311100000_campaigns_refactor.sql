-- Make event_id nullable on email_jobs (campaigns no longer require an event)
ALTER TABLE email_jobs ALTER COLUMN event_id DROP NOT NULL;

-- Remove segment CHECK constraint and make nullable
ALTER TABLE email_jobs DROP CONSTRAINT IF EXISTS email_jobs_segment_check;
ALTER TABLE email_jobs ALTER COLUMN segment DROP NOT NULL;
ALTER TABLE email_jobs ALTER COLUMN segment SET DEFAULT 'custom';

-- Add name column for campaign identification
ALTER TABLE email_jobs ADD COLUMN IF NOT EXISTS name TEXT;
