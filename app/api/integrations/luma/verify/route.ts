import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-server';

const LUMA_BASE_URL = 'https://public-api.luma.com/v1';

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'admin');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { api_key } = await request.json();
    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json({ error: 'api_key is required' }, { status: 400 });
    }

    // Use list-events to verify API key (list-calendars doesn't exist in Luma API)
    const res = await fetch(`${LUMA_BASE_URL}/calendar/list-events`, {
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
    const events = (data.entries || []).map((e: any) => ({
      name: e.event?.name || e.name,
      start_at: e.event?.start_at || e.start_at,
      api_id: e.event?.api_id || e.api_id,
    }));
    return NextResponse.json({ success: true, events, event_count: events.length });
  } catch (err) {
    console.error('Luma verify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
