import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('email_integrations')
      .select('*')
      .order('created_at');

    if (error) {
      console.error('Email integrations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch email integrations' }, { status: 500 });
    }

    return NextResponse.json({ integrations: data || [] });
  } catch (error) {
    console.error('Email integrations GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, config, is_default } = body;

    if (!name || !type || !config) {
      return NextResponse.json({ error: 'Name, type, and config are required' }, { status: 400 });
    }

    const validTypes = ['smtp', 'aws_ses', 'resend'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid integration type' }, { status: 400 });
    }

    // Check if this is the first integration — force default
    const { data: existing } = await supabase
      .from('email_integrations')
      .select('id')
      .limit(1);

    const shouldBeDefault = is_default || !existing || existing.length === 0;

    // If setting as default, unset all others first
    if (shouldBeDefault) {
      await supabase
        .from('email_integrations')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('email_integrations')
      .insert({
        name,
        type,
        config,
        is_default: shouldBeDefault,
      })
      .select()
      .single();

    if (error) {
      console.error('Email integration create error:', error);
      return NextResponse.json({ error: 'Failed to create email integration' }, { status: 500 });
    }

    return NextResponse.json({ integration: data }, { status: 201 });
  } catch (error) {
    console.error('Email integrations POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
