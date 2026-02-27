import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';
import { sendEmail } from '@/lib/email-sender';
import { composeEmail } from '@/lib/email-composer';

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

    await sendEmail(integration, { to, subject, html });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test email error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send test email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
