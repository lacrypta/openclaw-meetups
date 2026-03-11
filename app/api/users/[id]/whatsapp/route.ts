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

  const { id } = await params;

  // Get all sessions for this user
  const { data: sessions, error: sessError } = await supabase
    .from('messaging_sessions')
    .select('id, phone, status, created_at, updated_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  if (sessError) {
    return NextResponse.json({ error: sessError.message }, { status: 500 });
  }

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ sessions: [], messages: [] });
  }

  // Get messages for all sessions
  const sessionIds = sessions.map((s) => s.id);
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('id, session_id, role, content, created_at')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({ sessions, messages: messages || [] });
}
