import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: eventId } = await params;

  try {
    const { data, error } = await supabase
      .from('event_attendees')
      .select(`
        id,
        event_id,
        user_id,
        status,
        checked_in,
        attendance_confirmed,
        registered_at,
        notes,
        users (
          name,
          email,
          phone
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
      user_id: ea.user_id,
      status: ea.status,
      checked_in: ea.checked_in,
      attendance_confirmed: ea.attendance_confirmed || false,
      registered_at: ea.registered_at,
      notes: ea.notes,
      name: ea.users?.name || '',
      email: ea.users?.email || '',
      phone: ea.users?.phone || null,

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
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: eventId } = await params;

  try {
    const body = await request.json();
    const { user_id, status, notes } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('event_attendees')
      .insert({
        event_id: eventId,
        user_id,
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
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: eventId } = await params;

  try {
    const body = await request.json();
    const { user_id, status, checked_in, notes } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (status !== undefined) updates.status = status;
    if (checked_in !== undefined) updates.checked_in = checked_in;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('event_attendees')
      .update(updates)
      .eq('event_id', eventId)
      .eq('user_id', user_id)
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
