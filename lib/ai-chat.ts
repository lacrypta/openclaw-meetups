/**
 * AI chat response generator using Vercel AI SDK.
 * Uses config from integrations table (provider='ai').
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getAIConfig } from '@/lib/integrations';

export async function generateAIResponse(
  userMessage: string,
  context: { userName?: string; eventName?: string }
): Promise<string> {
  const config = await getAIConfig();
  
  const gatewayKey = process.env.AI_GATEWAY_API_KEY || '';
  const dbKey = config.api_key && !config.api_key.includes('KEEP_EXIST') ? config.api_key : '';
  const apiKey = gatewayKey || dbKey;

  if (!config.enabled || !apiKey) {
    return '';
  }

  const provider = createOpenAI({
    apiKey,
    baseURL: 'https://ai-gateway.vercel.sh/v1',
  });
  
  try {
    const { text } = await generateText({
      model: provider(config.default_model || 'anthropic/claude-haiku-4.5'),
      system: config.master_prompt || 'You are a helpful event assistant.',
      prompt: userMessage,
    });
    
    return text;
  } catch (error) {
    console.error('AI response generation failed:', error);
    return '';
  }
}
