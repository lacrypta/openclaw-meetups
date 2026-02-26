# Email Campaigns — Documentación Técnica

**Proyecto:** OpenClaw Meetups
**Versión:** 1.0
**Fecha:** 2026-02-26
**Autor:** Claudio

---

## Índice

1. [Arquitectura del Sistema](#1-arquitectura-del-sistema)
2. [Motor de Envío Optimizado](#2-motor-de-envío-optimizado)
3. [Resiliencia y Background Processing](#3-resiliencia-y-background-processing)
4. [Email Tracking (Opens & Clicks)](#4-email-tracking-opens--clicks)
5. [Integración con el Dashboard](#5-integración-con-el-dashboard)

---

## 1. Arquitectura del Sistema

### 1.1 Overview

El sistema de email campaigns permite enviar emails segmentados a los asistentes de un evento desde el dashboard de OpenClaw Meetups. Los emails se procesan en background con connection pooling, concurrencia configurable, y retry automático.

### 1.2 Stack

| Componente | Tecnología | Rol |
|-----------|-----------|-----|
| Frontend | Next.js 15 + React 19 + shadcn/ui | Dashboard UI, progreso real-time |
| API | Next.js API Routes | CRUD campaigns, trigger envíos |
| Background Worker | Supabase Edge Functions (Deno) | Procesamiento de emails |
| Scheduler | Supabase Cron (pg_cron) | Auto-continuación, resiliencia |
| Database | Supabase (PostgreSQL) | Jobs, templates, tracking, contactos |
| SMTP | ImprovMX (openclaw@lacrypta.ar) | Delivery de emails |

### 1.3 Modelo de Datos

#### Tablas existentes

```sql
-- Contactos globales
attendees (
  id SERIAL PRIMARY KEY,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  status TEXT,          -- 'approved' | 'waitlist' | 'declined'
  checked_in BOOLEAN,
  email_sent BOOLEAN,
  email_sent_at TIMESTAMPTZ,
  email_type TEXT,      -- 'checked-in' | 'no-show' | 'waitlist'
  registered_at TIMESTAMPTZ
)

-- Eventos
events (
  id UUID PRIMARY KEY,
  name TEXT,
  date TIMESTAMPTZ,
  location TEXT,
  status TEXT,          -- 'draft' | 'published' | 'completed'
  capacity INT
)

-- Relación N:N
event_attendees (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  attendee_id INT REFERENCES attendees(id),
  status TEXT,
  checked_in BOOLEAN,
  registered_at TIMESTAMPTZ
)

-- Config SMTP
email_integrations (
  id UUID PRIMARY KEY,
  name TEXT,            -- 'ImprovMX'
  type TEXT,            -- 'smtp'
  config TEXT,          -- JSON: {host, port, secure, username, password, from_email}
  is_default BOOLEAN
)
```

#### Tablas nuevas

```sql
-- Campaign jobs (tracking de envíos)
CREATE TABLE email_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  segment TEXT NOT NULL CHECK (segment IN ('checked-in', 'no-show', 'waitlist', 'custom')),
  template_id UUID REFERENCES email_templates(id),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'partial', 'completed', 'failed', 'cancelled')),
  total_contacts INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  cursor INT DEFAULT 0,              -- último attendee_id procesado (para auto-continuación)
  errors JSONB DEFAULT '[]',         -- [{email, error, attempts, timestamp}]
  config JSONB DEFAULT '{}',         -- {concurrency, max_retries, rate_limit}
  created_by TEXT,                   -- pubkey del admin
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ,        -- para detectar procesos muertos
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates reutilizables
CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,          -- 'checked-in', 'no-show', 'waitlist'
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',      -- ['first_name', 'name', 'email']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking de opens y clicks
CREATE TABLE email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES email_jobs(id),
  attendee_id INT REFERENCES attendees(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'open', 'click', 'bounce', 'complaint')),
  metadata JSONB DEFAULT '{}',       -- {link_url, user_agent, ip, ...}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_email_jobs_status ON email_jobs(status);
CREATE INDEX idx_email_jobs_event ON email_jobs(event_id);
CREATE INDEX idx_email_events_job ON email_events(job_id);
CREATE INDEX idx_email_events_attendee ON email_events(attendee_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);
```

### 1.4 Diagrama de Flujo

```
┌──────────────┐     POST /api/campaigns      ┌────────────────┐
│   Dashboard  │ ───────────────────────────── │  Next.js API   │
│   (React)    │                               │  Route         │
└──────┬───────┘                               └───────┬────────┘
       │                                               │
       │ polling GET /api/campaigns/[id]               │ 1. Crear job en DB (status: pending)
       │ every 2s                                      │ 2. Invocar Edge Function (async)
       │                                               │
       │                                        ┌──────▼────────┐
       │                                        │  Supabase     │
       │                                        │  Edge Function│
       │                                        │  send-campaign│
       │                                        └──────┬────────┘
       │                                               │
       │                                               │ 3. Load SMTP config
       │                                               │ 4. Load contacts (filtered)
       │                                               │ 5. Process in batches
       │                                               │    - Connection pool
       │                                               │    - Concurrency: 3
       │                                               │    - Retry: 3x backoff
       │                                               │ 6. Update DB per email
       │                                               │ 7. Update job heartbeat
       │                                               │
       │         ┌─────────────────┐                   │
       └──────── │   PostgreSQL    │ ◄─────────────────┘
                 │   (Supabase)    │
                 │                 │ ◄──── pg_cron (cada 1 min)
                 │  email_jobs     │       - Detectar jobs muertos
                 │  attendees      │       - Auto-continuar parciales
                 │  email_events   │       - Relanzar fallidos
                 └─────────────────┘
```

---

## 2. Motor de Envío Optimizado

### 2.1 Connection Pooling

En lugar de abrir una conexión SMTP nueva por cada email (overhead de ~3-5s por handshake TLS), reutilizamos conexiones:

```typescript
const transporter = nodemailer.createTransport({
  host: smtpIp,
  port: 587,
  secure: false,        // STARTTLS para puerto 587
  auth: { user, pass },
  tls: { servername },  // SNI con hostname original
  pool: true,           // HABILITAR connection pooling
  maxConnections: 3,    // Match concurrency
  maxMessages: 100,     // Reconectar cada 100 msgs
  rateDelta: 1000,      // Ventana de 1 segundo
  rateLimit: 5,         // Máximo 5 msg/seg
});
```

**Impacto medido:**
- Sin pooling: ~14s/email (57 emails en 13 min)
- Con pooling: ~7.5s/email (86 emails en 9.3 min) → **1.9x más rápido**

### 2.2 Concurrencia

Procesamos N emails en paralelo por batch:

```typescript
async function processInBatches(contacts, concurrency = 3) {
  for (let i = 0; i < contacts.length; i += concurrency) {
    const batch = contacts.slice(i, i + concurrency);
    
    await Promise.all(
      batch.map(contact => sendEmail(contact))
    );
    
    // Pausa entre batches (1s) para no saturar SMTP
    await sleep(1000);
  }
}
```

**Configuración recomendada por provider:**

| Provider | Max Concurrency | Rate Limit | Notas |
|----------|----------------|-----------|-------|
| ImprovMX | 3 | 5/seg | Connection drops frecuentes |
| Gmail SMTP | 5 | 20/seg | Límite diario: 500 emails |
| SendGrid | 10 | 100/seg | Requiere API key |
| AWS SES | 10 | 14/seg (default) | Requiere verificación dominio |

### 2.3 Retry con Exponential Backoff

Reintentos automáticos con backoff para errores transitorios:

```typescript
async function sendWithRetry(mailOptions, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      return { success: true, attempts: attempt };
    } catch (err) {
      if (attempt === maxRetries) {
        return { success: false, error: err.message, attempts: attempt };
      }
      // Backoff: 1s, 2s, 4s (max 8s)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      await sleep(delay);
    }
  }
}
```

**Resultados reales:**

| Sin retry | Con retry (3x) |
|-----------|---------------|
| 3 fallos permanentes (1.7%) | 0 fallos en waitlist, 1 en no-show (0.6%) |

### 2.4 Resolución IPv4 Forzada

ImprovMX resuelve a IPv6, pero el host no tiene conectividad IPv6. Forzamos IPv4:

```typescript
const dns = await import('node:dns');
const { address } = await dns.promises.lookup(smtpHost, { family: 4 });
// Usar IP directa en el transporter
// + tls.servername para SNI con hostname original
```

### 2.5 Detección Automática de STARTTLS

```typescript
// Puerto 587 = STARTTLS (secure: false, upgrade después del EHLO)
// Puerto 465 = Implicit TLS (secure: true desde el inicio)
const secure = (port === 465);
```

### 2.6 Template Variables

El motor reemplaza variables en los templates HTML:

| Variable | Valor | Encoding |
|----------|-------|----------|
| `{{first_name}}` | Nombre de pila | Plain text |
| `{{name}}` | Nombre completo | URL-encoded (para query params) |
| `{{email}}` | Email del contacto | URL-encoded (para query params) |

Ejemplo de URL generada:
```
https://tally.so/r/J964LY?name=Rodrigo%20Fernandez&email=agustin%40coinmelon.com
```

---

## 3. Resiliencia y Background Processing

### 3.1 El Problema

Supabase Edge Functions tienen timeout de 150s (free) / 400s (pro). Para 86+ emails a ~7.5s/email, necesitamos ~10 minutos. Esto excede cualquier timeout.

### 3.2 Solución: Chunked Processing + Auto-Continuación

```
┌─────────────┐
│  email_job   │
│ status:      │
│  pending ────┼──→ Edge Function invocada
│  running ────┼──→ Procesando emails, heartbeat cada 10s
│  partial ────┼──→ Chunk completado, quedan emails pendientes
│  completed ──┼──→ Todos enviados
│  failed ─────┼──→ Error irrecuperable
│  cancelled ──┼──→ Cancelado por admin
└─────────────┘
```

**Cada invocación de la Edge Function:**
1. Lee el job de la DB
2. Toma un chunk de N emails (empezando desde `cursor`)
3. Procesa el chunk con pooling + retry
4. Actualiza `cursor`, `sent_count`, `heartbeat` en DB
5. Si quedan emails → marca `partial` → termina
6. Si no quedan → marca `completed`

**pg_cron (cada 1 minuto):**

```sql
-- Detectar jobs muertos (running sin heartbeat hace >3 min)
UPDATE email_jobs
SET status = 'partial'
WHERE status = 'running'
  AND last_heartbeat < NOW() - INTERVAL '3 minutes';

-- Auto-continuar jobs parciales
SELECT net.http_post(
  'https://gpfoxevxvhltjzppeacr.supabase.co/functions/v1/send-campaign',
  jsonb_build_object('job_id', id)
)
FROM email_jobs
WHERE status = 'partial';
```

### 3.3 Chunk Size

| Edge Function Timeout | Avg Email Time | Safe Chunk Size |
|----------------------|----------------|-----------------|
| 150s (free) | 7.5s | 15 emails (112s) |
| 400s (pro) | 7.5s | 40 emails (300s) |

Con concurrency 3, el throughput real es:
- Chunk de 15: ~40s (3 emails en paralelo × 5 batches)
- Chunk de 40: ~100s (3 emails en paralelo × 14 batches)

### 3.4 Idempotencia

Nunca se envía un email dos veces gracias a:
1. `email_sent = true` en `attendees` después de cada envío exitoso
2. Query siempre filtra `.eq('email_sent', false)`
3. El `cursor` en `email_jobs` trackea hasta dónde se llegó
4. Si la función muere mid-batch, solo se reprocesa el batch actual (los ya enviados están marcados en DB)

### 3.5 Cancelación

El admin puede cancelar un job en curso:

```typescript
// POST /api/campaigns/[id]/cancel
await supabase.from('email_jobs').update({ status: 'cancelled' }).eq('id', jobId);

// La Edge Function chequea status antes de cada batch:
const { data: job } = await supabase.from('email_jobs').select('status').eq('id', jobId).single();
if (job.status === 'cancelled') return; // Abort
```

---

## 4. Email Tracking (Opens & Clicks)

### 4.1 Open Tracking

Insertar un pixel transparente de 1x1 en cada email:

```html
<img src="https://meetups.openclaw.com/api/track/open?jid={{job_id}}&aid={{attendee_id}}" 
     width="1" height="1" style="display:none" alt="" />
```

**API Route:**

```typescript
// GET /api/track/open?jid=...&aid=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jid');
  const attendeeId = searchParams.get('aid');
  
  // Log event (fire and forget)
  supabase.from('email_events').insert({
    job_id: jobId,
    attendee_id: attendeeId,
    event_type: 'open',
    metadata: {
      user_agent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for'),
      timestamp: new Date().toISOString(),
    }
  });
  
  // Return 1x1 transparent GIF
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  return new Response(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}
```

### 4.2 Click Tracking

Reescribir URLs en el template para pasar por un redirect tracker:

**Original:**
```html
<a href="https://tally.so/r/J964LY?name=...">Dejanos tu feedback</a>
```

**Con tracking:**
```html
<a href="https://meetups.openclaw.com/api/track/click?jid={{job_id}}&aid={{attendee_id}}&url=https%3A%2F%2Ftally.so%2Fr%2FJ964LY%3Fname%3D...">
  Dejanos tu feedback
</a>
```

**API Route:**

```typescript
// GET /api/track/click?jid=...&aid=...&url=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const jobId = searchParams.get('jid');
  const attendeeId = searchParams.get('aid');
  
  // Log click
  supabase.from('email_events').insert({
    job_id: jobId,
    attendee_id: attendeeId,
    event_type: 'click',
    metadata: { link_url: url }
  });
  
  // Redirect to original URL
  return NextResponse.redirect(url);
}
```

### 4.3 Métricas del Dashboard

```sql
-- Open rate por campaign
SELECT 
  j.id,
  j.sent_count,
  COUNT(DISTINCT e.attendee_id) FILTER (WHERE e.event_type = 'open') AS unique_opens,
  COUNT(DISTINCT e.attendee_id) FILTER (WHERE e.event_type = 'click') AS unique_clicks,
  ROUND(COUNT(DISTINCT e.attendee_id) FILTER (WHERE e.event_type = 'open')::numeric / j.sent_count * 100, 1) AS open_rate,
  ROUND(COUNT(DISTINCT e.attendee_id) FILTER (WHERE e.event_type = 'click')::numeric / j.sent_count * 100, 1) AS click_rate
FROM email_jobs j
LEFT JOIN email_events e ON e.job_id = j.id
GROUP BY j.id;
```

### 4.4 Limitaciones

- **Email clients que bloquean imágenes:** Apple Mail, Outlook (con config). Open tracking no será 100% preciso.
- **Privacy proxies:** Apple Mail Privacy Protection pre-carga imágenes → inflados de opens.
- **Solución:** Usar clicks como métrica principal de engagement (más confiable que opens).

---

## 5. Integración con el Dashboard

### 5.1 API Routes

```
POST   /api/campaigns              Crear nueva campaign
GET    /api/campaigns              Listar campaigns (con filtros)
GET    /api/campaigns/[id]         Status y progreso de una campaign
POST   /api/campaigns/[id]/cancel  Cancelar campaign en curso
POST   /api/campaigns/[id]/retry   Reintentar emails fallidos
GET    /api/campaigns/[id]/stats   Métricas (opens, clicks, bounces)
GET    /api/track/open             Pixel tracking de apertura
GET    /api/track/click            Click tracking con redirect
```

### 5.2 Request/Response Examples

**Crear campaign:**

```typescript
// POST /api/campaigns
{
  "event_id": "72b900d1-ce3b-45d7-90b1-d6117584864a",
  "segment": "checked-in",
  "template_id": "...",
  "subject": "¡Gracias por venir al OpenClaw Meetup! 🚀",
  "config": {
    "concurrency": 3,
    "max_retries": 3,
    "chunk_size": 30
  }
}

// Response
{
  "job": {
    "id": "abc123",
    "status": "pending",
    "total_contacts": 62,
    "sent_count": 0,
    "created_at": "2026-02-26T..."
  }
}
```

**Polling status:**

```typescript
// GET /api/campaigns/abc123
{
  "job": {
    "id": "abc123",
    "status": "running",
    "total_contacts": 62,
    "sent_count": 34,
    "failed_count": 1,
    "cursor": 35,
    "errors": [
      { "email": "bad@example.com", "error": "Connection closed", "attempts": 3 }
    ],
    "started_at": "2026-02-26T16:00:00Z",
    "last_heartbeat": "2026-02-26T16:02:15Z",
    "eta_seconds": 180
  }
}
```

### 5.3 UI Components

**Tab "Email Campaign" en Event Detail:**

```
┌─────────────────────────────────────────────┐
│  📧 Email Campaign                          │
│                                             │
│  Segment: [Checked-in ▾] [No-show] [Wait]  │
│  Template: [checked-in.html ▾]              │
│  Subject: ¡Gracias por venir...             │
│                                             │
│  Contacts: 62 (unsent)                      │
│  [Preview Email]  [▶ Send Campaign]         │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ████████████████░░░░░  34/62 (55%) │    │
│  │ Sending to: user@example.com        │    │
│  │ Speed: 9.1 emails/min              │    │
│  │ ETA: ~3 min                         │    │
│  │ Failed: 1  [Cancel]                │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  History                                    │
│  ┌──────────┬────────┬──────┬──────┬─────┐  │
│  │ Date     │ Segment│ Sent │ Open │Click│  │
│  ├──────────┼────────┼──────┼──────┼─────┤  │
│  │ Feb 26   │check-in│ 60/62│ 45%  │ 22% │  │
│  │ Feb 26   │waitlist│ 33/33│ 38%  │ 15% │  │
│  │ Feb 26   │no-show │ 85/86│ 31%  │ 12% │  │
│  └──────────┴────────┴──────┴──────┴─────┘  │
└─────────────────────────────────────────────┘
```

### 5.4 Implementación Estimada

| Tarea | Horas | Prioridad |
|-------|-------|-----------|
| DB migrations (email_jobs, email_templates, email_events) | 2h | P1 |
| Migrar settings → email_integrations | 2h | P1 |
| API routes (campaigns CRUD + status + cancel + retry) | 3h | P1 |
| Supabase Edge Function (send-campaign chunked) | 4h | P1 |
| pg_cron auto-continuación | 1h | P1 |
| Tracking API routes (open pixel + click redirect) | 2h | P1 |
| UI: Campaign tab + segment selector | 3h | P2 |
| UI: Progress bar real-time | 2h | P2 |
| UI: Campaign history + stats | 2h | P2 |
| UI: Template preview | 2h | P3 |
| UI: Template editor (WYSIWYG) | 4h | P3 |
| Tests + QA | 3h | P2 |
| **TOTAL** | **30h** | |

---

## Apéndice: Métricas del Envío Real (2026-02-26)

### Configuración
- **SMTP:** ImprovMX (smtp.improvmx.com:587, STARTTLS)
- **From:** openclaw@lacrypta.ar
- **Motor:** Node.js + nodemailer con pooling

### Resultados

| Segmento | Emails | Enviados | Fallidos | Tiempo | Throughput | Avg/email |
|----------|--------|----------|----------|--------|-----------|-----------|
| checked-in | 62 | 60 | 2 | 13 min | 4.4/min* | 14s* |
| waitlist | 33 | 33 | 0 | 4.5 min | 7.3/min | 10.8s |
| no-show | 86 | 85 | 1 | 9.3 min | 9.1/min | 7.5s |
| **TOTAL** | **181** | **178** | **3** | **26.8 min** | **6.6/min** | — |

*\* checked-in fue el primer batch, sin optimizaciones completas*

### Fallos (3 totales)

| Email | Segmento | Error | Intentos |
|-------|----------|-------|----------|
| saludiego201@outlook.com | checked-in | Connection closed unexpectedly | 1 (sin retry) |
| kathonejo@gmail.com | checked-in | Connection closed unexpectedly | 1 (sin retry) |
| n.carballal@gmail.com | no-show | Connection closed unexpectedly | 3 (con retry) |

**Diagnóstico:** ImprovMX cierra conexiones intermitentemente. No correlaciona con dominio del destinatario (outlook, gmail). Posible rate limiting server-side o timeout de conexión idle.

**Mitigación aplicada:** Retry automático (3x con backoff). Redujo fallos permanentes de ~3.5% a ~0.6%.
