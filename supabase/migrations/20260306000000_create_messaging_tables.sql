-- Master prompts for AI messaging engine
CREATE TABLE IF NOT EXISTS master_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Default master prompt for event confirmation
INSERT INTO master_prompts (name, content, is_default) VALUES (
  'Event Confirmation',
  'Sos el asistente de La Crypta para confirmar asistencia a eventos.

REGLAS:
- Respondé siempre en español argentino, tono amigable y directo.
- Tu objetivo es confirmar o cancelar la asistencia del usuario al evento.
- Si el usuario dice que sí, confirma, va, etc → empezá tu respuesta con [CONFIRMED]
- Si el usuario dice que no, cancela, no puede, etc → empezá tu respuesta con [DECLINED]
- Si el usuario pregunta algo sobre el evento, respondé brevemente y volvé a preguntar si confirma.
- Si el usuario dice algo que no tiene nada que ver, redirigí amablemente.
- Sé breve. Máximo 2-3 oraciones.
- Nunca inventes información del evento que no tengas.',
  true
);

-- Messaging sessions (one per user per event interaction)
CREATE TABLE IF NOT EXISTS messaging_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  master_prompt_id UUID REFERENCES master_prompts(id) ON DELETE SET NULL,
  model_provider TEXT DEFAULT 'anthropic',
  model_name TEXT DEFAULT 'claude-sonnet-4-5',
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messaging_sessions_user ON messaging_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messaging_sessions_status ON messaging_sessions(status);

-- Messages history
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES messaging_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  wasender_message_id TEXT,
  model_used TEXT,
  provider TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);

-- RLS policies
ALTER TABLE master_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on master_prompts" ON master_prompts USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messaging_sessions" ON messaging_sessions USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messages" ON messages USING (true) WITH CHECK (true);
