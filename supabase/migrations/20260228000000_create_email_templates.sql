-- Phase 1: Email Templates System
-- Creates email_layouts and email_templates tables, seeds default data,
-- and adds FK from email_jobs.template_id -> email_templates(id)

-- Email layouts (shared HTML wrapper with {{content}} placeholder)
CREATE TABLE IF NOT EXISTS email_layouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_layouts_default ON email_layouts(is_default) WHERE is_default = true;

-- Email templates (inner content HTML, references a layout)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  segment TEXT NOT NULL CHECK (segment IN ('checked-in', 'no-show', 'waitlist', 'custom')),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '[]',
  layout_id UUID REFERENCES email_layouts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_segment ON email_templates(segment);
CREATE INDEX IF NOT EXISTS idx_email_templates_layout ON email_templates(layout_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;

-- Add FK from email_jobs.template_id -> email_templates(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_email_jobs_template' AND table_name = 'email_jobs'
  ) THEN
    ALTER TABLE email_jobs
      ADD CONSTRAINT fk_email_jobs_template
      FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE email_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies (dashboard access via service key, permissive)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_layouts' AND policyname = 'Allow all on email_layouts') THEN
    CREATE POLICY "Allow all on email_layouts" ON email_layouts FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_templates' AND policyname = 'Allow all on email_templates') THEN
    CREATE POLICY "Allow all on email_templates" ON email_templates FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed default layout and 3 templates
DO $$
DECLARE
  v_layout_id UUID;
BEGIN
  -- Insert default layout (shared header + footer from all 3 templates)
  INSERT INTO email_layouts (name, description, html_content, is_default)
  VALUES (
    'Default OpenClaw',
    'Standard OpenClaw Meetup email layout with La Crypta branding',
    $html$<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    .logo-light { display: block !important; }
    .logo-dark { display: none !important; }
    @media (prefers-color-scheme: dark) {
      .logo-light { display: none !important; }
      .logo-dark { display: block !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px;">
              <img src="https://raw.githubusercontent.com/lacrypta/branding/main/title/512-black.png"
                   alt="La Crypta"
                   width="200"
                   class="logo-light"
                   style="display: block; margin: 0 auto;">
              <img src="https://raw.githubusercontent.com/lacrypta/branding/main/title/512-white.png"
                   alt="La Crypta"
                   width="200"
                   class="logo-dark"
                   style="display: none; margin: 0 auto;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              {{content}}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px 40px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px; color: #1a1a1a; font-weight: 600; font-size: 14px;">
                OpenClaw Meetups
              </p>
              <p style="margin: 0; color: #888; font-size: 13px; line-height: 1.5;">
                Un proyecto open source impulsado por La Crypta y Spark101
              </p>
              <p style="margin: 20px 0 0; color: #aaa; font-size: 12px;">
                Si no querés recibir más emails, ignorá este mensaje. Es el único follow-up que mandamos.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$html$,
    true
  )
  RETURNING id INTO v_layout_id;

  -- Seed: Checked-in template
  INSERT INTO email_templates (name, description, segment, subject, html_content, text_content, variables, layout_id)
  VALUES (
    'Post-Meetup Thank You',
    'Sent to attendees who checked in at the event',
    'checked-in',
    'Gracias por venir al OpenClaw Meetup, {{first_name}}!',
    $html$<h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 20px; text-align: center;">
  ¡Gracias por venir, {{first_name}}!
</h1>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
  Fue un placer tenerte en el <strong>OpenClaw Meetup Buenos Aires</strong> del viernes 21 de febrero. Esperamos que hayas disfrutado la charla, las demos y las conversaciones.
</p>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
  <strong>Tu feedback es super importante para nosotros.</strong> Nos ayudás un montón completando esta encuesta rápida:
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
  <tr>
    <td align="center">
      <a href="https://tally.so/r/J964LY?name={{name}}&email={{email}}" style="display: inline-block; background-color: #ff8c00; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Dejanos tu feedback (2 min)
      </a>
    </td>
  </tr>
</table>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 30px 0 10px; font-weight: 600;">
  Conectá con nosotros por las redes (todas activas)
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
      <p style="margin: 0 0 8px; color: #1a1a1a; font-weight: 600; font-size: 15px;">La Crypta</p>
      <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.5;">
        Comunidad Bitcoiner más activa de Argentina<br>
        🌐 <a href="https://lacrypta.ar" style="color: #ff8c00; text-decoration: none;">lacrypta.ar</a> ·
        📸 <a href="https://instagram.com/lacryptaok" style="color: #ff8c00; text-decoration: none;">IG @lacryptaok</a> ·
        🐦 <a href="https://x.com/lacryptaok" style="color: #ff8c00; text-decoration: none;">X @lacryptaok</a>
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
      <p style="margin: 0 0 8px; color: #1a1a1a; font-weight: 600; font-size: 15px;">SparkLab Online</p>
      <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.5;">
        Sesiones de implementación todos los jueves<br>
        <a href="https://spark101.tech" style="color: #ff8c00; text-decoration: none;">Sumate acá</a>
      </p>
    </td>
  </tr>
</table>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 30px 0 10px; font-weight: 600;">
  ¿Te interesa implementar IA en tu proyecto o empresa?
</p>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
  Hablá con Cami de Spark101 directamente por WhatsApp:
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 0;">
  <tr>
    <td align="center">
      <a href="https://wa.me/5491166094742?text=Hola!%20Vengo%20del%20OpenClaw%20Meetup%20y%20me%20interesa%20saber%20más%20sobre%20IA%20para%20mi%20proyecto" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        💬 Hablá con Cami
      </a>
    </td>
  </tr>
</table>$html$,
    'Gracias por venir, {{first_name}}! Fue un placer tenerte en el OpenClaw Meetup Buenos Aires.',
    '["first_name", "name", "email"]'::jsonb,
    v_layout_id
  );

  -- Seed: No-show template
  INSERT INTO email_templates (name, description, segment, subject, html_content, text_content, variables, layout_id)
  VALUES (
    'No-Show Follow Up',
    'Sent to registered attendees who did not check in',
    'no-show',
    '{{first_name}}, te perdiste un buen meetup',
    $html$<h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 20px; text-align: center;">
  {{first_name}}, te perdiste un buen meetup
</h1>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
  Vimos que te registraste para el <strong>OpenClaw Meetup Buenos Aires</strong> del viernes 21 de febrero, pero no pudiste venir. ¡No hay drama!
</p>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 10px; font-weight: 600;">
  Armamos un resumen rápido de lo que viste:
</p>

<ul style="color: #4a4a4a; font-size: 15px; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
  <li>Intro a OpenClaw</li>
  <li>Qué hacer y qué no</li>
  <li>Casos reales de uso</li>
  <li>Futuro de esta tecnología</li>
</ul>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 30px 0 10px; font-weight: 600;">
  Conectá con nosotros por las redes (todas activas)
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
      <p style="margin: 0 0 8px; color: #1a1a1a; font-weight: 600; font-size: 15px;">La Crypta</p>
      <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.5;">
        Comunidad Bitcoiner más activa de Argentina<br>
        🌐 <a href="https://lacrypta.ar" style="color: #ff8c00; text-decoration: none;">lacrypta.ar</a> ·
        📸 <a href="https://instagram.com/lacryptaok" style="color: #ff8c00; text-decoration: none;">IG @lacryptaok</a> ·
        🐦 <a href="https://x.com/lacryptaok" style="color: #ff8c00; text-decoration: none;">X @lacryptaok</a>
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
      <p style="margin: 0 0 8px; color: #1a1a1a; font-weight: 600; font-size: 15px;">SparkLab Online</p>
      <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.5;">
        Sesiones de implementación todos los jueves<br>
        <a href="https://spark101.tech" style="color: #ff8c00; text-decoration: none;">Sumate acá</a>
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0;">
      <p style="margin: 0 0 8px; color: #1a1a1a; font-weight: 600; font-size: 15px;">Próximos meetups</p>
      <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.5;">
        Seguinos en las redes para enterarte
      </p>
    </td>
  </tr>
</table>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 30px 0 10px; font-weight: 600;">
  ¿Te interesa implementar IA en tu proyecto o empresa?
</p>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
  Hablá con Cami de Spark101 directamente por WhatsApp:
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 0;">
  <tr>
    <td align="center">
      <a href="https://wa.me/5491166094742?text=Hola!%20Me%20registré%20para%20el%20OpenClaw%20Meetup%20y%20me%20interesa%20saber%20más%20sobre%20IA%20para%20mi%20proyecto" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        💬 Hablá con Cami
      </a>
    </td>
  </tr>
</table>$html$,
    '{{first_name}}, te perdiste un buen meetup. Vimos que te registraste para el OpenClaw Meetup Buenos Aires, pero no pudiste venir.',
    '["first_name"]'::jsonb,
    v_layout_id
  );

  -- Seed: Waitlist template
  INSERT INTO email_templates (name, description, segment, subject, html_content, text_content, variables, layout_id)
  VALUES (
    'Waitlist Follow Up',
    'Sent to attendees who were on the waitlist',
    'waitlist',
    '{{first_name}}, gracias por tu interés en OpenClaw',
    $html$<h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 20px; text-align: center;">
  {{first_name}}, gracias por tu interés
</h1>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
  Vimos que te registraste para el <strong>OpenClaw Meetup Buenos Aires</strong> pero quedaste en lista de espera. Lamentablemente el cupo se llenó rapidísimo (140+ confirmados en 48hs).
</p>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 30px; font-weight: 600;">
  No te preocupes — vas a tener prioridad en el próximo. Y mientras tanto podés:
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
  <tr>
    <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5;">
      <p style="margin: 0 0 8px; color: #1a1a1a; font-weight: 600; font-size: 15px;">Sumarte a La Crypta</p>
      <p style="margin: 0 0 4px; color: #4a4a4a; font-size: 14px; line-height: 1.5;">
        Comunidad Bitcoiner más activa de Argentina<br>
        🌐 <a href="https://lacrypta.ar" style="color: #ff8c00; text-decoration: none;">lacrypta.ar</a> ·
        📸 <a href="https://instagram.com/lacryptaok" style="color: #ff8c00; text-decoration: none;">IG @lacryptaok</a> ·
        🐦 <a href="https://x.com/lacryptaok" style="color: #ff8c00; text-decoration: none;">X @lacryptaok</a>
      </p>
      <p style="margin: 8px 0 0; color: #888; font-size: 13px; font-style: italic;">
        Ahí anunciamos todos los próximos meetups con anticipación
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding: 16px 0;">
      <p style="margin: 0 0 8px; color: #1a1a1a; font-weight: 600; font-size: 15px;">SparkLab Online</p>
      <p style="margin: 0 0 4px; color: #4a4a4a; font-size: 14px; line-height: 1.5;">
        Sesiones de implementación todos los jueves<br>
        <a href="https://spark101.tech" style="color: #ff8c00; text-decoration: none;">Sumate acá</a>
      </p>
      <p style="margin: 8px 0 0; color: #888; font-size: 13px; font-style: italic;">
        Es online y abierto, perfecto para meterte en IA práctica
      </p>
    </td>
  </tr>
</table>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 30px 0 10px; font-weight: 600;">
  ¿Te interesa implementar IA en tu proyecto o empresa?
</p>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
  Hablá con Cami de Spark101 directamente por WhatsApp:
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 30px;">
  <tr>
    <td align="center">
      <a href="https://wa.me/5491166094742?text=Hola!%20Quedé%20en%20waitlist%20del%20OpenClaw%20Meetup%20y%20me%20interesa%20saber%20más%20sobre%20IA%20para%20mi%20proyecto" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        💬 Hablá con Cami
      </a>
    </td>
  </tr>
</table>

<p style="color: #4a4a4a; font-size: 17px; font-weight: 600; text-align: center; margin: 30px 0 0;">
  Nos vemos en el próximo meetup. Gracias por el interés. ⚡
</p>$html$,
    '{{first_name}}, gracias por tu interés en el OpenClaw Meetup. Quedaste en lista de espera pero vas a tener prioridad en el próximo.',
    '["first_name"]'::jsonb,
    v_layout_id
  );
END $$;
