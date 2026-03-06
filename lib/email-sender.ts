/**
 * Email Sender — sends emails using configured integrations.
 * Supports SMTP, AWS SES, and Resend providers.
 */

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
      let host = cfg.host;
      const tlsOptions: Record<string, unknown> = { servername: cfg.host };
      try {
        host = await resolveIPv4(cfg.host);
      } catch {
        // DNS lookup may not work in serverless environments; fall back to hostname
      }
      const secure = cfg.port === 465;
      const transport = nodemailer.createTransport({
        host,
        port: cfg.port,
        secure,
        auth: { user: cfg.username, pass: cfg.password },
        tls: tlsOptions,
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
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


