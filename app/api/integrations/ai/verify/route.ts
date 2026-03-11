import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export async function POST(request: NextRequest) {
  const pubkey = verifyToken(request);
  if (!pubkey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { api_key } = await request.json();
    
    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json({ valid: false, error: 'API key is required' }, { status: 400 });
    }

    // Test the key with a simple completion
    const provider = createOpenAI({
      apiKey: api_key,
      baseURL: 'https://api.vercel.ai/v1',
    });

    await generateText({
      model: provider('anthropic/claude-haiku-4-5'),
      prompt: 'Test',
      maxTokens: 5,
    });

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error('AI key verification failed:', error);
    return NextResponse.json({
      valid: false,
      error: error?.message || 'Verification failed',
    });
  }
}
