/**
 * Webhook Logger — stores webhook requests in the webhook_logs table.
 */

import { supabase } from '@/lib/supabase';

interface WebhookLogEntry {
  provider: string;
  event_type?: string;
  request_headers?: Record<string, string>;
  request_body?: unknown;
}

interface WebhookLogResult {
  id: string;
  update: (data: {
    status?: string;
    response_status?: number;
    response_body?: unknown;
    error_message?: string;
    metadata?: Record<string, unknown>;
    processing_time_ms?: number;
  }) => Promise<void>;
}

/**
 * Create a webhook log entry. Returns an updater to finalize status.
 */
export async function logWebhook(entry: WebhookLogEntry): Promise<WebhookLogResult> {
  const { data, error } = await supabase
    .from('webhook_logs')
    .insert({
      provider: entry.provider,
      event_type: entry.event_type || null,
      status: 'processing',
      request_headers: entry.request_headers || null,
      request_body: entry.request_body || null,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Failed to create webhook log:', error);
    // Return a no-op so callers don't break
    return {
      id: 'unknown',
      update: async () => {},
    };
  }

  return {
    id: data.id,
    update: async (updates) => {
      const { error: updateError } = await supabase
        .from('webhook_logs')
        .update(updates)
        .eq('id', data.id);

      if (updateError) {
        console.error('Failed to update webhook log:', updateError);
      }
    },
  };
}
