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

# Configure SMTP credentials
cp .env.example .env
nano .env  # Edit with your actual SMTP credentials

# Or export environment variables manually:
export SMTP_HOST="smtp.example.com"
export SMTP_PORT="587"
export SMTP_SECURE="false"
export SMTP_USER="your-username"
export SMTP_PASS="your-password"
export EMAIL_FROM="noreply@example.com"
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

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | smtp.gmail.com |
| `SMTP_PORT` | SMTP port (587 or 465) | 587 |
| `SMTP_SECURE` | Use TLS (false for 587, true for 465) | false |
| `SMTP_USER` | SMTP username | user@example.com |
| `SMTP_PASS` | SMTP password | your-password |
| `EMAIL_FROM` | From email address | noreply@example.com |
| `SUPABASE_URL` | Supabase project URL | https://xxx.supabase.co |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | eyJhbGci... |

## Tracking

Columnas Supabase actualizadas por cada envío:
- `email_sent` → `true`
- `email_sent_at` → timestamp ISO
- `email_type` → `'checked-in'` | `'no-show'` | `'waitlist'`
