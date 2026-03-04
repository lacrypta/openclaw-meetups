import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-server';
import { composeEmail, getSampleVariables } from '@/lib/email-composer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pubkey = verifyToken(request);
  if (!pubkey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const customVariables = body.variables as Record<string, string> | undefined;

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Fetch layout if assigned
    let layout = null;
    if (template.layout_id) {
      const { data: layoutData } = await supabase
        .from('email_layouts')
        .select('*')
        .eq('id', template.layout_id)
        .single();
      layout = layoutData;
    }

    // Build variables: sample defaults merged with any custom overrides
    const variables = {
      ...getSampleVariables(template.variables || []),
      ...customVariables,
    };

    const { html, subject } = composeEmail({ template, layout, variables });

    return NextResponse.json({ html, subject });
  } catch (error) {
    console.error('Template preview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
