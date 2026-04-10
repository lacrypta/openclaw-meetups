-- ============================================================
-- BASELINE MIGRATION
-- Consolidated from 26 incremental migrations.
-- Represents the full schema as of 2026-04-06.
-- ============================================================

-- ============================================================
-- 1. TABLES (ordered by FK dependencies)
-- ============================================================

-- 1.1 events
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  capacity INTEGER,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  image_url TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  luma_event_id TEXT,
  requires_confirmation BOOLEAN DEFAULT false,
  luma_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events (date DESC);

-- 1.2 users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  luma_id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  pubkey TEXT,
  role TEXT NOT NULL DEFAULT 'guest'
    CHECK (role IN ('guest', 'manager', 'admin')),
  subscribed BOOLEAN NOT NULL DEFAULT true,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  unsubscribed_at TIMESTAMPTZ,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Speaker fields
  is_speaker BOOLEAN DEFAULT false,
  speaker_bio TEXT,
  speaker_tagline TEXT,
  speaker_photo TEXT,
  speaker_twitter TEXT,
  speaker_github TEXT,
  speaker_website TEXT,
  speaker_company TEXT,
  CONSTRAINT attendees_luma_id_key UNIQUE (luma_id),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_pubkey_key UNIQUE (pubkey)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_luma_id ON users (luma_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_pubkey ON users (pubkey);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unsubscribe_token ON users (unsubscribe_token);

-- 1.3 kv_store
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.4 email_layouts
CREATE TABLE IF NOT EXISTS email_layouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_layouts_default ON email_layouts (is_default) WHERE (is_default = true);

-- 1.5 contact_lists
CREATE TABLE IF NOT EXISTS contact_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'manual'
    CHECK (type IN ('manual', 'auto', 'event')),
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.6 wa_campaigns
CREATE TABLE IF NOT EXISTS wa_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'sending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.7 master_prompts
CREATE TABLE IF NOT EXISTS master_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.8 integrations
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT integrations_provider_name_key UNIQUE (provider, name)
);

CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations (provider);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations (provider) WHERE (is_active = true);

-- 1.9 email_templates (refs: email_layouts)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  segment TEXT NOT NULL
    CHECK (segment IN ('checked-in', 'no-show', 'waitlist', 'custom', 'confirmation')),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  layout_id UUID REFERENCES email_layouts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_segment ON email_templates (segment);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates (is_active) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_email_templates_layout ON email_templates (layout_id);

-- 1.10 email_jobs (refs: events, email_templates)
CREATE TABLE IF NOT EXISTS email_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  segment TEXT DEFAULT 'custom',
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'partial', 'completed', 'failed', 'cancelled')),
  total_contacts INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  cursor INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  created_by TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_jobs_event ON email_jobs (event_id);
CREATE INDEX IF NOT EXISTS idx_email_jobs_status ON email_jobs (status);

