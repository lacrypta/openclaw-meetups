# Feature Issue: Email Campaigns & Broadcast System

**Branch:** `email-campaigns` (to be created)  
**Status:** 📝 Specification Ready  
**Priority:** High  
**Created:** 2026-02-25  
**Depends on:** Email Templates Feature (branch: `email-templates`)

---

## 📋 Overview

Sistema de difusión de emails para eventos. Permite crear campañas de email masivo con filtros/condiciones sobre los attendees de un evento específico.

**Como un CRM:** Envío masivo sectorizado con preview y conteo de destinatarios.

**Ubicación:** Nueva tab "Difusión" en la página de evento individual (`/events/[id]`)

---

## 🎯 Objetivos

- ✅ Crear campañas de email desde la página del evento
- ✅ Importar templates del feature Email Templates
- ✅ Editar contenido con editor visual
- ✅ Aplicar filtros/condiciones sobre attendees
- ✅ Preview de email y lista de destinatarios
- ✅ Envío masivo con tracking

---

## 🗃️ Base de Datos

### Nueva Tabla: `email_campaigns`

```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Campaign info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Email content
  template_id UUID REFERENCES email_content_templates(id),
  layout_id UUID REFERENCES email_layouts(id),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL, -- Puede ser modificado desde template
  
  -- Filters/Conditions
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Ejemplo: {"status": ["checked-in", "waitlist"], "registered_at": {"after": "2026-02-01"}}
  
  -- Stats
  total_recipients INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_failed INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Indexes
CREATE INDEX idx_email_campaigns_event ON email_campaigns (event_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns (status);
CREATE INDEX idx_email_campaigns_scheduled ON email_campaigns (scheduled_at) WHERE status = 'scheduled';

-- RLS
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated reads" ON email_campaigns
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated writes" ON email_campaigns
  FOR ALL USING (true) WITH CHECK (true);
```

### Nueva Tabla: `email_campaign_logs`

```sql
CREATE TABLE email_campaign_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  attendee_id INTEGER NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  
  -- Email details
  email_to TEXT NOT NULL,
  subject TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'opened', 'clicked')),
  error_message TEXT,
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaign_logs_campaign ON email_campaign_logs (campaign_id);
CREATE INDEX idx_campaign_logs_attendee ON email_campaign_logs (attendee_id);
CREATE INDEX idx_campaign_logs_status ON email_campaign_logs (status);

-- RLS
ALTER TABLE email_campaign_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated reads" ON email_campaign_logs
  FOR SELECT USING (true);
```

---

## 🎨 UI Components

### Event Page - New Tab: "Difusión"

**Ubicación:** `/events/[id]` → Nueva tab junto a "Overview", "Attendees", etc.

**Layout:**

