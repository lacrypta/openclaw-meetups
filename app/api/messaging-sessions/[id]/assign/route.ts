/**
 * PATCH /api/messaging-sessions/[id]/assign
 *
 * Assign or reassign a user to a messaging session.
 * Body: { user_id: string | null }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';
import { eventBus } from '@/lib/event-bus';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { user_id } = await request.json();

  const { error } = await supabase
    .from('messaging_sessions')
    .update({ user_id: user_id || null, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  eventBus.publish({ type: 'session.updated', data: { id, user_id: user_id || null, updated_at: new Date().toISOString() } });

  return NextResponse.json({ ok: true });
}
