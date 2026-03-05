# ROADMAP — OpenClaw Meetups Platform

> Última actualización: 2026-03-05
> Orden secuencial de ejecución. Cada fase depende de la anterior.
> 
> ⚠️ **PIVOTE ESTRATÉGICO (Marzo 2026):** El proyecto evoluciona de "dashboard de eventos" a **plataforma todo-en-uno: Luma + Apollo + HubSpot, open source, Bitcoin-native.** Incluye creación de eventos con landing pages, CRM de asistentes, CRM de sponsors con outreach automatizado. Ver Phases 7-10.

---

## Phase 0: Foundation & Data Model Fix 🔧
> Prerequisito para todo lo demás. Arreglar el modelo de datos roto.

| # | Task | Issue | Est. | Deps |
|---|------|-------|------|------|
| 0.1 | **DB Migration: email_jobs + email_sends + email_events** | #19 | 2h | — |
| 0.2 | **Remove stale fields** (`email_sent`, `email_sent_at`, `email_type`) from `attendees` + `event_attendees` | #19 | 1h | 0.1 |
| 0.3 | **Migrate SMTP settings**: `/api/smtp-settings` → `email_integrations` | #19 | 2h | — |
| 0.4 | **Update Settings UI** to read/write `email_integrations` | #19 | 1h | 0.3 |
| 0.5 | **Update ContactsTable + hooks** to remove `email_sent` references, read from `email_sends` | #19 | 2h | 0.2 |

**Deliverable:** Clean data model, SMTP settings working, no broken references.

---

## Phase 1: Email Templates System 📝
> Store templates in DB, editable from dashboard.

| # | Task | Issue | Est. | Deps |
|---|------|-------|------|------|
| 1.1 | **DB: `email_templates` table** + seed 3 existing templates (checked-in, no-show, waitlist) | #4 | 1h | Phase 0 |
| 1.2 | **DB: `email_layouts` table** (logos, header, footer) + seed default layout | #4 | 1h | — |
| 1.3 | **API routes**: `/api/templates` (CRUD), `/api/layouts` (CRUD) | #4 | 2h | 1.1, 1.2 |
| 1.4 | **Email composer** (`lib/email-composer.ts`): merge layout + content + variables | #4 | 2h | 1.3 |
| 1.5 | **UI: Templates page** with tabs (Layout / Content Templates) | #4 | 3h | 1.3 |
| 1.6 | **UI: Template preview** (iframe, light/dark toggle) | #4 | 2h | 1.4, 1.5 |
| 1.7 | **Migrate existing HTML templates** from files to DB | #4 | 1h | 1.1 |

**Deliverable:** Templates editable from dashboard, preview working, layout system.

---

## Phase 2: Email Campaign Engine ⚡
> Background sending from dashboard with real-time progress.

| # | Task | Issue | Est. | Deps |
|---|------|-------|------|------|
| 2.1 | **API routes**: `/api/campaigns` (create, list, get, cancel, retry) | #19 | 3h | Phase 0, Phase 1 |
| 2.2 | **Supabase Edge Function**: `send-campaign` (chunked, pooled, retry, heartbeat) | #19 | 4h | 2.1 |
| 2.3 | **pg_cron**: auto-continue partial jobs, detect stale processes | #19 | 1h | 2.2 |
| 2.4 | **UI: Campaign tab** in EventDetail (segment selector, send button, confirmation) | #19 | 3h | 2.1 |
| 2.5 | **UI: Progress bar** (real-time polling, ETA, speed, current email) | #19 | 2h | 2.4 |
| 2.6 | **UI: Results table** (success/failed, per-email retry) | #19 | 2h | 2.4 |
| 2.7 | **UI: Campaign history** (past campaigns list with stats) | #19 | 2h | 2.1 |

**Deliverable:** Full email campaign system from dashboard. Send, monitor, retry.

---

## Phase 3: Tracking & Analytics 📊
> Open/click tracking, unsubscribe, metrics.

