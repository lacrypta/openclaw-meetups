# Plan: Email Campaigns integrado en OpenClaw Meetups

**Fecha:** 2026-02-26
**Autor:** Claudio
**Status:** DRAFT — pendiente revisión de Agustin

---

## 📋 Contexto

Hoy enviamos 173/181 emails (3 segmentos: checked-in, no-show, waitlist) usando un script CLI (`send-emails.js`) con optimizaciones de connection pooling, retry, y concurrencia. El objetivo es integrar esto directamente en la plataforma web de OpenClaw Meetups para que se pueda ejecutar desde el dashboard sin usar CLI.

## 🏗️ Análisis del Codebase Actual

### Stack
- **Next.js 15** (App Router) + React 19 + TypeScript
- **Supabase** (PostgreSQL) como DB
- **Nostr** para auth (NIP-07, NIP-46)
- **Vercel** para hosting
- **Tailwind + shadcn/ui** para UI

### Tablas relevantes
| Tabla | Rol |
|-------|-----|
| `attendees` | Contactos globales (name, email, email_sent, email_type) |
| `events` | Eventos (name, date, location, status) |
| `event_attendees` | Relación N:N (event_id, attendee_id, status, checked_in) |
| `email_integrations` | Config SMTP (host, port, user, pass, from — en campo `config` JSON) |

### API Routes existentes
- `GET/PATCH /api/contacts` — CRUD contactos (lee de `attendees`)
- `GET/PATCH /api/smtp-settings` — Config SMTP (⚠️ apunta a `smtp_settings` que NO existe, hay que migrar a `email_integrations`)
- `GET/POST /api/events` — CRUD eventos
- `GET /api/events/[id]/attendees` — Attendees por evento

### UI existente
- `/dashboard/settings` — Form SMTP (apunta a `smtp_settings`, migrar)
- `/dashboard/events/[id]` — Detalle de evento con tabla de attendees (EventDetail + ContactsTable)
- `/dashboard/attendees` — Lista global de contactos

### Limitaciones de Vercel
- **Serverless functions timeout:** 10s (Hobby), 60s (Pro), 300s (Enterprise)
- **No background jobs nativos** — no se puede correr un proceso de 5-10 min desde una API route
- **No WebSockets persistentes** — se cierra con el timeout

---

## 🎯 Propuesta de Implementación

### Opción A: Supabase Edge Functions (RECOMENDADA)

**Por qué:** Las Edge Functions de Supabase corren en Deno, tienen timeout de 150s (free) o 400s (pro), y pueden acceder a la DB directamente. Son ideales para background jobs.

**Arquitectura:**

```
Dashboard UI → API Route (Next.js) → Supabase Edge Function → SMTP
     ↑                                        |
     └──── Polling status via DB ←────────────┘
```

**Flujo:**
1. Admin clickea "Send Emails" en el dashboard
2. Next.js API route crea un registro en tabla `email_jobs` con status `pending`
3. API route invoca Supabase Edge Function (async, no espera respuesta)
4. Edge Function procesa los emails (pooling, retry, concurrency)
5. Edge Function actualiza `email_jobs.status` y `email_jobs.progress` en tiempo real
6. Frontend hace polling cada 2s para mostrar progreso

**Pros:** No depende de Vercel timeout, escalable, acceso directo a DB
**Contras:** Requiere Supabase CLI para deploy, nuevo runtime (Deno)

### Opción B: Vercel Cron + API Route chunked

**Arquitectura:**

```
Dashboard UI → API Route → crea job en DB
Vercel Cron (cada 1 min) → API Route → procesa 10 emails → actualiza DB
```

**Flujo:**
1. Admin crea campaign desde UI → inserta en `email_jobs`
2. Vercel Cron cada 1 min llama a `/api/jobs/process`
3. Cada invocación procesa un chunk de 10 emails (dentro del timeout de 10-60s)
4. Se repite hasta completar

**Pros:** Simple, funciona en Vercel Hobby
**Contras:** Lento (10 emails/min si cron es cada minuto), más complejo de coordinar

### Opción C: Background via Inngest/Trigger.dev

**Arquitectura:**

```
Dashboard UI → API Route → Inngest event → Background worker → SMTP
```

**Pros:** Diseñado para background jobs, retry built-in, observabilidad
**Contras:** Dependencia externa, pricing, setup adicional

### Recomendación: **Opción A (Supabase Edge Functions)**

Ya usamos Supabase. Es la opción más natural, sin agregar dependencias externas.

---

## 📐 Diseño Detallado (Opción A)

### 1. Nueva tabla: `email_jobs`

```sql
CREATE TABLE email_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  segment TEXT NOT NULL CHECK (segment IN ('checked-in', 'no-show', 'waitlist', 'custom')),
  template TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  total_contacts INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  progress JSONB DEFAULT '{}',  -- { current_email, current_batch, errors: [...] }
  created_by TEXT,  -- pubkey del admin
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Nueva tabla: `email_templates`

```sql
CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- 'checked-in', 'no-show', 'waitlist'
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',  -- ['first_name', 'name', 'email']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Supabase Edge Function: `send-campaign`

```typescript
// supabase/functions/send-campaign/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts"

serve(async (req) => {
  const { job_id } = await req.json()
  
  // 1. Load job, template, SMTP config, contacts
  // 2. Create SMTP connection pool
  // 3. Process in batches of 3 (concurrency)
  // 4. Retry failed (3 attempts, exponential backoff)
  // 5. Update job progress in real-time
  // 6. Mark job as completed/failed
  
  return new Response(JSON.stringify({ ok: true }))
})
```

### 4. API Routes (Next.js)

