-- Webhook logs table — stores all incoming webhook requests for debugging
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_logs' AND table_schema = 'public') THEN
    CREATE TABLE public.webhook_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider TEXT NOT NULL,           -- 'luma', 'wasender', 'stripe', etc.
      event_type TEXT,                  -- 'guest.registered', 'message.received', etc.
      status TEXT NOT NULL DEFAULT 'received', -- received, processing, success, error
      request_headers JSONB,
      request_body JSONB,
      response_status INTEGER,
      response_body JSONB,
      error_message TEXT,
      processing_time_ms INTEGER,
      metadata JSONB,                   -- any extra context (user_id, event_id matched, etc.)
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX idx_webhook_logs_provider ON public.webhook_logs(provider);
    CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(status);
    CREATE INDEX idx_webhook_logs_created ON public.webhook_logs(created_at DESC);
  END IF;
END $$;
