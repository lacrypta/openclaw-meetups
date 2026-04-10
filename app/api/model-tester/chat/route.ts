/**
 * POST /api/model-tester/chat
 *
 * Stateless AI chat endpoint for testing master prompts.
 * Uses Vercel AI Gateway (same as lib/ai-chat.ts) — no DB persistence.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { requireRole } from '@/lib/auth-server';
import { getAIConfig } from '@/lib/integrations';

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'manager');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { system_prompt, model, messages } = await request.json();

    if (!system_prompt || typeof system_prompt !== 'string') {
      return NextResponse.json({ error: 'system_prompt is required' }, { status: 400 });
    }
    if (!model || typeof model !== 'string') {
      return NextResponse.json({ error: 'model is required' }, { status: 400 });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const aiConfig = await getAIConfig();
    // Vercel AI Gateway key: check env var first, then DB config
    const gatewayKey = process.env.AI_GATEWAY_API_KEY || '';
    const dbKey = aiConfig.api_key && !aiConfig.api_key.includes('KEEP_EXIST') ? aiConfig.api_key : '';
    const apiKey = gatewayKey || dbKey || process.env.ANTHROPIC_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ error: 'No AI API key configured. Set AI_GATEWAY_API_KEY env var or update Settings > AI.' }, { status: 400 });
    }

    const provider = createOpenAI({
      apiKey,
      baseURL: 'https://ai-gateway.vercel.sh/v1',
    });

    const { text, usage } = await generateText({
      model: provider(model),
      system: system_prompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    return NextResponse.json({
      content: text,
      model,
      tokens_in: usage?.promptTokens || 0,
      tokens_out: usage?.completionTokens || 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
