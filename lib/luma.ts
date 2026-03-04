/**
 * Luma API Client — manage event guests.
 * Docs: https://docs.luma.com
 * Base URL: https://public-api.luma.com/v1
 */

const LUMA_API_KEY = process.env.LUMA_API_KEY || '';
const LUMA_BASE_URL = 'https://public-api.luma.com/v1';

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

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-luma-api-key': LUMA_API_KEY,
  };
}

/**
 * Get all guests for an event.
 */
export async function getEventGuests(eventApiId: string): Promise<LumaGuest[]> {
  const res = await fetch(
    `${LUMA_BASE_URL}/event/get-guests?event_api_id=${eventApiId}`,
    { headers: headers() }
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
 * Update a guest's status (approved, declined, pending_approval).
 */
export async function updateGuestStatus(
  eventApiId: string,
  guestApiId: string,
  status: 'approved' | 'declined' | 'pending_approval'
): Promise<void> {
  const res = await fetch(`${LUMA_BASE_URL}/event/update-guest-status`, {
    method: 'POST',
    headers: headers(),
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
