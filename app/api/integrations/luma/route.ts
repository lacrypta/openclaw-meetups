import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', 'luma')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ integration: null });
  }

  // Mask api_key
  const cfg = data.config as Record<string, unknown>;
  const maskedKey = cfg?.api_key
    ? '****' + String(cfg.api_key).slice(-4)
    : null;

  return NextResponse.json({
    integration: {
      ...data,
      config: { ...cfg, api_key: maskedKey },
    },
  });
}

export async function POST(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { api_key, webhook_secret } = await request.json();
    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json({ error: 'api_key is required' }, { status: 400 });
    }

    const config: Record<string, unknown> = {
      api_key,
      base_url: 'https://public-api.luma.com/v1',
    };
    if (webhook_secret) config.webhook_secret = webhook_secret;

    const { data, error } = await supabase
      .from('integrations')
      .upsert(
        {
          provider: 'luma',
          name: 'Luma',
          config,
          is_active: true,
        },
        { onConflict: 'provider,name' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, integration: data });
  } catch (err) {
    console.error('Luma save error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('integrations')
    .update({ is_active: false })
    .eq('provider', 'luma');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
