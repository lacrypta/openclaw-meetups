import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';
import type { EmailIntegration } from '@/lib/types';

/** Map an integrations row (provider='email') to EmailIntegration shape */
function mapRow(row: Record<string, unknown>): EmailIntegration {
  const config = (row.config as Record<string, unknown>) || {};
  return {
    id: row.id as string,
    name: row.name as string,
    type: config.type as EmailIntegration['type'],
    config,
    is_default: Boolean(config.is_default),
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'admin');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('provider', 'email')
      .order('created_at');

    if (error) {
      console.error('Email integrations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch email integrations' }, { status: 500 });
    }

    const integrations = (data || []).map(mapRow).sort((a, b) => 
      (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0)
    );
    return NextResponse.json({ integrations });
  } catch (error) {
    console.error('Email integrations GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'admin');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, config, is_default } = body;

    if (!name || !type || !config) {
      return NextResponse.json({ error: 'Name, type, and config are required' }, { status: 400 });
    }

    const validTypes = ['smtp', 'aws_ses', 'resend'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid integration type' }, { status: 400 });
    }

    // Check if this is the first integration — force default
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('provider', 'email')
      .limit(1);

    const shouldBeDefault = is_default || !existing || existing.length === 0;

    // If setting as default, unset all others first (update config.is_default = false)
    if (shouldBeDefault) {
      const { data: currentDefaults } = await supabase
        .from('integrations')
        .select('id, config')
        .eq('provider', 'email');

      for (const row of (currentDefaults || [])) {
        const cfg = (row.config as Record<string, unknown>) || {};
        if (cfg.is_default) {
          await supabase
            .from('integrations')
            .update({ config: { ...cfg, is_default: false } })
            .eq('id', row.id);
        }
      }
    }

    // Parse config string (comes from form as JSON string) and add type + is_default
    const configObj = typeof config === 'string' ? JSON.parse(config) : config;
    const fullConfig = { ...configObj, type, is_default: shouldBeDefault };

    const { data, error } = await supabase
      .from('integrations')
      .insert({
        provider: 'email',
        name,
        config: fullConfig,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Email integration create error:', error);
      return NextResponse.json({ error: 'Failed to create email integration' }, { status: 500 });
    }

    return NextResponse.json({ integration: mapRow(data as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    console.error('Email integrations POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
