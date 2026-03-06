import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-server';
import { getLumaConfig } from '@/lib/integrations';
import { getIntegration } from '@/lib/integrations';

export async function GET(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const integration = await getIntegration('luma');
  if (!integration) {
    return NextResponse.json({ error: 'Luma not configured' }, { status: 400 });
  }

  try {
    const config = await getLumaConfig();
    const res = await fetch(`${config.base_url}/calendar/list-events`, {
      headers: {
        'x-luma-api-key': config.api_key,
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
    const now = new Date();

    // Log raw first entry for debugging
    if (data.entries?.[0]) {
      console.log('Luma raw entry sample:', JSON.stringify(data.entries[0]).substring(0, 500));
    }

    // Filter upcoming events only
    const events = (data.entries || [])
      .map((entry: Record<string, unknown>) => (entry.event || entry) as Record<string, unknown>)
      .filter((event: Record<string, unknown>) => {
        if (!event) return false;
        const startAt = event.start_at as string | undefined;
        if (!startAt) return true;
        return new Date(startAt) >= now;
      })
      .map((event: Record<string, unknown>) => ({
        api_id: event.api_id,
        name: event.name,
        start_at: event.start_at,
        end_at: event.end_at,
        cover_url: event.cover_url,
        description: event.description,
        url: event.url,
        geo_address_info: event.geo_address_info,
      }));

    return NextResponse.json({ events });
  } catch (err) {
    console.error('Luma events error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
