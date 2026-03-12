import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';
import { sendEmail } from '@/lib/email-sender';
import { composeEmail } from '@/lib/email-composer';
import { loadCampaignEmailData, buildUserVariables } from '@/lib/campaign-loader';
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

    // 1. Load campaign email data (same as send flow)
    const { templateHtml, templateSubject, layoutHtml, integrationId } = await loadCampaignEmailData(id);

    // 2. Load integration
    if (!integrationId) {
      return NextResponse.json({ error: 'Email integration not configured' }, { status: 400 });
    }

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

    // 3. Build variables (same as send flow — look up real user if exists)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://openclaw.lacrypta.ar';

    const { data: testUser } = await supabase
      .from('users')
      .select('name, email, unsubscribe_token')
      .eq('email', testEmail)
      .single();

    const variables = buildUserVariables(
      testUser || { email: testEmail },
      templateSubject,
      appUrl
    );

    // 4. Compose (same function as send flow)
    const composed = composeEmail({
      template: { html_content: templateHtml, subject: templateSubject },
      layout: layoutHtml ? { html_content: layoutHtml } : null,
      variables,
    });

    // 5. Send
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
