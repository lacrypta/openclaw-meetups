-- Migration: Speakers & Talks system
-- Add speaker fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_speaker BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS speaker_bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS speaker_tagline TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS speaker_photo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS speaker_twitter TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS speaker_github TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS speaker_website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS speaker_company TEXT;

-- Talks table
CREATE TABLE IF NOT EXISTS talks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  format TEXT NOT NULL DEFAULT 'talk' CHECK (format IN ('talk', 'workshop', 'lightning', 'panel', 'fireside')),
  tags TEXT[],
  slides_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talks_speaker ON talks (speaker_id);
CREATE INDEX IF NOT EXISTS idx_talks_status ON talks (status);

-- Event talks (lineup)
CREATE TABLE IF NOT EXISTS event_talks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  talk_id UUID NOT NULL REFERENCES talks(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  room TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, talk_id)
);

CREATE INDEX IF NOT EXISTS idx_event_talks_event ON event_talks (event_id);
