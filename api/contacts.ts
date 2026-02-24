import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gpfoxevxvhltjzppeacr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function verifyToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { pubkey: string };
    return decoded.pubkey;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify JWT
  const pubkey = verifyToken(req);
  if (!pubkey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Build query with filters
      let query = supabase.from('attendees').select('*');

      // Apply filters from query params
      if (req.query.status) {
        query = query.eq('status', req.query.status);
      }
      if (req.query.checked_in === 'true') {
        query = query.eq('checked_in', true);
      } else if (req.query.checked_in === 'false') {
        query = query.eq('checked_in', false);
      }

      const { data, error } = await query.order('registered_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Failed to fetch contacts' });
      }

      return res.status(200).json({ contacts: data || [] });
    }

    if (req.method === 'PATCH') {
      const { id, email_sent, email_type, notes } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Missing contact ID' });
      }

      const updates: Record<string, any> = {};
      if (email_sent !== undefined) updates.email_sent = email_sent;
      if (email_type !== undefined) updates.email_type = email_type;
      if (notes !== undefined) updates.notes = notes;

      const { data, error } = await supabase
        .from('attendees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return res.status(500).json({ error: 'Failed to update contact' });
      }

      return res.status(200).json({ contact: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Contacts API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
