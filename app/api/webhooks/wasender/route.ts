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
import { sendConfirmationEmail } from '@/lib/email-sender';
import { findGuestByEmail, updateGuestStatus } from '@/lib/luma';

const CONFIRMED_TAG = '[CONFIRMED]';
const DECLINED_TAG = '[DECLINED]';
const WEBHOOK_SECRET = process.env.WASENDER_WEBHOOK_SECRET || '';

/** Strip intent tags from AI content before sending to user */
function stripTags(content: string): string {
  return content
    .replace(CONFIRMED_TAG, '')
    .replace(DECLINED_TAG, '')
    .trim();
}

/** Verify webhook authenticity */
function verifyWebhook(request: NextRequest): boolean {
  if (!WEBHOOK_SECRET) return true; // No secret configured = skip verification
  const secret = request.headers.get('x-wasender-secret') ||
    request.headers.get('authorization')?.replace('Bearer ', '') || '';
  return secret === WEBHOOK_SECRET;
}

export async function POST(request: NextRequest) {
  // 1. Verify webhook secret
  if (!verifyWebhook(request)) {
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
      .select('id, name, email, attendee_id')
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

    // 10. Handle side effects
    if (isConfirmed && session.event_id) {
      // Update event_attendees
      if (user.attendee_id) {
        await supabase
          .from('event_attendees')
          .update({ attendance_confirmed: true })
          .eq('event_id', session.event_id)
          .eq('attendee_id', user.attendee_id);
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
          .select('name, luma_event_id')
          .eq('id', session.event_id)
          .single();

        if (event) {
          sendConfirmationEmail(user.email, user.name, event.name).catch((err) =>
            console.error('Failed to send confirmation email:', err)
          );

          // Update Luma guest status (non-blocking)
          if (event.luma_event_id && user.email) {
            (async () => {
              try {
                const guest = await findGuestByEmail(event.luma_event_id, user.email!);
                if (guest) {
                  await updateGuestStatus(event.luma_event_id, guest.api_id, 'approved');
                  console.log(`Luma guest ${guest.api_id} approved for event ${event.luma_event_id}`);
                }
              } catch (err) {
                console.error('Failed to update Luma guest status:', err);
              }
            })();
          }
        }
      }

      console.log(`User ${user.id} confirmed attendance for event ${session.event_id}`);
    }

    if (isDeclined && session.event_id) {
      if (user.attendee_id) {
        await supabase
          .from('event_attendees')
          .update({ attendance_confirmed: false })
          .eq('event_id', session.event_id)
          .eq('attendee_id', user.attendee_id);
      }

      // Update Luma guest status to declined (non-blocking)
      if (user.email) {
        const { data: event } = await supabase
          .from('events')
          .select('luma_event_id')
          .eq('id', session.event_id)
          .single();

        if (event?.luma_event_id) {
          (async () => {
            try {
              const guest = await findGuestByEmail(event.luma_event_id, user.email!);
              if (guest) {
                await updateGuestStatus(event.luma_event_id, guest.api_id, 'declined');
                console.log(`Luma guest ${guest.api_id} declined for event ${event.luma_event_id}`);
              }
            } catch (err) {
              console.error('Failed to update Luma guest status:', err);
            }
          })();
        }
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
