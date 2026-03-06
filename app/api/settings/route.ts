import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('integrations')
    .select('id, config')
    .eq('provider', 'general')
    .eq('name', 'General Settings')
    .maybeSingle();

  return NextResponse.json({
    timezone: (data?.config as Record<string, unknown>)?.timezone || 'America/Buenos_Aires',
  });
}

export async function PATCH(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { timezone } = body;

  if (!timezone || typeof timezone !== 'string') {
    return NextResponse.json({ error: 'timezone is required' }, { status: 400 });
  }

  // Validate timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('integrations')
    .select('id, config')
    .eq('provider', 'general')
    .eq('name', 'General Settings')
    .maybeSingle();

  if (existing) {
    const newConfig = { ...(existing.config as Record<string, unknown>), timezone };
    await supabase
      .from('integrations')
      .update({ config: newConfig, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('integrations')
      .insert({ provider: 'general', name: 'General Settings', config: { timezone }, is_active: true });
  }

  return NextResponse.json({ ok: true, timezone });
}
