/**
 * Kapso WhatsApp Client — sends messages via Kapso WhatsApp Cloud API SDK.
 * Uses config from DB (integrations table) with env var fallback.
 */

import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';
import type { KapsoConfig } from '@/lib/types';

function createClient(apiKey: string): WhatsAppClient {
  return new WhatsAppClient({
    baseUrl: 'https://app.kapso.ai/api/meta/',
    kapsoApiKey: apiKey,
  });
}

/**
 * Sends a text WhatsApp message via Kapso.
 */
export async function sendKapsoMessage(
  to: string,
  text: string,
  config: KapsoConfig,
): Promise<void> {
  if (!config.api_key) {
    throw new Error('Kapso API key not configured');
  }
  if (!config.phone_number_id) {
    throw new Error('Kapso phone number ID not configured');
  }

  const client = createClient(config.api_key);
  await client.messages.sendText({
    phoneNumberId: config.phone_number_id,
    to,
    body: text,
  });
}

/**
 * Verify Kapso API key by attempting to query messages (will return empty or error).
 */
export async function verifyKapsoApiKey(
  apiKey: string,
  phoneNumberId: string,
): Promise<boolean> {
  try {
    const client = createClient(apiKey);
    // Send a text to an invalid number to test auth — will fail with auth error if key is bad,
    // or with a WhatsApp error if key is valid but number doesn't exist in 24h window
    await client.messages.sendText({
      phoneNumberId,
      to: '0000000000',
      body: 'test',
    });
    return true;
  } catch (e: any) {
    // If the error is about the recipient or 24h window, the key and phone ID are valid
    const msg = e?.message || '';
    if (msg.includes('24-hour') || msg.includes('recipient') || msg.includes('Recipient')) {
      return true;
    }
    // Auth errors mean invalid key
    return false;
  }
}
