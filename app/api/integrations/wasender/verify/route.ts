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

    // Verify by calling WaSender account endpoint
    const res = await fetch('https://wasenderapi.com/api/sessions', {
      headers: { Authorization: `Bearer ${api_key}` },
    });

    if (!res.ok) {
      return NextResponse.json({ valid: false, error: 'Invalid API key' }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json({
      valid: true,
      account: data,
    });
  } catch {
    return NextResponse.json({ valid: false, error: 'Connection failed' }, { status: 200 });
  }
}
