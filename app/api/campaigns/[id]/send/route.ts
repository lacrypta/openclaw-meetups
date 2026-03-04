import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';
import { sendEmail } from '@/lib/email-sender';
import { composeEmail } from '@/lib/email-composer';
import type { EmailIntegration } from '@/lib/types';

const BATCH_SIZE = 10;

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

    // 3. Load integration
    const integrationId = (job.config as Record<string, unknown>).integration_id as string;
    const { data: integration, error: intError } = await supabase
      .from('email_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (intError || !integration) {
      await supabase
        .from('email_jobs')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', id);
      return NextResponse.json({ error: 'Email integration not found' }, { status: 400 });
    }

    // 4. Load template + layout
    let templateHtml = '';
    let templateSubject = job.subject;
    let layoutHtml: string | null = null;

    if (job.template_id) {
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

    // 5. Query pending sends
    const { data: pendingSends, error: sendsError } = await supabase
      .from('email_sends')
      .select('*, attendees!inner(id, name, email)')
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
        const attendee = send.attendees as Record<string, unknown>;
        const attendeeName = (attendee.name as string) || '';
        const attendeeEmail = (attendee.email as string) || send.email;
        const firstName = attendeeName.split(' ')[0] || attendeeName;

        const variables: Record<string, string> = {
          name: attendeeName,
          firstname: firstName,
          first_name: firstName,
          fullname: attendeeName,
          email: attendeeEmail,
          subject: templateSubject,
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
