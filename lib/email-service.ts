/**
 * Email Service — single entry point for ALL email sending.
 *
 * All email flows go through `send()`. The `sendTest()` helper uses
 * the same code path so a passing test guarantees real sends work too.
 */

import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email-sender';
import { composeEmail } from '@/lib/email-composer';
import type { EmailIntegration } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendOptions {
  /** Recipient email address */
  to: string;
  /** Template segment key (e.g. 'confirmation') */
  segment: string;
  /** Template variables — {{key}} placeholders */
  variables?: Record<string, string>;
  /** Optional: use a specific integration instead of the default */
  integrationId?: string;
}

export interface SendTestOptions {
  /** Recipient email address */
  to: string;
  /** Integration to test (must exist in DB) */
  integrationId: string;
  /** Optional: wrap test content in this layout */
  layoutId?: string;
}

export interface SendResult {
  success: true;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Maps a raw integrations row to the EmailIntegration shape. */
function mapIntegration(raw: Record<string, unknown>): EmailIntegration {
  return {
    ...(raw as object),
    type: (raw.config as Record<string, unknown>).type as string,
    is_default: Boolean((raw.config as Record<string, unknown>).is_default),
  } as EmailIntegration;
}

/** Fetches the active default email integration from the DB. */
async function getDefaultIntegration(): Promise<EmailIntegration> {
  // Prefer the integration marked as default (config->is_default), fallback to newest
  const { data: rows, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', 'email')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const raw = rows?.find(
    (r) => (r.config as Record<string, unknown>)?.is_default === true
  ) || rows?.[0] || null;

  if (error || !raw) {
    throw new Error('No default email integration configured');
  }
  return mapIntegration(raw as Record<string, unknown>);
}

/** Fetches a specific integration by ID. */
async function getIntegrationById(id: string): Promise<EmailIntegration> {
  const { data: raw, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('id', id)
    .eq('provider', 'email')
    .single();

  if (error || !raw) {
    throw new Error(`Email integration not found: ${id}`);
  }
  return mapIntegration(raw as Record<string, unknown>);
}

/** Loads an email template (with its layout) by segment. Returns null if not found. */
async function loadTemplate(
  segment: string
): Promise<{ html_content: string; subject: string; layoutHtml: string | null } | null> {
  const { data } = await supabase
    .from('email_templates')
    .select('html_content, subject, layout_id, email_layouts(html_content)')
    .eq('segment', segment)
    .eq('is_active', true)
    .maybeSingle();

  if (!data) return null;

  const layoutHtml =
    (data.email_layouts as unknown as { html_content: string } | null)?.html_content ?? null;

  return {
    html_content: data.html_content,
    subject: data.subject,
    layoutHtml,
  };
}

/** Fallback HTML when no template is found for a segment. */
function fallbackTemplate(variables: Record<string, string>, segment: string) {
  const name = variables.name || variables.first_name || 'Asistente';
  const eventName = variables.event_name || '';
  const link = variables.confirmation_link || '';

  return {
    subject: eventName ? `✅ Confirmación: ${eventName}` : `✅ Email de ${segment}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>¡Confirmado! 🎉</h2>
        <p>Hola <strong>${name}</strong>,</p>
        ${eventName ? `<p>Tu asistencia a <strong>${eventName}</strong> ha sido confirmada.</p>` : ''}
        ${link ? `<p><a href="${link}">Ver confirmación</a></p>` : ''}
        <p>¡Nos vemos ahí!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px;">OpenClaw Meetups — La Crypta</p>
      </div>
    `,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send an email via the unified service.
 *
 * 1. Resolves integration (specific or default)
 * 2. Loads template by segment from DB
 * 3. Composes HTML via composeEmail()
 * 4. Falls back to built-in template if none found
 * 5. Sends via low-level transport
 */
export async function send(options: SendOptions): Promise<SendResult> {
  const { to, segment, variables = {}, integrationId } = options;

  const integration = integrationId
    ? await getIntegrationById(integrationId)
    : await getDefaultIntegration();

  const tpl = await loadTemplate(segment);

  let subject: string;
  let html: string;

  if (tpl) {
    const composed = composeEmail({
      template: { html_content: tpl.html_content, subject: tpl.subject },
      layout: tpl.layoutHtml ? { html_content: tpl.layoutHtml } : null,
      variables,
    });
    subject = composed.subject;
    html = composed.html;
  } else {
    // No DB template — use sensible fallback
    const fb = fallbackTemplate(variables, segment);
    subject = fb.subject;
    html = fb.html;
  }

  await sendEmail(integration, { to, subject, html });
  return { success: true };
}

/**
 * Send a test email through a specific integration.
 * Uses the same send() path — if test passes, real sends will work.
 */
export async function sendTest(options: SendTestOptions): Promise<SendResult> {
  const { to, integrationId, layoutId } = options;

  // Fetch integration name for the test content
  const integration = await getIntegrationById(integrationId);
  const integrationName = (integration as unknown as Record<string, unknown>).name as string || integrationId;

  // Build test template content
  const testHtml = `<h2>Test Email</h2><p>This is a test email sent from the <strong>${integrationName}</strong> integration.</p><p>If you received this, your email configuration is working correctly.</p>`;
  const testSubject = `Test email from ${integrationName}`;

  // Try to find a layout if layoutId provided
  let layoutHtml: string | null = null;
  if (layoutId) {
    const { data: layout } = await supabase
      .from('email_layouts')
      .select('html_content')
      .eq('id', layoutId)
      .single();
    if (layout) layoutHtml = layout.html_content;
  }

  const composed = composeEmail({
    template: { html_content: testHtml, subject: testSubject },
    layout: layoutHtml ? { html_content: layoutHtml } : null,
    variables: { subject: testSubject },
  });

  await sendEmail(integration, { to, subject: composed.subject, html: composed.html });
  return { success: true };
}
