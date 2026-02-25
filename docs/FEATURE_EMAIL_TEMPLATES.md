# Feature Specification: Email Templates Editor

**Branch:** `email-templates`  
**Status:** 📝 Specification  
**Priority:** High  
**Created:** 2026-02-25

---

## 📋 Overview

Nueva funcionalidad para configurar y previsualizar templates de emails desde el dashboard. Permite personalizar logos (light/dark mode), header, footer, y ver preview en tiempo real antes de enviar emails masivos.

**Sistema de dos niveles:**
1. **Layout** (Tab 1): Configuración global de logos, header, footer → tabla `email_layouts`
2. **Content Templates** (Tab 2): Templates específicos por tipo de email → tabla `email_content_templates`

**Templates existentes** (ya en codebase):
- `email-templates/checked-in.html` → Asistió al evento
- `email-templates/no-show.html` → Se registró pero no asistió
- `email-templates/waitlist.html` → Quedó en lista de espera

Estos 3 templates deben ser **migrados a la base de datos** como parte de la implementación.

---

## 🎯 Objetivos

1. Configuración visual de templates de email sin editar código
2. Preview en tiempo real de HTML generado
3. Soporte para dark mode (logos adaptativos)
4. Persistencia en base de datos (Supabase)
5. Reutilización de templates en diferentes campañas

---

## 🎨 UI Components

### 1. Sidebar Menu Item

**Ubicación:** `/app/components/Navbar.tsx` (o equivalente)

**Nuevo item:**
```tsx
{
  name: 'Templates',
  href: '/templates',
  icon: DocumentTextIcon, // Heroicon
}
```

**Orden sugerido:**
- Dashboard
- Events
- Attendees
- **Templates** ← NUEVO
- Settings

---

### 2. Templates Page (`/templates`)

**Ruta:** `/app/templates/page.tsx`

**Layout con Tabs:**

```
┌─────────────────────────────────────────────────────────────┐
│ [Navbar]                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Email Templates                                            │
│  Configure layouts and content templates                    │
│                                                             │
│  ┌─ [Layout] ─┬─ [Templates] ───────────────────────────┐ │
│  │                                                        │ │
│  │  (TAB 1: Layout Configuration)                        │ │
│  │                                                        │ │
│  │  ┌──────────────────┐ ┌──────────────────────────┐  │ │
│  │  │  Editor          │ │  Preview                 │  │ │
│  │  │                  │ │                          │  │ │
│  │  │  [Logo Light]    │ │  ┌────────────────────┐ │  │ │
│  │  │  URL: [_______]  │ │  │ [Logo Preview]     │ │  │ │
│  │  │                  │ │  │                    │ │  │ │
│  │  │  [Logo Dark]     │ │  │ Subject: ...       │ │  │ │
│  │  │  URL: [_______]  │ │  │                    │ │  │ │
│  │  │                  │ │  │ Body content...    │ │  │ │
│  │  │  [Header]        │ │  │                    │ │  │ │
│  │  │  Text: [______]  │ │  └────────────────────┘ │  │ │
│  │  │                  │ │                          │  │ │
│  │  │  [Footer]        │ │  [Light] [Dark]         │  │ │
│  │  │  Text: [______]  │ │                          │  │ │
│  │  │                  │ │                          │  │ │
│  │  │  [Save Layout]   │ │                          │  │ │
│  │  └──────────────────┘ └──────────────────────────┘  │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Layout ─┬─ [Templates] ───────────────────────────┐   │
│  │                                                      │   │
│  │  (TAB 2: Content Templates)                         │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  Template List                                 │ │   │
│  │  │                                                 │ │   │
│  │  │  ✓ Checked-in (Asistió)      [Edit] [Preview] │ │   │
│  │  │  ✓ No-show (No asistió)      [Edit] [Preview] │ │   │
│  │  │  ✓ Waitlist (Lista espera)   [Edit] [Preview] │ │   │
│  │  │                                                 │ │   │
│  │  │  [+ New Template]                              │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  │  ┌──────────────────┐ ┌──────────────────────────┐ │   │
│  │  │  Editor          │ │  Preview                 │ │   │
│  │  │                  │ │                          │ │   │
│  │  │  Name: [______]  │ │  ┌────────────────────┐ │ │   │
│  │  │  Type: [v]       │ │  │ Full email render  │ │ │   │
│  │  │                  │ │  │ (layout + content) │ │ │   │
│  │  │  Subject:        │ │  │                    │ │ │   │
│  │  │  [___________]   │ │  │ [Logo]             │ │ │   │
│  │  │                  │ │  │                    │ │ │   │
│  │  │  Content:        │ │  │ Subject: ...       │ │ │   │
│  │  │  [Rich editor]   │ │  │                    │ │ │   │
│  │  │  [___________]   │ │  │ Body content...    │ │ │   │
│  │  │  [___________]   │ │  │                    │ │ │   │
│  │  │                  │ │  │ [Footer]           │ │ │   │
│  │  │  [Save Template] │ │  └────────────────────┘ │ │   │
│  │  │                  │ │                          │ │   │
│  │  └──────────────────┘ └──────────────────────────┘ │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tab 1:** Layout (logos, header, footer) - configuración global  
**Tab 2:** Templates (contenido específico por tipo de asistente)

---

## 🗃️ Database Schema

### Tabla 1: `email_layouts` (Global Layout Config)

```sql
CREATE TABLE email_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Logo URLs
  logo_light_url TEXT NOT NULL,
  logo_dark_url TEXT NOT NULL,
  logo_width INTEGER DEFAULT 200,
  
  -- Header
  header_text TEXT,
  header_color TEXT DEFAULT '#1a1a1a',
  
  -- Footer
  footer_text TEXT,
  footer_color TEXT DEFAULT '#666666',
  footer_links JSONB, -- [{ text: "Link", url: "https://..." }]
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  is_default BOOLEAN DEFAULT false
);