```
┌────────────────────────────────────────────────────────────┐
│ Event: OpenClaw Meetup #2                                  │
├────────────────────────────────────────────────────────────┤
│ [Overview] [Attendees] [Settings] [Difusión] ← NUEVA TAB  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Email Campaigns                                           │
│  Send targeted emails to attendees                         │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Existing Campaigns                                   │ │
│  │                                                       │ │
│  │ ✓ Reminder 1 week before     [Edit] [View] [Stats] │ │
│  │ ✓ Thank you - Checked-in     [Edit] [View] [Stats] │ │
│  │ ⏸ Follow-up - No-show        [Edit] [View] [Stats] │ │
│  │                                                       │ │
│  │ [+ New Campaign]                                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### Campaign Editor

**Ruta:** `/events/[id]/campaigns/new` o `/events/[id]/campaigns/[campaignId]/edit`

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Event                                              │
├──────────────────────────────────────────────────────────────┤
│ New Campaign: OpenClaw Meetup #2                             │
│                                                              │
│ ┌─────────────────────────┐ ┌───────────────────────────┐  │
│ │ Configuration           │ │ Preview                   │  │
│ │                         │ │                           │  │
│ │ Name:                   │ │ ┌───────────────────────┐ │  │
│ │ [___________________]   │ │ │ Subject: ...          │ │  │
│ │                         │ │ │                       │ │  │
│ │ Template:               │ │ │ [Logo]                │ │  │
│ │ [v Checked-in        ]  │ │ │                       │ │  │
│ │ [Import Template]       │ │ │ Hi {{first_name}},    │ │  │
│ │                         │ │ │                       │ │  │
│ │ Subject:                │ │ │ Body content...       │ │  │
│ │ [___________________]   │ │ │                       │ │  │
│ │                         │ │ │ [Footer]              │ │  │
│ │ Content:                │ │ └───────────────────────┘ │  │
│ │ [Rich Text Editor   ]   │ │                           │  │
│ │ [___________________]   │ │ [Light] [Dark]           │  │
│ │ [___________________]   │ │                           │  │
│ │                         │ │                           │  │
│ │ Variables:              │ │                           │  │
│ │ {{first_name}} [Insert] │ │                           │  │
│ │ {{email}}      [Insert] │ │                           │  │
│ │ {{event_name}} [Insert] │ │                           │  │
│ │                         │ │                           │  │
│ └─────────────────────────┘ └───────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Filters & Conditions                                  │  │
│ │                                                        │  │
│ │ Send to:                                              │  │
│ │ [✓] Checked-in (asistió)                   61 people │  │
│ │ [✓] Waitlist (lista de espera)             33 people │  │
│ │ [ ] No-show (no asistió)                   86 people │  │
│ │                                                        │  │
│ │ Advanced Filters:                                     │  │
│ │ Registered after: [__________] (date picker)         │  │
│ │ Custom field:     [__________] [_______]             │  │
│ │                                                        │  │
│ │ ─────────────────────────────────────────────────────│  │
│ │ Total Recipients: 94 people                           │  │
│ │ [Preview Recipients List]                            │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ [Save as Draft] [Schedule] [Send Now]                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Routes

### Campaign CRUD

#### 1. GET `/api/events/[eventId]/campaigns`

**Descripción:** Listar campañas de un evento

**Response:**
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "name": "Reminder 1 week before",
      "subject": "No te olvides del meetup!",
      "status": "sent",
      "total_recipients": 120,
      "emails_sent": 118,
      "sent_at": "2026-02-18T10:00:00Z",
      "created_at": "2026-02-10T..."
    }
  ]
}
```

#### 2. POST `/api/events/[eventId]/campaigns`

**Descripción:** Crear nueva campaña

**Request:**
```json
{
  "name": "Thank you email",
  "template_id": "uuid-of-checked-in-template",
  "subject": "¡Gracias por venir!",
  "body_html": "<p>Edited content...</p>",
  "filters": {
    "status": ["checked-in"],
    "registered_after": "2026-02-01"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "total_recipients": 61,
  "message": "Campaign created successfully"
}
```

#### 3. GET `/api/campaigns/[id]`

**Descripción:** Obtener campaña específica con detalles completos

#### 4. PUT `/api/campaigns/[id]`

**Descripción:** Actualizar campaña (solo si status = draft)

#### 5. POST `/api/campaigns/[id]/send`

**Descripción:** Enviar campaña ahora

**Request:**
```json
{
  "confirm": true
}
```

**Response:**
```json
{
  "status": "sending",
  "queued_emails": 94,
  "message": "Campaign queued for sending"
}
```

#### 6. POST `/api/campaigns/[id]/schedule`

**Descripción:** Programar envío

**Request:**
```json
{
  "scheduled_at": "2026-02-28T10:00:00Z"
}
```

---

### Filter & Preview

#### 1. POST `/api/campaigns/preview-recipients`

**Descripción:** Preview de destinatarios según filtros

**Request:**
```json
{
  "event_id": "uuid",
  "filters": {
    "status": ["checked-in", "waitlist"]
  }
}
```

**Response:**
```json
{
  "total": 94,
  "recipients": [
    {
      "id": 1,
      "first_name": "Juan",
      "last_name": "Pérez",
      "email": "juan@example.com",
      "status": "checked-in"
    },
    {
      "id": 2,
      "first_name": "María",
      "last_name": "García",
      "email": "maria@example.com",
      "status": "waitlist"
    }
  ],
  "breakdown": {
    "checked-in": 61,
    "waitlist": 33
  }
}
```

#### 2. POST `/api/campaigns/[id]/preview-email`

**Descripción:** Preview del email final con datos de usuario específico

**Request:**
```json
{
  "attendee_id": 1
}
```

**Response:**
```json
{
  "html": "<!DOCTYPE html>...",
  "subject": "¡Gracias por venir, Juan!",
  "preview_url": "data:text/html;base64,..."
}
```

---

## 🔨 Implementation Steps

### Phase 1: Core Functionality (Sprint 1)

- [ ] Create database migrations
  - [ ] `email_campaigns` table
  - [ ] `email_campaign_logs` table
  - [ ] RLS policies
  