| # | Task | Issue | Est. | Deps |
|---|------|-------|------|------|
| 3.1 | **Tracking API**: open pixel (`/api/track/open`) + click redirect (`/api/track/click`) | #19 | 2h | Phase 2 |
| 3.2 | **Inject tracking** into email composer (pixel + URL rewriting) | #19 | 2h | 3.1, 1.4 |
| 3.3 | **Unsubscribe system**: secure token generation, `/unsubscribe` page, header | #5 | 3h | Phase 2 |
| 3.4 | **Campaign stats UI**: open rate, click rate, bounce rate per campaign | #19 | 2h | 3.1 |
| 3.5 | **Contact email history**: all emails sent to a contact across events | #6 | 2h | Phase 2 |

**Deliverable:** Full tracking, unsubscribe compliance, per-contact email history.

---

## Phase 4: Event Pages (Public-Facing) 🌐
> Public event detail, archive, speakers.

| # | Task | Issue | Est. | Deps |
|---|------|-------|------|------|
| 4.1 | **React Router**: multi-event architecture (`/events/[slug]`) | #7 | 3h | — |
| 4.2 | **Event Detail Page** (public, with registration) | #8 | 4h | 4.1 |
| 4.3 | **Events Archive** with timeline & filters | #9 | 3h | 4.1 |
| 4.4 | **Speakers Gallery** & profiles | #10 | 3h | 4.1 |
| 4.5 | **Photo Gallery** with lightbox | #11 | 3h | 4.1 |
| 4.6 | **Post-Event Feedback** system | #12 | 3h | 4.2 |
| 4.7 | **Enhanced Homepage** with featured event & upcoming preview | #13 | 3h | 4.1 |

**Deliverable:** Full public-facing event pages with archive, speakers, photos, feedback.

---

## Phase 5: SEO, Performance & Mobile 🚀
> Polish for production.

| # | Task | Issue | Est. | Deps |
|---|------|-------|------|------|
| 5.1 | **SEO & Meta Tags** (OG, Twitter cards, structured data) | #14 | 2h | Phase 4 |
| 5.2 | **Mobile Optimization** & responsive design audit | #15 | 3h | Phase 4 |
| 5.3 | **Image Optimization** (next/image, WebP, lazy load) | #18 | 2h | Phase 4 |
| 5.4 | **Analytics** (GA4 integration) | #17 | 2h | Phase 4 |

**Deliverable:** Production-ready performance, SEO, mobile experience.

---

## Phase 6: CI/CD & Testing 🧪
> Automated quality gates.

| # | Task | Issue | Est. | Deps |
|---|------|-------|------|------|
| 6.1 | **Testing setup** (Vitest + React Testing Library) | #16 | 2h | — |
| 6.2 | **CI pipeline** (GitHub Actions: lint, test, build) | #16 | 2h | 6.1 |
| 6.3 | **E2E tests** for critical flows (campaign send, template edit) | #16 | 3h | Phase 2 |

**Deliverable:** Automated testing and deployment pipeline.

---

## Attendee Metadata (Parallel Track) 🏷️
> Can be done alongside any phase.

| # | Task | Issue | Est. | Deps |
|---|------|-------|------|------|
| M.1 | **Flexible metadata system** (custom fields per event) | #6 | 4h | Phase 0 |

---

## Summary

| Phase | Focus | Issues | Est. Hours |
|-------|-------|--------|-----------|
| 0 | Data Model Fix | #19 | 8h |
| 1 | Email Templates | #4 | 12h |
| 2 | Campaign Engine | #19 | 17h |
| 3 | Tracking & Analytics | #5, #6, #19 | 11h |
| 4 | Event Pages | #7-#13 | 22h |
| 5 | SEO & Performance | #14, #15, #17, #18 | 9h |
| 6 | CI/CD & Testing | #16 | 7h |
| **Total** | | **16 issues** | **~86h** |

---

## Execution Order (Critical Path)

```
Phase 0 (data fix)
    ↓
Phase 1 (templates)
    ↓
Phase 2 (campaign engine)  ←── This is the big win
    ↓
Phase 3 (tracking)
    ↓
Phase 4-6 can run in parallel
```

