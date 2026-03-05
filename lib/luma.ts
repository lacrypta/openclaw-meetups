/**
 * Luma API Client — manage event guests.
 * Docs: https://docs.luma.com
 * Base URL: https://public-api.luma.com/v1
 *
 * Config is loaded from the integrations table (with env var fallback).
 */

import { getLumaConfig } from '@/lib/integrations';

interface LumaGuest {
  api_id: string;
  email: string;
  name: string;
  approval_status: string;
}

interface LumaGuestsResponse {
  entries: LumaGuest[];
  has_more: boolean;
  next_cursor?: string;
}

async function getHeaders(): Promise<Record<string, string>> {
  const config = await getLumaConfig();
  return {
    'Content-Type': 'application/json',
    'x-luma-api-key': config.api_key,
  };
}

async function getBaseUrl(): Promise<string> {
  const config = await getLumaConfig();
  return config.base_url;
}

/**
 * Get all guests for an event.
 */
export async function getEventGuests(eventApiId: string): Promise<LumaGuest[]> {
  const [hdrs, baseUrl] = await Promise.all([getHeaders(), getBaseUrl()]);
  const res = await fetch(
    `${baseUrl}/event/get-guests?event_api_id=${eventApiId}`,
    { headers: hdrs }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Luma get-guests error ${res.status}: ${err}`);
  }

  const data: LumaGuestsResponse = await res.json();
  return data.entries || [];
}

/**
 * Find a guest by email in a Luma event.
 */
export async function findGuestByEmail(
  eventApiId: string,
  email: string
): Promise<LumaGuest | null> {
  const guests = await getEventGuests(eventApiId);
  return guests.find((g) => g.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Update a guest's status by guest API ID (approved, declined, pending_approval).
 */
export async function updateGuestStatus(
  eventApiId: string,
  guestApiId: string,
  status: 'approved' | 'declined' | 'pending_approval'
): Promise<void> {
  const [hdrs, baseUrl] = await Promise.all([getHeaders(), getBaseUrl()]);
  const res = await fetch(`${baseUrl}/event/update-guest-status`, {
    method: 'POST',
    headers: hdrs,
    body: JSON.stringify({
      event_api_id: eventApiId,
      guest_api_id: guestApiId,
      status,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Luma update-guest-status error ${res.status}: ${err}`);
  }
}

/**
 * Update a guest's status by email (convenience wrapper — looks up guest first).
 */
export async function updateGuestStatusByEmail(
  eventApiId: string,
  guestEmail: string,
  status: 'approved' | 'declined' | 'pending_approval'
): Promise<void> {
  const guest = await findGuestByEmail(eventApiId, guestEmail);
  if (!guest) {
    throw new Error(`Guest with email ${guestEmail} not found in event ${eventApiId}`);
  }
  await updateGuestStatus(eventApiId, guest.api_id, status);
}
