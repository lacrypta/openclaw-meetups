import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: eventId } = await params;

  try {
    const { data, error } = await supabase
      .from('event_attendees')
      .select(`
        id,
        event_id,
        attendee_id,
        status,
        checked_in,
        registered_at,
        notes,
        attendees (
          name,
          email
        )
      `)
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (error) {
      console.error('Event attendees fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 });
    }

    const attendees = (data || []).map((ea: any) => ({
      id: ea.id,
      event_id: ea.event_id,
      attendee_id: ea.attendee_id,
      status: ea.status,
      checked_in: ea.checked_in,
      registered_at: ea.registered_at,
      notes: ea.notes,
      name: ea.attendees?.name || '',
      email: ea.attendees?.email || '',
      pubkey: null,
    }));

    return NextResponse.json({ attendees });
  } catch (error) {
    console.error('Event attendees GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const body = await request.json();
    const { attendee_id, status, notes } = body;

    if (!attendee_id) {
      return NextResponse.json({ error: 'attendee_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('event_attendees')
      .insert({
        event_id: eventId,
        attendee_id,
        status: status || 'waitlist',
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Add attendee error:', error);
      return NextResponse.json({ error: 'Failed to add attendee' }, { status: 500 });
    }

    return NextResponse.json({ attendee: data }, { status: 201 });
  } catch (error) {
    console.error('Event attendees POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: eventId } = await params;

  try {
    const body = await request.json();
    const { attendee_id, status, checked_in, notes } = body;

    if (!attendee_id) {
      return NextResponse.json({ error: 'attendee_id is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (status !== undefined) updates.status = status;
    if (checked_in !== undefined) updates.checked_in = checked_in;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('event_attendees')
      .update(updates)
      .eq('event_id', eventId)
      .eq('attendee_id', attendee_id)
      .select()
      .single();

    if (error) {
      console.error('Update attendee error:', error);
      return NextResponse.json({ error: 'Failed to update attendee' }, { status: 500 });
    }

    return NextResponse.json({ attendee: data });
  } catch (error) {
    console.error('Event attendees PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
