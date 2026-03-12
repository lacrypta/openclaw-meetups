import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(request, 'admin');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { role } = await request.json();

  if (!['guest', 'manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)
    .select('id, role')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
