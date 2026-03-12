import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';
import { sendEmail } from '@/lib/email-sender';
import { composeEmail } from '@/lib/email-composer';
import { loadCampaignEmailData, buildUserVariables } from '@/lib/campaign-loader';
import type { EmailIntegration, EmailSendStatus } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { send_id } = await request.json();

    if (!send_id) {
      return NextResponse.json({ error: 'send_id is required' }, { status: 400 });
    }

    // 1. Load send record with user
    const { data: send, error: sendError } = await supabase
      .from('email_sends')
      .select('*, users!inner(id, name, email, subscribed, unsubscribe_token)')
      .eq('id', send_id)
      .eq('job_id', id)
      .single();

    if (sendError || !send) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const user = send.users as Record<string, unknown>;

    if (user.subscribed === false) {
      return NextResponse.json({ error: 'Usuario desuscripto' }, { status: 400 });
    }

    // 2. Load campaign email data (same flow as bulk send)
    const { templateHtml, templateSubject, layoutHtml, integrationId } = await loadCampaignEmailData(id);

    if (!integrationId) {
      return NextResponse.json({ error: 'Email integration not configured' }, { status: 400 });
    }

    // 3. Load integration
    const { data: rawIntegration } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('provider', 'email')
      .single();

    if (!rawIntegration) {
      return NextResponse.json({ error: 'Email integration not found' }, { status: 400 });
    }

    const integration = {
      ...rawIntegration,
      type: (rawIntegration.config as Record<string, unknown>).type as string,
      is_default: Boolean((rawIntegration.config as Record<string, unknown>).is_default),
    } as EmailIntegration;

    // 4. Build variables (same as bulk send)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://openclaw.lacrypta.ar';
    const variables = buildUserVariables(
      {
        name: (user.name as string) || null,
        email: (user.email as string) || send.email,
        unsubscribe_token: (user.unsubscribe_token as string) || null,
      },
      templateSubject,
      appUrl
    );

    // 5. Compose (same as bulk send)
    const composed = composeEmail({
      template: { html_content: templateHtml, subject: templateSubject },
      layout: layoutHtml ? { html_content: layoutHtml } : null,
      variables,
    });

    // 6. Send
    await sendEmail(integration, {
      to: (user.email as string) || send.email,
      subject: composed.subject,
      html: composed.html,
      headers: variables.unsubscribe_url ? {
        'List-Unsubscribe': `<${variables.unsubscribe_url}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      } : undefined,
    });

    // 7. Update send status
    await supabase
      .from('email_sends')
      .update({
        status: 'sent' as EmailSendStatus,
        sent_at: new Date().toISOString(),
        attempts: (send.attempts || 0) + 1,
      })
      .eq('id', send_id);

    // 8. Log to email_log
    await supabase.from('email_log').insert({
      to_email: (user.email as string) || send.email,
      subject: composed.subject,
      status: 'sent',
      provider: integration.type,
      campaign_id: id,
      user_id: user.id as string,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send-one error:', error);

    // Update send as failed
    try {
      const { send_id } = await request.clone().json();
      if (send_id) {
        await supabase
          .from('email_sends')
          .update({
            status: 'failed' as EmailSendStatus,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', send_id);
      }
    } catch {}

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error sending email' },
      { status: 500 }
    );
  }
}
