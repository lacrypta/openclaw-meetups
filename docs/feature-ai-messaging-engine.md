# Feature: AI Messaging Engine — Motor de Conversación Inteligente
> Fecha: 2026-03-04

## Resumen
Motor de mensajería inteligente que procesa, interpreta y responde mensajes de WhatsApp usando modelos de AI (multi-provider). WaSenderAPI solo transporta mensajes — toda la inteligencia vive en nuestro servicio.

## Arquitectura

```
[Usuario WhatsApp]
       ↕ (mensajes)
[WaSenderAPI] — solo transporte
       ↕ (webhooks / API calls)
[OpenClaw Meetups API]
       ↓
  ┌─────────────────────────┐
  │  Message Router          │
  │  - Identifica usuario    │
  │  - Busca/crea sesión     │
  │  - Guarda mensaje        │
  └──────────┬──────────────┘
             ↓
  ┌─────────────────────────┐
  │  AI Engine               │
  │  - Carga master prompt   │
  │  - Carga historial       │
  │  - Envía al modelo       │
  │  - Recibe respuesta      │
  └──────────┬──────────────┘
             ↓
  ┌─────────────────────────┐
  │  Response Handler        │
  │  - Guarda respuesta      │
  │  - Envía vía WaSenderAPI │
  │  - Ejecuta acciones      │
  └─────────────────────────┘
```

## Flujo Detallado

### 1. Recepción de Mensaje
- WaSenderAPI recibe mensaje del usuario
- Dispara webhook → `POST /api/webhooks/wasender`
- Payload: número de teléfono + texto del mensaje

### 2. Routing
- Identificar usuario por número de teléfono → tabla `users`
- Buscar sesión activa → tabla `messaging_sessions`
- Si no hay sesión → crear una nueva
- Las sesiones son **aisladas** — nunca se pisan entre sí

### 3. Guardar Mensaje Entrante
- Insertar en tabla `messages` con:
  - `session_id` → FK a la sesión
  - `role: "user"`
  - `content` → texto del mensaje
  - `timestamp`

### 4. Procesamiento AI
- Cargar **master prompt** (system prompt configurable)
- Cargar **historial completo** de la sesión (todos los mensajes)
- Construir payload para el modelo:
  ```json
  {
    "model": "claude-sonnet-4-5",
    "system": "<master_prompt>",
    "messages": [
      {"role": "user", "content": "msg 1"},
      {"role": "assistant", "content": "respuesta 1"},
      {"role": "user", "content": "msg actual"}
    ]
  }
  ```
- Enviar al provider configurado (Anthropic, OpenAI, Google)
- Recibir respuesta

### 5. Guardar Respuesta
- Insertar en tabla `messages` con:
  - `session_id`
  - `role: "assistant"`
  - `content` → respuesta del modelo
  - `model_used` → qué modelo generó la respuesta
  - `provider` → anthropic/openai/google
  - `tokens_in`, `tokens_out` → tracking de uso

### 6. Enviar Respuesta
- `POST` a WaSenderAPI con el texto de respuesta
- Al número de teléfono del usuario

## Modelo de Datos

### Tabla: `messaging_sessions`
```sql
CREATE TABLE messaging_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  event_id TEXT,                          -- opcional, asociar a evento específico
  status TEXT DEFAULT 'active',           -- active, closed, archived
  model_provider TEXT DEFAULT 'anthropic', -- anthropic, openai, google
  model_name TEXT DEFAULT 'claude-sonnet-4-5',
  master_prompt_id UUID REFERENCES master_prompts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);
```

### Tabla: `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES messaging_sessions(id) NOT NULL,
  role TEXT NOT NULL,                     -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  model_used TEXT,                        -- solo para role='assistant'
  provider TEXT,                          -- solo para role='assistant'
  tokens_in INTEGER,
  tokens_out INTEGER,
  wasender_message_id TEXT,              -- ID del mensaje en WaSenderAPI
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_session ON messages(session_id, created_at);
```

### Tabla: `master_prompts`
```sql
CREATE TABLE master_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                     -- ej: "RSVP Confirmation", "General Assistant"
  content TEXT NOT NULL,                  -- el system prompt completo
  is_default BOOLEAN DEFAULT false,
  model_provider TEXT DEFAULT 'anthropic',
  model_name TEXT DEFAULT 'claude-sonnet-4-5',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla: `ai_providers`
```sql
CREATE TABLE ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,              -- 'anthropic', 'openai', 'google'
  api_base_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla: `ai_models`
```sql
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES ai_providers(id),
  name TEXT NOT NULL,                     -- 'claude-sonnet-4-5', 'claude-opus-4-5', 'gpt-4o'
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  cost_per_1m_input DECIMAL,
  cost_per_1m_output DECIMAL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Multi-Provider AI

### Providers soportados (fase 1: Anthropic)
| Provider | Modelos | API |
|----------|---------|-----|
| **Anthropic** | claude-opus-4-5, claude-sonnet-4-5 | `https://api.anthropic.com/v1/messages` |
| OpenAI (futuro) | gpt-4o, o1 | `https://api.openai.com/v1/chat/completions` |
| Google (futuro) | gemini-2.5-pro | `https://generativelanguage.googleapis.com/v1beta` |

### Configuración por sesión
- Cada sesión puede tener su propio modelo y provider
- El master prompt define el comportamiento del agente
- Se puede cambiar modelo mid-session si es necesario

## Master Prompt (System Prompt)

### Ejemplo para RSVP:
```
Sos el asistente del OpenClaw Meetup de La Crypta. Tu objetivo es confirmar la asistencia del usuario al evento.

Reglas:
- Sé amigable, corto y directo
- Hablá en español argentino casual
- Si el usuario confirma (sí, dale, voy, confirmo, etc.) → responder que está confirmado
- Si el usuario dice que no puede → responder amablemente y preguntar si quiere que le avisen del próximo
- Si el usuario hace preguntas sobre el evento → responder con la info disponible
- No inventar información que no tengas
- Mantener las respuestas cortas (máximo 2-3 oraciones)

Info del evento:
- Nombre: {event_name}
- Fecha: {event_date}
- Lugar: La Crypta, Belgrano, Buenos Aires
- Horario: 19:00hs
```

### Gestión desde frontend
- CRUD de master prompts desde el panel de admin
- Asignar master prompt default o por evento
- Preview del prompt antes de asignar

## Aislamiento de Sesiones

**CRÍTICO:** Las sesiones NUNCA se pisan entre sí.
- Cada usuario tiene su propia sesión
- El historial es independiente por sesión
- El contexto del modelo solo incluye mensajes de ESA sesión
- No hay cross-contamination entre conversaciones

## Consideraciones
- Rate limits del provider AI (Anthropic: 4000 req/min en Tier 1)
- Rate limits de WaSenderAPI
- Timeout del modelo → responder al usuario que espere
- Mensajes multimedia (audio, imágenes) → fase 2
- Costo tracking por sesión (tokens in/out)
- Retry si el modelo falla
- Queue para mensajes entrantes si hay pico de tráfico
