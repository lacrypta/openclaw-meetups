-- Phase 0.3: Migrate smtp_settings data into email_integrations, then drop legacy table

-- Copy existing SMTP config into email_integrations (only if smtp_settings still exists and has data)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smtp_settings') THEN
    INSERT INTO email_integrations (name, type, config, is_default)
    SELECT
      'Legacy SMTP',
      'smtp',
      jsonb_build_object(
        'host', s.smtp_host,
        'port', s.smtp_port,
        'secure', s.smtp_secure,
        'username', s.smtp_user,
        'password', s.smtp_pass,
        'from_email', s.email_from
      )::text,
      true
    FROM smtp_settings s
    WHERE s.smtp_user != '' AND s.smtp_pass != ''
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Drop the legacy table
DROP TABLE IF EXISTS smtp_settings;
