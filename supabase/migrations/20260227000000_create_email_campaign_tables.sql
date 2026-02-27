-- Phase 0.1: Create email campaign tables
-- email_jobs: campaign-level tracking (one per send batch)
-- email_sends: per-recipient send records (replaces attendees.email_sent boolean)
-- email_events: open/click/bounce tracking

-- Campaign jobs
CREATE TABLE email_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  segment TEXT NOT NULL CHECK (segment IN ('checked-in', 'no-show', 'waitlist', 'custom')),
  template_id UUID,  -- Will reference email_templates(id) once Phase 1 creates that table
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'partial', 'completed', 'failed', 'cancelled')),
  total_contacts INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  cursor INT DEFAULT 0,
  errors JSONB DEFAULT '[]',
  config JSONB DEFAULT '{}',
  created_by TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_jobs_status ON email_jobs(status);
CREATE INDEX idx_email_jobs_event ON email_jobs(event_id);

-- Per-recipient send records
CREATE TABLE email_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES email_jobs(id) ON DELETE CASCADE,
  attendee_id INTEGER NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  attempts INTEGER DEFAULT 0,
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, attendee_id)
);

CREATE INDEX idx_email_sends_job ON email_sends(job_id);
CREATE INDEX idx_email_sends_attendee ON email_sends(attendee_id);
CREATE INDEX idx_email_sends_status ON email_sends(status);

-- Tracking events (opens, clicks, bounces, complaints)
CREATE TABLE email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  send_id UUID REFERENCES email_sends(id) ON DELETE CASCADE,
  job_id UUID REFERENCES email_jobs(id) ON DELETE CASCADE,
  attendee_id INTEGER REFERENCES attendees(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'click', 'bounce', 'complaint')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_events_send ON email_events(send_id);
CREATE INDEX idx_email_events_job ON email_events(job_id);
CREATE INDEX idx_email_events_attendee ON email_events(attendee_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);

-- Enable RLS on all tables
ALTER TABLE email_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- RLS policies (dashboard access via service key, so permissive)
CREATE POLICY "Allow all on email_jobs" ON email_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on email_sends" ON email_sends FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on email_events" ON email_events FOR ALL USING (true) WITH CHECK (true);
