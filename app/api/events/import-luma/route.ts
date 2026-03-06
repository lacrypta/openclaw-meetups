import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-server';
import { getLumaConfig, getIntegration } from '@/lib/integrations';
import { supabase } from '@/lib/supabase';

interface LumaGeoAddress {
  full_address?: string;
  city?: string;
  country?: string;
}

interface LumaEvent {
  api_id: string;
  name: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  cover_url?: string;
  geo_address_info?: LumaGeoAddress;
  location?: string;
  url?: string;
}

interface LumaGuest {
  api_id: string;
  email: string;
  name: string;
  approval_status: string;
}

export async function POST(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const integration = await getIntegration('luma');
  if (!integration) {
    return NextResponse.json({ error: 'Luma not configured' }, { status: 400 });
  }

  try {
    const { luma_event_id } = await request.json();
    if (!luma_event_id || typeof luma_event_id !== 'string') {
      return NextResponse.json({ error: 'luma_event_id is required' }, { status: 400 });
    }

    const config = await getLumaConfig();
    const headers = {
      'x-luma-api-key': config.api_key,
      'Content-Type': 'application/json',
    };
    const baseUrl = config.base_url;

    // Fetch event details
    const eventRes = await fetch(`${baseUrl}/event/get?event_api_id=${luma_event_id}`, {
      headers,
    });
    if (!eventRes.ok) {
      const text = await eventRes.text();
      return NextResponse.json(
        { error: `Luma API error ${eventRes.status}: ${text}` },
        { status: 400 }
      );
    }
    const { event: lumaEvent }: { event: LumaEvent } = await eventRes.json();

    // Resolve location string
    const location =
      lumaEvent.geo_address_info?.full_address ||
      (lumaEvent.geo_address_info?.city && lumaEvent.geo_address_info?.country
        ? `${lumaEvent.geo_address_info.city}, ${lumaEvent.geo_address_info.country}`
        : null) ||
      lumaEvent.location ||
      null;

    // Create event in DB
    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert({
        name: lumaEvent.name,
        description: lumaEvent.description || null,
        date: lumaEvent.start_at || new Date().toISOString(),
        location,
        image_url: lumaEvent.cover_url || null,
        luma_event_id: lumaEvent.api_id,
        status: 'published',
        requires_confirmation: true,
        created_by: pubkey,
      })
      .select()
      .single();

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    // Fetch and import guests
    const guestsRes = await fetch(
      `${baseUrl}/event/get-guests?event_api_id=${luma_event_id}`,
      { headers }
    );

    if (guestsRes.ok) {
      const { entries: guests }: { entries: LumaGuest[] } = await guestsRes.json();

      for (const guest of guests || []) {
        if (!guest.email) continue;

        // Upsert user by email
        const { data: user, error: userError } = await supabase
          .from('users')
          .upsert(
            {
              email: guest.email,
              name: guest.name || guest.email,
              luma_id: guest.api_id,
            },
            { onConflict: 'email', ignoreDuplicates: false }
          )
          .select('id')
          .single();

        if (userError || !user) {
          console.error('Failed to upsert user:', guest.email, userError);
          continue;
        }

        // Map Luma approval_status to our AttendeeStatus
        const statusMap: Record<string, string> = {
          approved: 'approved',
          declined: 'declined',
          pending_approval: 'waitlist',
          waitlisted: 'waitlist',
        };
        const status = statusMap[guest.approval_status] || 'approved';

        // Create event_attendee
        await supabase
          .from('event_attendees')
          .upsert(
            {
              event_id: newEvent.id,
              user_id: user.id,
              status,
            },
            { onConflict: 'event_id,user_id', ignoreDuplicates: true }
          );
      }
    }

    return NextResponse.json({ success: true, event: newEvent });
  } catch (err) {
    console.error('Import Luma event error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
