import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';
import { sendWhatsAppMessage } from '@/lib/wasender';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json();
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // Get session with phone number
  const { data: session, error: sessError } = await supabase
    .from('messaging_sessions')
    .select('id, phone, status')
    .eq('id', id)
    .single();

  if (sessError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (!session.phone) {
    return NextResponse.json({ error: 'Session has no phone number' }, { status: 400 });
  }

  try {
    // Send via WaSender
    await sendWhatsAppMessage(session.phone, message);

    // Save to DB as assistant message (sent by admin)
    const { data: saved, error: saveError } = await supabase
      .from('messages')
      .insert({
        session_id: id,
        role: 'assistant',
        content: message,
        provider: 'manual',
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save message:', saveError);
    }

    return NextResponse.json({ success: true, message: saved });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
