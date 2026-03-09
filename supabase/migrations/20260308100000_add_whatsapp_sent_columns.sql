-- Add whatsapp_sent tracking to event_attendees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_attendees' AND column_name = 'whatsapp_sent'
  ) THEN
    ALTER TABLE event_attendees ADD COLUMN whatsapp_sent BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_attendees' AND column_name = 'whatsapp_sent_at'
  ) THEN
    ALTER TABLE event_attendees ADD COLUMN whatsapp_sent_at TIMESTAMPTZ;
  END IF;
END $$;
