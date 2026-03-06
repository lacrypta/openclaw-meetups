/**
 * POST /api/webhooks/wasender
 *
 * Receives inbound WhatsApp messages from WaSenderAPI.
 * Simple flow:
 *   1. Verify webhook secret
 *   2. Extract phone + message text
 *   3. Find user by phone
 *   4. If message is "si" (or variants) → confirm attendance for latest event
 *   5. Reply via WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/wasender';
import { confirmAttendance, declineAttendance } from '@/lib/confirm-attendance';
import { getWaSenderConfig } from '@/lib/integrations';

/** Normalize message for intent matching */
function normalizeMessage(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .trim();
}

const CONFIRM_KEYWORDS = ['si', 'sí', 'yes', 'confirmo', 'confirmar', 'voy', '1'];
const DECLINE_KEYWORDS = ['no', 'cancelo', 'cancelar', 'no voy', '2'];

/** Verify webhook authenticity */
async function verifyWebhook(request: NextRequest): Promise<boolean> {
  const config = await getWaSenderConfig();
  const secret = config.webhook_secret;
  if (!secret) return true;
  const provided = request.headers.get('x-wasender-secret') ||
    request.headers.get('authorization')?.replace('Bearer ', '') || '';
  return provided === secret;
}

export async function POST(request: NextRequest) {
  if (!(await verifyWebhook(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Extract phone and message — WaSenderAPI payload format
    const phone: string = body.from || body.phone || body.data?.from || '';
    const messageText: string = body.text || body.body || body.message || body.data?.body || '';

    if (!phone || !messageText) {
      return NextResponse.json({ ok: true, note: 'no phone or message, ignored' });
    }

    // Normalize phone (strip non-digits, ensure + prefix)
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const phoneVariants = [
      cleanPhone,
      cleanPhone.startsWith('+') ? cleanPhone.slice(1) : `+${cleanPhone}`,
    ];

    // Find user by phone
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .or(phoneVariants.map(p => `phone.eq.${p}`).join(','))
      .maybeSingle();

    if (!user) {
      console.warn(`WhatsApp message from unknown phone: ${cleanPhone}`);
      return NextResponse.json({ ok: true, note: 'unknown user' });
    }

    // Find latest pending (waitlist) event attendance for this user
    const { data: attendee } = await supabase
      .from('event_attendees')
      .select('id, event_id, attendance_confirmed, status, events(name)')
      .eq('user_id', user.id)
      .eq('attendance_confirmed', false)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    const normalized = normalizeMessage(messageText);
    const isConfirm = CONFIRM_KEYWORDS.includes(normalized);
    const isDecline = DECLINE_KEYWORDS.includes(normalized);
    const eventData = attendee?.events as any;
    const eventName = eventData?.name || 'el evento';
    const firstName = user.name?.split(' ')[0] || '';

    if (isConfirm && attendee) {
      await confirmAttendance(attendee.id);

      try {
        await sendWhatsAppMessage(
          user.phone || cleanPhone,
          `✅ ¡Listo, ${firstName}! Tu asistencia a *${eventName}* está confirmada.\n\n¡Te esperamos! ⚡`
        );
      } catch (err) {
        console.error('Failed to send WhatsApp reply:', err);
      }

      return NextResponse.json({ ok: true, intent: 'confirmed', user_id: user.id });
    }

    if (isDecline && attendee) {
      await declineAttendance(attendee.id);

      try {
        await sendWhatsAppMessage(
          user.phone || cleanPhone,
          `❌ Entendido, ${firstName}. Cancelamos tu lugar en *${eventName}*.\n\nSi cambiás de opinión, respondé *si*. ¡Saludos!`
        );
      } catch (err) {
        console.error('Failed to send WhatsApp reply:', err);
      }

      return NextResponse.json({ ok: true, intent: 'declined', user_id: user.id });
    }

    // No matching intent or no pending attendance — ignore silently
    return NextResponse.json({ ok: true, intent: 'none', note: 'no actionable intent or no pending attendance' });

  } catch (error) {
    console.error('WaSender webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
