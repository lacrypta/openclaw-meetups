/**
 * Email Sender — sends emails using configured integrations.
 * Supports SMTP, AWS SES, and Resend providers.
 */

import { supabase } from '@/lib/supabase';
import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { promises as dnsPromises } from 'dns';
import type { EmailIntegration, SmtpConfig, AwsSesConfig, ResendConfig } from './types';

async function resolveIPv4(hostname: string): Promise<string> {
  const { address } = await dnsPromises.lookup(hostname, { family: 4 });
  return address;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email using the provided integration (SMTP, AWS SES, or Resend).
 * Throws on failure with a descriptive error message.
 */
export async function sendEmail(
  integration: EmailIntegration,
  options: SendEmailOptions
): Promise<void> {
  // config is already a JSONB object (no JSON.parse needed)
  const config = integration.config;
  const { to, subject, html } = options;

  switch (integration.type) {
    case 'smtp': {
      const cfg = config as unknown as SmtpConfig;
      const ip = await resolveIPv4(cfg.host);
      const secure = cfg.port === 465;
      const transport = nodemailer.createTransport({
        host: ip,
        port: cfg.port,
        secure,
        auth: { user: cfg.username, pass: cfg.password },
        tls: { servername: cfg.host },
      });
      await transport.sendMail({ from: cfg.from_email, to, subject, html });
      break;
    }

    case 'aws_ses': {
      const cfg = config as unknown as AwsSesConfig;
      const ses = new SESClient({
        region: cfg.region,
        credentials: {
          accessKeyId: cfg.access_key_id,
          secretAccessKey: cfg.secret_access_key,
        },
      });
      await ses.send(
        new SendEmailCommand({
          Source: cfg.from_email,
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject },
            Body: { Html: { Data: html } },
          },
        })
      );
      break;
    }

    case 'resend': {
      const cfg = config as unknown as ResendConfig;
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.api_key}`,
        },
        body: JSON.stringify({ from: cfg.from_email, to, subject, html }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Resend API error: ${res.status}`);
      }
      break;
    }

    default:
      throw new Error(`Unsupported integration type: ${integration.type}`);
  }
}

/**
 * Send an RSVP confirmation email using the default email integration.
 */
export async function sendConfirmationEmail(
  to: string,
  userName: string,
  eventName: string,
  confirmationLink?: string
): Promise<void> {
  // Get default integration from generic integrations table (provider='email')
  const { data: rawIntegration, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', 'email')
    .eq('is_active', true)
    .order('created_at')
    .maybeSingle();

  // Map raw integrations row to EmailIntegration shape
  const integration = rawIntegration
    ? {
        ...rawIntegration,
        type: (rawIntegration.config as Record<string, unknown>).type as string,
        is_default: Boolean((rawIntegration.config as Record<string, unknown>).is_default),
      }
    : null;

  if (error || !rawIntegration || !integration) {
    throw new Error('No default email integration configured');
  }

  // Try to use a template from the database
  const firstName = userName.split(' ')[0];
  const { data: template } = await supabase
    .from('email_templates')
    .select('html_content, subject, layout_id, email_layouts(html_content)')
    .eq('segment', 'confirmation')
    .eq('is_active', true)
    .maybeSingle();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://openclaw.lacrypta.ar';
  const link = confirmationLink || `${baseUrl}/confirmation?email=${encodeURIComponent(to)}`;

  const replaceVars = (text: string) =>
    text
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, userName)
      .replace(/\{\{email\}\}/g, to)
      .replace(/\{\{event_name\}\}/g, eventName)
      .replace(/\{\{confirmation_link\}\}/g, link);

  const subject = template?.subject
    ? replaceVars(template.subject)
    : `✅ Confirmación: ${eventName}`;

  let templateHtml = template?.html_content
    ? replaceVars(template.html_content)
    : `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>¡Confirmado! 🎉</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Tu asistencia a <strong>${eventName}</strong> ha sido confirmada.</p>
        <p>¡Nos vemos ahí!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px;">OpenClaw Meetups — La Crypta</p>
      </div>
    `;

  // Wrap in layout if available
  const layoutHtml = (template as any)?.email_layouts?.html_content;
  const html = layoutHtml
    ? replaceVars(layoutHtml).replace('{{content}}', templateHtml).replace('{{subject}}', subject)
    : templateHtml;

  await sendEmail(integration as EmailIntegration, { to, subject, html });
}
