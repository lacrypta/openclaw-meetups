-- AI Messaging Engine Tables
-- Migration: 20260304000000_create_messaging_tables

-- users table (CRM - extends beyond attendees)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  attendee_id INTEGER REFERENCES attendees(id), -- link to legacy attendees
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);

-- AI providers
CREATE TABLE ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  api_base_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI models
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES ai_providers(id),
  name TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  cost_per_1m_input DECIMAL,
  cost_per_1m_output DECIMAL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Master prompts
CREATE TABLE master_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  model_provider TEXT DEFAULT 'anthropic',
  model_name TEXT DEFAULT 'claude-sonnet-4-5',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messaging sessions
CREATE TABLE messaging_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  event_id UUID REFERENCES events(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  model_provider TEXT DEFAULT 'anthropic',
  model_name TEXT DEFAULT 'claude-sonnet-4-5',
  master_prompt_id UUID REFERENCES master_prompts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);
CREATE INDEX idx_sessions_user ON messaging_sessions(user_id);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES messaging_sessions(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_used TEXT,
  provider TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  wasender_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_messages_session ON messages(session_id, created_at);

-- Seed default providers
INSERT INTO ai_providers (name, api_base_url) VALUES
  ('anthropic', 'https://api.anthropic.com/v1'),
  ('openai', 'https://api.openai.com/v1'),
  ('google', 'https://generativelanguage.googleapis.com/v1beta');

-- Seed default models
INSERT INTO ai_models (provider_id, name, display_name, cost_per_1m_input, cost_per_1m_output) VALUES
  ((SELECT id FROM ai_providers WHERE name = 'anthropic'), 'claude-sonnet-4-5', 'Claude Sonnet 4.5', 3.00, 15.00),
  ((SELECT id FROM ai_providers WHERE name = 'anthropic'), 'claude-opus-4-5', 'Claude Opus 4.5', 15.00, 75.00);

-- Seed default master prompt for RSVP
-- Note: [CONFIRMED] / [DECLINED] keywords are used by the server to detect intent
INSERT INTO master_prompts (name, content, is_default) VALUES (
  'RSVP Confirmation',
  'Sos el asistente del OpenClaw Meetup de La Crypta. Tu objetivo es confirmar la asistencia del usuario al evento.

Reglas:
- Sé amigable, corto y directo
- Hablá en español argentino casual
- Si el usuario confirma (sí, dale, voy, confirmo, etc.) → comenzar TU respuesta con [CONFIRMED] y luego decirle que está confirmado y que le va a llegar un email de confirmación
- Si el usuario dice que no puede → comenzar TU respuesta con [DECLINED] y luego responder amablemente y preguntar si quiere que le avisen del próximo
- Si el usuario hace preguntas sobre el evento → responder con la info disponible
- No inventar información que no tengas
- Mantener las respuestas cortas (máximo 2-3 oraciones después del tag)
- NUNCA revelar que sos una AI o un bot. Sos Claudio, el asistente del meetup.
- Los tags [CONFIRMED] y [DECLINED] son invisibles para el usuario — se eliminan antes de enviar

Info del evento:
- Nombre: OpenClaw Meetup
- Lugar: La Crypta, Belgrano, Buenos Aires
- Horario: 19:00hs',
  true
);
