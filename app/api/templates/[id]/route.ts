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
    const { name, description, segment, subject, html_content, text_content, variables, layout_id, is_active } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (segment !== undefined) updates.segment = segment;
    if (subject !== undefined) updates.subject = subject;
    if (html_content !== undefined) updates.html_content = html_content;
    if (text_content !== undefined) updates.text_content = text_content;
    if (variables !== undefined) updates.variables = variables;
    if (layout_id !== undefined) updates.layout_id = layout_id;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Template update error:', error);
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('Template PATCH error:', error);
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
    // Check if template is referenced by email_jobs
    const { data: jobs } = await supabase
      .from('email_jobs')
      .select('id')
      .eq('template_id', id)
      .limit(1);

    if (jobs && jobs.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template that is referenced by email campaigns.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Template delete error:', error);
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Template DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
