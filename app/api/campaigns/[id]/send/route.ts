import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';
import { sendEmail } from '@/lib/email-sender';
import { composeEmail } from '@/lib/email-composer';
import type { EmailIntegration, EmailSendStatus } from '@/lib/types';

const BATCH_SIZE = 10;

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
    // 1. Load job
    const { data: job, error: jobError } = await supabase
      .from('email_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (!['pending', 'partial'].includes(job.status)) {
      return NextResponse.json(
        { error: `Cannot send campaign with status: ${job.status}` },
        { status: 400 }
      );
    }

    // 2. Set status to running
    await supabase
      .from('email_jobs')
      .update({ status: 'running', started_at: job.started_at || new Date().toISOString() })
      .eq('id', id);

    // 3. Load integration (from generic integrations table, provider='email')
    const integrationId = (job.config as Record<string, unknown>).integration_id as string;
    const { data: rawIntegration, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('provider', 'email')
      .single();

    const integration = rawIntegration
      ? {
          ...rawIntegration,
          type: (rawIntegration.config as Record<string, unknown>).type as string,
          is_default: Boolean((rawIntegration.config as Record<string, unknown>).is_default),
        }
      : null;

    if (intError || !rawIntegration || !integration) {
      await supabase
        .from('email_jobs')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', id);
      return NextResponse.json({ error: 'Email integration not found' }, { status: 400 });
    }

    // 4. Load template + layout (custom_html overrides template)
    const jobConfig = (job.config || {}) as Record<string, unknown>;
    let templateHtml = '';
    let templateSubject = job.subject;
    let layoutHtml: string | null = null;

    if (typeof jobConfig.custom_html === 'string' && jobConfig.custom_html) {
      // Use custom HTML from campaign config — skip template
      templateHtml = jobConfig.custom_html;
    } else if (job.template_id) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('*, email_layouts(*)')
        .eq('id', job.template_id)
        .single();

      if (template) {
        templateHtml = template.html_content;
        templateSubject = job.subject || template.subject;
        if (template.email_layouts) {
          layoutHtml = template.email_layouts.html_content;
        } else if (template.layout_id) {
          const { data: layout } = await supabase
            .from('email_layouts')
            .select('html_content')
            .eq('id', template.layout_id)
            .single();
          if (layout) layoutHtml = layout.html_content;
        }
      }
    }

    // 5. Query pending sends (including unsubscribe token and subscription status)
    const { data: pendingSends, error: sendsError } = await supabase
      .from('email_sends')
      .select('*, users!inner(id, name, email, subscribed, unsubscribe_token)')
      .eq('job_id', id)
      .eq('status', 'pending')
      .order('created_at');

    if (sendsError) {
      console.error('Sends query error:', sendsError);
      await supabase
        .from('email_jobs')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', id);
      return NextResponse.json({ error: 'Failed to load pending sends' }, { status: 500 });
    }

    const sends = pendingSends || [];
    let sentCount = job.sent_count || 0;
    let failedCount = job.failed_count || 0;

    // 6. Process in batches
    for (let i = 0; i < sends.length; i += BATCH_SIZE) {
      // Re-check job status for cancellation
      const { data: currentJob } = await supabase
        .from('email_jobs')
        .select('status')
        .eq('id', id)
        .single();

      if (currentJob?.status === 'cancelled') {
        break;
      }

      const batch = sends.slice(i, i + BATCH_SIZE);

      for (const send of batch) {
        const user = send.users as Record<string, unknown> | null;

        // Skip unsubscribed users
        if (user?.subscribed === false) {
          await supabase
            .from('email_sends')
            .update({ status: 'skipped' as EmailSendStatus, attempts: (send.attempts || 0) + 1 })
            .eq('id', send.id);
          continue;
        }

        const attendeeName = (user?.name as string) || '';
        const attendeeEmail = (user?.email as string) || send.email;
        const firstName = attendeeName.split(' ')[0] || attendeeName;
        const unsubscribeToken = (user?.unsubscribe_token as string) || '';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://openclaw.lacrypta.ar';
        const unsubscribeUrl = unsubscribeToken ? `${appUrl}/unsubscribe?token=${unsubscribeToken}` : '';

        const variables: Record<string, string> = {
          name: attendeeName,
          firstname: firstName,
          first_name: firstName,
          fullname: attendeeName,
          email: attendeeEmail,
          subject: templateSubject,
          unsubscribe_token: unsubscribeToken,
          unsubscribe_url: unsubscribeUrl,
        };

        try {
          const composed = composeEmail({
            template: { html_content: templateHtml, subject: templateSubject },
            layout: layoutHtml ? { html_content: layoutHtml } : null,
            variables,
          });

          await sendEmail(integration as EmailIntegration, {
            to: attendeeEmail,
            subject: composed.subject,
            html: composed.html,
            headers: unsubscribeUrl ? {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            } : undefined,
          });

          await supabase
            .from('email_sends')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              attempts: (send.attempts || 0) + 1,
            })
            .eq('id', send.id);

          sentCount++;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';

          await supabase
            .from('email_sends')
            .update({
              status: 'failed',
              error: errorMsg,
              attempts: (send.attempts || 0) + 1,
            })
            .eq('id', send.id);

          failedCount++;
        }
      }

      // Update job progress after each batch
      await supabase
        .from('email_jobs')
        .update({
          sent_count: sentCount,
          failed_count: failedCount,
          cursor: i + batch.length,
          last_heartbeat: new Date().toISOString(),
        })
        .eq('id', id);
    }

    // 7. Final status
    const { data: finalCheck } = await supabase
      .from('email_jobs')
      .select('status')
      .eq('id', id)
      .single();

    let finalStatus: string;
    if (finalCheck?.status === 'cancelled') {
      finalStatus = 'cancelled';
    } else if (failedCount > 0 && sentCount > 0) {
      finalStatus = 'partial';
    } else if (failedCount > 0 && sentCount === 0) {
      finalStatus = 'failed';
    } else {
      finalStatus = 'completed';
    }

    const { data: campaign } = await supabase
      .from('email_jobs')
      .update({
        status: finalStatus,
        sent_count: sentCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Campaign send error:', error);
    await supabase
      .from('email_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('id', id);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
