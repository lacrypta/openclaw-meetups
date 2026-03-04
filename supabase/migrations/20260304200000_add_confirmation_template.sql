-- Add 'confirmation' segment to email_templates check constraint
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_segment_check;
ALTER TABLE email_templates ADD CONSTRAINT email_templates_segment_check
  CHECK (segment IN ('checked-in', 'no-show', 'waitlist', 'confirmation', 'custom'));

-- Seed confirmation email template using default layout
DO $$
DECLARE
  v_layout_id UUID;
BEGIN
  SELECT id INTO v_layout_id FROM email_layouts WHERE is_default = true LIMIT 1;

  INSERT INTO email_templates (name, description, segment, subject, html_content, text_content, variables, layout_id)
  VALUES (
    'RSVP Confirmation',
    'Sent when attendee confirms attendance via WhatsApp',
    'confirmation',
    '✅ {{first_name}}, tu asistencia está confirmada!',
    $html$<h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 20px; text-align: center;">
  ¡Confirmado! 🎉
</h1>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
  Hola <strong>{{first_name}}</strong>,
</p>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
  Tu asistencia al <strong>{{event_name}}</strong> ha sido confirmada. ¡Te esperamos!
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin: 30px 0;">
  <tr>
    <td style="padding: 20px;">
      <p style="margin: 0 0 8px; color: #1a1a1a; font-weight: 600; font-size: 15px;">📅 Evento</p>
      <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 14px;">{{event_name}}</p>
      <p style="margin: 0 0 8px; color: #1a1a1a; font-weight: 600; font-size: 15px;">📍 Lugar</p>
      <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 14px;">La Crypta, Buenos Aires</p>
      <p style="margin: 0 0 8px; color: #1a1a1a; font-weight: 600; font-size: 15px;">⚡ Recordá</p>
      <p style="margin: 0; color: #4a4a4a; font-size: 14px;">Llegá puntual. Los meetups arrancan en horario.</p>
    </td>
  </tr>
</table>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 30px 0 10px;">
  Si por algún motivo no podés asistir, respondé a este mail o avisanos por WhatsApp.
</p>

<p style="color: #4a4a4a; font-size: 17px; font-weight: 600; text-align: center; margin: 30px 0 0;">
  ¡Nos vemos ahí! ⚡
</p>$html$,
    '{{first_name}}, tu asistencia al {{event_name}} ha sido confirmada. ¡Te esperamos!',
    '["first_name", "name", "email", "event_name"]'::jsonb,
    v_layout_id
  )
  ON CONFLICT DO NOTHING;
END $$;
