# 🎯 OpenClaw Meetups — Product Vision

> **Luma + Apollo + HubSpot en uno. Open source. Bitcoin-native.**

## Visión
Una plataforma todo-en-uno para organizadores de eventos que combina:

1. **Creación de eventos** (lo que hace Luma) — landing pages, registro, check-in
2. **CRM de asistentes** (lo que hace HubSpot) — gestión de contactos, historial, segmentación
3. **CRM de sponsors** (lo que hace Apollo + HubSpot) — outreach, pipeline, follow-ups
4. **Todo integrado** — un evento conecta sponsors, asistentes, contenido y pagos

**El organizador se concentra en el contenido. La plataforma resuelve todo lo demás.**

Diferenciadores:
- **Open source** — cualquier comunidad puede usarlo
- **Self-hosted** (Supabase) — tus datos son tuyos
- **Bitcoin-native** (pagos en Lightning, sponsorships en sats)
- **AI-powered** (outreach personalizado, análisis de asistentes)
- **Nostr auth** — sin cuentas centralizadas

## Fase 1: Aprender (Marzo 2026)
Usar Apollo.io + HubSpot free como herramientas temporales para:
- [ ] Entender qué funcionalidades realmente usamos
- [ ] Identificar qué flujos son esenciales vs nice-to-have
- [ ] Documentar pain points de las herramientas existentes
- [ ] Cerrar los primeros sponsors con estas herramientas

## Fase 2: Diseñar (Abril 2026)
Basándonos en la experiencia de Fase 1:
- [ ] Definir el modelo de datos del CRM (sponsors, contactos, deals, actividades)
- [ ] Diseñar los flujos de usuario
- [ ] Crear issues en GitHub para cada feature
- [ ] Priorizar features por impacto

## Fase 3: Construir (Mayo-Junio 2026)
Implementar en OpenClaw Meetups (Next.js + Supabase):
- [ ] Módulo de Sponsors
- [ ] Pipeline de deals
- [ ] Email outreach
- [ ] Follow-up automation
- [ ] Contact enrichment
- [ ] Reportes y métricas

---

## Funcionalidades a Replicar

### De Apollo.io
| Feature | Prioridad | Complejidad |
|---------|-----------|-------------|
| **Email Finder** (buscar emails por empresa+cargo) | Alta | Alta (requiere data source) |
| **Secuencias de email** (multi-step automático) | Alta | Media |
| **Chrome extension LinkedIn** | Baja | Alta |
| **Contact enrichment** (enriquecer datos) | Media | Alta |
| **Email tracking** (opens, clicks) | Media | Media |

### De HubSpot
| Feature | Prioridad | Complejidad |
|---------|-----------|-------------|
| **Pipeline visual** (Kanban de deals) | Alta | Baja |
| **Gestión de contactos** (empresas + personas) | Alta | Baja |
| **Historial de actividades** (emails, calls, notas) | Alta | Baja |
| **Multi-user** (Agustin, Cami, Diana, Claudio) | Alta | Media |
| **Meeting scheduler** | Baja | Media |
| **Reportes/dashboard** | Media | Media |
| **Email templates** | Media | Baja |

### De Luma (Event Platform)
| Feature | Prioridad | Complejidad |
|---------|-----------|-------------|
| **Event creation** (título, fecha, imagen, descripción) | Alta | Baja |
| **Landing page automática** (template base customizable) | Alta | Media |
| **Templates de landing** (elegir o crear template custom) | Alta | Media |
| **Registro de asistentes** (formulario embebido en landing) | Alta | Baja (ya existe) |
| **Check-in** (QR code en evento) | Media | Baja (ya existe) |
| **Email confirmación** (automático al registrarse) | Alta | Baja (ya existe) |
| **Calendar integration** (agregar a Google Calendar / .ics) | Media | Baja |
| **Recurring events** (serie mensual, semanal) | Media | Media |
| **Custom domains** (evento.tuorg.com) | Baja | Media |
| **Embeddable widget** (registrarse desde otra web) | Baja | Media |

