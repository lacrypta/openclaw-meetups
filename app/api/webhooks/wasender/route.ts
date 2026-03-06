/**
 * POST /api/webhooks/wasender
 *
 * Receives inbound WhatsApp messages from WaSenderAPI.
 * Flow:
 *   1. Verify webhook secret
 *   2. Extract phone + message text from payload
 *   3. Find user by phone
 *   4. Find active messaging session for user
 *   5. Save inbound message (role: user)
 *   6. Generate AI response
 *   7. Parse [CONFIRMED] / [DECLINED] intent keywords
 *   8. Save AI response (role: assistant)
 *   9. Send reply via WaSender
 *  10. Handle confirmation/decline side effects:
 *      - Update event_attendees
 *      - Send confirmation email
 *      - Update Luma guest status
 *      - Close session (on confirm)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateResponse } from '@/lib/ai-engine';
import { sendWhatsAppMessage } from '@/lib/wasender';
import { send } from '@/lib/email-service';
import { confirmAttendance, declineAttendance } from '@/lib/confirm-attendance';
import { getWaSenderConfig } from '@/lib/integrations';

const CONFIRMED_TAG = '[CONFIRMED]';
const DECLINED_TAG = '[DECLINED]';

/** Strip intent tags from AI content before sending to user */
function stripTags(content: string): string {
  return content
    .replace(CONFIRMED_TAG, '')
    .replace(DECLINED_TAG, '')
    .trim();
}

/** Verify webhook authenticity */
async function verifyWebhook(request: NextRequest): Promise<boolean> {
  const config = await getWaSenderConfig();
  const secret = config.webhook_secret || process.env.WASENDER_WEBHOOK_SECRET || '';
  if (!secret) return true; // No secret configured = skip verification
  const provided = request.headers.get('x-wasender-secret') ||
    request.headers.get('authorization')?.replace('Bearer ', '') || '';
  return provided === secret;
}

export async function POST(request: NextRequest) {
  // 1. Verify webhook secret
  if (!(await verifyWebhook(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // 2. Extract phone and message text
    const phone: string = body.from || body.phone || '';
    const messageText: string = body.text || body.body || body.message || '';
    const wasenderMessageId: string = body.messageId || body.id || '';

    if (!phone || !messageText) {
      return NextResponse.json({ error: 'phone and message text are required' }, { status: 400 });
    }

    // 3. Find user by phone
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('phone', phone)
      .maybeSingle();

    if (userError) {
      console.error('User lookup error:', userError);
      return NextResponse.json({ error: 'Failed to lookup user' }, { status: 500 });
    }

    if (!user) {
      console.warn(`Received message from unknown phone: ${phone}`);
      return NextResponse.json({ ok: true, note: 'unknown user, ignored' });
    }

    // 4. Find active messaging session for this user
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

    // 5. Save inbound message
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

    // 6. Generate AI response
    const aiResult = await generateResponse(session.id, messageText);

    // 7. Parse intent
    const rawContent = aiResult.content;
    const isConfirmed = rawContent.startsWith(CONFIRMED_TAG);
    const isDeclined = rawContent.startsWith(DECLINED_TAG);
    const cleanContent = stripTags(rawContent);

    // 8. Save AI response
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

    // 9. Send reply via WaSender
    await sendWhatsAppMessage(phone, cleanContent);

    // 10. Handle side effects — unified confirmation flow (DB + Luma sync)
    if (isConfirmed && session.event_id) {
      // Find event_attendee for this user+event
      const { data: ea } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', session.event_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (ea) {
        // Unified: marks confirmed + syncs to Luma if applicable
        await confirmAttendance(ea.id);
      }

      // Close the session
      await supabase
        .from('messaging_sessions')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      // Send confirmation email (non-blocking)
      if (user.email) {
        const { data: event } = await supabase
          .from('events')
          .select('name')
          .eq('id', session.event_id)
          .single();

        if (event) {
          const firstName = user.name ? user.name.split(' ')[0] : '';
          send({
            to: user.email,
            segment: 'confirmation',
            variables: {
              name: user.name || '',
              first_name: firstName,
              email: user.email,
              event_name: event.name,
            },
          }).catch((err) => console.error('Failed to send confirmation email:', err));
        }
      }

      console.log(`User ${user.id} confirmed attendance for event ${session.event_id}`);
    }

    if (isDeclined && session.event_id) {
      const { data: ea } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', session.event_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (ea) {
        // Unified: marks declined + syncs to Luma if applicable
        await declineAttendance(ea.id);
      }

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
