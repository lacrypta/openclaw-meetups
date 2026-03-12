import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'admin');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { api_key } = await request.json();
    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json({ error: 'api_key is required' }, { status: 400 });
    }

    // Verify by calling WaSender status endpoint
    // A valid key returns JSON (even if session not found); an invalid key returns HTML/401
    const res = await fetch('https://wasenderapi.com/api/status', {
      headers: { Authorization: `Bearer ${api_key}` },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ valid: false, error: 'Invalid API key' });
    }

    const data = await res.json();
    // Valid responses: {status: "connected"} or {success: false, message: "Session not found"}
    const valid = data.status === 'connected' || data.message?.includes('Session not found') || data.success === true;
    return NextResponse.json({
      valid,
      message: data.status === 'connected' ? 'WhatsApp session connected' : data.message || 'API key valid',
      account: data,
    });
  } catch {
    return NextResponse.json({ valid: false, error: 'Connection failed' }, { status: 200 });
  }
}