### Nativas de OpenClaw Meetups (ventaja competitiva)
| Feature | Prioridad | Notas |
|---------|-----------|-------|
| **Integración eventos ↔ sponsors** | Alta | Un sponsor se asocia a uno o más eventos |
| **Lightning payments** (sponsors pagan en sats, tickets en sats) | Alta | LaWallet integration |
| **AI outreach** (emails personalizados por AI) | Alta | Ya tenemos AI engine |
| **Nostr auth** (sin cuentas centralizadas) | Alta | NIP-98 ya implementado |
| **WhatsApp RSVP** (asistentes y sponsors) | Media | WaSenderAPI ya integrado |
| **Landing page builder** (drag & drop o templates) | Alta | Diferenciador clave vs Luma |

---

## Flujo del Organizador

```
1. CREAR EVENTO
   → Título, fecha, lugar, descripción, imagen
   → Seleccionar template de landing (o crear custom)
   → Se genera landing page automáticamente
   → URL: evento.openclaw.app/mi-evento (o custom domain)

2. GESTIONAR ASISTENTES (CRM)
   → Los registros caen automáticamente al CRM
   → Segmentar (developers, empresas, sponsors, speakers)
   → Email automático de confirmación
   → Reminder pre-evento
   → Check-in con QR el día del evento
   → Post-evento: encuesta + thank you email

3. BUSCAR SPONSORS (Outreach)
   → Buscar contactos (email finder)
   → Armar secuencias de outreach (templates personalizables)
   → Follow-ups automáticos
   → Pipeline visual (prospect → contactado → reunión → confirmado)
   → Asociar sponsor al evento (logo en landing, mentions)

4. REPORTES
   → Dashboard: asistentes, sponsors, revenue, engagement
   → Export a CSV
   → Historial de eventos pasados
```

## Modelo de Datos (Borrador)

```
events
├── id (UUID)
├── org_id (FK → organizations)
├── title
├── slug (URL-friendly)
├── description (markdown)
├── date_start
├── date_end
├── location_name
├── location_address
├── location_url (maps)
├── cover_image_url
├── template_id (FK → landing_templates)
├── custom_css (override)
├── registration_open (boolean)
├── max_attendees
├── is_recurring (boolean)
├── recurrence_rule (cron-like)
├── status (draft, published, past, cancelled)
├── created_at
└── updated_at

landing_templates
├── id (UUID)
├── name
├── description
├── html_template (Handlebars/JSX)
├── preview_image_url
├── is_default (boolean)
├── created_by
└── created_at

organizations
├── id (UUID)
├── name
├── slug
├── logo_url
├── website
├── description
├── created_at
└── updated_at

sponsors
├── id (UUID)
├── name
├── website
├── type (exchange, fund, infra, ai, fintech, events)
├── tier (1, 2, 3)
├── status (prospect, contacted, negotiating, confirmed, active, churned)
├── notes
├── created_at
└── updated_at

sponsor_contacts
├── id (UUID)
├── sponsor_id (FK)
├── name
├── role (CEO, Head of Partnerships, DevRel, Marketing)
├── email
├── linkedin_url
├── twitter_handle
├── phone
├── is_primary (boolean)
└── created_at

deals
├── id (UUID)
├── sponsor_id (FK)
├── title
├── stage (prospect → contacted → responded → meeting → proposal → confirmed → active)
├── value_usd
├── value_sats
├── package (gold, silver, bronze, workshop, in-kind, partner)
├── assigned_to (user)
├── expected_close_date
├── closed_date
├── created_at
└── updated_at

activities
├── id (UUID)
├── deal_id (FK)
├── contact_id (FK)
├── type (email_sent, email_received, call, meeting, note, follow_up)
├── subject
├── body
├── channel (email, linkedin, twitter, whatsapp, in_person)
├── performed_by (user)
├── scheduled_at (para follow-ups)
├── completed_at
└── created_at

email_sequences
├── id (UUID)
├── name
├── steps (JSON: [{delay_days, subject, body_template}])
├── created_by
└── created_at

sequence_enrollments
├── id (UUID)
├── sequence_id (FK)
├── contact_id (FK)
├── current_step
├── status (active, paused, completed, replied)
├── enrolled_at
└── updated_at
```

---

## Stack
- **Frontend:** Next.js 15 (App Router) + Tailwind + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Realtime)
- **Email:** Nodemailer (SMTP) o Resend
- **AI:** Anthropic Claude (personalización de outreach)
- **Auth:** Nostr (NIP-98) — ya implementado
- **Payments:** Lightning Network (LaWallet)
- **Hosting:** Vercel

---

*Este documento evoluciona con la experiencia de usar Apollo + HubSpot en Fase 1.*
*Bitcoin o Muerte 💀*
