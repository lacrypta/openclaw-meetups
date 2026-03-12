import { NextRequest, NextResponse } from 'next/server';
import { verifyEvent } from 'nostr-tools';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

interface Nip98Event {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export async function POST(request: NextRequest) {
  try {
    const event = (await request.json()) as Nip98Event;

    // Verify it's a NIP-98 event (kind 27235)
    if (event.kind !== 27235) {
      return NextResponse.json({ error: 'Invalid event kind. Expected NIP-98 (27235)' }, { status: 400 });
    }

    // Verify signature
    const isValid = verifyEvent(event);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Verify timestamp (must be within 60 seconds)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - event.created_at) > 60) {
      return NextResponse.json({ error: 'Event timestamp too old or in the future' }, { status: 401 });
    }

    // Verify URL tag matches
    const urlTag = event.tags.find(t => t[0] === 'u');
    if (!urlTag || !urlTag[1]) {
      return NextResponse.json({ error: 'Missing URL tag' }, { status: 400 });
    }

    // Verify method tag
    const methodTag = event.tags.find(t => t[0] === 'method');
    if (!methodTag || methodTag[1] !== 'POST') {
      return NextResponse.json({ error: 'Invalid method tag' }, { status: 400 });
    }

    // Look up user by pubkey in DB
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('pubkey', event.pubkey)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Pubkey no registrada. Contactá al administrador.' }, { status: 403 });
    }

    // Generate JWT with role and userId
    const token = jwt.sign(
      { pubkey: event.pubkey, role: user.role, userId: user.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({ token, pubkey: event.pubkey, role: user.role });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
