import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('events')
      .select(`
        *,
        event_attendees (
          id,
          status,
          checked_in
        )
      `)
      .order('date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Events fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    const events = (data || []).map((event: any) => {
      const attendees = event.event_attendees || [];
      return {
        ...event,
        event_attendees: undefined,
        attendee_count: attendees.length,
        approved_count: attendees.filter((a: any) => a.status === 'approved').length,
        checked_in_count: attendees.filter((a: any) => a.checked_in).length,
      };
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Events GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, date, location, capacity, status, image_url } = body;

    if (!name || !date) {
      return NextResponse.json({ error: 'Name and date are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        name,
        description: description || null,
        date,
        location: location || null,
        capacity: capacity || null,
        status: status || 'draft',
        image_url: image_url || null,
        created_by: pubkey,
      })
      .select()
      .single();

    if (error) {
      console.error('Event create error:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error) {
    console.error('Events POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
