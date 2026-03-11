/**
 * WaSender Client — sends WhatsApp messages via WaSenderAPI.
 * Uses config from DB (integrations table) with env var fallback.
 */

import { getWaSenderConfig } from '@/lib/integrations';

const WASENDER_API_URL = 'https://wasenderapi.com/api/send-message';

/**
 * Sends a text WhatsApp message to the given phone number.
 * @param to - Phone number in international format (e.g. "+5491154177572")
 * @param text - Message text to send
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const config = await getWaSenderConfig();

  if (!config.api_key) {
    throw new Error('WaSender API key not configured');
  }

  const response = await fetch(WASENDER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.api_key}`,
    },
    body: JSON.stringify({
      messageType: 'text',
      to,
      text,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`WaSender API error ${response.status}: ${err}`);
  }
}

/**
 * Verify WaSender API key by testing the sessions endpoint.
 * The /api/account endpoint is deprecated, so we use /api/sessions instead.
 */
export async function verifyWaSenderApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch('https://wasenderapi.com/api/sessions', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
