/**
 * POST /api/webhooks/wasender
 *
 * DEBUG MODE: AI disabled — log everything, save messages to session.
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

    // WaSender actual payload: data.messages.key.cleanedSenderPn / data.messages.messageBody
    const msg = body.data?.messages || {};
    const phone: string =
      msg.key?.cleanedSenderPn || msg.key?.senderPn?.replace('@s.whatsapp.net', '') ||
      body.from || body.phone || body.data?.from || '';

    const messageText: string =
      msg.messageBody || msg.message?.conversation ||
      body.text || body.body || body.data?.body || '';

    const wasenderMessageId: string =
      msg.id || msg.key?.id || body.messageId || body.id || '';

    // Skip messages sent by us (fromMe)
    if (msg.key?.fromMe === true) {
      await log.update({ status: 'success', metadata: { note: 'skipped own message' } });
      return NextResponse.json({ ok: true, note: 'own message skipped' });
    }

    const extracted = { phone, messageText: messageText.substring(0, 200), wasenderMessageId };

    if (!phone && !messageText) {
      await log.update({ status: 'success', metadata: { ...extracted, note: 'no phone/message in payload', body_keys: Object.keys(body) } });
      return NextResponse.json({ ok: true, note: 'no phone or message', body_keys: Object.keys(body) });
    }

    // Normalize phone
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const phoneVariants = [
      cleanPhone,
      cleanPhone.startsWith('+') ? cleanPhone.slice(1) : `+${cleanPhone}`,
    ];

    // Find user (limit 1 — multiple users may share same phone in test data)
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .or(phoneVariants.map(p => `phone.eq.${p}`).join(','))
      .order('created_at', { ascending: true })
      .limit(1);

    const user = users?.[0] || null;

    if (!user) {
      await log.update({ status: 'success', metadata: { ...extracted, note: 'unknown user', cleanPhone } });
      return NextResponse.json({ ok: true, note: 'unknown user', cleanPhone });
    }

    // Find latest event attendance
    const { data: attendee } = await supabase
      .from('event_attendees')
      .select('id, event_id, events(name)')
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    const eventId = attendee?.event_id || null;

    // Find or create session
    let { data: session } = await supabase
      .from('messaging_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      const { data: prompt } = await supabase
        .from('master_prompts')
        .select('id')
        .eq('is_default', true)
        .maybeSingle();

      const { data: newSession, error: sessErr } = await supabase
        .from('messaging_sessions')
        .insert({
          user_id: user.id,
          event_id: eventId,
          status: 'active',
          master_prompt_id: prompt?.id || null,
        })
        .select('id')
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
        user_id: user.id,
        user_name: user.name,
        session_id: session!.id,
        event_name: (attendee?.events as any)?.name || null,
        note: 'message saved — AI disabled',
      },
    });

    return NextResponse.json({
      ok: true,
      user_id: user.id,
      session_id: session!.id,
      message_saved: true,
      ai_disabled: true,
    });

  } catch (error: any) {
    await log.update({ status: 'error', error_message: error?.message || String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