-- Solo un layout default a la vez
CREATE UNIQUE INDEX idx_email_layouts_default ON email_layouts (is_default) WHERE is_default = true;

-- RLS Policies
ALTER TABLE email_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated reads" ON email_layouts
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated updates" ON email_layouts
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated inserts" ON email_layouts
  FOR INSERT WITH CHECK (true);
```

### Tabla 2: `email_content_templates` (Content Templates)

```sql
CREATE TABLE email_content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Template type (para categorizar)
  type TEXT NOT NULL CHECK (type IN ('checked-in', 'no-show', 'waitlist', 'custom')),
  
  -- Email content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL, -- HTML content (sin layout)
  
  -- Variables disponibles
  available_variables JSONB DEFAULT '["first_name", "email", "event_name", "event_date"]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Index por tipo
CREATE INDEX idx_email_content_templates_type ON email_content_templates (type);
CREATE INDEX idx_email_content_templates_active ON email_content_templates (is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE email_content_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated reads" ON email_content_templates
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated updates" ON email_content_templates
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated inserts" ON email_content_templates
  FOR INSERT WITH CHECK (true);
```

### Initial Data (Seed)

```sql
-- Insertar layout default (logo actual de La Crypta)
INSERT INTO email_layouts (
  name,
  description,
  logo_light_url,
  logo_dark_url,
  logo_width,
  header_text,
  footer_text,
  footer_links,
  is_default
) VALUES (
  'Default Layout',
  'Layout por defecto con branding de La Crypta',
  'https://raw.githubusercontent.com/lacrypta/branding/main/title/512-black.png',
  'https://raw.githubusercontent.com/lacrypta/branding/main/title/512-white.png',
  200,
  NULL,
  '© 2026 OpenClaw Meetups',
  '[
    {"text":"Web","url":"https://lacrypta.ar"},
    {"text":"Instagram","url":"https://instagram.com/lacrypta"},
    {"text":"Twitter","url":"https://x.com/lacryptaBsAs"}
  ]'::jsonb,
  true
);

-- Insertar los 3 templates existentes (checked-in.html, no-show.html, waitlist.html)
-- Estos se migrarán desde los archivos actuales
```

---

## 🔌 API Routes

### Layout Routes

#### 1. GET `/api/layouts`

**Descripción:** Listar todos los layouts

**Response:**
```json
{
  "layouts": [
    {
      "id": "uuid",
      "name": "Default Layout",
      "description": "Layout por defecto",
      "logo_light_url": "https://...",
      "logo_dark_url": "https://...",
      "is_default": true,
      "created_at": "2026-02-25T..."
    }
  ]
}
```

#### 2. GET `/api/layouts/default`

**Descripción:** Obtener layout por defecto

**Response:** (igual que GET by ID)

### Content Template Routes

#### 1. GET `/api/templates`

**Descripción:** Listar todos los templates de contenido

**Query params:**
- `type` (optional): filtrar por tipo (checked-in, no-show, waitlist, custom)
- `active` (optional): true/false

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Checked-in (Asistió)",
      "type": "checked-in",
      "subject": "¡Gracias por venir!",
      "is_active": true,
      "created_at": "2026-02-25T..."
    }
  ]
}
```

