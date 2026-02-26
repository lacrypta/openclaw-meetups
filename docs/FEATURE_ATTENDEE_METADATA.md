# Feature: Attendee Metadata System

## Overview

Sistema flexible de metadata para attendees con arquitectura de dos tablas: una para definir campos/preguntas reutilizables y otra para almacenar valores específicos por usuario. Permite agregar información custom sin modificar el schema de `attendees`.

## User Story

**Como** organizador de eventos  
**Quiero** poder recolectar información adicional sobre asistentes (empresa, intereses, restricciones alimentarias, etc.)  
**Para que** pueda personalizar la experiencia y hacer análisis sin modificar la estructura de la base de datos cada vez

## Architecture

### Two-Table Design

```
metadata_fields (definitions)
├── key: "company"
├── description: "¿En qué empresa trabajás?"
└── type: "text"

attendee_metadata (values)
├── attendee_id: "user1"
├── field_key: "company"
└── value: "Spark101"
```

### Benefits

- ✅ **Schema-free:** Agregar campos sin ALTER TABLE
- ✅ **Reusable:** Un field puede usarse en múltiples eventos
- ✅ **Flexible:** Cualquier tipo de pregunta (text, number, url, etc.)
- ✅ **Scalable:** Un attendee puede tener N metadata entries
- ✅ **Queryable:** Filtrar attendees por metadata (ej: "todos de X empresa")

## Database Schema

### Table 1: `metadata_fields` (Definitions)

**Purpose:** Define available metadata fields (questions/properties)

```sql
CREATE TABLE metadata_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Unique identifier (e.g., "company", "dietary_restrictions")
  key TEXT NOT NULL UNIQUE,
  
  -- Human-readable description (e.g., "¿En qué empresa trabajás?")
  description TEXT NOT NULL,
  
  -- Field type for validation and UI rendering
  type TEXT NOT NULL DEFAULT 'text',
    -- Options: 'text', 'textarea', 'number', 'email', 'url', 'phone', 'select', 'multiselect'
  
  -- For select/multiselect: JSON array of options
  -- Example: ["Spark101", "La Crypta", "Independiente", "Otro"]
  options JSONB,
  
  -- Is this field required?
  required BOOLEAN DEFAULT false,
  
  -- Help text or placeholder
  placeholder TEXT,
  
  -- Display order in forms
  sort_order INTEGER DEFAULT 0,
  
  -- Is this field active? (soft delete)
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups by key
CREATE INDEX idx_metadata_fields_key ON metadata_fields(key);
CREATE INDEX idx_metadata_fields_active ON metadata_fields(active);
```

### Table 2: `attendee_metadata` (Values)

**Purpose:** Store actual metadata values for each attendee

```sql
CREATE TABLE attendee_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign key to attendees table
  attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  
  -- Foreign key to metadata_fields (by key, not id)
  field_key TEXT NOT NULL REFERENCES metadata_fields(key) ON DELETE CASCADE,
  
  -- The actual value (stored as text, cast as needed)
  value TEXT NOT NULL,
  
  -- Optional: event-specific metadata
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: One value per attendee per field (per event if event-scoped)
  UNIQUE(attendee_id, field_key, event_id)
);

-- Indexes for fast queries
CREATE INDEX idx_attendee_metadata_attendee ON attendee_metadata(attendee_id);
CREATE INDEX idx_attendee_metadata_field ON attendee_metadata(field_key);
CREATE INDEX idx_attendee_metadata_event ON attendee_metadata(event_id);
CREATE INDEX idx_attendee_metadata_value ON attendee_metadata(value); -- For filtering
```

### Migration: `20260225040000_create_metadata_system.sql`

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: Metadata field definitions
CREATE TABLE metadata_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  options JSONB,
  required BOOLEAN DEFAULT false,
  placeholder TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_metadata_fields_key ON metadata_fields(key);
CREATE INDEX idx_metadata_fields_active ON metadata_fields(active);

-- Table 2: Attendee metadata values
CREATE TABLE attendee_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL REFERENCES metadata_fields(key) ON DELETE CASCADE,
  value TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(attendee_id, field_key, event_id)
);

