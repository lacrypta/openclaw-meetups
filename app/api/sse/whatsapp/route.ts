/**
 * GET /api/sse/whatsapp?token=<jwt>
 *
 * Server-Sent Events endpoint for real-time WhatsApp message delivery.
 * Auth via query param (EventSource doesn't support custom headers).
 * Streams: message.new, session.new, session.updated events.
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';
import { eventBus, type SSEEvent } from '@/lib/event-bus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const KEEPALIVE_MS = 30_000;

async function verifyTokenFromParam(token: string): Promise<boolean> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { pubkey?: string };
    if (!decoded.pubkey) return false;

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('pubkey', decoded.pubkey)
      .single();

    if (!user) return false;
    return user.role === 'admin' || user.role === 'manager';
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const authorized = await verifyTokenFromParam(token);
  if (!authorized) {
    return new Response('Unauthorized', { status: 401 });
  }

  const connectionId = crypto.randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(event: SSEEvent) {
        try {
          const line = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(encoder.encode(line));
        } catch {
          // Stream closed — will be cleaned up by abort handler
        }
      }

      // Register subscriber
      eventBus.subscribe(connectionId, send);

      // Initial keepalive
      controller.enqueue(encoder.encode(': connected\n\n'));

      // Periodic keepalive to prevent proxy/browser timeout
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(keepalive);
        }
      }, KEEPALIVE_MS);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        eventBus.unsubscribe(connectionId);
        clearInterval(keepalive);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
