import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase';
import { getAIConfig } from '@/lib/integrations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'manager');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const { prompt, model } = await request.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get AI config from DB
    const aiConfig = await getAIConfig();
    if (!aiConfig?.api_key) {
      return NextResponse.json({ error: 'AI no configurada. Agregá tu API key en Settings → AI.' }, { status: 400 });
    }

    // Get campaign info for context
    const { data: campaign } = await supabase
      .from('email_jobs')
      .select('name, subject')
      .eq('id', id)
      .single();

    const provider = createOpenAI({
      apiKey: aiConfig.api_key,
      baseURL: 'https://ai-gateway.vercel.sh/v1',
    });

    const selectedModel = model || aiConfig.default_model || 'anthropic/claude-haiku-4.5';

    const systemPrompt = `Sos un experto en email marketing. Generás HTML de emails profesionales, visualmente atractivos, responsive y listos para enviar.

REGLAS:
- Devolvé SOLO el HTML del email, sin explicaciones ni markdown
- Usá inline CSS (no <style> tags)
- Diseño responsive (max-width: 600px centrado)
- Incluí las variables dinámicas disponibles: {{firstname}}, {{fullname}}, {{email}}, {{unsubscribe_url}}
- El email debe verse bien en fondos claros y oscuros
- Usá una paleta profesional y moderna
- Incluí siempre un footer con link de desuscripción: <a href="{{unsubscribe_url}}">Desuscribirme</a>
${campaign ? `\nContexto de la campaña:\n- Nombre: ${campaign.name || 'N/A'}\n- Asunto: ${campaign.subject || 'N/A'}` : ''}`;

    const result = await generateText({
      model: provider(selectedModel),
      system: systemPrompt,
      prompt: prompt.trim(),
      maxTokens: 4000,
    });

    return NextResponse.json({ html: result.text });
  } catch (error: any) {
    console.error('AI generate error:', error);
    return NextResponse.json({ error: error?.message || 'Error generando email' }, { status: 500 });
  }
}
