import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    let query = supabase
      .from('email_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Campaigns fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    return NextResponse.json({ campaigns: data || [] });
  } catch (error) {
    console.error('Campaigns GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, template_id, subject, integration_id, event_id, segment } = body;

    if (!template_id || !subject || !integration_id) {
      return NextResponse.json(
        { error: 'template_id, subject, and integration_id are required' },
        { status: 400 }
      );
    }

    // Create email job — no recipients yet, those are imported separately
    const { data: job, error: jobError } = await supabase
      .from('email_jobs')
      .insert({
        name: name || null,
        event_id: event_id || null,
        segment: segment || null,
        template_id,
        subject,
        status: 'pending',
        total_contacts: 0,
        sent_count: 0,
        failed_count: 0,
        cursor: 0,
        errors: [],
        config: { integration_id },
        created_by: auth.pubkey,
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Job create error:', jobError);
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    return NextResponse.json({ campaign: job }, { status: 201 });
  } catch (error) {
    console.error('Campaigns POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
