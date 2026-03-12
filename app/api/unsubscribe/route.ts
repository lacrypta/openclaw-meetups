import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***';
  return `${local[0]}***@${domain}`;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('email, subscribed')
    .eq('unsubscribe_token', token)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }

  return NextResponse.json({
    email: maskEmail(user.email),
    subscribed: user.subscribed,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const { data: user, error: findError } = await supabase
    .from('users')
    .select('id, subscribed')
    .eq('unsubscribe_token', token)
    .single();

  if (findError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }

  // Idempotent: always succeed
  if (user.subscribed) {
    await supabase
      .from('users')
      .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
      .eq('id', user.id);
  }

  return NextResponse.json({ success: true });
}
