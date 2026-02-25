import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let query = supabase.from('attendees').select('*');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const checkedIn = searchParams.get('checked_in');

    if (status) {
      query = query.eq('status', status);
    }
    if (checkedIn === 'true') {
      query = query.eq('checked_in', true);
    } else if (checkedIn === 'false') {
      query = query.eq('checked_in', false);
    }

    const { data, error } = await query.order('registered_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    return NextResponse.json({ contacts: data || [] });
  } catch (error) {
    console.error('Contacts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, email_sent, email_type, notes } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing contact ID' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (email_sent !== undefined) updates.email_sent = email_sent;
    if (email_type !== undefined) updates.email_type = email_type;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('attendees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
    }

    return NextResponse.json({ contact: data });
  } catch (error) {
    console.error('Contacts PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
