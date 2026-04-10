/**
 * POST /api/webhooks/kapso
 *
 * Handles incoming WhatsApp messages from Kapso.
 * Verifies HMAC-SHA256 signature, saves messages to session,
 * and generates AI responses when enabled.
 * Sessions indexed by PHONE (not user_id) — same pattern as WaSender webhook.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { supabase } from '@/lib/supabase';
import { logWebhook } from '@/lib/webhook-logger';
import { getKapsoConfig } from '@/lib/integrations';
import { generateResponse } from '@/lib/ai-engine';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { eventBus } from '@/lib/event-bus';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const hdrs: Record<string, string> = {};
  request.headers.forEach((v, k) => { hdrs[k] = v; });

  let parsedBody: any;
  try { parsedBody = JSON.parse(rawBody); } catch { parsedBody = rawBody; }

  const log = await logWebhook({
    provider: 'kapso',
    event_type: hdrs['x-webhook-event'] || 'inbound_message',
    request_headers: hdrs,
    request_body: parsedBody,
  });

  // Verify HMAC-SHA256 signature
  const config = await getKapsoConfig();
  if (config.webhook_secret) {
    const signature = hdrs['x-webhook-signature'] || '';
    if (!verifySignature(rawBody, signature, config.webhook_secret)) {
      await log.update({ status: 'rejected', metadata: { reason: 'invalid HMAC signature' } });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = parsedBody;
    if (typeof body !== 'object' || !body) {
      await log.update({ status: 'error', error_message: 'invalid JSON body' });
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Only process incoming messages
    const eventType = hdrs['x-webhook-event'] || '';
    if (eventType && eventType !== 'whatsapp.message.received') {
      await log.update({ status: 'success', metadata: { note: `skipped event: ${eventType}` } });
      return NextResponse.json({ ok: true, note: `event ${eventType} acknowledged` });
    }

    // Kapso v2 webhook payload:
    //   { message: { from, id, type, text: { body }, kapso: {...} }, conversation: { contact_name, ... } }
    // Also handle wrapped format: { data: { from, message: {...}, contact: {...} } }
    const msg = body.message || body.data?.message || {};
    const conv = body.conversation || {};
    const contact = body.data?.contact || {};

    const phone: string = msg.from || body.data?.from || '';
    const messageText: string = msg.text?.body || msg.body || msg.kapso?.content || '';
    const messageId: string = msg.id || '';
    const senderName: string = conv.contact_name || contact.name || contact.profile?.name || '';

    const extracted = { phone, messageText: messageText.substring(0, 200), messageId, senderName };

    if (!phone && !messageText) {
      await log.update({ status: 'success', metadata: { ...extracted, note: 'no phone/message in payload' } });
      return NextResponse.json({ ok: true, note: 'no phone or message' });
    }

    // Normalize phone — always store with +
    const digitsOnly = phone.replace(/[^\d]/g, '');
    const normalizedPhone = `+${digitsOnly}`;

    // Build phone variants for matching (handle Argentina mobile 9 prefix)
    // e.g., 541154177572 → also try +5491154177572 and vice versa
    const phoneVariants = [normalizedPhone, digitsOnly];
    if (digitsOnly.startsWith('54') && !digitsOnly.startsWith('549')) {
      // Add variant with 9: 5411... → 54911...
      const with9 = `+549${digitsOnly.slice(2)}`;
      phoneVariants.push(with9, with9.slice(1));
    } else if (digitsOnly.startsWith('549')) {
      // Add variant without 9: 54911... → 5411...
      const without9 = `+54${digitsOnly.slice(3)}`;
      phoneVariants.push(without9, without9.slice(1));
    }

    // Find matching users
    const phoneFilter = phoneVariants.map(p => `phone.eq.${p}`).join(',');
    const { data: matchingUsers } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .or(phoneFilter)
      .order('created_at', { ascending: true });

    const userCount = matchingUsers?.length || 0;
    const firstUser = matchingUsers?.[0] || null;

    // Find or create session BY PHONE
    let { data: session } = await supabase
      .from('messaging_sessions')
      .select('id, user_id')
      .eq('phone', normalizedPhone)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      let eventId: string | null = null;
      if (firstUser) {
        const { data: attendee } = await supabase
          .from('event_attendees')
          .select('event_id')
          .eq('user_id', firstUser.id)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();
        eventId = attendee?.event_id || null;
      }

      const { data: prompt } = await supabase
        .from('master_prompts')
        .select('id')
        .eq('is_default', true)
        .maybeSingle();

      const { data: newSession, error: sessErr } = await supabase
        .from('messaging_sessions')
        .insert({
          phone: normalizedPhone,
          user_id: userCount === 1 ? firstUser!.id : null,
          event_id: eventId,
          status: 'active',
          master_prompt_id: prompt?.id || null,
        })
        .select('id, user_id')
        .single();

      if (sessErr) {
        await log.update({ status: 'error', error_message: `create_session: ${sessErr.message}` });
        return NextResponse.json({ error: sessErr.message }, { status: 500 });
      }
      session = newSession;
      eventBus.publish({ type: 'session.new', data: { ...newSession, phone: normalizedPhone, status: 'active' } });
    }

    // Save message
    const { data: savedMsg, error: msgErr } = await supabase.from('messages').insert({
      session_id: session!.id,
      role: 'user',
      content: messageText,
      wasender_message_id: messageId || null,
      provider: 'kapso',
    }).select().single();

    if (msgErr) {
      await log.update({ status: 'error', error_message: `save_message: ${msgErr.message}` });
      return NextResponse.json({ error: msgErr.message }, { status: 500 });
    }

    eventBus.publish({ type: 'message.new', data: savedMsg });

    // Generate AI response using session's master prompt
    let aiResponseSent = false;
    if (session!.id) {
      try {
        const aiResult = await generateResponse(session!.id, messageText);

        if (aiResult.content) {
          await sendWhatsAppMessage(normalizedPhone, aiResult.content);
          const { data: savedAi } = await supabase.from('messages').insert({
            session_id: session!.id,
            role: 'assistant',
            content: aiResult.content,
            model_used: aiResult.model,
            provider: aiResult.provider,
            tokens_in: aiResult.tokensIn,
            tokens_out: aiResult.tokensOut,
          }).select().single();
          if (savedAi) eventBus.publish({ type: 'message.new', data: savedAi });
          aiResponseSent = true;
        }
      } catch (aiError: any) {
        console.error('AI response failed:', aiError);
      }
    }

    await log.update({
      status: 'success',
      metadata: {
        ...extracted,
        normalizedPhone,
        matching_users: userCount,
        assigned_user_id: session!.user_id,
        session_id: session!.id,
        ai_response_sent: aiResponseSent,
      },
    });

    return NextResponse.json({
      ok: true,
      phone: normalizedPhone,
      session_id: session!.id,
      matching_users: userCount,
      assigned: session!.user_id ? true : false,
      message_saved: true,
      ai_response_sent: aiResponseSent,
    });

  } catch (error: any) {
    await log.update({ status: 'error', error_message: error?.message || String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