- [ ] API routes
  - [ ] GET `/api/events/[eventId]/campaigns`
  - [ ] POST `/api/events/[eventId]/campaigns`
  - [ ] GET `/api/campaigns/[id]`
  - [ ] PUT `/api/campaigns/[id]`
  - [ ] POST `/api/campaigns/preview-recipients`
  - [ ] POST `/api/campaigns/[id]/preview-email`
  
- [ ] UI Components
  - [ ] Add "Difusión" tab to event page
  - [ ] Campaign list view
  - [ ] Basic campaign editor
  - [ ] Template selector (import from Email Templates)
  - [ ] Basic filters UI (checkboxes for status)
  - [ ] Recipient count display

### Phase 2: Enhanced Editor (Sprint 2)

- [ ] Rich text editor for content
  - [ ] TipTap or Quill integration
  - [ ] Variable insertion toolbar
  - [ ] Format toolbar (bold, italic, links, etc)
  
- [ ] Advanced filters
  - [ ] Date range picker (registered_after, registered_before)
  - [ ] Custom field filters
  - [ ] Combine multiple conditions (AND/OR)
  
- [ ] Preview system
  - [ ] Email HTML preview (light/dark mode)
  - [ ] Recipients list modal
  - [ ] Breakdown by filter (chart/stats)
  - [ ] Test send to specific email

### Phase 3: Sending System (Sprint 2-3)

- [ ] Email queue system
  - [ ] Job queue (Bull/BullMQ)
  - [ ] Rate limiting (avoid spam blocks)
  - [ ] Retry logic for failed emails
  
- [ ] Send functionality
  - [ ] Send now button
  - [ ] Schedule for later
  - [ ] Cancel scheduled
  - [ ] Pause/resume sending
  
- [ ] Logging & tracking
  - [ ] Insert log entry per email
  - [ ] Update campaign stats
  - [ ] Error handling & reporting

### Phase 4: Analytics & Tracking (Sprint 3+)

- [ ] Open tracking
  - [ ] Tracking pixel insertion
  - [ ] Record open events
  
- [ ] Click tracking
  - [ ] URL rewriting
  - [ ] Record click events
  
- [ ] Campaign stats dashboard
  - [ ] Open rate
  - [ ] Click-through rate
  - [ ] Bounce rate
  - [ ] Timeline of sends
  
- [ ] Export functionality
  - [ ] Export recipient list as CSV
  - [ ] Export campaign results

### Phase 5: Advanced Features (Sprint 4+)

- [ ] A/B testing
  - [ ] Multiple subject lines
  - [ ] Multiple content variants
  - [ ] Auto-select winner
  
- [ ] Segmentation templates
  - [ ] Save filter combinations
  - [ ] Reuse segments across campaigns
  
- [ ] Automated campaigns
  - [ ] Trigger on event (e.g., 1 day after check-in)
  - [ ] Drip campaigns
  - [ ] Follow-up sequences
  
- [ ] Unsubscribe management
  - [ ] Unsubscribe link insertion
  - [ ] Unsubscribe preferences
  - [ ] Respect unsubscribe status

---

## 🔄 Email Sending Flow

```
User creates campaign
    ↓
Selects template (imports layout + content)
    ↓
Edits content if needed
    ↓
Applies filters (checked-in, waitlist, etc)
    ↓
Preview: Shows count + recipient list
    ↓
User clicks "Send Now" or "Schedule"
    ↓
System queries attendees with filters
    ↓
For each recipient:
    - Fetch attendee data
    - Replace variables in HTML
    - Queue email for sending
    - Create log entry
    ↓
Worker processes queue
    - Send via SMTP
    - Update log status (sent/failed)
    - Update campaign stats
    ↓
Campaign status = "sent"
User can view analytics
```

---

## 🎯 Filter System

### Available Filters

#### 1. Status Filter
```json
{
  "status": ["checked-in", "waitlist", "no-show"]
}
```

#### 2. Registration Date Filter
```json
{
  "registered_after": "2026-02-01",
  "registered_before": "2026-02-20"
}
```

#### 3. Check-in Date Filter
```json
{
  "checked_in_after": "2026-02-21T18:00:00Z",
  "checked_in_before": "2026-02-21T22:00:00Z"
}
```

#### 4. Custom Field Filter (Future)
```json
{
  "custom_fields": {
    "company": "La Crypta",
    "role": ["developer", "designer"]
  }
}
```

### Query Builder

**SQL Generation from Filters:**

