/**
 * WaSender Client — sends WhatsApp messages via WaSenderAPI.
 */

const WASENDER_API_KEY = process.env.WASENDER_API_KEY || '';
const WASENDER_API_URL = 'https://wasenderapi.com/api/send-message';

/**
 * Sends a text WhatsApp message to the given phone number.
 * @param to - Phone number in international format (e.g. "+5491154177572")
 * @param text - Message text to send
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const response = await fetch(WASENDER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WASENDER_API_KEY}`,
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