---

### 2. GET `/api/templates/[id]`

**Descripción:** Obtener un template específico

**Response:**
```json
{
  "id": "uuid",
  "name": "Default Template",
  "logo_light_url": "https://...",
  "logo_dark_url": "https://...",
  "logo_width": 200,
  "header_text": "OpenClaw Meetups",
  "header_color": "#1a1a1a",
  "footer_text": "© 2026 La Crypta",
  "footer_color": "#666666",
  "footer_links": [
    { "text": "Web", "url": "https://lacrypta.ar" },
    { "text": "Instagram", "url": "https://instagram.com/lacrypta" }
  ],
  "html_template": "<!DOCTYPE html>..."
}
```

---

### 3. POST `/api/templates`

**Descripción:** Crear nuevo template

**Request Body:**
```json
{
  "name": "My Template",
  "description": "Template custom",
  "logo_light_url": "https://...",
  "logo_dark_url": "https://...",
  "logo_width": 200,
  "header_text": "...",
  "footer_text": "..."
}
```

**Response:**
```json
{
  "id": "uuid",
  "message": "Template created successfully"
}
```

---

### 4. PUT `/api/templates/[id]`

**Descripción:** Actualizar template existente

**Request Body:** (igual que POST)

**Response:**
```json
{
  "message": "Template updated successfully"
}
```

---

### 5. POST `/api/templates/[id]/preview`

**Descripción:** Generar preview HTML en tiempo real

**Request Body:**
```json
{
  "logo_light_url": "https://...",
  "logo_dark_url": "https://...",
  "header_text": "Test Header",
  "footer_text": "Test Footer"
}
```

**Response:**
```json
{
  "html": "<!DOCTYPE html>...",
  "preview_url": "data:text/html;base64,..."
}
```

---

## 🎨 Frontend Components

### 1. TemplateEditor Component

**Ubicación:** `/app/components/TemplateEditor.tsx`

**Props:**
```tsx
interface TemplateEditorProps {
  template?: EmailTemplate;
  onSave: (template: EmailTemplate) => Promise<void>;
  onPreview: (template: Partial<EmailTemplate>) => void;
}
```

**State:**
```tsx
const [template, setTemplate] = useState<EmailTemplate>({
  name: '',
  logo_light_url: '',
  logo_dark_url: '',
  logo_width: 200,
  header_text: '',
  header_color: '#1a1a1a',
  footer_text: '',
  footer_color: '#666666',
  footer_links: [],
});

const [previewHtml, setPreviewHtml] = useState<string>('');
const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
```

**Key Features:**
- Input fields para todas las propiedades
- Color pickers (Tailwind/shadcn ColorPicker)
- URL validation (check imagen existe antes de guardar)
- Debounced preview update (evitar llamadas excesivas)

---

### 2. TemplatePreview Component

**Ubicación:** `/app/components/TemplatePreview.tsx`

**Props:**
```tsx
interface TemplatePreviewProps {
  html: string;
  mode: 'light' | 'dark';
  onModeToggle: (mode: 'light' | 'dark') => void;
}
```

**Implementación:**
```tsx
export default function TemplatePreview({ html, mode, onModeToggle }: TemplatePreviewProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-2 bg-gray-100 border-b">
        <button 
          onClick={() => onModeToggle('light')}
          className={mode === 'light' ? 'bg-white' : ''}
        >
          Light Mode
        </button>
        <button 
          onClick={() => onModeToggle('dark')}
          className={mode === 'dark' ? 'bg-gray-900 text-white' : ''}
        >
          Dark Mode
        </button>
      </div>
      
      {/* Preview Iframe */}
      <iframe
        srcDoc={html}
        className={`w-full h-[600px] ${mode === 'dark' ? 'dark-mode' : ''}`}
        sandbox="allow-same-origin"
      />
    </div>
  );
}
```

**CSS Injection for Dark Mode:**
```tsx
// Agregar <style> al HTML inyectado en iframe
const darkModeStyles = `
  <style>
    @media (prefers-color-scheme: dark) {
      /* Aplicar estilos dark mode al preview */
    }
  </style>
`;
```

---

## 🔨 Implementation Steps

### Step 1: Database Setup

1. Crear migration en `supabase/migrations/`:
   ```bash
   supabase migration new email_layouts_and_templates
   ```

2. Agregar SQL de ambas tablas: `email_layouts` y `email_content_templates`

3. Aplicar migration:
   ```bash
   npm run migrate
   ```

4. Seed initial data (layout default + 3 templates existentes)

---

