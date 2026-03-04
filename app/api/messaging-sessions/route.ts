/**
 * GET /api/messaging-sessions
 *
 * List messaging sessions with optional filters:
 *   ?user_id=<uuid>
 *   ?event_id=<uuid>
 *   ?status=active|closed|archived
 *
 * Requires JWT auth (admin only).
 */

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
    const userId = searchParams.get('user_id');
    const eventId = searchParams.get('event_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('messaging_sessions')
      .select(`
        *,
        users (id, name, email, phone),
        master_prompts (id, name)
      `)
      .order('created_at', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (eventId) query = query.eq('event_id', eventId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) {
      console.error('messaging_sessions fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions: data || [] });
  } catch (error) {
    console.error('messaging-sessions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
