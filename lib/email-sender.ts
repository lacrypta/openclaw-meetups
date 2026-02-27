import nodemailer from 'nodemailer';
import { promises as dnsPromises } from 'dns';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
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
  const config = JSON.parse(integration.config);
  const { to, subject, html } = options;

  switch (integration.type) {
    case 'smtp': {
      const cfg = config as SmtpConfig;
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
      const cfg = config as AwsSesConfig;
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
      const cfg = config as ResendConfig;
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
