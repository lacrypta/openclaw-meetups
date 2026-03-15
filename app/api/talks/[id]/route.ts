import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: talk, error } = await supabase
    .from('talks')
    .select(`*, speaker:users!talks_speaker_id_fkey(id, name, speaker_photo, speaker_tagline)`)
    .eq('id', id)
    .single();

  if (error || !talk) {
    return NextResponse.json({ error: 'Talk not found' }, { status: 404 });
  }

  // Draft talks are speaker-only
  if (talk.status !== 'approved') {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const isAdmin = auth.role === 'admin' || auth.role === 'manager';
    if (!isAdmin && auth.userId !== talk.speaker_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.json({ talk });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: talk } = await supabase.from('talks').select('*').eq('id', id).single();
  if (!talk) return NextResponse.json({ error: 'Talk not found' }, { status: 404 });

  const isAdmin = auth.role === 'admin' || auth.role === 'manager';
  if (!isAdmin && auth.userId !== talk.speaker_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, duration_minutes, format, tags, slides_url, status } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
  if (format !== undefined) updates.format = format;
  if (tags !== undefined) updates.tags = tags;
  if (slides_url !== undefined) updates.slides_url = slides_url;

  // Status changes: speaker can submit, admin can approve/reject
  if (status !== undefined) {
    if (isAdmin) {
      updates.status = status;
    } else if (status === 'submitted' && talk.status === 'draft') {
      updates.status = status;
    } else if (status === 'draft' && talk.status === 'submitted') {
      updates.status = status;
    }
  }

  const { data, error } = await supabase
    .from('talks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Talk PUT error:', error);
    return NextResponse.json({ error: 'Failed to update talk' }, { status: 500 });
  }

  return NextResponse.json({ talk: data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: talk } = await supabase.from('talks').select('*').eq('id', id).single();
  if (!talk) return NextResponse.json({ error: 'Talk not found' }, { status: 404 });

  const isAdmin = auth.role === 'admin' || auth.role === 'manager';
  if (!isAdmin && auth.userId !== talk.speaker_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check if talk is assigned to any event (unless admin)
  if (!isAdmin) {
    const { data: assigned } = await supabase
      .from('event_talks')
      .select('id')
      .eq('talk_id', id)
      .limit(1);

    if (assigned && assigned.length > 0) {
      return NextResponse.json({ error: 'Cannot delete a talk assigned to an event' }, { status: 400 });
    }
  }

  const { error } = await supabase.from('talks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete talk' }, { status: 500 });

  return NextResponse.json({ success: true });
}
