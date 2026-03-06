/**
 * POST /api/webhooks/wasender
 *
 * Receives inbound WhatsApp messages from WaSenderAPI.
 * Flow:
 *   1. Verify webhook secret
 *   2. Extract phone + message text
 *   3. Find user by phone
 *   4. Find or create messaging session for user's latest pending event
 *   5. Save inbound message
 *   6. Generate AI response (with full conversation history)
 *   7. Parse [CONFIRMED] / [DECLINED] intent from AI response
 *   8. Save AI response with model/token metadata
 *   9. Send reply via WhatsApp
 *  10. Handle confirm/decline: DB + Luma sync + close session
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateResponse } from '@/lib/ai-engine';
import { sendWhatsAppMessage } from '@/lib/wasender';
import { confirmAttendance, declineAttendance } from '@/lib/confirm-attendance';
import { getWaSenderConfig } from '@/lib/integrations';

const CONFIRMED_TAG = '[CONFIRMED]';
const DECLINED_TAG = '[DECLINED]';

function stripTags(content: string): string {
  return content
    .replace(CONFIRMED_TAG, '')
    .replace(DECLINED_TAG, '')
    .trim();
}

async function verifyWebhook(request: NextRequest): Promise<boolean> {
  const config = await getWaSenderConfig();
  const secret = config.webhook_secret;
  if (!secret) return true; // No secret configured = skip verification
  const provided = request.headers.get('x-webhook-signature') || '';
  return provided === secret;
}

export async function POST(request: NextRequest) {
  if (!(await verifyWebhook(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const phone: string = body.from || body.phone || body.data?.from || '';
    const messageText: string = body.text || body.body || body.message || body.data?.body || '';
    const wasenderMessageId: string = body.messageId || body.id || '';

    if (!phone || !messageText) {
      return NextResponse.json({ ok: true, note: 'no phone or message' });
    }

    // Normalize phone
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const phoneVariants = [
      cleanPhone,
      cleanPhone.startsWith('+') ? cleanPhone.slice(1) : `+${cleanPhone}`,
    ];

    // Find user by phone
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .or(phoneVariants.map(p => `phone.eq.${p}`).join(','))
      .maybeSingle();

    if (!user) {
      console.warn(`WhatsApp from unknown phone: ${cleanPhone}`);
      return NextResponse.json({ ok: true, note: 'unknown user' });
    }

    // Find latest pending event attendance
    const { data: attendee } = await supabase
      .from('event_attendees')
      .select('id, event_id, attendance_confirmed, events(name)')
      .eq('user_id', user.id)
      .eq('attendance_confirmed', false)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!attendee) {
      return NextResponse.json({ ok: true, note: 'no pending attendance' });
    }

    const eventId = attendee.event_id;
    const eventName = (attendee.events as any)?.name || 'el evento';

    // Find or create messaging session
    let { data: session } = await supabase
      .from('messaging_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .eq('status', 'active')
      .maybeSingle();

    if (!session) {
      // Get default master prompt
      const { data: prompt } = await supabase
        .from('master_prompts')
        .select('id')
        .eq('is_default', true)
        .maybeSingle();

      const { data: newSession } = await supabase
        .from('messaging_sessions')
        .insert({
          user_id: user.id,
          event_id: eventId,
          status: 'active',
          master_prompt_id: prompt?.id || null,
        })
        .select('id')
        .single();

      session = newSession;
    }

    if (!session) {
      console.error('Failed to create messaging session');
      return NextResponse.json({ error: 'Session creation failed' }, { status: 500 });
    }

    // Save inbound message
    await supabase.from('messages').insert({
      session_id: session.id,
      role: 'user',
      content: messageText,
      wasender_message_id: wasenderMessageId || null,
    });

    // Generate AI response with full conversation history
    let rawContent: string;
    let model = '';
    let provider = '';
    let tokensIn = 0;
    let tokensOut = 0;

    try {
      const aiResult = await generateResponse(session.id, messageText);
      rawContent = aiResult.content;
      model = aiResult.model;
      provider = aiResult.provider;
      tokensIn = aiResult.tokensIn;
      tokensOut = aiResult.tokensOut;
    } catch (err) {
      console.error('AI engine failed, using keyword fallback:', err);
      // Keyword fallback
      const normalized = messageText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const confirmWords = ['si', 'yes', 'confirmo', 'voy', '1'];
      const declineWords = ['no', 'cancelo', 'no voy', '2'];
      if (confirmWords.includes(normalized)) {
        rawContent = `${CONFIRMED_TAG}¡Listo! Tu asistencia a ${eventName} está confirmada. ¡Te esperamos! ⚡`;
      } else if (declineWords.includes(normalized)) {
        rawContent = `${DECLINED_TAG}Entendido. Cancelamos tu lugar en ${eventName}. Si cambiás de opinión, respondé *si*.`;
      } else {
        rawContent = `¡Hola! Estoy acá para confirmar tu asistencia a *${eventName}*. ¿Podés confirmar? Respondé *si* o *no*.`;
      }
    }

    // Parse intent
    const isConfirmed = rawContent.includes(CONFIRMED_TAG);
    const isDeclined = rawContent.includes(DECLINED_TAG);
    const cleanContent = stripTags(rawContent);

    // Save AI response
    await supabase.from('messages').insert({
      session_id: session.id,
      role: 'assistant',
      content: cleanContent,
      model_used: model || null,
      provider: provider || null,
      tokens_in: tokensIn || null,
      tokens_out: tokensOut || null,
    });

    // Send reply via WhatsApp
    try {
      await sendWhatsAppMessage(user.phone || cleanPhone, cleanContent);
    } catch (err) {
      console.error('Failed to send WhatsApp reply:', err);
    }

    // Handle confirmation
    if (isConfirmed) {
      await confirmAttendance(attendee.id);

      // Close session
      await supabase
        .from('messaging_sessions')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', session.id);

      console.log(`User ${user.id} confirmed via WhatsApp for event ${eventId}`);
    }

    // Handle decline
    if (isDeclined) {
      await declineAttendance(attendee.id);

      await supabase
        .from('messaging_sessions')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', session.id);

      console.log(`User ${user.id} declined via WhatsApp for event ${eventId}`);
    }

    return NextResponse.json({
      ok: true,
      intent: isConfirmed ? 'confirmed' : isDeclined ? 'declined' : 'conversation',
      session_id: session.id,
      user_id: user.id,
    });

  } catch (error) {
    console.error('WaSender webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