CREATE INDEX idx_attendee_metadata_attendee ON attendee_metadata(attendee_id);
CREATE INDEX idx_attendee_metadata_field ON attendee_metadata(field_key);
CREATE INDEX idx_attendee_metadata_event ON attendee_metadata(event_id);
CREATE INDEX idx_attendee_metadata_value ON attendee_metadata(value);

-- Seed with example fields
INSERT INTO metadata_fields (key, description, type, placeholder, sort_order) VALUES
  ('company', '¿En qué empresa trabajás?', 'text', 'Ej: Spark101, La Crypta, Independiente', 10),
  ('role', '¿Cuál es tu rol?', 'select', NULL, 20),
  ('interest', '¿Qué te interesa aprender?', 'textarea', 'Bitcoin, Lightning, IA, etc.', 30),
  ('dietary_restrictions', '¿Tenés restricciones alimentarias?', 'text', 'Ej: Vegetariano, Celíaco', 40),
  ('linkedin', 'LinkedIn (opcional)', 'url', 'https://linkedin.com/in/...', 50);

-- Update role field with options
UPDATE metadata_fields
SET options = '["Developer", "Designer", "Product Manager", "Founder", "Student", "Other"]'
WHERE key = 'role';
```

## TypeScript Interfaces

```typescript
// metadata_fields table
interface MetadataField {
  id: string;
  key: string;                    // Unique identifier
  description: string;            // Human-readable question
  type: FieldType;                // 'text' | 'textarea' | 'number' | 'email' | 'url' | 'phone' | 'select' | 'multiselect'
  options?: string[];             // For select/multiselect
  required: boolean;
  placeholder?: string;
  sort_order: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

// attendee_metadata table
interface AttendeeMetadata {
  id: string;
  attendee_id: string;
  field_key: string;
  value: string;
  event_id?: string;              // Optional: event-specific
  created_at: Date;
  updated_at: Date;
}

// Combined view for frontend
interface AttendeeWithMetadata {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  // ... other attendee fields
  
