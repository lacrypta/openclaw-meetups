-- Merge email_integrations into generic integrations table
-- Email integrations become integrations with provider='email'
-- The 'type' column (smtp/aws_ses/resend) and 'is_default' are merged into the JSONB config

DO $$ BEGIN
  -- Only run if email_integrations table still exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_integrations' AND table_schema = 'public') THEN

    -- Migrate data: merge type and is_default into config JSONB
    INSERT INTO integrations (provider, name, config, is_active, created_at, updated_at)
    SELECT
      'email',
      name,
      (config::jsonb || jsonb_build_object('type', type, 'is_default', is_default)),
      true,
      created_at,
      updated_at
    FROM email_integrations
    ON CONFLICT (provider, name) DO NOTHING;

    -- Drop old table
    DROP TABLE IF EXISTS email_integrations;

  END IF;
END $$;
