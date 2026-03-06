import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    // "Session not found" means key is valid but no WhatsApp session linked yet
    const valid = data.success === true || data.message?.includes('Session not found');
    return NextResponse.json({
      valid,
      message: data.success ? 'Connected' : data.message || 'API key valid, no session linked yet',
      account: data,
    });
  } catch {
    return NextResponse.json({ valid: false, error: 'Connection failed' }, { status: 200 });
  }
}
