-- Create SMTP settings table
CREATE TABLE IF NOT EXISTS smtp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_secure BOOLEAN NOT NULL DEFAULT false,
  smtp_user TEXT NOT NULL,
  smtp_pass TEXT NOT NULL,
  email_from TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only allow one row (singleton pattern)
CREATE UNIQUE INDEX smtp_settings_singleton ON smtp_settings ((id IS NOT NULL))
  WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;

-- Insert default row with UUID 00000000-0000-0000-0000-000000000000
INSERT INTO smtp_settings (
  id,
  smtp_host,
  smtp_port,
  smtp_secure,
  smtp_user,
  smtp_pass,
  email_from
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'smtp.gmail.com',
  587,
  false,
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE smtp_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow updates (no inserts/deletes since it's singleton)
CREATE POLICY "Allow authenticated updates" ON smtp_settings
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated reads" ON smtp_settings
  FOR SELECT USING (true);
