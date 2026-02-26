# Feature: Unsubscribe System (Desuscripción)

## Overview

Sistema completo de desuscripción de emails estilo CRM profesional. Cada attendee tiene un link único y seguro para darse de baja. El sistema respeta las preferencias y no envía más emails a usuarios desuscritos.

## User Story

**Como** asistente que recibió un email del evento  
**Quiero** poder desuscribirme fácilmente con un click  
**Para que** no me lleguen más comunicaciones si no me interesan

## Requirements

### Functional

1. **Unique Unsubscribe Link**
   - Cada usuario tiene un token único y seguro
   - Link format: `https://meetups.lacrypta.ar/unsubscribe?token=abc123...`
   - Token debe ser imposible de adivinar (UUID v4 o hash SHA-256)

2. **Landing Page**
   - Muestra email del usuario (validado por token)
   - Botón de confirmación: "Sí, desuscribirme"
   - Mensaje claro sobre qué emails dejarán de recibir
   - Opción alternativa: "Cambiar preferencias" (future)

3. **Database Flag**
   - Campo `unsubscribed` (boolean) en tabla `attendees`
   - Timestamp `unsubscribed_at` para auditoría
   - Opcional: `unsubscribe_reason` (texto libre)

4. **Email Filtering**
   - Sistema de envío debe verificar flag antes de enviar
   - Reportes muestran "X unsubscribed contacts skipped"
   - No enviar a `unsubscribed = true`

5. **Footer Link**
   - Todos los emails deben incluir link de unsubscribe
   - Texto: "Si no querés recibir más emails, [desuscribite acá]"
   - Link siempre visible (no oculto)

### Non-Functional

- **Security:** Token no debe ser reversible (no exponer ID directamente)
- **Performance:** Lookup de token debe ser rápido (index en DB)
- **UX:** Proceso debe completarse en <5 segundos
- **Legal:** Cumplir con requisitos de opt-out (CAN-SPAM, GDPR)

## Database Schema

### Migration: `20260225030000_add_unsubscribe_system.sql`

```sql
-- Add unsubscribe fields to attendees table
ALTER TABLE attendees
ADD COLUMN unsubscribe_token UUID DEFAULT uuid_generate_v4() NOT NULL,
ADD COLUMN unsubscribed BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN unsubscribed_at TIMESTAMP,
ADD COLUMN unsubscribe_reason TEXT;

-- Create index for fast token lookup
CREATE INDEX idx_attendees_unsubscribe_token ON attendees(unsubscribe_token);

-- Constraint: unsubscribed_at must be set if unsubscribed is true
ALTER TABLE attendees
ADD CONSTRAINT check_unsubscribed_at_when_true
CHECK (
  (unsubscribed = false AND unsubscribed_at IS NULL) OR
  (unsubscribed = true AND unsubscribed_at IS NOT NULL)
);

-- Generate tokens for existing attendees (if any don't have one)
UPDATE attendees
SET unsubscribe_token = uuid_generate_v4()
WHERE unsubscribe_token IS NULL;
```

### Schema After Migration

```typescript
interface Attendee {
  id: string;
  email: string;
  first_name: string;
  // ... other fields
  
  // Unsubscribe system
  unsubscribe_token: string;      // UUID v4 (unique, indexed)
  unsubscribed: boolean;           // Default: false
  unsubscribed_at: Date | null;   // Timestamp when unsubscribed
  unsubscribe_reason: string | null; // Optional feedback
}
```

## API Routes

### 1. GET `/api/unsubscribe/verify?token=<UUID>`

**Purpose:** Verify token and get user info for confirmation page

**Request:**
```
GET /api/unsubscribe/verify?token=550e8400-e29b-41d4-a716-446655440000
```

**Response (200):**
```json
{
  "valid": true,
  "email": "usuario@example.com",
  "first_name": "Juan",
  "already_unsubscribed": false
}
```

