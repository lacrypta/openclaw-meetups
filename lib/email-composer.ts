import type { EmailTemplate, EmailLayout } from './types';

interface ComposeEmailParams {
  template: Pick<EmailTemplate, 'html_content' | 'subject'>;
  layout?: Pick<EmailLayout, 'html_content'> | null;
  variables?: Record<string, string>;
}

/**
 * Replaces all {{variable}} placeholders in a string with their values.
 */
function replaceVariables(html: string, variables: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Composes a full email HTML by injecting template content into the layout
 * and replacing all variable placeholders.
 */
export function composeEmail({ template, layout, variables = {} }: ComposeEmailParams): {
  html: string;
  subject: string;
} {
  const subject = replaceVariables(template.subject, variables);

  // Replace variables in template content
  let html = replaceVariables(template.html_content, variables);

  if (layout) {
    // Inject composed content into layout's {{content}} placeholder
    let layoutHtml = layout.html_content.replace('{{content}}', html);
    // Replace layout-level variables (e.g. {{subject}})
    layoutHtml = replaceVariables(layoutHtml, { ...variables, subject });
    html = layoutHtml;
  }

  return { html, subject };
}

/**
 * Available template variables with descriptions and sample values.
 */
export const AVAILABLE_VARIABLES: { name: string; description: string; sample: string }[] = [
  { name: 'firstname', description: 'Nombre del asistente', sample: 'Juan' },
  { name: 'lastname', description: 'Apellido del asistente', sample: 'Perez' },
  { name: 'fullname', description: 'Nombre completo', sample: 'Juan Perez' },
  { name: 'email', description: 'Email del asistente', sample: 'juan@example.com' },
];

/**
 * Returns sample variable values for template preview.
 */
export function getSampleVariables(variableNames: string[]): Record<string, string> {
  const sampleMap: Record<string, string> = {};
  for (const v of AVAILABLE_VARIABLES) {
    sampleMap[v.name] = v.sample;
  }
  // Extras for layout-level variables
  sampleMap.subject = 'OpenClaw Meetup';

  const result: Record<string, string> = {};
  for (const name of variableNames) {
    result[name] = sampleMap[name] || `[${name}]`;
  }
  return result;
}
