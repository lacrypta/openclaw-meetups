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

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.email) {
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

    // Send confirmation email
    await sendConfirmationEmail(user.email, user.name, event.name);

    // Mark as confirmed
    await supabase
      .from('event_attendees')
      .update({ attendance_confirmed: true })
      .eq('event_id', eventId)
      .eq('user_id', user_id);

    return NextResponse.json({ ok: true, sent_to: user.email });
  } catch (error) {
    console.error('Send confirmation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send confirmation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
