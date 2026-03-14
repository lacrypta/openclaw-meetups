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
import { getLumaConfig, getWaSenderConfig } from '@/lib/integrations';
import { logWebhook } from '@/lib/webhook-logger';
import { send } from '@/lib/email-service';
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
      // Luma sends: data.user_name, data.user_email, data.phone_number, data.api_id (guest)
      // Event info nested in: data.event.api_id, data.event.name
      const d = body.data;
      name = d.user_name || `${d.user_first_name || ''} ${d.user_last_name || ''}`.trim() || '';
      email = d.user_email || '';
      phone = d.phone_number || '';
      lumaGuestId = d.api_id || '';
      lumaEventId = d.event?.api_id || '';
      eventName = d.event?.name || '';
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
    let isNewAttendee = false;
    if (internalEventId) {
      // Check if attendee already exists (for deduplication)
      const { data: existingAttendee } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', internalEventId)
        .eq('user_id', userId)
        .maybeSingle();

      isNewAttendee = !existingAttendee;

      const { error: attendeeError } = await supabase.from('event_attendees').upsert(
        {
          event_id: internalEventId,
          user_id: userId,
          attendance_confirmed: false,
          status: 'waitlist',
        },
        { onConflict: 'event_id,user_id', ignoreDuplicates: true }
      );

      if (attendeeError) {
        console.warn('event_attendees upsert warning:', attendeeError);
      }
    }

    // 5. Send WhatsApp confirmation with direct link (only for new attendees)
    const wasenderConfig = await getWaSenderConfig();
    if (isNewAttendee && wasenderConfig.send_whatsapp_on_new_guest && phone) {
      try {
        // Get confirmation token for this attendee
        const { data: eaForWa } = await supabase
          .from('event_attendees')
          .select('confirmation_token')
          .eq('event_id', internalEventId!)
          .eq('user_id', userId)
          .maybeSingle();

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://openclaw.lacrypta.ar';
        const confirmLink = eaForWa?.confirmation_token
          ? `${baseUrl}/confirm/${eaForWa.confirmation_token}`
          : null;

        const eventLabel = eventName ? ` a *${eventName}*` : ' al próximo OpenClaw Meetup';
        const firstName = name?.split(' ')[0] || name || '';
        const confirmationMessage = confirmLink
          ? `¡Hola ${firstName}! 👋\n\n` +
            `Te registraste${eventLabel}. 🎉\n\n` +
            `Confirmá tu asistencia acá:\n${confirmLink}\n\n` +
            `¡Te esperamos! ⚡`
          : `¡Hola ${firstName}! 👋\n\n` +
            `Te registraste${eventLabel}. 🎉\n\n` +
            `¡Te esperamos! ⚡`;

        await sendWhatsAppMessage(phone, confirmationMessage);
      } catch (err) {
        console.error('Failed to send WhatsApp message:', err);
      }
    }

    // 5b. Send confirmation email with unique token link (only for new attendees)
    const lumaConfig = await getLumaConfig();
    const shouldSendEmail = lumaConfig.send_confirmation_email !== false;
    if (isNewAttendee && shouldSendEmail && email && internalEventId) {
      try {
        // Get the confirmation token for this attendee
        const { data: ea } = await supabase
          .from('event_attendees')
          .select('confirmation_token')
          .eq('event_id', internalEventId)
          .eq('user_id', userId)
          .maybeSingle();

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://openclaw.lacrypta.ar';
        const confirmationLink = ea?.confirmation_token
          ? `${baseUrl}/confirm/${ea.confirmation_token}`
          : `${baseUrl}/confirmation?email=${encodeURIComponent(email)}`;
        const firstName = name.split(' ')[0];
        await send({
          to: email,
          segment: 'confirmation',
          variables: {
            name,
            first_name: firstName,
            email,
            event_name: eventName,
            confirmation_link: confirmationLink,
          },
        });
      } catch (err) {
        console.error('Failed to send confirmation email:', err);
        // Non-fatal — continue
      }
    }

    // 6. Create messaging session (non-fatal — tables may not exist yet)
    let sessionId: string | null = null;
    try {
      const { data: defaultPrompt } = await supabase
        .from('master_prompts')
        .select('id')
        .eq('is_default', true)
        .maybeSingle();

      const { data: session } = await supabase
        .from('messaging_sessions')
        .insert({
          user_id: userId,
          event_id: internalEventId,
          status: 'active',
          master_prompt_id: defaultPrompt?.id || null,
        })
        .select('id')
        .single();

      sessionId = session?.id || null;

      // 7. Save sent message in history (must match the actual WhatsApp message)
      if (sessionId && phone) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://openclaw.lacrypta.ar';
        const { data: eaForHistory } = await supabase
          .from('event_attendees')
          .select('confirmation_token')
          .eq('event_id', internalEventId!)
          .eq('user_id', userId)
          .maybeSingle();
        const historyConfirmLink = eaForHistory?.confirmation_token
          ? `${baseUrl}/confirm/${eaForHistory.confirmation_token}`
          : null;
        const historyEventLabel = eventName ? ` a *${eventName}*` : ' al próximo OpenClaw Meetup';
        const historyFirstName = name?.split(' ')[0] || name || '';
        const savedMsg = historyConfirmLink
          ? `¡Hola ${historyFirstName}! 👋\n\n` +
            `Te registraste${historyEventLabel}. 🎉\n\n` +
            `Confirmá tu asistencia acá:\n${historyConfirmLink}\n\n` +
            `¡Te esperamos! ⚡`
          : `¡Hola ${historyFirstName}! 👋\n\n` +
            `Te registraste${historyEventLabel}. 🎉\n\n` +
            `¡Te esperamos! ⚡`;
        await supabase.from('messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: savedMsg,
        });
      }
    } catch (err) {
      console.warn('Messaging session setup skipped (tables may not exist):', err);
    }

    await log.update({
      status: 'success',
      response_status: 200,
      response_body: { ok: true, user_id: userId, session_id: sessionId },
      metadata: {
        user_id: userId,
        session_id: sessionId,
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
      session_id: sessionId,
    });
  } catch (error) {
    console.error('Luma webhook error:', error);
    // Try to update log with error
    try {
      const errMsg = error instanceof Error ? error.message : String(error);
      // log may not exist if error was before log creation
      await supabase
        .from('webhook_logs')
        .update({
          status: 'error',
          response_status: 500,
          error_message: errMsg,
          processing_time_ms: Date.now() - startTime,
        })
        .eq('status', 'processing')
        .order('created_at', { ascending: false })
        .limit(1);
    } catch { /* ignore */ }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
