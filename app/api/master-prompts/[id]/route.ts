/**
 * GET    /api/master-prompts/[id]  — get a single master prompt
 * PUT    /api/master-prompts/[id]  — update a master prompt
 * DELETE /api/master-prompts/[id]  — delete a master prompt
 *
 * Requires JWT auth (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('master_prompts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Master prompt not found' }, { status: 404 });
    }

    return NextResponse.json({ master_prompt: data });
  } catch (error) {
    console.error('master-prompts GET [id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, content, is_default, model_provider, model_name } = body;

    // If setting as default, unset previous default first
    if (is_default) {
      await supabase
        .from('master_prompts')
        .update({ is_default: false })
        .eq('is_default', true)
        .neq('id', params.id);
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (content !== undefined) updates.content = content;
    if (is_default !== undefined) updates.is_default = is_default;
    if (model_provider !== undefined) updates.model_provider = model_provider;
    if (model_name !== undefined) updates.model_name = model_name;

    const { data, error } = await supabase
      .from('master_prompts')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !data) {
      console.error('master_prompts update error:', error);
      return NextResponse.json({ error: 'Failed to update master prompt' }, { status: 500 });
    }

    return NextResponse.json({ master_prompt: data });
  } catch (error) {
    console.error('master-prompts PUT [id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error } = await supabase.from('master_prompts').delete().eq('id', params.id);

    if (error) {
      console.error('master_prompts delete error:', error);
      return NextResponse.json({ error: 'Failed to delete master prompt' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('master-prompts DELETE [id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
