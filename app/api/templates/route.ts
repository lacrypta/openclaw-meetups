import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const segment = searchParams.get('segment');

    let query = supabase
      .from('email_templates')
      .select('*')
      .order('created_at');

    if (segment) {
      query = query.eq('segment', segment);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Templates fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: data || [] });
  } catch (error) {
    console.error('Templates GET error:', error);
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
    const { name, description, segment, subject, html_content, text_content, variables, layout_id, is_active } = body;

    if (!name || !segment || !subject || !html_content) {
      return NextResponse.json({ error: 'Name, segment, subject, and html_content are required' }, { status: 400 });
    }

    const validSegments = ['checked-in', 'no-show', 'waitlist', 'custom'];
    if (!validSegments.includes(segment)) {
      return NextResponse.json({ error: 'Invalid segment' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        name,
        description,
        segment,
        subject,
        html_content,
        text_content,
        variables: variables || [],
        layout_id,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Template create error:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error) {
    console.error('Templates POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
