-- Generic integrations/config table (key-value, flexible)
-- Stores configuration for external services: Luma, WaSender, Anthropic, etc.
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,              -- 'luma', 'wasender', 'anthropic', 'smtp', 'zoom', 'nostr'
  name TEXT NOT NULL,                  -- Human-readable: 'Luma Production', 'WaSender Main'
  config JSONB NOT NULL DEFAULT '{}',  -- Flexible JSON: api_key, webhook_secret, base_url, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, name)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(provider) WHERE is_active = true;

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'integrations' AND policyname = 'integrations_select') THEN
    CREATE POLICY "integrations_select" ON integrations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'integrations' AND policyname = 'integrations_insert') THEN
    CREATE POLICY "integrations_insert" ON integrations FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'integrations' AND policyname = 'integrations_update') THEN
    CREATE POLICY "integrations_update" ON integrations FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'integrations' AND policyname = 'integrations_delete') THEN
    CREATE POLICY "integrations_delete" ON integrations FOR DELETE USING (true);
  END IF;
END $$;

-- Example configs (commented out, for reference):
--
-- INSERT INTO integrations (provider, name, config) VALUES
-- ('luma', 'Production', '{
--   "api_key": "luma_xxx",
--   "base_url": "https://public-api.luma.com/v1",
--   "webhook_secret": "whsec_xxx"
-- }'),
-- ('wasender', 'Main', '{
--   "api_key": "ws_xxx",
--   "webhook_secret": "whsec_xxx",
--   "phone_number": "+5491176441220"
-- }'),
-- ('anthropic', 'Default', '{
--   "api_key": "sk-ant-xxx",
--   "model": "claude-sonnet-4-5",
--   "max_tokens": 1024
-- }'),
-- ('smtp', 'Gmail', '{
--   "host": "smtp.gmail.com",
--   "port": 587,
--   "user": "xxx@gmail.com",
--   "pass": "xxx"
-- }');

COMMENT ON TABLE integrations IS 'Generic config store for external service integrations. JSONB config allows flexible schema per provider.';
COMMENT ON COLUMN integrations.config IS 'Provider-specific config as JSON. Contains API keys, secrets, URLs, and any provider-specific settings.';
