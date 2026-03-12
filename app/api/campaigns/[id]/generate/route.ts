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

    const systemPrompt = `Generás el CUERPO de un email en HTML. El header y footer ya existen — vos solo generás el contenido intermedio.

OUTPUT:
- SOLO HTML. Sin explicaciones, sin markdown, sin \`\`\`. Devolvé el HTML crudo directamente.
- Inline CSS únicamente (no <style> tags). Responsive (max-width: 600px).

VARIABLES DINÁMICAS (usá donde corresponda):
- {{firstname}} — nombre del destinatario (usalo para saludar)
- {{fullname}} — nombre completo
- {{email}} — email del destinatario

ESTILO:
- Minimalista: fondo blanco, texto negro/gris oscuro, tipografía sans-serif.
- Sin colores salvo en botones CTA — esos van con color llamativo y border-radius.
- Jerarquía clara: título grande, cuerpo legible (16px), espaciado generoso.
- Si hay un CTA, usá un botón HTML con padding, fondo de color, texto blanco, centrado.
- No uses imágenes. No uses backgrounds de color en secciones. Limpio y directo.

TONO:
- Profesional pero cercano. Directo, sin relleno.
${campaign ? `\nCONTEXTO:\n- Campaña: ${campaign.name || 'N/A'}\n- Asunto: ${campaign.subject || 'N/A'}` : ''}`;

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
