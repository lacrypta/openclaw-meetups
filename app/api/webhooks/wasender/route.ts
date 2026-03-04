/**
 * POST /api/webhooks/wasender
 *
 * Receives inbound WhatsApp messages from WaSenderAPI.
 * Flow:
 *   1. Extract phone + message text from payload
 *   2. Find user by phone
 *   3. Find active messaging session for user
 *   4. Save inbound message (role: user)
 *   5. Generate AI response
 *   6. Parse [CONFIRMED] / [DECLINED] intent keywords
 *   7. Save AI response (role: assistant)
 *   8. Send reply via WaSender
 *   9. Handle confirmation/decline side effects
 *
 * No JWT auth — uses WaSender's own delivery mechanism.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateResponse } from '@/lib/ai-engine';
import { sendWhatsAppMessage } from '@/lib/wasender';

const CONFIRMED_TAG = '[CONFIRMED]';
const DECLINED_TAG = '[DECLINED]';

/** Strip intent tags from AI content before sending to user */
function stripTags(content: string): string {
  return content
    .replace(CONFIRMED_TAG, '')
    .replace(DECLINED_TAG, '')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Extract phone and message text
    // WaSender webhook payload shape (adapt if needed):
    // { from: "+5491154177572", text: "sí", messageId: "..." }
    const phone: string = body.from || body.phone || '';
    const messageText: string = body.text || body.body || body.message || '';
    const wasenderMessageId: string = body.messageId || body.id || '';

    if (!phone || !messageText) {
      return NextResponse.json({ error: 'phone and message text are required' }, { status: 400 });
    }

    // 2. Find user by phone
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('phone', phone)
      .maybeSingle();

    if (userError) {
      console.error('User lookup error:', userError);
      return NextResponse.json({ error: 'Failed to lookup user' }, { status: 500 });
    }

    if (!user) {
      // Unknown user — ignore or create on the fly
      console.warn(`Received message from unknown phone: ${phone}`);
      return NextResponse.json({ ok: true, note: 'unknown user, ignored' });
    }

    // 3. Find active messaging session for this user
    const { data: session, error: sessionError } = await supabase
      .from('messaging_sessions')
      .select('id, event_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('Session lookup error:', sessionError);
      return NextResponse.json({ error: 'Failed to lookup session' }, { status: 500 });
    }

    if (!session) {
      console.warn(`No active session for user ${user.id}`);
      return NextResponse.json({ ok: true, note: 'no active session' });
    }

    // 4. Save inbound message
    const { error: inboundError } = await supabase.from('messages').insert({
      session_id: session.id,
      role: 'user',
      content: messageText,
      wasender_message_id: wasenderMessageId || null,
    });

    if (inboundError) {
      console.error('Failed to save inbound message:', inboundError);
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    // 5. Generate AI response
    const aiResult = await generateResponse(session.id, messageText);

    // 6. Parse intent
    const rawContent = aiResult.content;
    const isConfirmed = rawContent.startsWith(CONFIRMED_TAG);
    const isDeclined = rawContent.startsWith(DECLINED_TAG);
    const cleanContent = stripTags(rawContent);

    // 7. Save AI response
    const { error: outboundError } = await supabase.from('messages').insert({
      session_id: session.id,
      role: 'assistant',
      content: cleanContent,
      model_used: aiResult.model,
      provider: aiResult.provider,
      tokens_in: aiResult.tokensIn,
      tokens_out: aiResult.tokensOut,
    });

    if (outboundError) {
      console.warn('Failed to save assistant message:', outboundError);
    }

    // 8. Send reply via WaSender
    await sendWhatsAppMessage(phone, cleanContent);

    // 9. Handle side effects
    if (isConfirmed && session.event_id) {
      // Mark attendance as confirmed
      await supabase
        .from('event_attendees')
        .update({ attendance_confirmed: true })
        .eq('event_id', session.event_id);

      // Close the session
      await supabase
        .from('messaging_sessions')
        .update({ status: 'closed', closed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', session.id);

      // TODO: Send confirmation email
      // TODO: Update Luma attendance status via Luma API
      console.log(`User ${user.id} confirmed attendance for event ${session.event_id}`);
    }

    if (isDeclined && session.event_id) {
      // Mark declined but don't close session — user may change mind
      await supabase
        .from('event_attendees')
        .update({ attendance_confirmed: false })
        .eq('event_id', session.event_id);

      console.log(`User ${user.id} declined attendance for event ${session.event_id}`);
    }

    return NextResponse.json({
      ok: true,
      intent: isConfirmed ? 'confirmed' : isDeclined ? 'declined' : 'none',
    });
  } catch (error) {
    console.error('WaSender webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
