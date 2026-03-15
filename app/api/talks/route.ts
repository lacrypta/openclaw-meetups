import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole, authenticateRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const speakerId = searchParams.get('speaker_id');
    const status = searchParams.get('status');
    const eventId = searchParams.get('event_id');

    if (eventId) {
      // Return talks for a specific event (via event_talks join)
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

      if (error) throw error;
      return NextResponse.json({ talks: data || [] });
    }

    let query = supabase
      .from('talks')
      .select(`
        *,
        speaker:users!talks_speaker_id_fkey(id, name, speaker_photo, speaker_tagline)
      `);

    if (speakerId) {
      // Only allow seeing own drafts
      if (speakerId !== auth.userId) {
        query = query.eq('speaker_id', speakerId).eq('status', 'approved');
      } else {
        query = query.eq('speaker_id', speakerId);
      }
    } else if (status) {
      query = query.eq('status', status);
    } else {
      // Default: show approved talks or own talks
      const roleHierarchy: Record<string, number> = { guest: 0, manager: 1, admin: 2 };
      if (roleHierarchy[auth.role] >= 1) {
        // managers/admins see all
      } else {
        // guests see approved + their own
        query = query.or(`status.eq.approved,speaker_id.eq.${auth.userId}`);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ talks: data || [] });
  } catch (error) {
    console.error('Talks GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'guest');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user is a speaker
    const { data: user } = await supabase
      .from('users')
      .select('is_speaker')
      .eq('id', auth.userId)
      .single();

    if (!user?.is_speaker) {
      return NextResponse.json({ error: 'Only speakers can create talks' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, duration_minutes, format, tags, slides_url } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('talks')
      .insert({
        speaker_id: auth.userId,
        title,
        description: description || null,
        duration_minutes: duration_minutes || 30,
        format: format || 'talk',
        tags: tags || null,
        slides_url: slides_url || null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ talk: data }, { status: 201 });
  } catch (error) {
    console.error('Talks POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
