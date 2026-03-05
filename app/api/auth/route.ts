import { NextRequest, NextResponse } from 'next/server';
import { verifyEvent } from 'nostr-tools';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const ALLOWED_PUBKEYS = (process.env.ALLOWED_PUBKEYS || 'e5c1a30bfe9db1fc2ae3284da2cec7a3c3e67fb3ca699d4d05a3f1b3c64f862f').split(',');

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

    // Verify pubkey is in allowlist
    if (!ALLOWED_PUBKEYS.includes(event.pubkey)) {
      return NextResponse.json({ error: 'Pubkey not authorized' }, { status: 403 });
    }

    // Generate JWT
    const token = jwt.sign(
      { pubkey: event.pubkey },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({ token, pubkey: event.pubkey });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
