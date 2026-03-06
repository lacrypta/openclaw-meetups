/**
 * POST /api/webhooks/luma
 *
 * Receives Luma webhook events. Handles `guest.registered`.
 * Flow:
 *   1. Verify webhook signature (if secret configured)
 *   2. Parse `guest.registered` payload
 *   3. Upsert user in CRM users table (match by email, set luma_id)
 *   4. Link user to event in event_attendees table
 *   5. Send WhatsApp confirmation request via WaSender
 *   6. Create messaging_session for this user+event
 *   7. Save the sent WhatsApp message in messages table
 *
 * No JWT auth — Luma uses its own webhook signature mechanism.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/wasender';
import { getLumaConfig } from '@/lib/integrations';
import { logWebhook } from '@/lib/webhook-logger';
import type { LumaWebhookPayload } from '@/lib/types';

/** Verify Luma webhook signature (basic shared-secret check) */
async function verifySignature(request: NextRequest): Promise<boolean> {
  const config = await getLumaConfig();
  if (!config.webhook_secret) return true; // No secret configured = skip

  const provided =
    request.headers.get('x-luma-signature') ||
    request.headers.get('x-webhook-secret') ||
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    '';

  return provided === config.webhook_secret;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const headers = Object.fromEntries(request.headers.entries());

  // 1. Verify signature
  const sigValid = await verifySignature(request);
  if (!sigValid) {
    await logWebhook({
      provider: 'luma',
      request_headers: headers,
    }).then(log => log.update({
      status: 'error',
      response_status: 401,
      error_message: 'Signature verification failed',
      processing_time_ms: Date.now() - startTime,
    }));
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const log = await logWebhook({
      provider: 'luma',
      event_type: body.type || 'unknown',
      request_headers: headers,
      request_body: body,
    });

    // Support both Luma native webhook shape and legacy flat shape (Zapier, etc.)
    let name: string;
    let email: string;
    let phone: string;
    let lumaGuestId: string;
    let lumaEventId: string;
    let eventName: string;

    if (body.type === 'guest.registered' && body.data) {
      // Native Luma webhook payload
      const payload = body as LumaWebhookPayload;
      name = payload.data.guest.name || '';
      email = payload.data.guest.email || '';
      phone = payload.data.guest.phone || '';
      lumaGuestId = payload.data.guest.api_id || '';
      lumaEventId = payload.data.event.api_id || '';
      eventName = payload.data.event.name || '';
    } else {
      // Legacy flat payload (Zapier or manual)
      name = body.name || body.guest_name || '';
      email = body.email || body.guest_email || '';
      phone = body.phone || body.guest_phone || '';
      lumaGuestId = body.luma_guest_id || body.guest_api_id || '';
      lumaEventId = body.luma_event_id || body.event_api_id || '';
      eventName = body.event_name || '';
    }

    if (!name && !email) {
      await log.update({
        status: 'error',
        response_status: 400,
        error_message: 'No name or email in payload',
        processing_time_ms: Date.now() - startTime,
      });
      return NextResponse.json({ error: 'guest name or email is required' }, { status: 400 });
    }

    // 2. Upsert user — match by email, set luma_id
    let userId: string;

    if (email) {
      const upsertData: Record<string, string | null> = {
        name,
        email,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      };
      if (lumaGuestId) upsertData.luma_id = lumaGuestId;

      const { data: upserted, error: upsertError } = await supabase
        .from('users')
        .upsert(upsertData, { onConflict: 'email', ignoreDuplicates: false })
        .select('id')
        .single();

      if (upsertError || !upserted) {
        console.error('User upsert error:', upsertError);
        return NextResponse.json({ error: 'Failed to upsert user' }, { status: 500 });
      }
      userId = upserted.id;
    } else if (phone) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (existing) {
        userId = existing.id;
        const updateData: Record<string, string | null> = {
          name,
          updated_at: new Date().toISOString(),
        };
        if (lumaGuestId) updateData.luma_id = lumaGuestId;
        await supabase.from('users').update(updateData).eq('id', userId);
      } else {
        const insertData: Record<string, string | null> = { name, phone };
        if (lumaGuestId) insertData.luma_id = lumaGuestId;

        const { data: inserted, error: insertError } = await supabase
          .from('users')
          .insert(insertData)
          .select('id')
          .single();

        if (insertError || !inserted) {
          console.error('User insert error:', insertError);
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }
        userId = inserted.id;
      }
    } else {
      return NextResponse.json({ error: 'email or phone is required' }, { status: 400 });
    }

    // 3. Resolve internal event ID from luma_event_id
    let internalEventId: string | null = null;
    if (lumaEventId) {
      const { data: event } = await supabase
        .from('events')
        .select('id, name')
        .eq('luma_event_id', lumaEventId)
        .maybeSingle();

      if (event) {
        internalEventId = event.id;
        if (!eventName) eventName = event.name;
      }
    }

    // 4. Link user to event in event_attendees
    if (internalEventId) {
      const { error: attendeeError } = await supabase.from('event_attendees').upsert(
        {
          event_id: internalEventId,
          user_id: userId,
          attendance_confirmed: false,
          status: 'approved',
        },
        { onConflict: 'event_id,user_id', ignoreDuplicates: true }
      );

      if (attendeeError) {
        console.warn('event_attendees upsert warning:', attendeeError);
      }
    }

    // 5. Send WhatsApp confirmation message
    const eventLabel = eventName ? ` al evento *${eventName}*` : ' al próximo OpenClaw Meetup';
    const confirmationMessage =
      `¡Hola ${name}! 👋 Soy el asistente de *La Crypta*.\n\n` +
      `Te registraste${eventLabel}. 🎉\n\n` +
      `¿Podés confirmar tu asistencia?\n` +
      `• Respondé *1* para confirmar ✅\n` +
      `• Respondé *2* para cancelar ❌\n\n` +
      `¡Te esperamos!`;

    if (phone) {
      try {
        await sendWhatsAppMessage(phone, confirmationMessage);
      } catch (err) {
        console.error('Failed to send WhatsApp message:', err);
        // Non-fatal — continue
      }
    }

    // 6. Create messaging session
    const { data: defaultPrompt } = await supabase
      .from('master_prompts')
      .select('id')
      .eq('is_default', true)
      .maybeSingle();

    const { data: session, error: sessionError } = await supabase
      .from('messaging_sessions')
      .insert({
        user_id: userId,
        event_id: internalEventId,
        status: 'active',
        master_prompt_id: defaultPrompt?.id || null,
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      console.error('Session create error:', sessionError);
      // Non-fatal for the webhook response — user and attendee are already created
      return NextResponse.json({ ok: true, user_id: userId, session_id: null });
    }

    // 7. Save sent message in history
    if (phone) {
      const { error: msgError } = await supabase.from('messages').insert({
        session_id: session.id,
        role: 'assistant',
        content: confirmationMessage,
      });

      if (msgError) {
        console.warn('Failed to save initial message:', msgError);
      }
    }

    await log.update({
      status: 'success',
      response_status: 200,
      response_body: { ok: true, user_id: userId, session_id: session.id },
      metadata: {
        user_id: userId,
        session_id: session.id,
        event_id: internalEventId,
        event_name: eventName,
        guest_name: name,
        guest_email: email,
        whatsapp_sent: !!phone,
      },
      processing_time_ms: Date.now() - startTime,
    });

    return NextResponse.json({
      ok: true,
      user_id: userId,
      session_id: session.id,
    });
  } catch (error) {
    console.error('Luma webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
