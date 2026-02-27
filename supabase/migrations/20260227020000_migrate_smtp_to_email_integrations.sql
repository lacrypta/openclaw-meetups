-- Phase 0.3: Migrate smtp_settings data into email_integrations, then drop legacy table

-- Copy existing SMTP config into email_integrations (only if smtp_settings has actual data)
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

-- Drop the legacy table
DROP TABLE IF EXISTS smtp_settings;
