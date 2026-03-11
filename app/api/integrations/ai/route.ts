import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', 'ai')
    .eq('is_active', true)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ integration: null });
  }

  const cfg = data.config as Record<string, unknown>;
  
  // NEVER return the API key — only indicate if it exists
  return NextResponse.json({
    integration: {
      id: data.id,
      config: {
        has_key: !!cfg.api_key,
        default_model: cfg.default_model || 'anthropic/claude-haiku-4-5',
        master_prompt: cfg.master_prompt || '',
        enabled: cfg.enabled ?? false,
      },
    },
  });
}

export async function POST(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { api_key, default_model, master_prompt, enabled } = await request.json();
    
    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json({ error: 'api_key is required' }, { status: 400 });
    }

    const config: Record<string, unknown> = {
      api_key,
      default_model: default_model || 'anthropic/claude-haiku-4-5',
      master_prompt: master_prompt || 'Sos Claudio, asistente de eventos de La Crypta. Respondé en español argentino, corto y directo.',
      enabled: enabled ?? false,
    };

    const { error } = await supabase
      .from('integrations')
      .upsert(
        {
          provider: 'ai',
          name: 'AI Configuration',
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
    .eq('provider', 'ai');

  return NextResponse.json({ ok: true });
}
