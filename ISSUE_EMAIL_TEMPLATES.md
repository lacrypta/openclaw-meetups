# Feature Issue: Email Templates Editor with Layout & Content Management

**Branch:** `email-templates`  
**Status:** 📝 Specification Ready  
**Priority:** High  
**Created:** 2026-02-25  
**Assignee:** Development Team

---

## 📋 Overview

Nueva funcionalidad para configurar y previsualizar templates de emails desde el dashboard.

**Sistema de dos niveles:**
1. **Layout** (Tab 1): Configuración global de logos, header, footer
2. **Content Templates** (Tab 2): Templates específicos por tipo de email

---

## 🎯 Objetivos

- ✅ Configuración visual de templates sin editar código
- ✅ Preview en tiempo real (light/dark mode)
- ✅ Persistencia en base de datos (Supabase)
- ✅ Migración de 3 templates existentes a DB
- ✅ Reutilización de templates en diferentes campañas

---

## 🗃️ Base de Datos

**2 nuevas tablas:**

### 1. `email_layouts` - Configuración Global

```sql
CREATE TABLE email_layouts (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  logo_light_url TEXT NOT NULL,
  logo_dark_url TEXT NOT NULL,
  logo_width INTEGER DEFAULT 200,
  header_text TEXT,
  header_color TEXT DEFAULT '#1a1a1a',
  footer_text TEXT,
  footer_color TEXT DEFAULT '#666666',
  footer_links JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_default BOOLEAN DEFAULT false
);
```

### 2. `email_content_templates` - Templates por Tipo

```sql
CREATE TABLE email_content_templates (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checked-in', 'no-show', 'waitlist', 'custom')),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  available_variables JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

---

## 🎨 UI Components

### Tab 1: Layout Configuration
- Logo Light URL input (with preview)
- Logo Dark URL input (with preview)
- Header text/color picker
- Footer text/color picker
- Footer links editor (JSONB)
- Preview with light/dark mode toggle
- Save Layout button

### Tab 2: Content Templates
- **Lista de templates:**
  - ✓ Checked-in (Asistió)
  - ✓ No-show (No asistió)
  - ✓ Waitlist (Lista de espera)
  - [+ New Template] button
  
- **Editor:**
  - Name input
  - Type dropdown
  - Subject line input
  - Rich text editor (body content)
  - Variable insertion toolbar ({{first_name}}, {{email}}, etc)
  
- **Preview:**
  - Full email render (layout + content)
  - Light/Dark mode toggle
  - Mobile/Desktop view toggle
  - Real-time updates as you type

---

## 📦 Templates a Migrar

Estos 3 templates existentes deben ser migrados a la base de datos:

| Archivo | Tipo | Subject | Status |
|---------|------|---------|--------|
| `email-templates/checked-in.html` | checked-in | ¡Gracias por venir al OpenClaw Meetup! 🚀 | ⏳ Pending |
| `email-templates/no-show.html` | no-show | Te perdiste el OpenClaw Meetup — próxima oportunidad 🔥 | ⏳ Pending |
| `email-templates/waitlist.html` | waitlist | Lista de espera — OpenClaw Meetup ⏳ | ⏳ Pending |

**Migration Script:** `scripts/migrate-templates-to-db.mjs`

---

## 🔨 Implementation Checklist

### Phase 1: Core Functionality (Sprint 1)
- [ ] Create database migration script
  - [ ] `email_layouts` table
  - [ ] `email_content_templates` table
  - [ ] RLS policies
  - [ ] Initial seed data (default layout)
- [ ] Create migration script for existing templates
- [ ] Run migration to populate DB
- [ ] API routes for layouts
  - [ ] `GET /api/layouts`
  - [ ] `GET /api/layouts/default`
  - [ ] `GET /api/layouts/[id]`
  - [ ] `PUT /api/layouts/[id]`
- [ ] API routes for content templates
  - [ ] `GET /api/templates`
  - [ ] `GET /api/templates/[id]`
  - [ ] `POST /api/templates`
  - [ ] `PUT /api/templates/[id]`
  - [ ] `POST /api/templates/[id]/preview`

### Phase 1.5: UI Foundation (Sprint 1-2)
- [ ] Add "Templates" to sidebar navigation
- [ ] Create `/templates` page
- [ ] Implement tab system (Layout vs Templates)
- [ ] Basic layout editor UI
  - [ ] Logo URL inputs
  - [ ] Header/footer text inputs
  - [ ] Color pickers (basic)
- [ ] Basic template list UI
  - [ ] Display 3 migrated templates
  - [ ] Edit/Preview buttons
- [ ] Basic preview component
  - [ ] Iframe with HTML injection
  - [ ] Light/Dark mode toggle

### Phase 2: Enhanced Editor (Sprint 2-3)
- [ ] Advanced color picker (shadcn/ui)
- [ ] Image URL validation (check URL exists)
- [ ] Rich text editor for content (TipTap/Quill)
- [ ] Variable insertion UI
  - [ ] Dropdown with available variables
  - [ ] Insert at cursor position
- [ ] Responsive preview
  - [ ] Mobile/Desktop toggle
  - [ ] Accurate rendering
- [ ] Dark mode accurate preview
  - [ ] CSS injection for dark mode simulation
  - [ ] Logo swap verification
- [ ] Save/Load state management
  - [ ] Debounced auto-save
  - [ ] Success/error notifications

### Phase 3: Advanced Features (Sprint 3+)
- [ ] Multiple layouts support
  - [ ] Create new layout
  - [ ] Duplicate layout
  - [ ] Delete layout
  - [ ] Set default
- [ ] Custom content templates
  - [ ] Create new template (type: custom)
  - [ ] Define custom variables
- [ ] Template versioning
  - [ ] Save template history
  - [ ] Restore previous version
- [ ] Template duplication
  - [ ] Clone existing template
  - [ ] Edit and save as new
- [ ] A/B testing
  - [ ] Create variants
  - [ ] Split traffic
  - [ ] Track performance
- [ ] Analytics
  - [ ] Open rates per template
  - [ ] Click-through rates
  - [ ] Conversion metrics
- [ ] Event-specific override
  - [ ] Override layout per event
  - [ ] Override templates per event

---

## 🔄 Email Composition Flow

```
User sends email campaign
    ↓
