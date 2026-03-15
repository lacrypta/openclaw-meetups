import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, bio, tagline, photo, twitter, github, website, company, pubkey } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const speakerFields = {
      name,
      email,
      is_speaker: true,
      speaker_bio: bio || null,
      speaker_tagline: tagline || null,
      speaker_photo: photo || null,
      speaker_twitter: twitter || null,
      speaker_github: github || null,
      speaker_website: website || null,
      speaker_company: company || null,
    };

    // Check if user with that email exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    let user;

    if (existing) {
      // Update existing user with speaker fields
      const { data, error } = await supabase
        .from('users')
        .update(speakerFields)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      user = data;
    } else {
      // Create new user
      const newUser: Record<string, unknown> = {
        ...speakerFields,
        role: 'guest',
        email_verified: false,
        phone_verified: false,
        subscribed: true,
      };
      if (pubkey) newUser.pubkey = pubkey;

      const { data, error } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (error) throw error;
      user = data;
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Speaker register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