**Response (404 - Invalid Token):**
```json
{
  "valid": false,
  "error": "Invalid or expired token"
}
```

**Response (200 - Already Unsubscribed):**
```json
{
  "valid": true,
  "email": "usuario@example.com",
  "first_name": "Juan",
  "already_unsubscribed": true,
  "unsubscribed_at": "2026-02-25T15:30:00Z"
}
```

### 2. POST `/api/unsubscribe`

**Purpose:** Execute unsubscribe action

**Request:**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "reason": "Ya no me interesan estos eventos" // Optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Te desuscribiste exitosamente",
  "email": "usuario@example.com"
}
```

**Response (400 - Already Unsubscribed):**
```json
{
  "success": false,
  "error": "Ya estabas desuscripto desde 2026-02-20"
}
```

**Response (404 - Invalid Token):**
```json
{
  "success": false,
  "error": "Token inválido"
}
```

### 3. GET `/api/attendees/[id]/unsubscribe-link`

**Purpose:** Get unsubscribe link for specific attendee (internal, admin only)

**Request:**
```
GET /api/attendees/abc123/unsubscribe-link
Authorization: Bearer <admin_jwt>
```

**Response (200):**
```json
{
  "unsubscribe_url": "https://meetups.lacrypta.ar/unsubscribe?token=550e8400..."
}
```

## Frontend

### Page: `/unsubscribe`

**Route:** `/unsubscribe?token=<UUID>`

**Components:**

```tsx
// app/unsubscribe/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Verify token on mount
  useEffect(() => {
    if (!token) return;
    
    fetch(`/api/unsubscribe/verify?token=${token}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [token]);
  
  const handleUnsubscribe = async () => {
    setUnsubscribing(true);
    
    const res = await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    
    const result = await res.json();
    
    if (result.success) {
      setSuccess(true);
    }
    
    setUnsubscribing(false);
  };
  
  if (loading) return <LoadingState />;
  if (!data?.valid) return <InvalidTokenState />;
  if (data.already_unsubscribed) return <AlreadyUnsubscribedState data={data} />;
  if (success) return <SuccessState email={data.email} />;
  
  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">
        Desuscribirse de OpenClaw Meetups
      </h1>
      
      <p className="text-gray-600 mb-6">
        ¿Estás seguro que querés dejar de recibir emails de OpenClaw Meetups?
      </p>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-gray-500">Email:</p>
        <p className="font-semibold">{data.email}</p>
      </div>
      
      <p className="text-sm text-gray-600 mb-8">
        Si te desuscribís, no vas a recibir más:
      </p>
      
      <ul className="list-disc pl-6 mb-8 text-sm text-gray-700">
        <li>Invitaciones a próximos meetups</li>
        <li>Encuestas de feedback</li>
        <li>Actualizaciones sobre la comunidad</li>
      </ul>
      
      <div className="flex gap-4">
        <button
          onClick={handleUnsubscribe}
          disabled={unsubscribing}
          className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {unsubscribing ? 'Desuscribiendo...' : 'Sí, desuscribirme'}
        </button>
        
        <button
          onClick={() => window.close()}
          className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-6 text-center">
        Podés cambiar de opinión en cualquier momento contactándonos
      </p>
    </div>
  );
}
```

### Success State

```tsx
function SuccessState({ email }: { email: string }) {
  return (
    <div className="max-w-lg mx-auto p-8 text-center">
      <div className="mb-6">
        <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold mb-4">
        ¡Listo!
      </h1>
      
      <p className="text-gray-600 mb-6">
        Te desuscribiste correctamente de OpenClaw Meetups.
      </p>
      
      <p className="text-sm text-gray-500">
        No vas a recibir más emails en <strong>{email}</strong>
      </p>
      
      <p className="text-xs text-gray-400 mt-8">
        Si cambiás de opinión, contactanos a info@lacrypta.ar
      </p>
    </div>
  );
}
```

## Email Template Integration

### Footer Update (All Templates)

**Current footer:**
```html
<p style="margin: 20px 0 0; color: #aaa; font-size: 12px;">
  Si no querés recibir más emails, ignorá este mensaje.
</p>
```

**New footer:**
```html
<p style="margin: 20px 0 0; color: #aaa; font-size: 12px;">
  Si no querés recibir más emails, 
  <a href="https://meetups.lacrypta.ar/unsubscribe?token={{unsubscribe_token}}" 
     style="color: #ff8c00; text-decoration: underline;">
    desuscribite acá
  </a>.
</p>
```

### Variable Replacement

When generating email HTML, replace:
- `{{first_name}}` → Attendee's first name
- `{{email}}` → Attendee's email
- **`{{unsubscribe_token}}`** → Attendee's unique token

## Email Sending Logic

### Before (Current)

```typescript
// Send to all checked-in attendees
const recipients = await supabase
  .from('attendees')
  .select('*')
  .eq('status', 'checked-in');

for (const attendee of recipients) {
  await sendEmail(attendee);
}
```

### After (With Unsubscribe Filter)

```typescript
// Send only to subscribed checked-in attendees
const recipients = await supabase
  .from('attendees')
  .select('*')
  .eq('status', 'checked-in')
  .eq('unsubscribed', false);  // 👈 NEW: Filter out unsubscribed

let sent = 0;
let skipped = 0;

for (const attendee of recipients) {
  // Double-check (redundant but safe)
  if (attendee.unsubscribed) {
    skipped++;
    continue;
  }
  
  await sendEmail(attendee);
  sent++;
}

console.log(`✅ Sent: ${sent}, ⏭️  Skipped (unsubscribed): ${skipped}`);
```

## Campaign System Integration

When creating email campaigns (from FEATURE_EMAIL_CAMPAIGNS.md), apply unsubscribe filter:

```typescript
// Campaign recipient count (real-time)
const count = await supabase
  .from('attendees')
  .select('id', { count: 'exact', head: true })
  .eq('event_id', eventId)
  .in('status', filters.status)
  .eq('unsubscribed', false);  // 👈 Always filter

return { total_recipients: count };
```

## Analytics & Reporting

### Admin Dashboard: Unsubscribe Stats

```tsx
// Display in event analytics
interface UnsubscribeStats {
  total_attendees: number;
  unsubscribed_count: number;
  unsubscribe_rate: number;  // Percentage
  recent_unsubscribes: Array<{
    email: string;
    unsubscribed_at: Date;
    reason?: string;
  }>;
}
```

### Query

```sql
SELECT 
  COUNT(*) as total_attendees,
  COUNT(*) FILTER (WHERE unsubscribed = true) as unsubscribed_count,
  ROUND(
    (COUNT(*) FILTER (WHERE unsubscribed = true)::numeric / COUNT(*)::numeric) * 100, 
    2
  ) as unsubscribe_rate
FROM attendees
WHERE event_id = $1;
```

## Security Considerations

### 1. Token Security

- ✅ **DO:** Use UUID v4 (128-bit random, cryptographically secure)
- ✅ **DO:** Store token in indexed column for fast lookup
- ❌ **DON'T:** Use sequential IDs (guessable)
- ❌ **DON'T:** Encode attendee ID in URL (reversible)

### 2. Rate Limiting

Prevent abuse of unsubscribe endpoint:

```typescript
// api/unsubscribe/route.ts
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
});

export async function POST(request: Request) {
  try {
    await limiter.check(request, 10, 'UNSUBSCRIBE'); // 10 requests per minute
  } catch {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  
  // ... rest of unsubscribe logic
}
```

### 3. No Personal Data in URL

❌ **BAD:** `/unsubscribe?email=usuario@example.com&id=123`  
✅ **GOOD:** `/unsubscribe?token=550e8400-e29b-41d4-a716-446655440000`

Reason: URLs are logged in server logs, analytics, referrer headers, browser history.

## Testing Checklist

- [ ] Generate unsubscribe token for new attendee
- [ ] Verify token on landing page (valid)
- [ ] Verify token on landing page (invalid)
- [ ] Unsubscribe user successfully
- [ ] Try to unsubscribe same user twice (already unsubscribed message)
- [ ] Verify email is NOT sent to unsubscribed user
- [ ] Check unsubscribe link in email footer (all templates)
- [ ] Test with real Gmail/Outlook/Apple Mail clients
- [ ] Verify unsubscribe stats in admin dashboard
- [ ] Test rate limiting (10 requests in 1 minute)

## Implementation Phases

### Phase 1: Database (Day 1 - 2h)

- [ ] Create migration `20260225030000_add_unsubscribe_system.sql`
- [ ] Run migration on dev environment
- [ ] Generate tokens for existing attendees
- [ ] Verify indexes created

### Phase 2: API Routes (Day 1 - 3h)

- [ ] Implement `GET /api/unsubscribe/verify`
- [ ] Implement `POST /api/unsubscribe`
- [ ] Add rate limiting
- [ ] Write unit tests

### Phase 3: Frontend (Day 2 - 4h)

- [ ] Create `/unsubscribe` page
- [ ] Build confirmation UI
- [ ] Build success/error states
- [ ] Add loading states
- [ ] Test responsive design

### Phase 4: Email Integration (Day 2 - 2h)

- [ ] Update all email templates with unsubscribe link
- [ ] Add `{{unsubscribe_token}}` variable replacement
- [ ] Update email sending logic (filter unsubscribed)
- [ ] Test with real email send

### Phase 5: Analytics (Day 3 - 2h)

- [ ] Add unsubscribe stats to admin dashboard
- [ ] Create reports query
- [ ] Display recent unsubscribes with reasons
- [ ] Export functionality

### Phase 6: Testing & Deploy (Day 3 - 2h)

- [ ] Full end-to-end test
- [ ] Test with multiple email clients
- [ ] Verify GDPR compliance
- [ ] Deploy to production
- [ ] Monitor logs for 24h

**Total Estimated Effort:** 3 days (~15 hours)

## Success Metrics

1. **Unsubscribe Rate:** Target <2% after first send
2. **Page Load Time:** <1s for unsubscribe page
3. **Token Lookup:** <100ms average
4. **Zero Emails to Unsubscribed:** 100% filtering accuracy
5. **User Feedback:** Collect unsubscribe reasons for product insights

## Future Enhancements

### Phase 2 (Optional)

- **Granular Preferences:** Unsubscribe from specific types (only feedback emails, only event invites)
- **Re-subscribe:** Allow users to opt back in
- **Pause Instead of Unsubscribe:** "Pause for 3 months" option
- **Preference Center:** Full email preferences page

### Example Preference Center

```
Email Preferences for usuario@example.com

[ ] Event invitations
[x] Feedback requests (you'll receive these)
[ ] Community updates
[x] Reminders (you'll receive these)

[Save Preferences]
```

## Legal Compliance

### CAN-SPAM Act (US)

- ✅ Clear unsubscribe link in every email
- ✅ Process unsubscribe within 10 business days (we do instantly)
- ✅ Honor unsubscribe permanently

### GDPR (EU)

- ✅ Right to withdraw consent (opt-out)
- ✅ No re-subscribing without explicit consent
- ✅ Audit trail (unsubscribed_at timestamp)

## Related Documents

- `FEATURE_EMAIL_TEMPLATES.md` — Email template system
- `FEATURE_EMAIL_CAMPAIGNS.md` — Campaign sending system
- `MIGRATIONS.md` — Database migration process

---

**Status:** 📝 Specification Complete  
**Priority:** HIGH (required before mass email sends)  
**Effort:** 3 days (~15 hours)  
**Dependencies:** Email template system, Campaign system
