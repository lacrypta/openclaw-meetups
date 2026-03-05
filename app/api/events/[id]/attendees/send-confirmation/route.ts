/**
 * POST /api/events/[id]/attendees/send-confirmation
 *
 * Manually send a confirmation email to a user.
 * Body: { user_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';
import { sendConfirmationEmail } from '@/lib/email-sender';

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
      .select('id, confirmation_token, users(name, email)')
      .eq('event_id', eventId)
      .eq('user_id', user_id)
      .maybeSingle();

    if (attendeeError || !attendee) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 });
    }

    const userData = attendee.users as unknown as { name: string; email: string } | null;
    if (!userData?.email) {
      return NextResponse.json({ error: 'User has no email' }, { status: 400 });
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
    const confirmationLink = confirmationToken
      ? `${baseUrl}/confirm/${confirmationToken}`
      : undefined;

    // Send confirmation email with token-based link
    await sendConfirmationEmail(
      userData.email,
      userData.name,
      event.name,
      confirmationLink,
      confirmationToken ?? undefined
    );

    // Mark email as sent
    await supabase
      .from('event_attendees')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        email_type: 'confirmation',
      })
      .eq('id', attendee.id);

    return NextResponse.json({ ok: true, sent_to: userData.email });
  } catch (error) {
    console.error('Send confirmation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send confirmation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
