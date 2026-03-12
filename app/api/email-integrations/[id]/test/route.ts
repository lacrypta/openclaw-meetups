import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-server';
import { sendTest } from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'admin');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { to, layout_id } = await request.json();
    if (!to || typeof to !== 'string') {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    await sendTest({ to, integrationId: id, layoutId: layout_id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test email error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send test email';
    // Surface "not found" errors as 404
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
