import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'admin');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { send_ids } = await request.json();

  if (!Array.isArray(send_ids) || send_ids.length === 0) {
    return NextResponse.json({ error: 'send_ids array is required' }, { status: 400 });
  }

  // Verify campaign is pending
  const { data: job } = await supabase
    .from('email_jobs')
    .select('status')
    .eq('id', id)
    .single();

  if (!job) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  if (job.status !== 'pending') {
    return NextResponse.json({ error: 'Solo se pueden eliminar destinatarios de campañas pendientes' }, { status: 400 });
  }

  // Bulk delete
  const { error } = await supabase
    .from('email_sends')
    .delete()
    .in('id', send_ids)
    .eq('job_id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update total_contacts
  const { count } = await supabase
    .from('email_sends')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', id);

  await supabase
    .from('email_jobs')
    .update({ total_contacts: count || 0 })
    .eq('id', id);

  return NextResponse.json({ success: true, deleted: send_ids.length, total_contacts: count || 0 });
}
