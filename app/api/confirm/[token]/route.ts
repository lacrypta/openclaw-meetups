import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const db = getSupabaseAdmin();

  // Find the attendee by confirmation token
  const { data: attendee, error: fetchError } = await db
    .from('event_attendees')
    .select(`
      id,
      attendance_confirmed,
      users (name),
      events (name)
    `)
    .eq('confirmation_token', token)
    .maybeSingle();

  if (fetchError || !attendee) {
    return NextResponse.redirect(
      new URL(`/confirm/${token}`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
      { status: 303 }
    );
  }

  // If already confirmed, redirect back
  if (attendee.attendance_confirmed) {
    return NextResponse.redirect(
      new URL(`/confirm/${token}`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
      { status: 303 }
    );
  }

  // Mark as confirmed
  const { error: updateError } = await db
    .from('event_attendees')
    .update({
      attendance_confirmed: true,
      confirmed_at: new Date().toISOString(),
      status: 'approved',
    })
    .eq('confirmation_token', token);

  if (updateError) {
    console.error('Confirm attendee error:', updateError);
    return NextResponse.json({ error: 'Failed to confirm attendance' }, { status: 500 });
  }

  return NextResponse.redirect(
    new URL(`/confirm/${token}`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    { status: 303 }
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const db = getSupabaseAdmin();

  const { data: attendee, error } = await db
    .from('event_attendees')
    .select(`
      id,
      attendance_confirmed,
      confirmed_at,
      users (name),
      events (name)
    `)
    .eq('confirmation_token', token)
    .maybeSingle();

  if (error || !attendee) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  }

  const eventData = attendee.events as any;
  const userData = attendee.users as any;

  return NextResponse.json({
    confirmed: attendee.attendance_confirmed,
    confirmed_at: attendee.confirmed_at,
    attendee_name: userData?.name,
    event_name: eventData?.name,
  });
}
