import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');

  let query = supabase.from('users').select('id, name, email, phone').order('created_at', { ascending: true });

  if (phone) {
    const clean = phone.replace(/[^\d+]/g, '');
    const variants = [clean, clean.startsWith('+') ? clean.slice(1) : `+${clean}`];
    query = query.or(variants.map(p => `phone.eq.${p}`).join(','));
  }

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data || [] });
}