**Priority:** Phases 0-2 son críticas. El resto se puede reordenar según necesidad.

---

---

## Phase 7: Rebranding 🎨
> El proyecto ya no es solo "OpenClaw Meetups". Es una plataforma completa de gestión de eventos + CRM. Necesita nombre y branding nuevo.

| # | Task | Est. | Deps |
|---|------|------|------|
| 7.1 | **Naming:** Brainstorm + selección de nombre nuevo | 2h | — |
| 7.2 | **Dominio:** Registrar dominio del nuevo nombre | 1h | 7.1 |
| 7.3 | **Identidad visual:** Logo, paleta, tipografía | 4h | 7.1 |
| 7.4 | **Rename repo** en GitHub (lacrypta/openclaw-meetups → nuevo nombre) | 1h | 7.1 |
| 7.5 | **Update codebase:** package.json, meta tags, OG images, favicon | 2h | 7.3, 7.4 |
| 7.6 | **Landing page del producto** (marketing site) | 4h | 7.3 |

**Deliverable:** Nueva identidad, nuevo dominio, nuevo repo. El producto tiene nombre propio.

---

## Phase 8: Event Landing Pages (Luma Replacement) 🎪
> Cualquier organizador puede crear un evento y generar una landing page automáticamente.

| # | Task | Est. | Deps |
|---|------|------|------|
| 8.1 | **DB: `landing_templates` table** + seed 3 templates base (minimal, conference, meetup) | 2h | Phase 0 |
| 8.2 | **DB: `organizations` table** (multi-org support) | 2h | Phase 0 |
| 8.3 | **Event creation wizard:** título, fecha, lugar, descripción, imagen, template selector | 4h | 8.1 |
| 8.4 | **Template engine:** Handlebars/JSX templates que renderizan landing desde datos del evento | 4h | 8.1 |
| 8.5 | **Landing page renderer:** `/events/[slug]` genera landing completa desde template + datos | 3h | 8.4 |
| 8.6 | **Template customizer:** editor visual para modificar colores, secciones, orden | 6h | 8.4 |
| 8.7 | **Registration widget:** formulario embebible en landing (ya existe parcialmente) | 2h | 8.5 |
| 8.8 | **Calendar integration:** botón "Agregar a Google Calendar" / descarga .ics | 1h | 8.5 |
| 8.9 | **Recurring events:** crear serie (mensual, semanal) con un solo setup | 3h | 8.3 |
| 8.10 | **Custom domains:** CNAME para `mienvento.miorg.com` | 2h | 8.5 |
| 8.11 | **Event types:** presencial, virtual, o híbrido — selector en creación | 1h | 8.3 |
| 8.12 | **Virtual event support:** integración Google Meet, Zoom, Jitsi, o link custom | 2h | 8.11 |
| 8.13 | **Auto-send meeting link:** al confirmar registro, enviar link de la sala automáticamente | 1h | 8.12 |
| 8.14 | **Hybrid events:** mostrar dirección física + link virtual en la misma landing | 1h | 8.11 |

**Deliverable:** Organizador crea evento → landing se genera automáticamente → asistentes se registran → fluye al CRM.

---

## Phase 9: Sponsor CRM (Apollo Replacement) 🎯
> Buscar, contactar y gestionar sponsors desde la plataforma.

| # | Task | Est. | Deps |
|---|------|------|------|
| 9.1 | **DB: sponsors, sponsor_contacts, deals, activities, email_sequences** | 3h | Phase 0 |
| 9.2 | **Sponsors dashboard:** lista, filtros por tier/status, búsqueda | 3h | 9.1 |
| 9.3 | **Sponsor profile page:** info, contactos, historial de actividades, deals | 3h | 9.1 |
| 9.4 | **Pipeline visual (Kanban):** prospect → contactado → respondió → reunión → propuesta → confirmado | 4h | 9.1 |
| 9.5 | **Email outreach:** enviar emails personalizados desde la plataforma | 3h | Phase 1, 9.1 |
| 9.6 | **Email sequences:** secuencias multi-step con delays automáticos | 4h | 9.5 |
| 9.7 | **Follow-up reminders:** notificaciones cuando toca hacer follow-up | 2h | 9.6 |
| 9.8 | **Activity log:** registrar llamadas, reuniones, notas, emails enviados | 2h | 9.1 |
| 9.9 | **Sponsor ↔ Event linking:** asociar sponsor a evento, logo en landing automático | 2h | 9.1, 8.5 |
| 9.10 | **Email templates para outreach:** templates de primer contacto, follow-up, propuesta | 2h | Phase 1 |