Get default layout (logos, header, footer)
    ↓
Get content template by type (checked-in/no-show/waitlist)
    ↓
Combine layout + content
    ↓
Replace variables ({{first_name}}, {{email}})
    ↓
Send final HTML
```

**Implementation:**

```typescript
// lib/email-composer.ts
export async function composeEmail(
  contentTemplateType: 'checked-in' | 'no-show' | 'waitlist',
  userData: { first_name: string; email: string }
): Promise<string> {
  const layout = await getDefaultLayout();
  const template = await getTemplateByType(contentTemplateType);
  const layoutHtml = generateLayoutHTML(layout);
  const content = processVariables(template.body_html, userData);
  return layoutHtml.replace('{{CONTENT}}', content);
}
```

---

## 🔐 Security Considerations

1. **URL Validation:**
   - Validate logo URLs are HTTPS
   - Check images exist before saving
   - Sanitize all text inputs

2. **HTML Sanitization:**
   - Use DOMPurify for custom HTML
   - Whitelist allowed tags
   - Prevent XSS attacks

3. **RLS Policies:**
   - Only authenticated users can edit
   - Consider role-based access (admin vs viewer)

4. **Rate Limiting:**
   - Limit preview API calls
   - Debounce save operations

---

## 📊 Success Metrics

### Usability
- Time to create/edit template: **< 5 minutes**
- Preview accuracy vs real email: **> 95%**
- User satisfaction rating: **> 4.5/5**

### Performance
- Preview generation time: **< 500ms**
- Save operation time: **< 1s**
- Page load time: **< 2s**

### Adoption
- % of emails using custom templates: **> 50%**
- Number of custom templates created: **> 5** in first month

---

## 📚 Documentation

- **Full Spec:** `docs/FEATURE_EMAIL_TEMPLATES.md`
- **API Docs:** (To be created in `/docs/api/`)
- **User Guide:** (To be created in `/docs/guides/`)

---

## 🚀 Future Enhancements

1. **Drag & Drop Builder**
   - Visual email builder (Mailchimp-style)
   - Reusable content blocks
   - No-code template creation

2. **Template Library**
   - Pre-made templates
   - Community templates
   - Import from other sources

3. **Advanced Customization**
   - Custom CSS per template
   - Conditional content (if/else logic)
   - Advanced merge tags

4. **Testing Tools**
   - Send test email directly from editor
   - Email client compatibility checker
   - Spam score analyzer
   - Litmus/Email on Acid integration

5. **Multi-language Support**
   - Translate templates
   - Language-specific templates
   - Auto-detect user language

---

## 🔗 Related

- **Branch:** `email-templates`
- **Base Branch:** `master`
- **Related Issues:** None
- **Documentation:** `docs/FEATURE_EMAIL_TEMPLATES.md`

---

## 💬 Notes

- Templates will replace existing hardcoded HTML files
- Existing email sending scripts need to be updated to use DB
- Consider backward compatibility during migration
- Test thoroughly with different email clients (Gmail, Outlook, Apple Mail)

---

## ✅ Acceptance Criteria

- [ ] User can configure layout (logos, header, footer) from dashboard
- [ ] User can edit existing 3 templates (checked-in, no-show, waitlist)
- [ ] User can preview emails in light/dark mode
- [ ] User can save changes to database
- [ ] Email sending system uses DB templates instead of files
- [ ] All existing templates migrated successfully
- [ ] Preview matches actual email output (95%+ accuracy)
- [ ] No performance regression (page loads < 2s)
- [ ] Documentation complete (spec + API + user guide)

---

**Estimated Effort:** 2-3 sprints (4-6 weeks)  
**Team Size:** 1-2 developers  
**Priority:** High  
**Risk Level:** Medium (database migration, backward compatibility)

---

*Issue created: 2026-02-25*  
*Last updated: 2026-02-25*