### Step 1.5: Migrate Existing Templates

**Script:** `scripts/migrate-templates-to-db.mjs`

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function migrateTemplates() {
  const templates = [
    {
      name: 'Checked-in (Asistió)',
      type: 'checked-in',
      subject: '¡Gracias por venir al OpenClaw Meetup! 🚀',
      file: 'email-templates/checked-in.html'
    },
    {
      name: 'No-show (No asistió)',
      type: 'no-show',
      subject: 'Te perdiste el OpenClaw Meetup — próxima oportunidad 🔥',
      file: 'email-templates/no-show.html'
    },
    {
      name: 'Waitlist (Lista de espera)',
      type: 'waitlist',
      subject: 'Lista de espera — OpenClaw Meetup ⏳',
      file: 'email-templates/waitlist.html'
    }
  ];

  for (const template of templates) {
    const html = fs.readFileSync(template.file, 'utf-8');
    
    // Extraer solo el body (sin logos, header, footer)
    const bodyMatch = html.match(/<body[^>]*>(.*)<\/body>/s);
    const bodyHtml = bodyMatch ? bodyMatch[1] : html;
    
    const { data, error } = await supabase
      .from('email_content_templates')
      .insert({
        name: template.name,
        type: template.type,
        subject: template.subject,
        body_html: bodyHtml,
        is_active: true
      });
    
    if (error) {
      console.error(`❌ Error migrating ${template.name}:`, error);
    } else {
      console.log(`✅ Migrated ${template.name}`);
    }
  }
}

migrateTemplates();
```

**Run:**
```bash
node scripts/migrate-templates-to-db.mjs
```

---

### Step 2: API Routes

1. Crear `/app/api/templates/route.ts` (GET, POST)
2. Crear `/app/api/templates/[id]/route.ts` (GET, PUT)
3. Crear `/app/api/templates/[id]/preview/route.ts` (POST)

**Template base HTML:**
```typescript
// lib/email-template-base.ts
export function generateEmailHTML(config: EmailTemplateConfig): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        .logo-light { display: block !important; }
        .logo-dark { display: none !important; }
        
        @media (prefers-color-scheme: dark) {
          .logo-light { display: none !important; }
          .logo-dark { display: block !important; }
        }
      </style>
    </head>
    <body>
      <table width="600" cellpadding="0" cellspacing="0">
        <!-- Header -->
        <tr>
          <td align="center">
            <img src="${config.logo_light_url}" class="logo-light" width="${config.logo_width}">
            <img src="${config.logo_dark_url}" class="logo-dark" width="${config.logo_width}">
          </td>
        </tr>
        
        <!-- Dynamic Content -->
        <tr>
          <td>{{CONTENT}}</td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="color: ${config.footer_color}">
            ${config.footer_text}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
```

---

### Step 3: Frontend Components

1. Crear `TemplateEditor.tsx`
2. Crear `TemplatePreview.tsx`
3. Crear página `/app/templates/page.tsx`
4. Agregar entrada en Navbar/Sidebar

---

### Step 4: Email Composition System

**Cómo se combinan Layout + Content Template:**

```typescript
// lib/email-composer.ts

export async function composeEmail(
  contentTemplateType: 'checked-in' | 'no-show' | 'waitlist',
  userData: { first_name: string; email: string }
): Promise<string> {
  
  // 1. Obtener layout default
  const layout = await supabase
    .from('email_layouts')
    .select('*')
    .eq('is_default', true)
    .single();
  
  // 2. Obtener content template por tipo
  const template = await supabase
    .from('email_content_templates')
    .select('*')
    .eq('type', contentTemplateType)
    .eq('is_active', true)
    .single();
  
  // 3. Generar HTML base del layout
  const layoutHtml = generateLayoutHTML(layout.data);
  
  // 4. Procesar variables del content template
  let content = template.data.body_html
    .replace(/\{\{first_name\}\}/g, userData.first_name)
    .replace(/\{\{email\}\}/g, userData.email);
  
  // 5. Inyectar content en layout
  const finalHtml = layoutHtml.replace('{{CONTENT}}', content);
  
  return finalHtml;
}