**Deliverable:** CRM completo de sponsors con pipeline, outreach automatizado y vinculación a eventos.

---

## Phase 10: AI & Bitcoin-Native Features ⚡🤖
> Las funcionalidades que ningún competidor tiene.

| # | Task | Est. | Deps |
|---|------|------|------|
| 10.1 | **AI email writer:** genera emails personalizados por sponsor (Anthropic Claude) | 4h | Phase 9 |
| 10.2 | **AI sponsor research:** dado un nombre de empresa, investiga y genera perfil | 4h | Phase 9 |
| 10.3 | **Lightning payments:** sponsors pagan en sats (LaWallet integration) | 6h | Phase 9 |
| 10.4 | **Lightning tickets:** asistentes pagan entrada en sats | 4h | Phase 8 |
| 10.5 | **Nostr event announcements:** publicar evento en relays Nostr | 2h | Phase 8 |
| 10.6 | **WhatsApp RSVP integration** (ya existe, conectar con nuevo modelo) | 2h | Phase 8, 9 |
| 10.7 | **Multi-channel chatbots:** WhatsApp, Telegram, Nostr — asistentes y sponsors interactúan por el canal que prefieran | 8h | Phase 8, 9 |
| 10.8 | **Chatbot flows:** RSVP, consultas, confirmaciones, follow-ups — todo automatizado por AI en cada canal | 6h | 10.7 |
| 10.9 | **Unified inbox:** todas las conversaciones (WA, Telegram, Nostr) en un solo lugar del dashboard | 4h | 10.7 |

**Deliverable:** Platform con superpoderes: AI + Lightning + Nostr + chatbots multi-canal. Diferenciador absoluto.

---

## Updated Summary

| Phase | Focus | Est. Hours | Status |
|-------|-------|-----------|--------|
| 0 | Data Model Fix | 8h | 🔲 |
| 1 | Email Templates | 12h | ✅ (PR #25 merged) |
| 2 | Campaign Engine | 17h | 🔲 |
| 3 | Tracking & Analytics | 11h | 🔲 |
| 4 | Event Pages | 22h | 🔲 |
| 5 | SEO & Performance | 9h | 🔲 |
| 6 | CI/CD & Testing | 7h | 🔲 |
| **7** | **Rebranding** | **14h** | **🔲 NEW** |
| **8** | **Event Landing Pages (Luma)** | **29h** | **🔲 NEW** |
| **9** | **Sponsor CRM (Apollo)** | **28h** | **🔲 NEW** |
| **10** | **AI & Bitcoin-Native + Chatbots** | **40h** | **🔲 NEW** |
| **Total** | | **~197h** | |

## New Execution Order

```
Phase 0 (data fix) → Phase 1 (templates) ✅ → Phase 2 (campaigns)
                                                      ↓
Phase 7 (REBRANDING) ←── puede arrancar en paralelo
                                                      ↓
Phase 8 (Event Landings / Luma replacement)
                          ↓
Phase 9 (Sponsor CRM / Apollo replacement)
                          ↓
Phase 10 (AI + Bitcoin-native)
                          ↓
Phases 3-6 (tracking, SEO, testing) — en paralelo
```

**Prioridad inmediata:**
1. Phase 7 (Rebranding) — definir nombre y dirección
2. Phase 0 + 2 (data fix + campaigns) — funcionalidad core
3. Phase 8 (Event landings) — reemplazar Luma
4. Phase 9 (Sponsor CRM) — reemplazar Apollo

---

*Actualizado por Claudio — 2026-03-05*
