/**
 * GET  /api/master-prompts  — list all master prompts
 * POST /api/master-prompts  — create a new master prompt
 *
 * Requires JWT auth (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('master_prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('master_prompts fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch master prompts' }, { status: 500 });
    }

    return NextResponse.json({ master_prompts: data || [] });
  } catch (error) {
    console.error('master-prompts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, content, is_default, model_provider, model_name } = body;

    if (!name || !content) {
      return NextResponse.json({ error: 'name and content are required' }, { status: 400 });
    }

    // If setting as default, unset previous default first
    if (is_default) {
      await supabase.from('master_prompts').update({ is_default: false }).eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('master_prompts')
      .insert({
        name,
        content,
        is_default: is_default || false,
        model_provider: model_provider || 'anthropic',
        model_name: model_name || 'claude-sonnet-4-5',
      })
      .select()
      .single();

    if (error) {
      console.error('master_prompts insert error:', error);
      return NextResponse.json({ error: 'Failed to create master prompt' }, { status: 500 });
    }

    return NextResponse.json({ master_prompt: data }, { status: 201 });
  } catch (error) {
    console.error('master-prompts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
