import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'admin');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', 'kapso')
    .eq('is_active', true)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ integration: null });
  }

  const cfg = data.config as Record<string, unknown>;
  const maskedKey = cfg.api_key
    ? `${String(cfg.api_key).slice(0, 8)}...${String(cfg.api_key).slice(-4)}`
    : '';

  return NextResponse.json({
    integration: {
      id: data.id,
      config: {
        api_key: maskedKey,
        phone_number_id: cfg.phone_number_id || '',
        phone_number: cfg.phone_number || '',
        send_whatsapp_on_new_guest: cfg.send_whatsapp_on_new_guest ?? false,
      },
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'admin');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { api_key, phone_number_id, phone_number, send_whatsapp_on_new_guest } = await request.json();
    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json({ error: 'api_key is required' }, { status: 400 });
    }
    if (!phone_number_id || typeof phone_number_id !== 'string') {
      return NextResponse.json({ error: 'phone_number_id is required' }, { status: 400 });
    }

    const config: Record<string, unknown> = {
      api_key,
      phone_number_id,
      phone_number: phone_number || '',
      send_whatsapp_on_new_guest: send_whatsapp_on_new_guest ?? false,
    };

    // Deactivate other WhatsApp providers when saving Kapso
    await supabase
      .from('integrations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('provider', 'wasender');

    const { error } = await supabase
      .from('integrations')
      .upsert(
        {
          provider: 'kapso',
          name: 'Kapso',
          config,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'provider,name' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRole(request, 'admin');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase
    .from('integrations')
    .delete()
    .eq('provider', 'kapso');

  return NextResponse.json({ ok: true });
}
