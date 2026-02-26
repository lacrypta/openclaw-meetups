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
    const { name, config, is_default } = body;

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (config !== undefined) updates.config = config;

    // If setting as default, unset all others first
    if (is_default === true) {
      await supabase
        .from('email_integrations')
        .update({ is_default: false })
        .eq('is_default', true);
      updates.is_default = true;
    }

    const { data, error } = await supabase
      .from('email_integrations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Email integration update error:', error);
      return NextResponse.json({ error: 'Failed to update email integration' }, { status: 500 });
    }

    return NextResponse.json({ integration: data });
  } catch (error) {
    console.error('Email integration PATCH error:', error);
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
    // Check if this integration is the default
    const { data: integration } = await supabase
      .from('email_integrations')
      .select('is_default')
      .eq('id', id)
      .single();

    if (integration?.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete the default integration. Set another as default first.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('email_integrations')
      .delete()
      .eq('id', id);

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
