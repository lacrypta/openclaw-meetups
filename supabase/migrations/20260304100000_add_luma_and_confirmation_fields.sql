-- Add luma_event_id to events table (links to Luma API)
ALTER TABLE events ADD COLUMN IF NOT EXISTS luma_event_id TEXT;
CREATE INDEX IF NOT EXISTS idx_events_luma_event_id ON events(luma_event_id);

-- Add attendance_confirmed to event_attendees (WhatsApp RSVP confirmation)
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS attendance_confirmed BOOLEAN DEFAULT false;
