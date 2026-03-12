import { supabase } from '@/lib/supabase';

export interface CampaignEmailData {
  templateHtml: string;
  templateSubject: string;
  layoutHtml: string | null;
  integrationId: string | null;
}

/**
 * Loads campaign email data: template HTML, subject, layout, and integration ID.
 * Single source of truth for test, preview, and send flows.
 */
export async function loadCampaignEmailData(campaignId: string): Promise<CampaignEmailData> {
  const { data: job, error } = await supabase
    .from('email_jobs')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (error || !job) {
    throw new Error('Campaign not found');
  }

  const jobConfig = (job.config || {}) as Record<string, unknown>;
  let templateHtml = '';
  let templateSubject = job.subject || '';
  let layoutHtml: string | null = null;

  // 1. Load content: custom_html takes priority over template
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

  // 2. Apply layout from campaign config (overrides template layout)
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

  return {
    templateHtml,
    templateSubject,
    layoutHtml,
    integrationId: (jobConfig.integration_id as string) || null,
  };
}

/**
 * Builds variables for a specific user (used by both send and test flows).
 */
export function buildUserVariables(
  user: { name?: string | null; email: string; unsubscribe_token?: string | null },
  subject: string,
  appUrl: string
): Record<string, string> {
  const fullName = user.name || '';
  const firstName = fullName.split(' ')[0] || '';
  const unsubscribeToken = user.unsubscribe_token || '';
  const unsubscribeUrl = unsubscribeToken ? `${appUrl}/unsubscribe?token=${unsubscribeToken}` : '';

  const lastName = fullName.split(' ').slice(1).join(' ');

  return {
    firstname: firstName,
    first_name: firstName,
    lastname: lastName,
    last_name: lastName,
    fullname: fullName,
    name: fullName,
    email: user.email,
    subject,
    unsubscribe_token: unsubscribeToken,
    unsubscribe_url: unsubscribeUrl,
  };
}
