import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'manager');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('master_prompts')
    .select('id, name, content, is_default')
    .eq('is_default', true)
    .maybeSingle();

  return NextResponse.json({ prompt: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRole(request, 'manager');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content } = await request.json();
  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  // Update default prompt, or create one if none exists
  const { data: existing } = await supabase
    .from('master_prompts')
    .select('id')
    .eq('is_default', true)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('master_prompts')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('master_prompts')
      .insert({ name: 'Event Confirmation', content, is_default: true });
  }

  return NextResponse.json({ ok: true });
}
