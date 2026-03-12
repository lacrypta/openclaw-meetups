import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';
import { sendEmail } from '@/lib/email-sender';
import { composeEmail } from '@/lib/email-composer';
import { loadCampaignEmailData, buildUserVariables } from '@/lib/campaign-loader';
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

    // 4. Load template + layout (shared with test flow)
    const { templateHtml, templateSubject, layoutHtml } = await loadCampaignEmailData(id);

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

        const attendeeEmail = (user?.email as string) || send.email;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://openclaw.lacrypta.ar';

        const variables = buildUserVariables(
          {
            name: (user?.name as string) || null,
            email: attendeeEmail,
            unsubscribe_token: (user?.unsubscribe_token as string) || null,
          },
          templateSubject,
          appUrl
        );

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
            headers: variables.unsubscribe_url ? {
              'List-Unsubscribe': `<${variables.unsubscribe_url}>`,
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

          // Log to email_log
          await supabase.from('email_log').insert({
            to_email: attendeeEmail,
            subject: composed.subject,
            status: 'sent',
            provider: (integration as EmailIntegration).type,
            campaign_id: id,
            user_id: (user as Record<string, unknown>).id as string,
          }); // best-effort, ignore errors

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

          // Log failure
          await supabase.from('email_log').insert({
            to_email: attendeeEmail,
            subject: templateSubject,
            status: 'failed',
            provider: (integration as EmailIntegration).type,
            campaign_id: id,
            user_id: (user as Record<string, unknown>).id as string,
            error: errorMsg,
          }); // best-effort, ignore errors

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
