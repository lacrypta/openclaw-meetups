import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-server';

const LUMA_BASE_URL = 'https://public-api.luma.com/v1';

export async function POST(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { api_key } = await request.json();
    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json({ error: 'api_key is required' }, { status: 400 });
    }

    const res = await fetch(`${LUMA_BASE_URL}/calendar/list-calendars`, {
      headers: {
        'x-luma-api-key': api_key,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Luma API error ${res.status}: ${text}` },
        { status: 400 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, calendars: data.entries || [] });
  } catch (err) {
    console.error('Luma verify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