  metadata: Record<string, string>; // key -> value map
  // Example: { company: "Spark101", role: "Developer" }
}
```

## API Routes

### 1. GET `/api/metadata/fields` — List all metadata fields

**Purpose:** Get available metadata fields for forms

**Response:**
```json
[
  {
    "id": "550e8400-...",
    "key": "company",
    "description": "¿En qué empresa trabajás?",
    "type": "text",
    "placeholder": "Ej: Spark101, La Crypta",
    "required": false,
    "sort_order": 10
  },
  {
    "key": "role",
    "description": "¿Cuál es tu rol?",
    "type": "select",
    "options": ["Developer", "Designer", "Product Manager"],
    "required": false,
    "sort_order": 20
  }
]
```

### 2. POST `/api/metadata/fields` — Create new field

**Purpose:** Add new metadata field definition

**Request:**
```json
{
  "key": "github_username",
  "description": "GitHub Username",
  "type": "text",
  "placeholder": "@username",
  "required": false
}
```

**Response (201):**
```json
{
  "success": true,
  "field": {
    "id": "abc-123",
    "key": "github_username",
    "description": "GitHub Username",
    "type": "text"
  }
}
```

### 3. GET `/api/attendees/[id]/metadata` — Get attendee's metadata

**Purpose:** Fetch all metadata for specific attendee

**Response:**
```json
{
  "attendee_id": "user-123",
  "metadata": {
    "company": "Spark101",
    "role": "Developer",
    "interest": "Bitcoin Lightning",
    "linkedin": "https://linkedin.com/in/johndoe"
  }
}
```

### 4. PUT `/api/attendees/[id]/metadata` — Update attendee metadata

**Purpose:** Set/update metadata values for attendee

**Request:**
```json
{
  "metadata": {
    "company": "Spark101",
    "role": "Developer",
    "interest": "Bitcoin Lightning"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "updated": ["company", "role", "interest"]
}
```

**Implementation (upsert logic):**
```typescript
// For each key-value pair in request
for (const [key, value] of Object.entries(metadata)) {
  await supabase
    .from('attendee_metadata')
    .upsert({
      attendee_id: attendeeId,
      field_key: key,
      value: value,
      event_id: eventId // if event-scoped
    }, {
      onConflict: 'attendee_id,field_key,event_id'
    });
}
```

### 5. GET `/api/attendees?metadata[company]=Spark101` — Filter by metadata

**Purpose:** Search attendees by metadata values

**Query Examples:**
```
/api/attendees?metadata[company]=Spark101
/api/attendees?metadata[role]=Developer
/api/attendees?metadata[interest]=Bitcoin
```

**Response:**
```json
{
  "attendees": [
    {
      "id": "user-1",
      "email": "user1@example.com",
      "first_name": "Juan",
      "metadata": {
        "company": "Spark101",
        "role": "Developer"
      }
    }
  ],
  "total": 1
}
```

**Implementation (SQL):**
```sql
SELECT a.*, 
  json_object_agg(am.field_key, am.value) as metadata
FROM attendees a
LEFT JOIN attendee_metadata am ON a.id = am.attendee_id
WHERE a.id IN (
  SELECT attendee_id 
  FROM attendee_metadata 
  WHERE field_key = 'company' 
    AND value = 'Spark101'
)
GROUP BY a.id;
```

## Frontend Components

### 1. Metadata Fields Manager (`/admin/metadata-fields`)

**Purpose:** Admin UI to manage available fields

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function MetadataFieldsManager() {
  const [fields, setFields] = useState<MetadataField[]>([]);
  
  useEffect(() => {
    fetch('/api/metadata/fields')
      .then(r => r.json())
      .then(setFields);
  }, []);
  
  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Metadata Fields</h1>
        <button className="btn-primary">+ New Field</button>
      </div>
      
      <table className="w-full">
        <thead>
          <tr>
            <th>Key</th>
            <th>Description</th>
            <th>Type</th>
            <th>Required</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(field => (
            <tr key={field.id}>
              <td><code>{field.key}</code></td>
              <td>{field.description}</td>
              <td>{field.type}</td>
              <td>{field.required ? '✓' : '-'}</td>
              <td>
                <button>Edit</button>
                <button>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 2. Attendee Metadata Form (`components/AttendeeMetadataForm.tsx`)

**Purpose:** Dynamic form to collect metadata from attendee

```tsx
'use client';

import { useState, useEffect } from 'react';

interface Props {
  attendeeId: string;
  onSave?: () => void;
}

export default function AttendeeMetadataForm({ attendeeId, onSave }: Props) {
  const [fields, setFields] = useState<MetadataField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load field definitions
    fetch('/api/metadata/fields')
      .then(r => r.json())
      .then(setFields);
    
    // Load existing values
    fetch(`/api/attendees/${attendeeId}/metadata`)
      .then(r => r.json())
      .then(data => {
        setValues(data.metadata || {});
        setLoading(false);
      });
  }, [attendeeId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await fetch(`/api/attendees/${attendeeId}/metadata`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata: values })
    });
    
    onSave?.();
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(field => (
          <div key={field.key}>
            <label className="block font-medium mb-2">
              {field.description}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            
            {field.type === 'text' && (
              <input
                type="text"
                value={values[field.key] || ''}
                onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full border rounded px-3 py-2"
              />
            )}
            
            {field.type === 'textarea' && (
              <textarea
                value={values[field.key] || ''}
                onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
                className="w-full border rounded px-3 py-2"
              />
            )}
            
            {field.type === 'select' && (
              <select
                value={values[field.key] || ''}
                onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                required={field.required}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleccioná una opción</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            
            {field.type === 'url' && (
              <input
                type="url"
                value={values[field.key] || ''}
                onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full border rounded px-3 py-2"
              />
            )}
          </div>
        ))}
      
      <button type="submit" className="btn-primary">
        Save Metadata
      </button>
    </form>
  );
}
```

### 3. Attendee List with Metadata (`/attendees`)

**Purpose:** Show attendees with their metadata in table

```tsx
export default async function AttendeesPage() {
  const { data: attendees } = await supabase
    .from('attendees')
    .select(`
      *,
      attendee_metadata (
        field_key,
        value
      )
    `);
  
  // Transform metadata array to object
  const attendeesWithMetadata = attendees.map(a => ({
    ...a,
    metadata: Object.fromEntries(
      a.attendee_metadata.map(m => [m.field_key, m.value])
    )
  }));
  
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Company</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        {attendeesWithMetadata.map(a => (
          <tr key={a.id}>
            <td>{a.first_name} {a.last_name}</td>
            <td>{a.email}</td>
            <td>{a.metadata.company || '-'}</td>
            <td>{a.metadata.role || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Use Cases

### Use Case 1: Registration Form with Custom Fields

**Scenario:** Attendee registers for event

```typescript
// 1. Show registration form with metadata fields
const fields = await fetch('/api/metadata/fields').then(r => r.json());

// 2. User fills form
const formData = {
  // Standard fields
  email: 'user@example.com',
  first_name: 'Juan',
  last_name: 'Pérez',
  
  // Metadata fields
  metadata: {
    company: 'Spark101',
    role: 'Developer',
    interest: 'Bitcoin Lightning'
  }
};

// 3. Create attendee + metadata
const attendee = await createAttendee(formData);
await updateAttendeeMetadata(attendee.id, formData.metadata);
```

### Use Case 2: Email Personalization

**Scenario:** Send email with metadata variables

```typescript
// Get attendee with metadata
const attendee = await getAttendeeWithMetadata(attendeeId);

// Template with metadata variables
let html = emailTemplate
  .replace('{{first_name}}', attendee.first_name)
  .replace('{{company}}', attendee.metadata.company || 'tu empresa')
  .replace('{{role}}', attendee.metadata.role || '');

await sendEmail({ to: attendee.email, html });
```

**Example email:**
```
Hola Juan,

Como Developer de Spark101, sabemos que te interesa Bitcoin Lightning.
Por eso te invitamos a nuestro próximo taller técnico...
```

### Use Case 3: Segment by Metadata

**Scenario:** Send campaign only to developers

```typescript
// Filter attendees by metadata
const developers = await supabase
  .from('attendees')
  .select(`*, attendee_metadata!inner(*)`)
  .eq('attendee_metadata.field_key', 'role')
  .eq('attendee_metadata.value', 'Developer');

// Send targeted email
for (const dev of developers) {
  await sendEmail({
    to: dev.email,
    subject: 'Workshop para Developers — Bitcoin Lightning'
  });
}
```

### Use Case 4: Dietary Restrictions for Catering

**Scenario:** Export list with dietary restrictions

```typescript
const attendees = await getAttendeesWithMetadata(eventId);

const cateringList = attendees
  .filter(a => a.status === 'checked-in')
  .map(a => ({
    name: `${a.first_name} ${a.last_name}`,
    restrictions: a.metadata.dietary_restrictions || 'None'
  }));

// Export CSV for catering company
exportCSV(cateringList, 'catering-requirements.csv');
```

## Analytics Queries

### 1. Metadata Coverage Report

**Question:** ¿Cuántos attendees completaron cada field?

```sql
SELECT 
  mf.key,
  mf.description,
  COUNT(am.id) as responses,
  COUNT(DISTINCT a.id) as total_attendees,
  ROUND(
    (COUNT(am.id)::numeric / COUNT(DISTINCT a.id)::numeric) * 100,
    2
  ) as completion_rate
FROM metadata_fields mf
CROSS JOIN attendees a
LEFT JOIN attendee_metadata am 
  ON am.field_key = mf.key 
  AND am.attendee_id = a.id
GROUP BY mf.key, mf.description
ORDER BY completion_rate DESC;
```

**Result:**
```
key          | description              | responses | total | rate
-------------|--------------------------|-----------|-------|------
company      | ¿En qué empresa trabajás?| 150       | 180   | 83.33
role         | ¿Cuál es tu rol?         | 145       | 180   | 80.56
interest     | ¿Qué te interesa?        | 120       | 180   | 66.67
linkedin     | LinkedIn (opcional)      | 80        | 180   | 44.44
```

### 2. Top Values Report

**Question:** ¿Cuáles son las respuestas más comunes?

```sql
SELECT 
  field_key,
  value,
  COUNT(*) as count
FROM attendee_metadata
WHERE field_key = 'company'
GROUP BY field_key, value
ORDER BY count DESC
LIMIT 10;
```

**Result:**
```
field_key | value         | count
----------|---------------|------
company   | Spark101      | 25
company   | La Crypta     | 20
company   | Independiente | 15
company   | Bitcoin Beach | 10
```

## Security Considerations

### 1. Input Validation

- Validate `value` matches field `type` (email, url, number)
- Sanitize text inputs (XSS prevention)
- Limit value length (max 1000 chars)

### 2. Field Key Restrictions

- Only allow alphanumeric + underscore (no spaces, special chars)
- Prevent reserved keys: `id`, `email`, `created_at`, etc.
- Max length: 50 chars

```typescript
function validateFieldKey(key: string): boolean {
  return /^[a-z0-9_]+$/.test(key) && key.length <= 50;
}
```

### 3. Rate Limiting

Prevent spam on metadata update endpoint:

```typescript
// Max 10 metadata updates per minute per attendee
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500
});

await limiter.check(request, 10, `METADATA_${attendeeId}`);
```

## Testing Checklist

- [ ] Create new metadata field
- [ ] Edit existing field
- [ ] Delete field (should cascade delete values)
- [ ] Add metadata to attendee
- [ ] Update existing metadata
- [ ] Query attendees by metadata
- [ ] Filter attendees with multiple metadata conditions
- [ ] Export attendees with metadata to CSV
- [ ] Render dynamic form from field definitions
- [ ] Validate field types (email, url, number)
- [ ] Test select/multiselect with options
- [ ] Coverage analytics query
- [ ] Top values query
- [ ] Metadata personalization in emails

## Implementation Phases

### Phase 1: Database (Day 1 - 2h)

- [ ] Create `metadata_fields` table
- [ ] Create `attendee_metadata` table
- [ ] Seed with example fields
- [ ] Test foreign keys and cascades

### Phase 2: API Routes (Day 1 - 3h)

- [ ] `GET /api/metadata/fields`
- [ ] `POST /api/metadata/fields`
- [ ] `GET /api/attendees/[id]/metadata`
- [ ] `PUT /api/attendees/[id]/metadata` (upsert logic)
- [ ] Add validation

### Phase 3: Admin UI (Day 2 - 4h)

- [ ] Metadata fields manager page
- [ ] Create/edit/delete field forms
- [ ] Field type selector with options
- [ ] Sort order drag-and-drop

### Phase 4: Attendee Form (Day 2 - 3h)

- [ ] Dynamic metadata form component
- [ ] Type-specific inputs (text, select, url, etc.)
- [ ] Validation client-side
- [ ] Save metadata on submit

### Phase 5: Integration (Day 3 - 3h)

- [ ] Add metadata columns to attendee list
- [ ] Filter attendees by metadata
- [ ] Metadata in email personalization
- [ ] CSV export with metadata

### Phase 6: Analytics (Day 3 - 2h)

- [ ] Completion rate report
- [ ] Top values report
- [ ] Metadata dashboard widget
- [ ] Export analytics

**Total Estimated Effort:** 3 days (~17 hours)

## Success Metrics

1. **Adoption:** >70% attendees fill at least 1 metadata field
2. **Flexibility:** Admin can add new field in <2 minutes
3. **Performance:** Metadata queries <100ms
4. **Segmentation:** Email campaigns use metadata filters

## Future Enhancements

### Phase 2 (Optional)

- **Conditional Fields:** Show field B only if field A = X
- **Validation Rules:** Regex patterns, min/max length
- **Field Groups:** Organize fields into sections
- **Import/Export:** Bulk upload metadata from CSV
- **Versioning:** Track metadata changes over time
- **Computed Fields:** Derive values (e.g., "age" from "birthdate")

## Related Documents

- `FEATURE_EMAIL_CAMPAIGNS.md` — Use metadata for segmentation
- `MIGRATIONS.md` — Database migration process

---

**Status:** 📝 Specification Complete  
**Priority:** MEDIUM  
**Effort:** 3 days (~17 hours)  
**Dependencies:** None (standalone feature)
