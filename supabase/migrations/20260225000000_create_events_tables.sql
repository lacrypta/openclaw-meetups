-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  capacity INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled','completed')),
  image_url TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_date ON events (date DESC);

-- Create event_attendees junction table (attendees.id is INTEGER)
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attendee_id INTEGER NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waitlist' CHECK (status IN ('approved','waitlist','declined')),
  checked_in BOOLEAN DEFAULT false,
  registered_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(event_id, attendee_id)
);
CREATE INDEX IF NOT EXISTS idx_ea_event ON event_attendees (event_id);
CREATE INDEX IF NOT EXISTS idx_ea_attendee ON event_attendees (attendee_id);

-- Migrate existing attendees into a legacy event (only if attendees exist and no events yet)
INSERT INTO events (name, description, date, location, status)
SELECT 'OpenClaw Meetup #1', 'Migrated legacy event', '2026-02-20T19:00:00-03:00', 'La Crypta, Belgrano', 'completed'
WHERE EXISTS (SELECT 1 FROM attendees LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM events LIMIT 1);

INSERT INTO event_attendees (event_id, attendee_id, status, checked_in, registered_at)
SELECT (SELECT id FROM events LIMIT 1), a.id, a.status, a.checked_in, a.registered_at
FROM attendees a
WHERE NOT EXISTS (SELECT 1 FROM event_attendees LIMIT 1);
