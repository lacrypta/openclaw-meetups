import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { data: job, error: jobError } = await supabase
      .from('email_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (!['partial', 'failed'].includes(job.status)) {
      return NextResponse.json(
        { error: `Cannot retry campaign with status: ${job.status}` },
        { status: 400 }
      );
    }

    // Reset failed sends to pending
    const { error: resetError } = await supabase
      .from('email_sends')
      .update({ status: 'pending', error: null })
      .eq('job_id', id)
      .eq('status', 'failed');

    if (resetError) {
      console.error('Reset sends error:', resetError);
      return NextResponse.json({ error: 'Failed to reset failed sends' }, { status: 500 });
    }

    // Reset job for re-processing
    const { data: campaign, error: updateError } = await supabase
      .from('email_jobs')
      .update({
        status: 'pending',
        cursor: 0,
        failed_count: 0,
        completed_at: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Job reset error:', updateError);
      return NextResponse.json({ error: 'Failed to reset campaign' }, { status: 500 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Campaign retry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
