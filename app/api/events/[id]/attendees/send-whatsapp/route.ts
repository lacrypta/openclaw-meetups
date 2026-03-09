/**
 * POST /api/events/[id]/attendees/send-whatsapp
 *
 * Manually send a WhatsApp confirmation message to a user.
 * Body: { user_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';
import { sendWhatsAppMessage } from '@/lib/wasender';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: eventId } = await params;

  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Get attendee record with confirmation_token
    const { data: attendee, error: attendeeError } = await supabase
      .from('event_attendees')
      .select('id, confirmation_token, users(name, email, phone)')
      .eq('event_id', eventId)
      .eq('user_id', user_id)
      .maybeSingle();

    if (attendeeError || !attendee) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 });
    }

    const userData = attendee.users as unknown as { name: string; email: string; phone: string | null } | null;
    if (!userData?.phone) {
      return NextResponse.json({ error: 'User has no phone number' }, { status: 400 });
    }

    // Get event info
    const { data: event, error: evtError } = await supabase
      .from('events')
      .select('name')
      .eq('id', eventId)
      .single();

    if (evtError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://openclaw.lacrypta.ar';
    const confirmationToken = attendee.confirmation_token as string | null;
    const confirmLink = confirmationToken
      ? `${baseUrl}/confirm/${confirmationToken}`
      : null;

    const firstName = userData.name?.split(' ')[0] || userData.name || '';
    const eventLabel = event.name ? ` a *${event.name}*` : ' al próximo OpenClaw Meetup';

    const message = confirmLink
      ? `¡Hola ${firstName}! 👋\n\n` +
        `Te registraste${eventLabel}. 🎉\n\n` +
        `Confirmá tu asistencia acá:\n${confirmLink}\n\n` +
        `O respondé *si* a este mensaje. ¡Te esperamos! ⚡`
      : `¡Hola ${firstName}! 👋\n\n` +
        `Te registraste${eventLabel}. 🎉\n\n` +
        `Respondé *si* para confirmar tu asistencia. ¡Te esperamos! ⚡`;

    await sendWhatsAppMessage(userData.phone, message);

    // Mark WhatsApp as sent
    await supabase
      .from('event_attendees')
      .update({
        whatsapp_sent: true,
        whatsapp_sent_at: new Date().toISOString(),
      })
      .eq('id', attendee.id);

    return NextResponse.json({ ok: true, sent_to: userData.phone });
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send WhatsApp';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
