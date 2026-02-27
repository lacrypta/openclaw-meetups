# CLAUDE.md — OpenClaw Meetups

## Project Overview

OpenClaw Meetups is a **Next.js 15 + Supabase** platform for managing monthly AI meetups at [La Crypta](https://lacrypta.ar), Buenos Aires. It provides a bilingual (ES/EN) public landing page and a protected admin dashboard for event management, attendee tracking, and email campaigns.

**Repo:** `lacrypta/openclaw-meetups`
**Live registration:** Luma (external)
**Project board:** https://github.com/orgs/lacrypta/projects/2/

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components)
- **Language:** TypeScript 5.9, React 19
- **Styling:** Tailwind CSS 4 + Shadcn UI + Radix UI
- **Database:** Supabase (PostgreSQL) with RLS
- **Auth:** Nostr (NIP-07, NIP-46, nsec) + JWT for dashboard
- **Email:** Nodemailer + AWS SES SDK (multi-provider via `email_integrations`)
- **Package manager:** pnpm
- **Node:** v22.14.0 (see `.nvmrc`)

## Key Directories

```
app/                  # Next.js App Router (pages + API routes)
  api/                # REST endpoints (auth, events, contacts, email-integrations)
  dashboard/          # Protected admin pages (events, attendees, settings)
components/           # React components (Shadcn UI in components/ui/)
hooks/                # Custom hooks (useNostr, useAuth, useEvents, etc.)
lib/                  # Utilities (auth, supabase client, types)
supabase/migrations/  # SQL migration files (auto-applied)
config/               # meetup.json (next date), talks.json
email-templates/      # HTML email templates (40+ variants)
scripts/              # setup-env.mjs, migrate-db.mjs
docs/                 # Technical documentation
```

## Database Schema

Tables: `events`, `event_attendees`, `attendees`, `smtp_settings` (legacy singleton), `email_integrations` (multi-provider).

Migrations live in `supabase/migrations/` and auto-apply on `npm run dev` and `npm run build`.

## Development Commands

```bash
pnpm dev          # auto-setup + auto-migrate + start dev server
pnpm build        # auto-setup + auto-migrate + production build
pnpm migrate      # apply SQL migrations manually
pnpm lint         # Next.js linter
```

## Auth Flow

1. User authenticates via Nostr (NIP-07 extension, NIP-46 bunker, or direct nsec)
2. Client sends NIP-98 signed event to `POST /api/auth`
3. Server verifies signature, checks `ALLOWED_PUBKEYS`, returns JWT
4. JWT stored in localStorage (`openclaw_jwt`), used for dashboard API calls

## Git Workflow

When working on any issue or task:

1. **Create a feature branch** from `master` before making changes:
   - Branch naming: `feat/<issue-number>-<short-description>` (e.g., `feat/19-email-campaign-phase0`)
   - For bug fixes: `fix/<issue-number>-<short-description>`
2. **Commit changes** incrementally with clear messages referencing the issue (e.g., `feat: add email_jobs table (#19)`)
3. **Create a Pull Request** to `master` when the work is complete, linking the relevant issue(s)
   - PR title should be concise and descriptive
   - PR body should summarize changes and reference the issue with `Closes #<number>`

## Working on Issues

All 16 open issues map to the roadmap phases in `ROADMAP.md`. Follow the **sequential execution order** — each phase depends on the previous.

### Phase 0: Foundation & Data Model Fix (Issues: #19)

> **PREREQUISITE for everything else.** Fix the broken data model.

- [ ] 0.1 — DB Migration: `email_jobs` + `email_sends` + `email_events` tables
- [ ] 0.2 — Remove stale fields (`email_sent`, `email_sent_at`, `email_type`) from `attendees` + `event_attendees`
- [ ] 0.3 — Migrate SMTP settings: `/api/smtp-settings` -> `email_integrations`
- [ ] 0.4 — Update Settings UI to read/write `email_integrations`
- [ ] 0.5 — Update ContactsTable + hooks to remove `email_sent` refs, read from `email_sends`

### Phase 1: Email Templates System (Issues: #4)

> Store templates in DB, editable from dashboard.

- [ ] 1.1 — DB: `email_templates` table + seed 3 existing templates
- [ ] 1.2 — DB: `email_layouts` table + seed default layout
- [ ] 1.3 — API: `/api/templates` (CRUD), `/api/layouts` (CRUD)
- [ ] 1.4 — Email composer (`lib/email-composer.ts`): merge layout + content + variables
- [ ] 1.5 — UI: Templates page with tabs (Layout / Content Templates)
- [ ] 1.6 — UI: Template preview (iframe, light/dark toggle)
- [ ] 1.7 — Migrate existing HTML templates from files to DB

### Phase 2: Email Campaign Engine (Issues: #19)

> Background sending from dashboard with real-time progress.

