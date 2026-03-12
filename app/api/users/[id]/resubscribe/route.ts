import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'admin');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabase
    .from('users')
    .update({ subscribed: true, unsubscribed_at: null })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to resubscribe user' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
