import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole, authenticateRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;

  const { data, error } = await supabase
    .from('event_talks')
    .select(`
      *,
      talk:talks(
        *,
        speaker:users!talks_speaker_id_fkey(id, name, speaker_photo, speaker_tagline)
      )
    `)
    .eq('event_id', eventId)
    .order('sort_order');

  if (error) {
    console.error('Lineup GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch lineup' }, { status: 500 });
  }

  return NextResponse.json({ lineup: data || [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const auth = await requireRole(request, 'manager');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { talk_id, start_time, end_time, room, sort_order } = await request.json();

    if (!talk_id) return NextResponse.json({ error: 'talk_id is required' }, { status: 400 });

    // Get max sort_order if not provided
    let order = sort_order;
    if (order === undefined) {
      const { data: existing } = await supabase
        .from('event_talks')
        .select('sort_order')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: false })
        .limit(1);
      order = existing && existing.length > 0 ? (existing[0].sort_order + 1) : 0;
    }

    const { data, error } = await supabase
      .from('event_talks')
      .insert({ event_id: eventId, talk_id, start_time: start_time || null, end_time: end_time || null, room: room || null, sort_order: order })
      .select(`*, talk:talks(*, speaker:users!talks_speaker_id_fkey(id, name, speaker_photo, speaker_tagline))`)
      .single();

    if (error) throw error;

    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (error) {
    console.error('Lineup POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const auth = await requireRole(request, 'manager');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { event_talk_id, start_time, end_time, room, sort_order } = await request.json();
    if (!event_talk_id) return NextResponse.json({ error: 'event_talk_id is required' }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (room !== undefined) updates.room = room;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    const { data, error } = await supabase
      .from('event_talks')
      .update(updates)
      .eq('id', event_talk_id)
      .select(`*, talk:talks(*, speaker:users!talks_speaker_id_fkey(id, name, speaker_photo, speaker_tagline))`)
      .single();

    if (error) throw error;

    return NextResponse.json({ entry: data });
  } catch (error) {
    console.error('Lineup PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const auth = await requireRole(request, 'manager');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { event_talk_id } = await request.json();
    if (!event_talk_id) return NextResponse.json({ error: 'event_talk_id is required' }, { status: 400 });

    const { error } = await supabase.from('event_talks').delete().eq('id', event_talk_id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lineup DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
