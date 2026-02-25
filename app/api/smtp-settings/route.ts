import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

const SINGLETON_ID = '00000000-0000-0000-0000-000000000000';

export async function GET(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('id', SINGLETON_ID)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({ settings: data || null });
  } catch (error) {
    console.error('SMTP settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    
    const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, email_from } = body;

    if (!smtp_host || !smtp_port || smtp_user === undefined || smtp_pass === undefined || !email_from) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updates = {
      smtp_host,
      smtp_port: parseInt(smtp_port),
      smtp_secure: smtp_secure === true || smtp_secure === 'true',
      smtp_user,
      smtp_pass,
      email_from,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('smtp_settings')
      .update(updates)
      .eq('id', SINGLETON_ID)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error('SMTP settings PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