// Función para generar HTML del layout
function generateLayoutHTML(layout: EmailLayout): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        .logo-light { display: block !important; }
        .logo-dark { display: none !important; }
        
        @media (prefers-color-scheme: dark) {
          .logo-light { display: none !important; }
          .logo-dark { display: block !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
      <table width="600" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <!-- Header with logos -->
        <tr>
          <td align="center" style="padding: 40px 0 20px;">
            <img src="${layout.logo_light_url}" 
                 class="logo-light" 
                 width="${layout.logo_width}" 
                 alt="Logo">
            <img src="${layout.logo_dark_url}" 
                 class="logo-dark" 
                 width="${layout.logo_width}" 
                 alt="Logo">
          </td>
        </tr>
        
        <!-- Content injection point -->
        <tr>
          <td>{{CONTENT}}</td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="padding: 40px; color: ${layout.footer_color}; text-align: center;">
            <p>${layout.footer_text}</p>
            ${layout.footer_links?.map(link => 
              `<a href="${link.url}" style="color: #ff8c00; margin: 0 10px;">${link.text}</a>`
            ).join('')}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
```

---

### Step 5: Integration with Email Sending

**Modificar scripts de envío de emails:**

```typescript
// email-templates/send-emails.js
import { composeEmail } from '@/lib/email-composer';

async function sendEmailsToAttendees(eventId: string) {
  // Obtener attendees por tipo
  const checkedIn = await getAttendees(eventId, 'checked-in');
  const noShow = await getAttendees(eventId, 'no-show');
  const waitlist = await getAttendees(eventId, 'waitlist');
  
  // Enviar a cada grupo con su template correspondiente
  for (const user of checkedIn) {
    const html = await composeEmail('checked-in', user);
    await sendEmail(user.email, html);
  }
  
  for (const user of noShow) {
    const html = await composeEmail('no-show', user);
    await sendEmail(user.email, html);
  }
  
  for (const user of waitlist) {
    const html = await composeEmail('waitlist', user);
    await sendEmail(user.email, html);
  }
}
```

---

## 🎯 Features Checklist

### Phase 1: Core Functionality
- [ ] Database schema & migrations (2 tables)
- [ ] Migrate existing 3 templates to DB (checked-in, no-show, waitlist)
- [ ] API routes for layouts (CRUD)
- [ ] API routes for content templates (CRUD)
- [ ] Tab system (Layout vs Templates)
- [ ] Basic editor UI (both tabs)
- [ ] Preview functionality (layout + content combined)
- [ ] Save/Load functionality

### Phase 2: Enhanced Editor
- [ ] Color picker integration
- [ ] Image URL validation
- [ ] Responsive preview (mobile/desktop toggle)
- [ ] Dark mode accurate preview
- [ ] Rich text editor for content
- [ ] Variable insertion UI ({{first_name}}, etc)

### Phase 3: Advanced Features
- [ ] Multiple layouts support
- [ ] Custom content templates (beyond 3 default)
- [ ] Template versioning
- [ ] Template duplication
- [ ] A/B testing templates
- [ ] Analytics (open rates per template)
- [ ] Event-specific template override

---

## 🔐 Security Considerations

1. **URL Validation:**
   - Validar que URLs de logos sean HTTPS
   - Verificar que imágenes existan antes de guardar
   - Sanitizar inputs (prevenir XSS)

2. **RLS Policies:**
   - Solo usuarios autenticados pueden editar templates
   - Considerar roles (admin vs viewer)

3. **HTML Sanitization:**
   - Si se permite HTML custom, usar DOMPurify
   - Whitelist de tags permitidos

---

## 📊 Success Metrics

1. **Usabilidad:**
   - Tiempo para crear template: < 5 minutos
   - Accuracy de preview vs email real: > 95%

2. **Performance:**
   - Preview generation: < 500ms
   - Save operation: < 1s

3. **Adoption:**
   - % de emails enviados con templates custom: > 50%
   - Feedback positivo en usabilidad: > 80%

---

## 🚀 Future Enhancements

1. **Drag & Drop Builder:**
   - Editor visual tipo Mailchimp
   - Bloques reutilizables

2. **Template Library:**
   - Templates predefinidos
   - Importar templates de otras fuentes

3. **Advanced Customization:**
   - CSS custom por template
   - Conditional content (if/else)
   - Merge tags avanzados

4. **Testing:**
   - Send test email directly from editor
   - Email client compatibility checker
   - Spam score checker

---

## 📚 Resources

- Tally API: https://tally.so/help/api
- Email HTML Best Practices: https://www.litmus.com/blog/
- Dark Mode Email Guide: https://www.emailonacid.com/blog/article/email-development/dark-mode-for-email/
- Supabase Docs: https://supabase.com/docs

---

**Next Steps:**
1. Review & approve this spec
2. Create database migration
3. Implement API routes
4. Build frontend components
5. Test with real email clients
6. Deploy to production

---

*Document created: 2026-02-25*  
*Author: Claudio*  
*Branch: `email-templates`*
