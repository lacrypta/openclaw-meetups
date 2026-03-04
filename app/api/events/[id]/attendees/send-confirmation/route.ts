/**
 * POST /api/events/[id]/attendees/send-confirmation
 *
 * Manually send a confirmation email to an attendee.
 * Body: { attendee_id: number }
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
    const { attendee_id } = await request.json();

    if (!attendee_id) {
      return NextResponse.json({ error: 'attendee_id is required' }, { status: 400 });
    }

    // Get attendee info
    const { data: attendee, error: attError } = await supabase
      .from('attendees')
      .select('id, name, email')
      .eq('id', attendee_id)
      .single();

    if (attError || !attendee) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 });
    }

    if (!attendee.email) {
      return NextResponse.json({ error: 'Attendee has no email' }, { status: 400 });
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

    // Send confirmation email
    await sendConfirmationEmail(attendee.email, attendee.name, event.name);

    // Mark as confirmed
    await supabase
      .from('event_attendees')
      .update({ attendance_confirmed: true })
      .eq('event_id', eventId)
      .eq('attendee_id', attendee_id);

    return NextResponse.json({ ok: true, sent_to: attendee.email });
  } catch (error) {
    console.error('Send confirmation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send confirmation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
