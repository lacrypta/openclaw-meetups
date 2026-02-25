# OpenClaw Meetup Email Campaign

Sistema de follow-up emails personalizados para asistentes del meetup.

## Templates

- **checked-in.html** — Para los 61 que vinieron (agradecimiento + feedback form)
- **no-show.html** — Para los 86 que se registraron pero no vinieron (resumen + próximos pasos)
- **waitlist.html** — Para los 33 que quedaron en lista de espera (prioridad próximo meetup)

## Setup

```bash
cd /home/agustin/clawd/projects/openclaw-meetups/email-templates

# Install dependencies (if not already)
npm install nodemailer @supabase/supabase-js

# Load env vars
source /home/agustin/clawd/.env.email
export SUPABASE_URL="https://gpfoxevxvhltjzppeacr.supabase.co"
export SUPABASE_SERVICE_KEY="<service_key>"
```

## Test (Dry Run)

Preview sin enviar:

```bash
node send-emails.js checked-in --dry-run --limit 5
node send-emails.js no-show --dry-run --limit 5
node send-emails.js waitlist --dry-run --limit 5
```

## Test Real (1 email)

```bash
# Enviar 1 email real para verificar formato
node send-emails.js checked-in --limit 1
```

## Envío Masivo

```bash
# Checked-in (61 contacts)
node send-emails.js checked-in

# No-show (86 contacts)
node send-emails.js no-show

# Waitlist (33 contacts)
node send-emails.js waitlist
```

## Safety

- Solo envía a contactos con `email_sent = null`
- Marca `email_sent = true` después de enviar
- Rate limit: 2 segundos entre emails
- `--dry-run` no modifica Supabase ni envía emails

## Variables

| Variable | Valor |
|----------|-------|
| `GMAIL_USER` | claudiomoltbot@gmail.com |
| `GMAIL_APP_PASSWORD` | (en .env.email) |
| `SUPABASE_URL` | https://gpfoxevxvhltjzppeacr.supabase.co |
| `SUPABASE_SERVICE_KEY` | (service role key) |

## Tracking

Columnas Supabase actualizadas por cada envío:
- `email_sent` → `true`
- `email_sent_at` → timestamp ISO
- `email_type` → `'checked-in'` | `'no-show'` | `'waitlist'`