-- 1.11 email_sends (refs: email_jobs, users)
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES email_jobs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  attempts INTEGER DEFAULT 0,
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT email_sends_job_id_user_id_key UNIQUE (job_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_email_sends_job ON email_sends (job_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends (status);

-- 1.12 email_events (refs: email_jobs, email_sends, users)
CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  send_id UUID REFERENCES email_sends(id) ON DELETE CASCADE,
  job_id UUID REFERENCES email_jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('open', 'click', 'bounce', 'complaint')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_send ON email_events (send_id);
CREATE INDEX IF NOT EXISTS idx_email_events_job ON email_events (job_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events (event_type);

-- 1.13 email_log (refs: email_jobs, users)
CREATE TABLE IF NOT EXISTS email_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  provider TEXT,
  campaign_id UUID REFERENCES email_jobs(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_campaign_id ON email_log (campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_log_user_id ON email_log (user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_created_at ON email_log (created_at DESC);

-- 1.14 event_attendees (refs: events, users)
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waitlist'
    CHECK (status IN ('approved', 'waitlist', 'declined')),
  checked_in BOOLEAN DEFAULT false,
  registered_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  email_type TEXT,
  attendance_confirmed BOOLEAN DEFAULT false,
  confirmation_token UUID DEFAULT gen_random_uuid(),
  confirmed_at TIMESTAMPTZ,
  whatsapp_sent BOOLEAN DEFAULT false,
  whatsapp_sent_at TIMESTAMPTZ,
  CONSTRAINT event_attendees_event_user_unique UNIQUE (event_id, user_id),
  CONSTRAINT event_attendees_confirmation_token_key UNIQUE (confirmation_token)
);

CREATE INDEX IF NOT EXISTS idx_ea_event ON event_attendees (event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees (user_id);

-- 1.15 contact_list_members (refs: contact_lists, users)
CREATE TABLE IF NOT EXISTS contact_list_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT contact_list_members_list_id_user_id_key UNIQUE (list_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_clm_list ON contact_list_members (list_id);
CREATE INDEX IF NOT EXISTS idx_clm_user ON contact_list_members (user_id);

-- 1.16 messaging_sessions (refs: users, events, master_prompts)
CREATE TABLE IF NOT EXISTS messaging_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'closed')),
  master_prompt_id UUID REFERENCES master_prompts(id) ON DELETE SET NULL,
  model_provider TEXT DEFAULT 'anthropic',
  model_name TEXT DEFAULT 'claude-sonnet-4-5',
  phone TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messaging_sessions_user ON messaging_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_messaging_sessions_status ON messaging_sessions (status);
CREATE INDEX IF NOT EXISTS idx_messaging_sessions_phone ON messaging_sessions (phone);

-- 1.17 messages (refs: messaging_sessions)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES messaging_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL
    CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  wasender_message_id TEXT,
  model_used TEXT,
  provider TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages (session_id);

-- 1.18 wa_campaign_contacts (refs: wa_campaigns)
CREATE TABLE IF NOT EXISTS wa_campaign_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES wa_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  send_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (send_status IN ('pending', 'sending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_campaign_contacts_campaign ON wa_campaign_contacts (campaign_id);

-- 1.19 webhook_logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  request_headers JSONB,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  error_message TEXT,
  processing_time_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider ON webhook_logs (provider);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs (status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs (created_at DESC);

-- 1.20 talks (refs: users)
CREATE TABLE IF NOT EXISTS talks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  format TEXT NOT NULL DEFAULT 'talk'
    CHECK (format IN ('talk', 'workshop', 'lightning', 'panel', 'fireside')),
  tags TEXT[],
  slides_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talks_speaker ON talks (speaker_id);
CREATE INDEX IF NOT EXISTS idx_talks_status ON talks (status);

-- 1.21 event_talks (refs: events, talks)
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

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on tables that had it
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_sessions ENABLE ROW LEVEL SECURITY;

-- Policies: allow all for service role (app uses service key)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all on email_events" ON email_events FOR ALL USING (true);
CREATE POLICY "Allow all on email_jobs" ON email_jobs FOR ALL USING (true);
CREATE POLICY "Allow all on email_layouts" ON email_layouts FOR ALL USING (true);
CREATE POLICY "Allow all on email_sends" ON email_sends FOR ALL USING (true);
CREATE POLICY "Allow all on email_templates" ON email_templates FOR ALL USING (true);
CREATE POLICY "Allow all on master_prompts" ON master_prompts FOR ALL USING (true);
CREATE POLICY "Allow all on messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all on messaging_sessions" ON messaging_sessions FOR ALL USING (true);

-- Integrations has granular policies
CREATE POLICY "integrations_select" ON integrations FOR SELECT USING (true);
CREATE POLICY "integrations_insert" ON integrations FOR INSERT WITH CHECK (true);
CREATE POLICY "integrations_update" ON integrations FOR UPDATE USING (true);
CREATE POLICY "integrations_delete" ON integrations FOR DELETE USING (true);
