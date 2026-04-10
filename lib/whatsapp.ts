/**
 * WhatsApp provider abstraction — dispatches to the active provider (WASender or Kapso).
 */

import { getActiveWhatsAppProvider, getWaSenderConfig, getKapsoConfig } from '@/lib/integrations';

/**
 * Sends a text WhatsApp message via the currently active provider.
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const provider = await getActiveWhatsAppProvider();

  if (!provider) {
    throw new Error('No WhatsApp provider configured');
  }

  if (provider === 'kapso') {
    const { sendKapsoMessage } = await import('@/lib/kapso');
    const config = await getKapsoConfig();
    await sendKapsoMessage(to, text, config);
  } else {
    const { sendWaSenderMessage } = await import('@/lib/wasender');
    await sendWaSenderMessage(to, text);
  }
}
