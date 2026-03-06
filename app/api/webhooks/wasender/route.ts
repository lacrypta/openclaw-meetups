/**
 * POST /api/webhooks/wasender
 *
 * DEBUG MODE: AI disabled — log everything, save messages to session.
 * Sessions indexed by PHONE (not user_id).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logWebhook } from '@/lib/webhook-logger';
import { getWaSenderConfig } from '@/lib/integrations';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const hdrs: Record<string, string> = {};
  request.headers.forEach((v, k) => { hdrs[k] = v; });

  let parsedBody: any;
  try { parsedBody = JSON.parse(rawBody); } catch { parsedBody = rawBody; }

  const log = await logWebhook({
    provider: 'wasender',
    event_type: 'inbound_message',
    request_headers: hdrs,
    request_body: parsedBody,
  });

  // Verify webhook secret
  const config = await getWaSenderConfig();
  const secret = config.webhook_secret;
  if (secret) {
    const provided = request.headers.get('x-webhook-signature') || '';
    if (provided !== secret) {
      await log.update({ status: 'rejected', metadata: { reason: 'invalid signature' } });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = parsedBody;
    if (typeof body !== 'object' || !body) {
      await log.update({ status: 'error', error_message: 'invalid JSON body' });
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // WaSender payload: data.messages.key.cleanedSenderPn / data.messages.messageBody
    const msg = body.data?.messages || {};
    const phone: string =
      msg.key?.cleanedSenderPn || msg.key?.senderPn?.replace('@s.whatsapp.net', '') ||
      body.from || body.phone || body.data?.from || '';

    const messageText: string =
      msg.messageBody || msg.message?.conversation ||
      body.text || body.body || body.data?.body || '';

    const wasenderMessageId: string =
      msg.id || msg.key?.id || body.messageId || body.id || '';

    const senderName: string = msg.pushName || '';

    // Skip own messages
    if (msg.key?.fromMe === true) {
      await log.update({ status: 'success', metadata: { note: 'skipped own message' } });
      return NextResponse.json({ ok: true, note: 'own message skipped' });
    }

    const extracted = { phone, messageText: messageText.substring(0, 200), wasenderMessageId, senderName };

    if (!phone && !messageText) {
      await log.update({ status: 'success', metadata: { ...extracted, note: 'no phone/message in payload', body_keys: Object.keys(body) } });
      return NextResponse.json({ ok: true, note: 'no phone or message', body_keys: Object.keys(body) });
    }

    // Normalize phone — always store with +
    const digitsOnly = phone.replace(/[^\d]/g, '');
    const normalizedPhone = `+${digitsOnly}`;

    // Find matching users (may be multiple)
    const { data: matchingUsers } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .or(`phone.eq.${normalizedPhone},phone.eq.${digitsOnly}`)
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
      // Find latest event attendance for any matching user
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
          user_id: userCount === 1 ? firstUser!.id : null, // auto-assign only if unambiguous
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
    }

    // Save message
    const { error: msgErr } = await supabase.from('messages').insert({
      session_id: session!.id,
      role: 'user',
      content: messageText,
      wasender_message_id: wasenderMessageId || null,
    });

    if (msgErr) {
      await log.update({ status: 'error', error_message: `save_message: ${msgErr.message}` });
      return NextResponse.json({ error: msgErr.message }, { status: 500 });
    }

    await log.update({
      status: 'success',
      metadata: {
        ...extracted,
        normalizedPhone,
        matching_users: userCount,
        assigned_user_id: session!.user_id,
        session_id: session!.id,
        note: userCount > 1
          ? `message saved — ${userCount} users share this phone (unassigned)`
          : userCount === 1
            ? 'message saved — user auto-assigned'
            : 'message saved — no matching user',
      },
    });

    return NextResponse.json({
      ok: true,
      phone: normalizedPhone,
      session_id: session!.id,
      matching_users: userCount,
      assigned: session!.user_id ? true : false,
      message_saved: true,
      ai_disabled: true,
    });

  } catch (error: any) {
    await log.update({ status: 'error', error_message: error?.message || String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
