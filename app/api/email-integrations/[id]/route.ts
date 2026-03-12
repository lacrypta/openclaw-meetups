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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'admin');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, config, is_default } = body;

    // Load current row
    const { data: current, error: fetchErr } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', id)
      .eq('provider', 'email')
      .single();

    if (fetchErr || !current) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const currentConfig = (current.config as Record<string, unknown>) || {};

    // Build updated config
    let newConfig = { ...currentConfig };
    if (config !== undefined) {
      const configObj = typeof config === 'string' ? JSON.parse(config) : config;
      newConfig = { ...newConfig, ...configObj };
    }

    // If setting as default, unset all others first
    if (is_default === true) {
      const { data: allRows } = await supabase
        .from('integrations')
        .select('id, config')
        .eq('provider', 'email');

      for (const row of (allRows || [])) {
        if (row.id === id) continue;
        const cfg = (row.config as Record<string, unknown>) || {};
        if (cfg.is_default) {
          await supabase
            .from('integrations')
            .update({ config: { ...cfg, is_default: false } })
            .eq('id', row.id);
        }
      }
      newConfig.is_default = true;
    }

    const updates: Record<string, unknown> = {
      config: newConfig,
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updates.name = name;

    const { data, error } = await supabase
      .from('integrations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Email integration update error:', error);
      return NextResponse.json({ error: 'Failed to update email integration' }, { status: 500 });
    }

    return NextResponse.json({ integration: mapRow(data as Record<string, unknown>) });
  } catch (error) {
    console.error('Email integration PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'admin');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if this integration is the default
    const { data: integration } = await supabase
      .from('integrations')
      .select('config')
      .eq('id', id)
      .eq('provider', 'email')
      .single();

    const cfg = (integration?.config as Record<string, unknown>) || {};
    if (cfg.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete the default integration. Set another as default first.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id)
      .eq('provider', 'email');

    if (error) {
      console.error('Email integration delete error:', error);
      return NextResponse.json({ error: 'Failed to delete email integration' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email integration DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
