/**
 * AI Engine — generates responses for messaging sessions using Anthropic API.
 * Supports the [CONFIRMED] / [DECLINED] keyword protocol for intent detection.
 */

import { supabase } from '@/lib/supabase';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

  const modelProvider = session.model_provider || 'anthropic';
  const modelName = session.model_name || 'claude-sonnet-4-5';
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

  // 3. Build message array for Anthropic API
  const messages: AnthropicMessage[] = (history || [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  // Add the new user message
  messages.push({ role: 'user', content: userMessage });

  // 4. Call Anthropic API
  if (modelProvider !== 'anthropic') {
    throw new Error(`Provider "${modelProvider}" is not yet supported`);
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelName,
      max_tokens: 512,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const result = await response.json();

  // 5. Extract response content and token usage
  const content: string = result.content?.[0]?.text || '';
  const tokensIn: number = result.usage?.input_tokens || 0;
  const tokensOut: number = result.usage?.output_tokens || 0;

  return {
    content,
    model: modelName,
    provider: modelProvider,
    tokensIn,
    tokensOut,
  };
}
