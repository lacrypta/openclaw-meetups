import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from './supabase';
import type { UserRole } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export interface AuthUser {
  pubkey: string;
  userId: string;
  role: UserRole;
}

// Basic token verification — returns pubkey (backward compat)
export function verifyToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
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

// Full auth with role — returns AuthUser or null
export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
  const pubkey = verifyToken(request);
  if (!pubkey) return null;

  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('pubkey', pubkey)
    .single();

  if (!user) return null;

  return { pubkey, userId: user.id, role: user.role };
}

// Role guard — returns AuthUser if role is sufficient, null otherwise
export async function requireRole(request: NextRequest, minRole: UserRole): Promise<AuthUser | null> {
  const auth = await authenticateRequest(request);
  if (!auth) return null;

  const hierarchy: Record<UserRole, number> = { guest: 0, manager: 1, admin: 2 };
  if (hierarchy[auth.role] < hierarchy[minRole]) return null;

  return auth;
}
