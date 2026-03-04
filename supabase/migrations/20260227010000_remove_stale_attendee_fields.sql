-- Phase 0.2: Remove stale email tracking fields from attendees
-- These are replaced by the email_sends table (per-recipient, per-job tracking)

ALTER TABLE attendees DROP COLUMN IF EXISTS email_sent;
ALTER TABLE attendees DROP COLUMN IF EXISTS email_sent_at;
ALTER TABLE attendees DROP COLUMN IF EXISTS email_type;