```typescript
function buildAttendeesQuery(eventId: string, filters: Filters) {
  let query = supabase
    .from('event_attendees')
    .select('*, attendees(*)')
    .eq('event_id', eventId);
  
  // Status filter
  if (filters.status) {
    query = query.in('status', filters.status);
  }
  
  // Date filters
  if (filters.registered_after) {
    query = query.gte('registered_at', filters.registered_after);
  }
  if (filters.registered_before) {
    query = query.lte('registered_at', filters.registered_before);
  }
  
  // Check-in filters
  if (filters.checked_in_after) {
    query = query.gte('checked_in_at', filters.checked_in_after);
  }
  
  return query;
}
```

---

## 🔐 Security Considerations

1. **Rate Limiting:**
   - Max 1000 emails per campaign
   - Max 100 emails per minute (avoid spam blocks)
   - Warn user if approaching limits

2. **Email Validation:**
   - Validate recipient emails before sending
   - Filter out invalid/bounced emails
   - Respect bounce list

3. **Content Sanitization:**
   - Sanitize HTML before sending
   - Remove dangerous tags/scripts
   - Validate all inserted variables

4. **Permissions:**
   - Only event organizers can create campaigns
   - Log who created/sent each campaign
   - Audit trail for compliance

5. **Unsubscribe:**
   - Include unsubscribe link (legal requirement in many jurisdictions)
   - Honor unsubscribe requests
   - Store opt-out preferences

---

## 📊 Success Metrics

### Usability
- Time to create campaign: **< 10 minutes**
- Time to send campaign: **< 2 minutes**
- Filter accuracy: **100%** (no wrong recipients)

### Performance
- Queue 100 emails: **< 5 seconds**
- Send 100 emails: **< 2 minutes** (with rate limiting)
- Preview generation: **< 1 second**

### Deliverability
- Delivery rate: **> 95%**
- Open rate: **> 20%** (industry average)
- Bounce rate: **< 5%**

---

## 📚 Documentation

- **Full Spec:** This document
- **API Docs:** (To be created in `/docs/api/`)
- **User Guide:** (To be created in `/docs/guides/`)

---

## 🚀 Future Enhancements

1. **SMS Campaigns**
   - Send SMS in addition to email
   - Same filter system
   - SMS template library

2. **WhatsApp Campaigns**
   - Send via WhatsApp Business API
   - Template message compliance
   - Opt-in management

3. **Multi-language Support**
   - Detect user language
   - Send in preferred language
   - Translation management

4. **Dynamic Content**
   - Show/hide sections based on filters
   - Personalize beyond variables
   - Conditional logic in templates

5. **Integration with CRM**
   - Sync with HubSpot/Salesforce
   - Import contacts
   - Export engagement data

---

## 🔗 Dependencies

### Required Before Implementation

- **Email Templates Feature** (branch: `email-templates`)
  - `email_layouts` table
  - `email_content_templates` table
  - Layout + Content composition system
  - Template selector UI

### Optional (Nice to Have)

- Email tracking infrastructure (open/click tracking)
- Job queue system (Bull/BullMQ)
- SMTP provider with good deliverability (SendGrid/Postmark)

---

## ✅ Acceptance Criteria

- [ ] User can create campaign from event page
- [ ] User can import template from Email Templates
- [ ] User can edit imported content
- [ ] User can insert variables ({{first_name}}, etc)
- [ ] User can apply filters (status checkboxes)
- [ ] System shows accurate recipient count
- [ ] User can preview recipient list
- [ ] User can preview email HTML (light/dark)
- [ ] User can send campaign immediately
- [ ] User can schedule campaign for later
- [ ] System queues emails properly
- [ ] System sends emails with rate limiting
- [ ] System logs all sends (success/failure)
- [ ] User can view campaign analytics
- [ ] All recipients receive correct personalized email
- [ ] Variables replaced correctly
- [ ] No duplicate sends to same person
- [ ] Filters work 100% accurately

---

## 💬 Notes

- This feature turns OpenClaw Meetups into a full CRM
- Similar to Mailchimp campaigns but integrated
- Critical for event follow-up and engagement
- Must have excellent UX (intuitive, fast)
- Deliverability is key (reputation, SPF/DKIM)

---

**Estimated Effort:** 3-4 sprints (6-8 weeks)  
**Team Size:** 1-2 developers  
**Priority:** High  
**Risk Level:** Medium-High (email deliverability, queue system)  
**Depends on:** Email Templates Feature

---

*Issue created: 2026-02-25*  
*Last updated: 2026-02-25*
