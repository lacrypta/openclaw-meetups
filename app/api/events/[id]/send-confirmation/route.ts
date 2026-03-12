import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';
import { send } from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: eventId } = await params;

  let body: { user_ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { user_ids } = body;
  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({ error: 'user_ids array is required' }, { status: 400 });
  }

  // Fetch event info
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://openclaw.lacrypta.ar';
  let sentCount = 0;
  const errors: { user_id: string; error: string }[] = [];

  for (const userId of user_ids) {
    try {
      // Get attendee record with confirmation_token
      const { data: attendee, error: attendeeError } = await supabase
        .from('event_attendees')
        .select('id, confirmation_token, users(name, email)')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (attendeeError || !attendee) {
        errors.push({ user_id: userId, error: 'Attendee not found' });
        continue;
      }

      const userData = attendee.users as any;
      const userEmail = userData?.email;
      const userName = userData?.name || 'Asistente';

      if (!userEmail) {
        errors.push({ user_id: userId, error: 'User has no email' });
        continue;
      }

      if (!attendee.confirmation_token) {
        errors.push({ user_id: userId, error: 'No confirmation token generated yet' });
        continue;
      }

      const confirmationLink = `${baseUrl}/confirm/${attendee.confirmation_token}`;
      const firstName = userName.split(' ')[0];

      await send({
        to: userEmail,
        segment: 'confirmation',
        variables: {
          name: userName,
          first_name: firstName,
          email: userEmail,
          event_name: event.name,
          confirmation_link: confirmationLink,
        },
      });

      // Mark email as sent
      await supabase
        .from('event_attendees')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          email_type: 'confirmation',
        })
        .eq('id', attendee.id);

      sentCount++;
    } catch (err: any) {
      errors.push({ user_id: userId, error: err?.message || 'Unknown error' });
    }
  }

  return NextResponse.json({
    sent: sentCount,
    total: user_ids.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
