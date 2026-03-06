/**
 * Unified attendance confirmation logic.
 * Used by: email confirm link, WhatsApp bot, and any future confirmation channel.
 * Handles: DB update + Luma sync (if applicable).
 */

import { supabase } from '@/lib/supabase';
import { getLumaConfig } from '@/lib/integrations';

interface ConfirmResult {
  success: boolean;
  alreadyConfirmed?: boolean;
  error?: string;
  attendeeName?: string;
  eventName?: string;
}

/**
 * Confirm attendance for an event_attendee.
 * Marks as confirmed in DB and syncs to Luma if the event has a luma_event_id
 * and the user has a luma_id.
 */
export async function confirmAttendance(
  attendeeId: string,
): Promise<ConfirmResult> {
  // Fetch attendee with event and user data
  const { data: attendee, error: fetchError } = await supabase
    .from('event_attendees')
    .select(`
      id,
      event_id,
      user_id,
      attendance_confirmed,
      events (name, luma_event_id),
      users (name, luma_id)
    `)
    .eq('id', attendeeId)
    .single();

  if (fetchError || !attendee) {
    return { success: false, error: 'Attendee not found' };
  }

  const eventData = attendee.events as any;
  const userData = attendee.users as any;

  if (attendee.attendance_confirmed) {
    return {
      success: true,
      alreadyConfirmed: true,
      attendeeName: userData?.name,
      eventName: eventData?.name,
    };
  }

  // Update DB
  const { error: updateError } = await supabase
    .from('event_attendees')
    .update({
      attendance_confirmed: true,
      confirmed_at: new Date().toISOString(),
      status: 'approved',
    })
    .eq('id', attendeeId);

  if (updateError) {
    return { success: false, error: 'Failed to update attendance' };
  }

  // Sync to Luma if applicable
  if (eventData?.luma_event_id && userData?.luma_id) {
    try {
      await syncLumaGuestStatus(
        eventData.luma_event_id,
        userData.luma_id,
        'approved'
      );
    } catch (err) {
      // Log but don't fail — DB is already updated
      console.error('Luma sync failed (non-fatal):', err);
    }
  }

  return {
    success: true,
    alreadyConfirmed: false,
    attendeeName: userData?.name,
    eventName: eventData?.name,
  };
}

/**
 * Decline attendance — same unified flow.
 */
export async function declineAttendance(
  attendeeId: string,
): Promise<ConfirmResult> {
  const { data: attendee, error: fetchError } = await supabase
    .from('event_attendees')
    .select(`
      id,
      event_id,
      user_id,
      events (name, luma_event_id),
      users (name, luma_id)
    `)
    .eq('id', attendeeId)
    .single();

  if (fetchError || !attendee) {
    return { success: false, error: 'Attendee not found' };
  }

  const eventData = attendee.events as any;
  const userData = attendee.users as any;

  const { error: updateError } = await supabase
    .from('event_attendees')
    .update({
      attendance_confirmed: false,
      status: 'declined',
    })
    .eq('id', attendeeId);

  if (updateError) {
    return { success: false, error: 'Failed to update attendance' };
  }

  if (eventData?.luma_event_id && userData?.luma_id) {
    try {
      await syncLumaGuestStatus(
        eventData.luma_event_id,
        userData.luma_id,
        'declined'
      );
    } catch (err) {
      console.error('Luma sync failed (non-fatal):', err);
    }
  }

  return {
    success: true,
    attendeeName: userData?.name,
    eventName: eventData?.name,
  };
}

/**
 * Sync guest status to Luma via API.
 */
async function syncLumaGuestStatus(
  lumaEventId: string,
  lumaGuestId: string,
  status: 'approved' | 'declined',
): Promise<void> {
  const config = await getLumaConfig();
  if (!config) {
    console.warn('No Luma integration configured, skipping sync');
    return;
  }

  const baseUrl = config.base_url || 'https://public-api.luma.com/v1';
  const res = await fetch(`${baseUrl}/event/update-guest-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-luma-api-key': config.api_key,
    },
    body: JSON.stringify({
      event_api_id: lumaEventId,
      guest_api_id: lumaGuestId,
      status,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Luma API error ${res.status}: ${body}`);
  }
}
