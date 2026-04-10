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

    // Fetch message counts and last message per session
    // Chunk the query to avoid PostgREST URL length limits with large IN clauses
    const sessionIds = sessions.map((s: { id: string }) => s.id);

    const countMap: Record<string, number> = {};
    const lastMsgMap: Record<string, { content: string; role: string; created_at: string } | null> = {};
    for (const sid of sessionIds) {
      countMap[sid] = 0;
      lastMsgMap[sid] = null;
    }

    const CHUNK = 30;
    const chunks: string[][] = [];
    for (let i = 0; i < sessionIds.length; i += CHUNK) {
      chunks.push(sessionIds.slice(i, i + CHUNK));
    }

    await Promise.all(
      chunks.map(async (chunk) => {
        const { data: msgs } = await supabase
          .from('messages')
          .select('session_id, content, role, created_at')
          .in('session_id', chunk)
          .order('created_at', { ascending: false })
          .limit(5000);

        if (msgs) {
          for (const msg of msgs) {
            if (countMap[msg.session_id] !== undefined) {
              countMap[msg.session_id]++;
              if (!lastMsgMap[msg.session_id]) {
                lastMsgMap[msg.session_id] = { content: msg.content, role: msg.role, created_at: msg.created_at };
              }
            }
          }
        }
      })
    );

    const enriched = sessions.map((s: Record<string, unknown>) => ({
      ...s,
      message_count: countMap[s.id as string] ?? 0,
      last_message: lastMsgMap[s.id as string] ?? null,
    }));

    return NextResponse.json({ sessions: enriched });
  } catch (error) {
    console.error('messaging-sessions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