- [ ] 2.1 — API: `/api/campaigns` (create, list, get, cancel, retry)
- [ ] 2.2 — Supabase Edge Function: `send-campaign` (chunked, pooled, retry)
- [ ] 2.3 — pg_cron: auto-continue partial jobs, detect stale processes
- [ ] 2.4 — UI: Campaign tab in EventDetail (segment selector, send, confirm)
- [ ] 2.5 — UI: Progress bar (real-time polling, ETA, speed)
- [ ] 2.6 — UI: Results table (success/failed, per-email retry)
- [ ] 2.7 — UI: Campaign history with stats

### Phase 3: Tracking & Analytics (Issues: #5, #6, #19)

> Open/click tracking, unsubscribe, metrics.

- [ ] 3.1 — Tracking API: open pixel + click redirect
- [ ] 3.2 — Inject tracking into email composer
- [ ] 3.3 — Unsubscribe system: secure tokens, `/unsubscribe` page (#5)
- [ ] 3.4 — Campaign stats UI: open rate, click rate, bounce rate
- [ ] 3.5 — Contact email history across events (#6)

### Phase 4: Event Pages — Public Facing (Issues: #7-#13)

> Public event detail, archive, speakers.

- [ ] 4.1 — React Router: multi-event architecture `/events/[slug]` (#7)
- [ ] 4.2 — Event Detail Page with registration (#8)
- [ ] 4.3 — Events Archive with timeline & filters (#9)
- [ ] 4.4 — Speakers Gallery & profiles (#10)
- [ ] 4.5 — Photo Gallery with lightbox (#11)
- [ ] 4.6 — Post-Event Feedback system (#12)
- [ ] 4.7 — Enhanced Homepage with featured event (#13)

### Phase 5: SEO, Performance & Mobile (Issues: #14, #15, #17, #18)

> Polish for production.

- [ ] 5.1 — SEO & Meta Tags (OG, Twitter cards, structured data) (#14)
- [ ] 5.2 — Mobile Optimization & responsive audit (#15)
- [ ] 5.3 — Image Optimization (WebP, lazy load) (#18)
- [ ] 5.4 — Analytics (GA4 integration) (#17)

### Phase 6: CI/CD & Testing (Issues: #16)

> Automated quality gates.

- [ ] 6.1 — Testing setup (Vitest + React Testing Library)
- [ ] 6.2 — CI pipeline (GitHub Actions: lint, test, build)
- [ ] 6.3 — E2E tests for critical flows

### Parallel Track: Attendee Metadata (Issues: #6)

- [ ] M.1 — Flexible metadata system (custom fields per event)

## Critical Path

```
Phase 0 (data fix) → Phase 1 (templates) → Phase 2 (campaign engine) → Phase 3 (tracking)
                                                                              ↓
                                                              Phases 4-6 can run in parallel
```

**Priority:** Phases 0-2 are critical. The rest can be reordered by need.

## Issue Reference (all OPEN)

| #   | Title                                   | Phase |
| --- | --------------------------------------- | ----- |
| #4  | Email Templates Editor                  | 1     |
| #5  | Unsubscribe System with Secure Tokens   | 3     |
| #6  | Flexible Attendee Metadata System       | 3, M  |
| #7  | React Router & Multi-Event Architecture | 4     |
| #8  | Event Detail Page                       | 4     |
| #9  | Events Archive with Timeline & Filters  | 4     |
| #10 | Speakers Gallery & Profiles             | 4     |
| #11 | Photo Gallery with Lightbox             | 4     |
| #12 | Post-Event Feedback & Ratings           | 4     |
| #13 | Enhanced Homepage                       | 4     |
| #14 | SEO & Social Media Meta Tags            | 5     |
| #15 | Mobile Optimization                     | 5     |
| #16 | Testing & CI/CD Pipeline                | 6     |
| #17 | Analytics (GA4)                         | 5     |
| #18 | Image Optimization & Performance        | 5     |
| #19 | Email Campaign System                   | 0, 2  |

## Conventions

- **Migrations:** Create SQL files in `supabase/migrations/[YYYYMMDDHHMMSS]_description.sql`
- **API routes:** REST style under `app/api/`, use Supabase service key server-side
- **Components:** Shadcn UI components in `components/ui/`, app components in `components/`
- **Hooks:** Custom hooks in `hooks/` follow `use[Resource].ts` pattern
- **Auth:** All dashboard API routes must verify JWT via `lib/auth-server.ts`
- **i18n:** Bilingual support (ES/EN), translations managed in components
- **Styling:** Tailwind CSS, dark theme with blue (#3B82F6) and amber (#F59E0B) accents
- **Email providers:** Multi-provider support via `email_integrations` table (SMTP, AWS SES, Resend)

## Known Technical Debt

- `attendees` table has legacy fields (`email_sent`, `email_sent_at`, `email_type`) that need removal (Phase 0)
- `/api/smtp-settings` is a legacy endpoint — should migrate to `/api/email-integrations` (Phase 0)
- Email templates are HTML files in `email-templates/` — should move to DB (Phase 1)
- README.md project structure section is outdated (references old Vite/src/ layout)