```
POST /api/campaigns              → Crear campaign job
GET  /api/campaigns              → Listar campaigns
GET  /api/campaigns/[id]         → Status + progreso de una campaign
POST /api/campaigns/[id]/cancel  → Cancelar campaign en curso
POST /api/campaigns/[id]/retry   → Reintentar fallidos
```

### 5. UI: Campaign Dashboard

**Ubicación:** `/dashboard/events/[id]` — nuevo tab "Email Campaign"

**Componentes:**

```
EventDetail
├── Tab: Attendees (existente)
├── Tab: Email Campaign (NUEVO)
│   ├── SegmentSelector (checked-in / no-show / waitlist)
│   ├── TemplatePreview (preview del HTML con datos de ejemplo)
│   ├── SendButton (con confirmación)
│   ├── ProgressBar (real-time polling)
│   │   ├── Sent: 45/86
│   │   ├── Failed: 1
│   │   ├── Current: sending to user@example.com
│   │   └── ETA: ~2 min
│   ├── ResultsTable (post-envío)
│   │   ├── ✅ Sent emails
│   │   ├── ❌ Failed emails (con botón retry)
│   │   └── Export CSV
│   └── CampaignHistory (lista de campaigns anteriores)
```

### 6. Migración de Settings

- Migrar `/api/smtp-settings` → usar `email_integrations` (ya existe con data)
- Actualizar `/dashboard/settings` para leer/escribir `email_integrations`
- Eliminar referencia a `smtp_settings`

---

## ⚡ Optimizaciones (ya probadas en CLI)

| Optimización | Implementación | Impacto |
|-------------|---------------|---------|
| Connection pooling | `pool: true` en nodemailer / denomailer | -60% tiempo conexión |
| Concurrency | 3 emails en paralelo por batch | 3x throughput |
| Auto-retry | 3 intentos, backoff exponencial (1s, 2s, 4s) | -95% fallos permanentes |
| IPv4 forced | DNS lookup con `family: 4` | Elimina ENETUNREACH IPv6 |
| STARTTLS auto | `secure = (port === 465)` | Compatible con cualquier SMTP |
| Rate limiting | 5 msg/seg max | Evita bans del SMTP provider |

**Métricas reales (del envío de hoy):**

| Segmento | Emails | Throughput | Fallos |
|----------|--------|-----------|--------|
| checked-in | 57 | ~4.4/min (sin pooling) | 2 (3.5%) |
| waitlist | 33 | 7.3/min (con pooling) | 0 (0%) |
| no-show | 86 | 9.1/min (con pooling) | 1 (1.2%) |

---

## 📅 Estimación de Trabajo

| Tarea | Horas | Prioridad |
|-------|-------|-----------|
| Migrar settings → `email_integrations` | 2h | P1 |
| Crear tabla `email_jobs` + migration | 1h | P1 |
| Crear tabla `email_templates` + seed | 1h | P1 |
| API routes campaigns (CRUD + status) | 3h | P1 |
| Supabase Edge Function `send-campaign` | 4h | P1 |
| UI: Campaign tab en EventDetail | 4h | P2 |
| UI: ProgressBar + real-time polling | 2h | P2 |
| UI: ResultsTable + retry | 2h | P2 |
| UI: Template editor/preview | 3h | P3 |
| Tests + QA | 2h | P2 |
| **TOTAL** | **24h** | |

**Timeline:** 1 semana (4-5h/día)

---

## 🔒 Seguridad

- Templates sanitizados (no ejecutar JS arbitrario)
- SMTP credentials encriptadas en DB (ya están en `email_integrations`)
- Auth requerida para todas las API routes de campaigns
- Rate limiting para prevenir abuso
- Audit log de quién envió qué campaign

---

## 📝 GitHub Issue (draft)

**Title:** feat: Integrate email campaign system into dashboard

**Labels:** `feature`, `email`, `dashboard`

**Body:**

### Descripción
Integrar el sistema de envío de emails (actualmente CLI) directamente en el dashboard web. Permitir a admins enviar campaigns segmentadas (checked-in, no-show, waitlist) desde la UI con progreso en tiempo real.

### Motivación
- Actualmente se ejecuta manualmente via CLI
- No hay visibilidad del progreso ni retry desde la UI
- Los settings de SMTP están desactualizados (apuntan a tabla inexistente)

### Tareas
- [ ] Migrar settings page a usar `email_integrations`
- [ ] Crear tabla `email_jobs` para tracking de campaigns
- [ ] Crear tabla `email_templates` para templates reutilizables
- [ ] Implementar API routes para campaigns
- [ ] Implementar Supabase Edge Function para envío background
- [ ] UI: Tab "Email Campaign" en event detail
- [ ] UI: Barra de progreso real-time
- [ ] UI: Tabla de resultados con retry
- [ ] UI: Preview de template
- [ ] Tests y QA

### Acceptance Criteria
- [ ] Admin puede enviar campaign desde el dashboard
- [ ] Progreso visible en tiempo real
- [ ] Emails fallidos se pueden reintentar
- [ ] Templates personalizables con variables
- [ ] Historial de campaigns enviadas
- [ ] Settings SMTP funcionales desde `email_integrations`

---

## 🤔 Preguntas Abiertas

1. **¿Supabase Pro?** — Edge Functions en free tienen 500K invocaciones/mes y 150s timeout. ¿Es suficiente o necesitamos Pro (400s)?
2. **¿Template editor?** — ¿Queremos un editor WYSIWYG en el dashboard, o está bien editar HTML directo?
3. **¿Scheduled campaigns?** — ¿Queremos poder programar envíos futuros (ej: "enviar el lunes a las 9 AM")?
4. **¿Email tracking?** — ¿Queremos pixel tracking de opens/clicks? (requiere dominio custom para el pixel)

---

*Preparado por Claudio — Pendiente revisión de Agustin*
