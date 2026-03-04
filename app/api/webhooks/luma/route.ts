/**
 * POST /api/webhooks/luma
 *
 * Receives a new guest registration from Luma (via Zapier or direct webhook).
 * Flow:
 *   1. Parse guest data (name, email, phone, event_id)
 *   2. Upsert user in CRM users table
 *   3. Create event_attendees record (unconfirmed)
 *   4. Send WhatsApp confirmation request via WaSender
 *   5. Create messaging_session for this user+event
 *   6. Save the sent WhatsApp message in messages table
 *
 * No JWT auth — Luma uses its own webhook signature mechanism.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/wasender';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract guest data — adapt field names to your Luma/Zapier payload shape
    const name: string = body.name || body.guest_name || '';
    const email: string = body.email || body.guest_email || '';
    const phone: string = body.phone || body.guest_phone || '';
    const eventId: string = body.event_id || body.luma_event_id || '';

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // 2. Upsert user — match by email if present, else by phone
    let userId: string;

    if (email) {
      const { data: upserted, error: upsertError } = await supabase
        .from('users')
        .upsert(
          { name, email, phone: phone || null, updated_at: new Date().toISOString() },
          { onConflict: 'email', ignoreDuplicates: false }
        )
        .select('id')
        .single();

      if (upsertError || !upserted) {
        console.error('User upsert error:', upsertError);
        return NextResponse.json({ error: 'Failed to upsert user' }, { status: 500 });
      }
      userId = upserted.id;
    } else if (phone) {
      // No email — try to find by phone, else insert
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (existing) {
        userId = existing.id;
        // Update name if changed
        await supabase
          .from('users')
          .update({ name, updated_at: new Date().toISOString() })
          .eq('id', userId);
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('users')
          .insert({ name, phone })
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

    // 3. Create event_attendees record (unconfirmed)
    if (eventId) {
      const { error: attendeeError } = await supabase.from('event_attendees').upsert(
        {
          event_id: eventId,
          // Store user_id as reference — adjust column name if schema differs
          // Using attendee_id may refer to legacy integer id; store user_id separately
          // If your event_attendees table doesn't have user_id yet, this is a best-effort insert
          attendance_confirmed: false,
        },
        { ignoreDuplicates: true }
      );

      if (attendeeError) {
        // Non-fatal — log and continue
        console.warn('event_attendees upsert warning:', attendeeError);
      }
    }

    // 4. Send WhatsApp confirmation request
    const confirmationMessage = `¡Hola ${name}! 👋 Soy Claudio del OpenClaw Meetup de La Crypta. Te registraste al evento del próximo encuentro.\n\n¿Confirmás tu asistencia? Respondé *sí* o *no* 🙌`;

    if (phone) {
      await sendWhatsAppMessage(phone, confirmationMessage);
    }

    // 5. Create messaging session
    // Fetch the default master prompt
    const { data: defaultPrompt } = await supabase
      .from('master_prompts')
      .select('id')
      .eq('is_default', true)
      .maybeSingle();

    const { data: session, error: sessionError } = await supabase
      .from('messaging_sessions')
      .insert({
        user_id: userId,
        event_id: eventId || null,
        status: 'active',
        master_prompt_id: defaultPrompt?.id || null,
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      console.error('Session create error:', sessionError);
      return NextResponse.json({ error: 'Failed to create messaging session' }, { status: 500 });
    }

    // 6. Save sent message as assistant message in history
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
