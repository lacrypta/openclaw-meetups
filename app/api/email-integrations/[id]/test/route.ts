import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';
import nodemailer from 'nodemailer';
import { promises as dnsPromises } from 'dns';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { SmtpConfig, AwsSesConfig, ResendConfig } from '@/lib/types';
import { composeEmail } from '@/lib/email-composer';

async function resolveIPv4(hostname: string): Promise<string> {
  const { address } = await dnsPromises.lookup(hostname, { family: 4 });
  return address;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { to, layout_id } = await request.json();
    if (!to || typeof to !== 'string') {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    const { data: integration, error: fetchError } = await supabase
      .from('email_integrations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const config = JSON.parse(integration.config);
    const testContent = `<h2>Test Email</h2><p>This is a test email sent from the <strong>${integration.name}</strong> integration.</p><p>If you received this, your email configuration is working correctly.</p>`;

    let subject = `Test email from ${integration.name}`;
    let html = testContent;

    // Wrap in layout if requested
    if (layout_id) {
      const { data: layout } = await supabase
        .from('email_layouts')
        .select('*')
        .eq('id', layout_id)
        .single();

      if (layout) {
        const composed = composeEmail({
          template: { html_content: testContent, subject },
          layout: { html_content: layout.html_content },
          variables: { subject },
        });
        html = composed.html;
        subject = composed.subject;
      }
    }

    switch (integration.type) {
      case 'smtp': {
        const cfg = config as SmtpConfig;
        const ip = await resolveIPv4(cfg.host);
        // Port 465 uses implicit TLS; other ports (587, 25) use STARTTLS
        const secure = cfg.port === 465;
        const transport = nodemailer.createTransport({
          host: ip,
          port: cfg.port,
          secure,
          auth: { user: cfg.username, pass: cfg.password },
          tls: { servername: cfg.host },
        });
        await transport.sendMail({
          from: cfg.from_email,
          to,
          subject,
          html,
        });
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
          body: JSON.stringify({
            from: cfg.from_email,
            to,
            subject,
            html,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Resend API error: ${res.status}`);
        }
        break;
      }

      default:
        return NextResponse.json({ error: `Unsupported integration type: ${integration.type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test email error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send test email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
