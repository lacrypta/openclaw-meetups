import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';
import type { EmailJobSegment } from '@/lib/types';

export async function GET(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('email_jobs')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Campaigns fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    return NextResponse.json({ campaigns: data || [] });
  } catch (error) {
    console.error('Campaigns GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const VALID_SEGMENTS: EmailJobSegment[] = ['checked-in', 'no-show', 'waitlist'];

export async function POST(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { event_id, segment, template_id, subject, integration_id } = body;

    if (!event_id || !segment || !template_id || !subject || !integration_id) {
      return NextResponse.json(
        { error: 'event_id, segment, template_id, subject, and integration_id are required' },
        { status: 400 }
      );
    }

    if (!VALID_SEGMENTS.includes(segment)) {
      return NextResponse.json({ error: 'Invalid segment' }, { status: 400 });
    }

    // Resolve segment to attendees
    let query = supabase
      .from('event_attendees')
      .select('attendee_id, attendees!inner(id, name, email)')
      .eq('event_id', event_id);

    switch (segment as EmailJobSegment) {
      case 'checked-in':
        query = query.eq('checked_in', true);
        break;
      case 'no-show':
        query = query.eq('status', 'approved').eq('checked_in', false);
        break;
      case 'waitlist':
        query = query.eq('status', 'waitlist');
        break;
    }

    const { data: attendeeRows, error: attendeeError } = await query;

    if (attendeeError) {
      console.error('Attendee query error:', attendeeError);
      return NextResponse.json({ error: 'Failed to query attendees' }, { status: 500 });
    }

    const attendees = (attendeeRows || []).map((row: Record<string, unknown>) => {
      const att = row.attendees as Record<string, unknown>;
      return {
        attendee_id: row.attendee_id as number,
        email: att.email as string,
      };
    });

    if (attendees.length === 0) {
      return NextResponse.json({ error: 'No attendees found for this segment' }, { status: 400 });
    }

    // Create email job
    const { data: job, error: jobError } = await supabase
      .from('email_jobs')
      .insert({
        event_id,
        segment,
        template_id,
        subject,
        status: 'pending',
        total_contacts: attendees.length,
        sent_count: 0,
        failed_count: 0,
        cursor: 0,
        errors: [],
        config: { integration_id },
        created_by: pubkey,
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Job create error:', jobError);
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    // Bulk insert email sends
    const sends = attendees.map((a: { attendee_id: number; email: string }) => ({
      job_id: job.id,
      attendee_id: a.attendee_id,
      email: a.email,
      status: 'pending',
      attempts: 0,
    }));

    const { error: sendsError } = await supabase.from('email_sends').insert(sends);

    if (sendsError) {
      console.error('Sends insert error:', sendsError);
      // Clean up the job
      await supabase.from('email_jobs').delete().eq('id', job.id);
      return NextResponse.json({ error: 'Failed to create email sends' }, { status: 500 });
    }

    return NextResponse.json({ campaign: job }, { status: 201 });
  } catch (error) {
    console.error('Campaigns POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
