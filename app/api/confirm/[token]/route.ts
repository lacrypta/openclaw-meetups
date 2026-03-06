import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { confirmAttendance } from '@/lib/confirm-attendance';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://openclaw.lacrypta.ar');

  // Find attendee by token
  const { data: attendee } = await supabase
    .from('event_attendees')
    .select('id')
    .eq('confirmation_token', token)
    .maybeSingle();

  if (!attendee) {
    return NextResponse.redirect(new URL(`/confirm/${token}`, baseUrl), { status: 303 });
  }

  // Use unified confirmation flow (DB + Luma sync)
  const result = await confirmAttendance(attendee.id);

  if (!result.success) {
    console.error('Confirm error:', result.error);
  }

  return NextResponse.redirect(new URL(`/confirm/${token}`, baseUrl), { status: 303 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const { data: attendee, error } = await supabase
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
