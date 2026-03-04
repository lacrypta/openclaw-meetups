import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, description, html_content, is_default } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (html_content !== undefined) {
      if (!html_content.includes('{{content}}')) {
        return NextResponse.json({ error: 'Layout must contain {{content}} placeholder' }, { status: 400 });
      }
      updates.html_content = html_content;
    }

    if (is_default === true) {
      await supabase
        .from('email_layouts')
        .update({ is_default: false })
        .eq('is_default', true);
      updates.is_default = true;
    }

    const { data, error } = await supabase
      .from('email_layouts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Layout update error:', error);
      return NextResponse.json({ error: 'Failed to update layout' }, { status: 500 });
    }

    return NextResponse.json({ layout: data });
  } catch (error) {
    console.error('Layout PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if default
    const { data: layout } = await supabase
      .from('email_layouts')
      .select('is_default')
      .eq('id', id)
      .single();

    if (layout?.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete the default layout. Set another as default first.' },
        { status: 400 }
      );
    }

    // Check if in use by templates
    const { data: templates } = await supabase
      .from('email_templates')
      .select('id')
      .eq('layout_id', id)
      .limit(1);

    if (templates && templates.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete layout that is assigned to templates. Reassign them first.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('email_layouts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Layout delete error:', error);
      return NextResponse.json({ error: 'Failed to delete layout' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Layout DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
