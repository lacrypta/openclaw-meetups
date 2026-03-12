/**
 * GET /api/messaging-sessions
 *
 * List messaging sessions with user info, event name, last message preview, and message count.
 * Ordered by updated_at DESC.
 *
 * Requires JWT auth (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const eventId = searchParams.get('event_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('messaging_sessions')
      .select(`
        *,
        users (id, name, email, phone),
        events (id, name)
      `)
      .order('updated_at', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (eventId) query = query.eq('event_id', eventId);
    if (status) query = query.eq('status', status);

    const { data: sessions, error } = await query;

    if (error) {
      console.error('messaging_sessions fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    // Fetch last message and message count for each session
    const sessionIds = sessions.map((s: { id: string }) => s.id);

    const { data: messages } = await supabase
      .from('messages')
      .select('session_id, content, role, created_at')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false });

    // Group by session_id
    const msgBySession: Record<string, { count: number; last: { content: string; role: string; created_at: string } | null }> = {};
    for (const sid of sessionIds) {
      msgBySession[sid] = { count: 0, last: null };
    }
    if (messages) {
      for (const msg of messages) {
        const entry = msgBySession[msg.session_id];
        if (entry) {
          entry.count++;
          if (!entry.last) entry.last = msg;
        }
      }
    }

    const enriched = sessions.map((s: Record<string, unknown>) => ({
      ...s,
      message_count: msgBySession[s.id as string]?.count ?? 0,
      last_message: msgBySession[s.id as string]?.last ?? null,
    }));

    return NextResponse.json({ sessions: enriched });
  } catch (error) {
    console.error('messaging-sessions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
