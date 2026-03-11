import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { event_id, segment } = body;

    if (!event_id || !segment) {
      return NextResponse.json(
        { error: 'event_id and segment are required' },
        { status: 400 }
      );
    }

    // Verify campaign exists and is pending
    const { data: job, error: jobError } = await supabase
      .from('email_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (job.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only import recipients to pending campaigns' },
        { status: 400 }
      );
    }

    // Query attendees based on segment
    let query = supabase
      .from('event_attendees')
      .select('user_id, users!inner(id, name, email)')
      .eq('event_id', event_id);

    switch (segment) {
      case 'all':
        // No additional filter
        break;
      case 'approved':
        query = query.eq('status', 'approved');
        break;
      case 'waitlist':
        query = query.eq('status', 'waitlist');
        break;
      case 'checked-in':
        query = query.eq('checked_in', true);
        break;
      case 'no-show':
        query = query.eq('status', 'approved').eq('checked_in', false);
        break;
      default:
        return NextResponse.json({ error: 'Invalid segment' }, { status: 400 });
    }

    const { data: attendeeRows, error: attendeeError } = await query;

    if (attendeeError) {
      console.error('Attendee query error:', attendeeError);
      return NextResponse.json({ error: 'Failed to query attendees' }, { status: 500 });
    }

    const attendees = (attendeeRows || []).map((row: Record<string, unknown>) => {
      const user = row.users as Record<string, unknown>;
      return {
        user_id: row.user_id as string,
        email: user.email as string,
        name: user.name as string,
      };
    });

    if (attendees.length === 0) {
      return NextResponse.json({ error: 'No se encontraron asistentes para este segmento' }, { status: 400 });
    }

    // Get existing emails in this campaign to deduplicate
    const { data: existingSends } = await supabase
      .from('email_sends')
      .select('email')
      .eq('job_id', id);

    const existingEmails = new Set((existingSends || []).map((s: { email: string }) => s.email.toLowerCase()));

    // Filter out duplicates
    const newAttendees = attendees.filter(
      (a: { email: string }) => !existingEmails.has(a.email.toLowerCase())
    );

    if (newAttendees.length === 0) {
      return NextResponse.json({
        message: 'Todos los contactos ya estaban importados',
        imported: 0,
        total_contacts: existingEmails.size,
      });
    }

    // Insert new sends
    const sends = newAttendees.map((a: { user_id: string; email: string }) => ({
      job_id: id,
      user_id: a.user_id,
      email: a.email,
      status: 'pending',
      attempts: 0,
    }));

    const { error: sendsError } = await supabase.from('email_sends').insert(sends);

    if (sendsError) {
      console.error('Sends insert error:', sendsError);
      return NextResponse.json({ error: 'Failed to import recipients' }, { status: 500 });
    }

    // Update total_contacts
    const newTotal = existingEmails.size + newAttendees.length;
    await supabase
      .from('email_jobs')
      .update({ total_contacts: newTotal })
      .eq('id', id);

    return NextResponse.json({
      message: `${newAttendees.length} contactos importados`,
      imported: newAttendees.length,
      skipped: attendees.length - newAttendees.length,
      total_contacts: newTotal,
    });
  } catch (error) {
    console.error('Campaign import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
