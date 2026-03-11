/**
 * Generic integrations helper — fetches provider configs from the integrations table.
 */

import { supabase } from '@/lib/supabase';
import type { Integration, LumaConfig, WaSenderConfig, AIConfig } from '@/lib/types';

/**
 * Fetch an active integration config by provider name.
 */
export async function getIntegration(provider: string): Promise<Integration | null> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', provider)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error(`Failed to fetch integration for provider "${provider}":`, error);
    return null;
  }

  return data as Integration | null;
}

/**
 * Returns typed Luma config from the integrations table.
 * Falls back to env vars if not configured in DB.
 */
export async function getLumaConfig(): Promise<LumaConfig> {
  const integration = await getIntegration('luma');

  if (integration?.config) {
    const cfg = integration.config as Partial<LumaConfig>;
    return {
      api_key: cfg.api_key || process.env.LUMA_API_KEY || '',
      base_url: cfg.base_url || 'https://public-api.luma.com/v1',
      webhook_secret: cfg.webhook_secret,
      send_confirmation_email: cfg.send_confirmation_email ?? true,
    };
  }

  // Fallback to env vars
  return {
    api_key: process.env.LUMA_API_KEY || '',
    base_url: 'https://public-api.luma.com/v1',
    webhook_secret: process.env.LUMA_WEBHOOK_SECRET,
  };
}

/**
 * Returns typed WaSender config from the integrations table.
 * Falls back to env vars if not configured in DB.
 */
export async function getWaSenderConfig(): Promise<WaSenderConfig> {
  const integration = await getIntegration('wasender');

  if (integration?.config) {
    const cfg = integration.config as Partial<WaSenderConfig>;
    return {
      api_key: cfg.api_key || process.env.WASENDER_API_KEY || '',
      webhook_secret: cfg.webhook_secret || process.env.WASENDER_WEBHOOK_SECRET,
      phone_number: cfg.phone_number || '',
      send_whatsapp_on_new_guest: cfg.send_whatsapp_on_new_guest ?? false,
    };
  }

  // Fallback to env vars
  return {
    api_key: process.env.WASENDER_API_KEY || '',
    webhook_secret: process.env.WASENDER_WEBHOOK_SECRET,
    phone_number: process.env.WASENDER_PHONE_NUMBER || '',
  };
}

/**
 * Returns typed AI config from the integrations table.
 */
export async function getAIConfig(): Promise<AIConfig> {
  const integration = await getIntegration('ai');
  const cfg = integration?.config as Partial<AIConfig> || {};
  return {
    api_key: cfg.api_key || '',
    default_model: cfg.default_model || 'anthropic/claude-haiku-4-5',
    master_prompt: cfg.master_prompt || 'Sos Claudio, asistente de eventos de La Crypta. Respondé en español argentino, corto y directo.',
    enabled: cfg.enabled ?? false,
  };
}
