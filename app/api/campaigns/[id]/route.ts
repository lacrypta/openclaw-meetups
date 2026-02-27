import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
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
      .select('*')
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
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    if (body.status !== 'cancelled') {
      return NextResponse.json({ error: 'Only cancellation is supported' }, { status: 400 });
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
