-- Create events table
CREATE TABLE events (
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
CREATE INDEX idx_events_date ON events (date DESC);

-- Create event_attendees junction table (attendees.id is INTEGER)
CREATE TABLE event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attendee_id INTEGER NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waitlist' CHECK (status IN ('approved','waitlist','declined')),
  checked_in BOOLEAN DEFAULT false,
  registered_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(event_id, attendee_id)
);
CREATE INDEX idx_ea_event ON event_attendees (event_id);
CREATE INDEX idx_ea_attendee ON event_attendees (attendee_id);

-- Migrate existing attendees into a legacy event
INSERT INTO events (name, description, date, location, status)
VALUES ('OpenClaw Meetup #1', 'Migrated legacy event', '2026-02-20T19:00:00-03:00', 'La Crypta, Belgrano', 'completed');

INSERT INTO event_attendees (event_id, attendee_id, status, checked_in, registered_at)
SELECT (SELECT id FROM events LIMIT 1), a.id, a.status, a.checked_in, a.registered_at
FROM attendees a;
