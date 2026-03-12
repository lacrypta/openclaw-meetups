import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';
import { sendEmail } from '@/lib/email-sender';
import { composeEmail, getSampleVariables, AVAILABLE_VARIABLES } from '@/lib/email-composer';
import type { EmailIntegration } from '@/lib/types';

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
    const body = await request.json();
    const testEmail = body.email;

    if (!testEmail || typeof testEmail !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Load campaign
    const { data: job, error: jobError } = await supabase
      .from('email_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // 2. Load integration
    const jobConfig = (job.config || {}) as Record<string, unknown>;
    const integrationId = jobConfig.integration_id as string;

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

    // 3. Load template + layout, respecting custom_html
    let templateHtml = '';
    let templateSubject = job.subject;
    let layoutHtml: string | null = null;

    if (typeof jobConfig.custom_html === 'string' && jobConfig.custom_html) {
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

    // Apply layout from campaign config (overrides template layout)
    if (typeof jobConfig.layout_id === 'string') {
      if (jobConfig.layout_id === 'blank') {
        layoutHtml = null;
      } else {
        const { data: layout } = await supabase
          .from('email_layouts')
          .select('html_content')
          .eq('id', jobConfig.layout_id)
          .single();
        if (layout) layoutHtml = layout.html_content;
      }
    }

    // 4. Compose with provided variables or sample fallback
    const variableNames = AVAILABLE_VARIABLES.map(v => v.name);
    const variables = {
      ...getSampleVariables(variableNames),
      ...(body.variables || {}),
      subject: templateSubject,
    };

    const composed = composeEmail({
      template: { html_content: templateHtml, subject: templateSubject },
      layout: layoutHtml ? { html_content: layoutHtml } : null,
      variables,
    });

    // 5. Send test email
    await sendEmail(integration, {
      to: testEmail,
      subject: `[TEST] ${composed.subject}`,
      html: composed.html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test email error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
