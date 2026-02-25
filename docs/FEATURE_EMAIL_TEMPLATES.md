# Feature Specification: Email Templates Editor

**Branch:** `email-templates`  
**Status:** 📝 Specification  
**Priority:** High  
**Created:** 2026-02-25

---

## 📋 Overview

Nueva funcionalidad para configurar y previsualizar templates de emails desde el dashboard. Permite personalizar logos (light/dark mode), header, footer, y ver preview en tiempo real antes de enviar emails masivos.

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

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│ [Navbar]                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Email Templates                                        │
│  Configure email layouts for your campaigns            │
│                                                         │
│  ┌─────────────────────┐ ┌──────────────────────────┐ │
│  │  Editor             │ │  Preview                 │ │
│  │                     │ │                          │ │
│  │  [Logo Light]       │ │  ┌────────────────────┐ │ │
│  │  URL: [_________]   │ │  │ [Logo Preview]     │ │ │
│  │                     │ │  │                    │ │ │
│  │  [Logo Dark]        │ │  │ Subject: ...       │ │ │
│  │  URL: [_________]   │ │  │                    │ │ │
│  │                     │ │  │ Body content...    │ │ │
│  │  [Header]           │ │  │                    │ │ │
│  │  Text: [_________]  │ │  └────────────────────┘ │ │
│  │                     │ │                          │ │
│  │  [Footer]           │ │  [Light Mode] [Dark]    │ │
│  │  Text: [_________]  │ │                          │ │
│  │                     │ │                          │ │
│  │  [Save Template]    │ │                          │ │
│  └─────────────────────┘ └──────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🗃️ Database Schema

**Nueva tabla:** `email_templates`

```sql
CREATE TABLE email_templates (
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
  is_default BOOLEAN DEFAULT false,
  
  -- Full HTML template (generated)
  html_template TEXT
);

-- Index para default template
CREATE INDEX idx_email_templates_default ON email_templates (is_default) WHERE is_default = true;

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated reads" ON email_templates
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated updates" ON email_templates
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated inserts" ON email_templates
  FOR INSERT WITH CHECK (true);
```

---

## 🔌 API Routes

### 1. GET `/api/templates`

**Descripción:** Listar todos los templates

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Default Template",
      "description": "Template por defecto",
      "logo_light_url": "https://...",
      "logo_dark_url": "https://...",
      "is_default": true,
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
   supabase migration new email_templates
   ```

2. Agregar SQL de la tabla `email_templates`

3. Aplicar migration:
   ```bash
   npm run migrate
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

### Step 4: Integration with Email Sending

**Modificar scripts de envío de emails:**

```typescript
// email-templates/send-emails.js
import { getDefaultTemplate } from '@/lib/supabase';

async function sendEmail(user, templateId = 'default') {
  // 1. Obtener template de DB
  const template = await getDefaultTemplate();
  
  // 2. Generar HTML con template
  const html = generateEmailHTML(template)
    .replace('{{CONTENT}}', getUserSpecificContent(user))
    .replace('{{first_name}}', user.first_name)
    .replace('{{email}}', user.email);
  
  // 3. Enviar
  await transporter.sendMail({ html });
}
```

---

## 🎯 Features Checklist

### Phase 1: Core Functionality
- [ ] Database schema & migrations
- [ ] API routes (CRUD templates)
- [ ] Basic editor UI
- [ ] Preview functionality
- [ ] Save/Load templates

### Phase 2: Enhanced Editor
- [ ] Color picker integration
- [ ] Image URL validation
- [ ] Responsive preview (mobile/desktop toggle)
- [ ] Dark mode accurate preview

### Phase 3: Advanced Features
- [ ] Multiple templates support
- [ ] Template versioning
- [ ] Template duplication
- [ ] A/B testing templates
- [ ] Analytics (open rates per template)

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
