import type { VercelRequest, VercelResponse } from '@vercel/node';
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body as Nip98Event;

    // Verify it's a NIP-98 event (kind 27235)
    if (event.kind !== 27235) {
      return res.status(400).json({ error: 'Invalid event kind. Expected NIP-98 (27235)' });
    }

    // Verify signature
    const isValid = verifyEvent(event);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Verify timestamp (must be within 60 seconds)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - event.created_at) > 60) {
      return res.status(401).json({ error: 'Event timestamp too old or in the future' });
    }

    // Verify URL tag matches
    const urlTag = event.tags.find(t => t[0] === 'u');
    if (!urlTag || !urlTag[1]) {
      return res.status(400).json({ error: 'Missing URL tag' });
    }

    // Verify method tag
    const methodTag = event.tags.find(t => t[0] === 'method');
    if (!methodTag || methodTag[1] !== 'POST') {
      return res.status(400).json({ error: 'Invalid method tag' });
    }

    // Verify pubkey is in allowlist
    if (!ALLOWED_PUBKEYS.includes(event.pubkey)) {
      return res.status(403).json({ error: 'Pubkey not authorized' });
    }

    // Generate JWT
    const token = jwt.sign(
      { pubkey: event.pubkey },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({ token, pubkey: event.pubkey });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
