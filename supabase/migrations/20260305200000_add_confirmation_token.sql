-- Add confirmation_token and confirmed_at to event_attendees
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_attendees' AND column_name = 'confirmation_token'
  ) THEN
    ALTER TABLE event_attendees ADD COLUMN confirmation_token UUID DEFAULT gen_random_uuid() UNIQUE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_attendees' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE event_attendees ADD COLUMN confirmed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add requires_confirmation to events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'requires_confirmation'
  ) THEN
    ALTER TABLE events ADD COLUMN requires_confirmation BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Backfill existing rows that have no confirmation_token
UPDATE event_attendees SET confirmation_token = gen_random_uuid() WHERE confirmation_token IS NULL;

-- Add email tracking fields if not present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_attendees' AND column_name = 'email_sent'
  ) THEN
    ALTER TABLE event_attendees ADD COLUMN email_sent BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_attendees' AND column_name = 'email_sent_at'
  ) THEN
    ALTER TABLE event_attendees ADD COLUMN email_sent_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_attendees' AND column_name = 'email_type'
  ) THEN
    ALTER TABLE event_attendees ADD COLUMN email_type TEXT;
  END IF;
END $$;
