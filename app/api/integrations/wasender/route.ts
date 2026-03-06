import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', 'wasender')
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
        phone_number: cfg.phone_number || '',
        send_whatsapp_on_new_guest: cfg.send_whatsapp_on_new_guest ?? false,
      },
    },
  });
}

export async function POST(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { api_key, phone_number, send_whatsapp_on_new_guest } = await request.json();
    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json({ error: 'api_key is required' }, { status: 400 });
    }

    const config: Record<string, unknown> = {
      api_key,
      phone_number: phone_number || '',
      send_whatsapp_on_new_guest: send_whatsapp_on_new_guest ?? false,
    };

    const { error } = await supabase
      .from('integrations')
      .upsert(
        {
          provider: 'wasender',
          name: 'WaSender',
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
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase
    .from('integrations')
    .delete()
    .eq('provider', 'wasender');

  return NextResponse.json({ ok: true });
}
