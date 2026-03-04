-- Create attendees table (legacy flat table from Luma imports)
-- Must run before create_events_tables which references attendees(id)

CREATE TABLE IF NOT EXISTS attendees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  pubkey TEXT,
  status TEXT NOT NULL DEFAULT 'waitlist' CHECK (status IN ('approved','waitlist','declined')),
  checked_in BOOLEAN DEFAULT false,
  registered_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  email_type TEXT
);

CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees (email);
