/**
 * AI Engine — generates responses for messaging sessions.
 * Uses Vercel AI Gateway with session's master prompt and message history.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { supabase } from '@/lib/supabase';
import { getAIConfig } from '@/lib/integrations';

interface GenerateResponseResult {
  content: string;
  model: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
}

/**
 * Generates an AI response for a given session and user message.
 * Fetches session config, master prompt, and message history from Supabase.
 */
export async function generateResponse(
  sessionId: string,
  userMessage: string
): Promise<GenerateResponseResult> {
  // 1. Fetch session with master prompt
  const { data: session, error: sessionError } = await supabase
    .from('messaging_sessions')
    .select(`
      *,
      master_prompts (
        id,
        content
      )
    `)
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const modelName = session.model_name || 'anthropic/claude-haiku-4-5';
  const systemPrompt = session.master_prompts?.content || '';

  // 2. Fetch message history ordered by created_at
  const { data: history, error: historyError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: true });

  if (historyError) {
    throw new Error(`Failed to fetch message history: ${historyError.message}`);
  }

  // 3. Build messages array
  const messages = (history || [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  messages.push({ role: 'user', content: userMessage });

  // 4. Get API key from config or env
  const aiConfig = await getAIConfig();
  const apiKey = process.env.AI_GATEWAY_API_KEY
    || (aiConfig.api_key && !aiConfig.api_key.includes('KEEP_EXIST') ? aiConfig.api_key : '')
    || process.env.ANTHROPIC_API_KEY
    || '';

  if (!apiKey) {
    throw new Error('No AI API key configured');
  }

  // 5. Call via Vercel AI Gateway
  const provider = createOpenAI({
    apiKey,
    baseURL: 'https://ai-gateway.vercel.sh/v1',
  });

  // Use gateway format: model name should include provider prefix
  const gatewayModel = modelName.includes('/') ? modelName : `anthropic/${modelName}`;

  const { text, usage } = await generateText({
    model: provider(gatewayModel),
    system: systemPrompt,
    messages,
  });

  return {
    content: text,
    model: gatewayModel,
    provider: 'vercel-ai-gateway',
    tokensIn: usage?.promptTokens || 0,
    tokensOut: usage?.completionTokens || 0,
  };
}
