-- Create email_integrations table
CREATE TABLE IF NOT EXISTS email_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('smtp', 'aws_ses', 'resend')),
  config TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_integrations_default ON email_integrations (is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE email_integrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_integrations' AND policyname = 'Allow authenticated reads') THEN
    CREATE POLICY "Allow authenticated reads" ON email_integrations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_integrations' AND policyname = 'Allow authenticated inserts') THEN
    CREATE POLICY "Allow authenticated inserts" ON email_integrations FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_integrations' AND policyname = 'Allow authenticated updates') THEN
    CREATE POLICY "Allow authenticated updates" ON email_integrations FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_integrations' AND policyname = 'Allow authenticated deletes') THEN
    CREATE POLICY "Allow authenticated deletes" ON email_integrations FOR DELETE USING (true);
  END IF;
END $$;
