import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sendId: string }> }
) {
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, sendId } = await params;

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

  // Delete the send
  const { error } = await supabase
    .from('email_sends')
    .delete()
    .eq('id', sendId)
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

  return NextResponse.json({ success: true, total_contacts: count || 0 });
}
