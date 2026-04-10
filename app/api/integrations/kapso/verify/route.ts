import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-server';
import { verifyKapsoApiKey } from '@/lib/kapso';

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'admin');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { api_key, phone_number_id } = await request.json();
    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json({ error: 'api_key is required' }, { status: 400 });
    }
    if (!phone_number_id || typeof phone_number_id !== 'string') {
      return NextResponse.json({ error: 'phone_number_id is required' }, { status: 400 });
    }

    const valid = await verifyKapsoApiKey(api_key, phone_number_id);
    return NextResponse.json({
      valid,
      message: valid ? 'Kapso API key verified' : 'Invalid API key or phone number ID',
    });
  } catch {
    return NextResponse.json({ valid: false, error: 'Connection failed' }, { status: 200 });
  }
}
