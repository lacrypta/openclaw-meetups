# ROADMAP — OpenClaw Meetups Platform

> Última actualización: 2026-02-26
> Orden secuencial de ejecución. Cada fase depende de la anterior.

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

*Generado por Claudio — 2026-02-26*
