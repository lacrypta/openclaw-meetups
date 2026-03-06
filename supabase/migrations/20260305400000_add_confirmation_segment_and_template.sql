-- Add 'confirmation' to email_templates segment check constraint
DO $$ BEGIN
  ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_segment_check;
  ALTER TABLE email_templates ADD CONSTRAINT email_templates_segment_check 
    CHECK (segment = ANY (ARRAY['checked-in', 'no-show', 'waitlist', 'custom', 'confirmation']));
END $$;

-- Insert default confirmation template if none exists
INSERT INTO email_templates (name, description, segment, subject, html_content, variables, is_active)
SELECT
  'Confirmación de Asistencia',
  'Email enviado cuando un usuario se registra en un evento. Incluye link de confirmación único.',
  'confirmation',
  '✅ {{first_name}}, confirmá tu asistencia a {{event_name}}',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #f59e0b; margin-bottom: 16px;">¡Hola {{first_name}}! 👋</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    Te registraste en <strong>{{event_name}}</strong>. Para confirmar tu asistencia, hacé clic en el botón:
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{confirmation_link}}" style="background-color: #f59e0b; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
      Confirmar Asistencia ✅
    </a>
  </div>
  <p style="font-size: 14px; color: #666; line-height: 1.5;">
    Si no podés hacer clic en el botón, copiá y pegá este link en tu navegador:<br>
    <a href="{{confirmation_link}}" style="color: #f59e0b;">{{confirmation_link}}</a>
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #888; font-size: 12px;">
    Si no te registraste en este evento, podés ignorar este email.<br>
    OpenClaw Meetups — La Crypta ⚡
  </p>
</div>',
  '["first_name", "name", "email", "event_name", "confirmation_link"]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates WHERE segment = 'confirmation'
);
