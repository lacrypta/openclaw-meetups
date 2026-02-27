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
      .from('email_layouts')
      .select('*')
      .order('created_at');

    if (error) {
      console.error('Layouts fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch layouts' }, { status: 500 });
    }

    return NextResponse.json({ layouts: data || [] });
  } catch (error) {
    console.error('Layouts GET error:', error);
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
    const { name, description, html_content, is_default } = body;

    if (!name || !html_content) {
      return NextResponse.json({ error: 'Name and html_content are required' }, { status: 400 });
    }

    if (!html_content.includes('{{content}}')) {
      return NextResponse.json({ error: 'Layout must contain {{content}} placeholder' }, { status: 400 });
    }

    // If setting as default, unset all others first
    if (is_default) {
      await supabase
        .from('email_layouts')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('email_layouts')
      .insert({ name, description, html_content, is_default: is_default || false })
      .select()
      .single();

    if (error) {
      console.error('Layout create error:', error);
      return NextResponse.json({ error: 'Failed to create layout' }, { status: 500 });
    }

    return NextResponse.json({ layout: data }, { status: 201 });
  } catch (error) {
    console.error('Layouts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
