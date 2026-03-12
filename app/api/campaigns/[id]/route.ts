import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { data: campaign, error: jobError } = await supabase
      .from('email_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const { data: sends, error: sendsError } = await supabase
      .from('email_sends')
      .select('*, users(name, email)')
      .eq('job_id', id)
      .order('created_at');

    if (sendsError) {
      console.error('Sends fetch error:', sendsError);
      return NextResponse.json({ error: 'Failed to fetch sends' }, { status: 500 });
    }

    return NextResponse.json({ campaign, sends: sends || [] });
  } catch (error) {
    console.error('Campaign GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body: Record<string, unknown> = await request.json();

    // Handle custom_html update
    if (body.custom_html !== undefined) {
      const { data: existing, error: fetchError } = await supabase
        .from('email_jobs')
        .select('config')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }

      const currentConfig = (existing.config || {}) as Record<string, unknown>;
      const newConfig: Record<string, unknown> = { ...currentConfig, custom_html: body.custom_html };
      if (body.layout_id !== undefined) {
        newConfig.layout_id = body.layout_id;
      }

      const updatePayload: Record<string, unknown> = { config: newConfig };
      if (typeof body.name === 'string') updatePayload.name = body.name;
      if (typeof body.subject === 'string') updatePayload.subject = body.subject;

      const { data: campaign, error: updateError } = await supabase
        .from('email_jobs')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Campaign update error:', updateError);
        return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
      }

      return NextResponse.json({ campaign });
    }

    if (body.status !== 'cancelled') {
      return NextResponse.json({ error: 'Only cancellation or custom_html update is supported' }, { status: 400 });
    }

    // Check current status
    const { data: existing, error: fetchError } = await supabase
      .from('email_jobs')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const cancellable = ['pending', 'running', 'partial'];
    if (!cancellable.includes(existing.status)) {
      return NextResponse.json(
        { error: `Cannot cancel campaign with status: ${existing.status}` },
        { status: 400 }
      );
    }

    const { data: campaign, error: updateError } = await supabase
      .from('email_jobs')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Campaign cancel error:', updateError);
      return NextResponse.json({ error: 'Failed to cancel campaign' }, { status: 500 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Campaign PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
