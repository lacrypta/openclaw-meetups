# OpenClaw Meetups — Propuesta de Mejoras 2026
## Análisis Actual + Roadmap Accionable

**Fecha:** 23 de febrero, 2026  
**Evento pasado:** 21 de febrero, 2026 @ La Crypta, Buenos Aires  
**Asistentes:** ~45 personas  
**Charlas:** 8 (confirmadas)

---

## 📊 ANÁLISIS DEL SITIO ACTUAL

### Estado Actual (Feb 2026)

**Repo:** `/workspace/projects/openclaw-meetups`  
**Stack:** React 19 + TypeScript + Vite + Nostr  
**Live:** Landing page + Luma embed

**Estructura:**
```
src/
├── App.tsx                  # Single page (landing page)
├── components/              # 11 componentes reutilizables
├── i18n/                    # Bilingual (ES/EN)
├── hooks/                   # Nostr auth, RSVP, Profile
├── lib/                     # Nostr utilities, theme tokens
└── config/
    ├── meetup.json         # Solo fecha del próximo evento
    └── talks.json          # 2 talks (hardcoded para Feb 21)
```

### ✅ FORTALEZAS

1. **Arquitectura React sólida**
   - TypeScript desde el inicio → type safety
   - Hooks bien organizados (useNostr, useProfile, useRsvp)
   - Componentes reutilizables y limpios
   
2. **Autenticación Nostr integrada**
   - 3 métodos: NIP-07 (extensión), NIP-46 (nsecBunker), nsec directo
   - localStorage persistence
   - Profile fetching desde relays Nostr
   
3. **Multilingual**
   - Context API + localStorage
   - Auto-detección de idioma del navegador
   - Fácil agregar más idiomas
   
4. **Diseño limpio**
   - Dark theme profesional (azul #2563eb + ámbar #f59e0b)
   - Mobile-first responsive
   - Spacing y tipografía coherentes
   
5. **Integración Luma**
   - Embed nativo del evento
   - Botón de registro directo
   - Meta tags para SEO

### ⚠️ LIMITACIONES

| Problema | Impacto | Severidad |
|----------|--------|-----------|
| **One-shot design** | Sitio optimizado para UN evento | 🔴 Alto |
| **Sin historial** | Imposible ver eventos pasados | 🔴 Alto |
| **Registro centralizado** | Dependencia total en Luma | 🟡 Medio |
| **Datos hardcoded** | talks.json solo tiene 2 charlas del Feb 21 | 🔴 Alto |
| **Sin galería** | Ninguna forma de compartir fotos | 🔴 Alto |
| **Sin feedback** | No se recolecta satisfacción post-evento | 🟡 Medio |
| **Speakers limitados** | Perfil muy básico (sin avatar, bio, etc) | 🟡 Medio |
| **Sin estadísticas** | No hay tracking de engagement | 🟡 Medio |

---

## 💡 PROPUESTA DE TRANSFORMACIÓN

### Visión
**Landing page + Event Registry** → **Plataforma de comunidad escalable**

Mantener:
- ✅ Landing page para próximo evento
- ✅ Nostr auth integrada
- ✅ Bilingual
- ✅ Diseño + branding

Agregar:
- 📅 **Timeline de eventos** (archivo mensual/bimestral)
- 👥 **Galería de speakers** con perfiles expandidos
- 📸 **Galería de fotos/videos** por evento
- 📊 **Feedback & ratings** post-evento
- 📈 **Estadísticas públicas** (asistentes, charlas, etc)
- 🔗 **Sistema de URLs amigables** por evento

---

## 🎯 MEJORAS CONCRETAS POR SECCIÓN

### 1. **HOMEPAGE (Hero + Próximo Evento)**

**Cambios:**
- ✅ Mantener hero + Luma embed (igual que ahora)
- ✅ Agregar sección "Featured Event" del evento anterior
- ✅ Agregar "Próximos 3 eventos" en mini cards
- ✅ CTA clara al archive

**Componente nuevo:** `FeaturedEventCard.tsx`
```tsx
// Mostrar el evento más reciente con:
// - Fecha + lugar
// - Foto principal
// - # asistentes + # charlas
// - "Ver detalles" → /events/2026-02-21
```

**Ejemplo visual:**
```
┌─────────────────────────────────┐
│ OPENCLAW MEETUP — PRÓXIMO       │
│ Viernes 7 de Marzo @ La Crypta  │
│ [Luma embed]                    │
│ [Registrarse]                   │
└─────────────────────────────────┘

┌─ ÚLTIMO EVENTO ─────────────────┐
│ [Foto] 21 Feb 2026              │
│ 45 asistentes • 8 charlas       │
│ "Experiencias con OpenClaw..."  │
│ [Ver evento completo] →         │
└─────────────────────────────────┘

┌─ PRÓXIMOS EVENTOS ──────────────┐
│ Mar 7  │  Abr 4  │  May 2       │
└─────────────────────────────────┘
```

---

### 2. **DETALLE DE EVENTO (/events/:date)**

**Nueva ruta:** `/events/2026-02-21`

**Estructura:**
```
- Portada (fecha, lugar, foto destacada)
- Contadores (asistentes, charlas, duración)
- Agenda completa + horarios
- Lista de speakers con perfiles
- Encuesta de feedback inline
- Galería de fotos (si disponibles)
- Videos (si disponibles)
```

**Componentes a crear:**
1. `EventDetail.tsx` (página)
2. `EventHeader.tsx` (portada con foto)
3. `EventStats.tsx` (counters)
4. `EventAgenda.tsx` (horarios + talks)
5. `ExpandedSpeakerCard.tsx` (perfil completo)
6. `InlineFeedbackForm.tsx` (encuesta)
7. `PhotoGallery.tsx` (lightbox)

**Data structure (config/events.json):**
```json
{
  "events": [
    {
      "id": "evt-001",
      "date": "2026-02-21T19:00:00Z",
      "dateFormatted": "21 de febrero de 2026",
      "location": {
        "name": "La Crypta",
        "address": "Avenida de los Incas 3000, Belgrano",
        "city": "Buenos Aires, Argentina",
        "mapUrl": "https://maps.google.com/..."
      },
      "lumaEventId": "evt-aAtfxEgfRKNP3nz",
      "coverImage": "/events/2026-02-21/cover.jpg",
      "description": "Primer meetup de OpenClaw...",
      "stats": {
        "attendees": 45,
        "talks": 8,
        "duration_minutes": 240
      },
      "speakers": ["spk-001", "spk-002", "spk-003"],
      "schedule": [
        {
          "time": "19:00",
          "title": "Bienvenida",
          "duration": 10
        },
        {
          "time": "19:10",
          "title": "Mi experiencia con OpenClaw",
          "speaker": "spk-001",
          "duration": 15
        }
      ],
      "media": {
        "photos": {
          "count": 32,
          "folder": "/public/events/2026-02-21/photos",
          "provider": "local"
        },
        "videos": []
      },
      "feedback": {
        "averageRating": 4.7,
        "totalResponses": 28,
        "topicsSuggested": ["Más streaming en vivo", "Workshop práctico"]
      }
    }
  ]
}
```

**URLs amigables:**
- `/events/2026-02-21` → Feb 21 event details
- `/events/latest` → Último evento
- `/events/2026/march` → Todos los eventos de marzo

---

### 3. **ARCHIVO DE EVENTOS (/archive)**

**Nueva ruta:** `/archive`

**Contenido:**
- Timeline horizontal (2026)
- Grid de eventos con cards
- Filtros: Por mes, por speaker, por tema
- Búsqueda por título/descripción

**Componentes:**
1. `EventsArchive.tsx` (página)
2. `EventTimeline.tsx` (timeline visual)
3. `EventArchiveCard.tsx` (card reutilizable)
4. `ArchiveFilters.tsx` (filtros)

**Ejemplo:**
```
2026 ARCHIVE

[Feb]  [Mar]  [Apr]  [May]  [Jun]

┌──────────────────────────┐
│ 📅 Meetup #1             │
│ 21 de febrero            │
│ La Crypta                │
│ 45 asistentes • 8 talks  │
│ 📸 32 fotos              │
│ ⭐ 4.7/5                 │
│ [Ver]                    │
└──────────────────────────┘

┌──────────────────────────┐
│ 📅 Meetup #2             │
│ 7 de marzo               │
│ La Crypta                │
│ -- / -- asistentes       │
│ [Ver]                    │
└──────────────────────────┘
```

---

### 4. **GALERÍA DE SPEAKERS (/speakers)**

**Nueva ruta:** `/speakers`

**Contenido:**
- Grid de todos los speakers (histórico)
- Orden: Por # de charlas (frecuencia primero)
- Card por speaker:
  - Avatar (Nostr profile o GitHub)
  - Nombre + alias
  - Bio (1 línea)
  - # charlas + eventos
  - Temas principales (tags)
  - Social links: Twitter, GitHub, Nostr, Website
  - Badge: "Regular" (3+ charlas)

**Componentes:**
1. `SpeakersGallery.tsx` (página)
2. `SpeakerCard.tsx` (card)
3. `SpeakerFilters.tsx` (filtrar por tema)

**Data structure (config/speakers.json):**
```json
{
  "speakers": [
    {
      "id": "spk-001",
      "name": "Francisco Calderón",
      "alias": "Negrunch",
      "bio": "Dev de IA y OpenClaw",
      "avatar": "https://github.com/negrunch.png",
      "socials": {
        "twitter": "negrunch",
        "github": "negrunch",
        "nostr": "npub1...",
        "website": "https://..."
      },
      "talks": ["talk-001", "talk-003"],
      "events": ["evt-001", "evt-002"],
      "topics": ["IA", "Workflow"]
    }
  ]
}
```

**Ejemplo visual:**
```
┌─────────────────────┐
│ SPEAKERS GALLERY    │
│                     │
│ 📊 Filtrar: Todos   │
│ 📌 Ordenar: Por    │
│    frecuencia       │
└─────────────────────┘

┌──────────┐  ┌──────────┐  ┌──────────┐
│ [Avatar] │  │ [Avatar] │  │ [Avatar] │
│ Francisco│  │ Matías R.│  │ [Next]   │
│ Negrunch │  │          │  │          │
│ 1 charla │  │ 1 charla │  │          │
│ IA       │  │ Hardware │  │          │
│ 𝕏 GH     │  │ 𝕏 GH     │  │          │
│ Nostr    │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘
```

---

### 5. **GALERÍA MULTIMEDIA (/gallery)**

**Nueva ruta:** `/gallery`

**Contenido:**
- Grid de fotos de todos los eventos
- Filtrable por evento
- Lightbox para ampliar
- Información de foto (evento, fecha, autor si aplica)

**Componentes:**
1. `GalleryPage.tsx`
2. `PhotoGrid.tsx` (lazy-loaded)
3. `PhotoLightbox.tsx` (react-medium-image-zoom o similar)
4. `GalleryFilters.tsx`

**Opciones de almacenamiento:**
- 🟢 **Local:** `/public/events/{date}/photos/` (GitHub Pages)
- 🟡 **Google Drive:** Link embed + lista
- 🟡 **Cloudinary:** API + transformaciones automáticas
- 🔴 **Instagram:** Embed directo (menos control)

**Recomendación:** Local + carpeta organizada por evento

**Estructura:**
```
public/
├── events/
│   ├── 2026-02-21/
│   │   ├── cover.jpg (hero image)
│   │   ├── photos/
│   │   │   ├── 001-full.jpg
│   │   │   ├── 001-thumb.jpg (thumbnail)
│   │   │   ├── 002-full.jpg
│   │   │   └── ...
│   │   └── videos/
│   │       └── recording.mp4 (si aplica)
│   └── 2026-03-07/
│       └── ...
└── gallery.json (índice)
```

**Data structure (public/gallery.json):**
```json
{
  "photos": [
    {
      "id": "photo-001",
      "event": "evt-001",
      "eventDate": "2026-02-21",
      "url": "/events/2026-02-21/photos/001-full.jpg",
      "thumb": "/events/2026-02-21/photos/001-thumb.jpg",
      "caption": "Presentación de Francisco",
      "photographer": "Agustin"
    }
  ]
}
```

---

### 6. **FEEDBACK & ENCUESTAS (inline en event detail)**

**Integración:** Directamente en `/events/:date` page

**Formulario:**
```
¿Cómo fue la experiencia?
[⭐⭐⭐⭐⭐] (1-5 stars, required)

¿Qué charlas te gustaron?
☐ Charla 1
☐ Charla 2
☐ Charla 3

¿Qué temas quieres para próximos eventos?
[Text area]

¿Te gustaría ser speaker?
[Sí] [No]

Nombre (opcional)
[Input]

Email (opcional)
[Input]
```

**Componentes:**
1. `InlineFeedbackForm.tsx`
2. `FeedbackSummary.tsx` (resultados públicos)

**Almacenamiento:**
- Opción 1: JSON en GitHub (PR required)
- Opción 2: Formspree (free, envía email + webhook)
- Opción 3: Basin (serverless JSON storage)

**Recomendación:** Formspree (sin backend, verificado, emails automáticos)

**Data (config/feedback.json):**
```json
{
  "responses": [
    {
      "eventId": "evt-001",
      "timestamp": "2026-02-21T22:30:00Z",
      "rating": 5,
      "likesCharles": ["talk-001", "talk-003"],
      "suggestions": "Más tiempo para networking",
      "wantToSpeak": true,
      "name": "Juan",
      "email": "juan@example.com"
    }
  ],
  "summary": {
    "evt-001": {
      "averageRating": 4.7,
      "totalResponses": 28,
      "topSuggestions": ["Más streaming en vivo", "Workshop práctico"],
      "speakersInterested": 5
    }
  }
}
```

---

## 🏗️ ARQUITECTURA ESCALABLE

### Rutas Nuevas (React Router v6)

```typescript
// routes.tsx
export const routes = [
  { path: "/", element: <HomePage /> },
  { path: "/events/:date", element: <EventDetail /> },
  { path: "/events/latest", element: <EventDetail latest={true} /> },
  { path: "/archive", element: <EventsArchive /> },
  { path: "/speakers", element: <SpeakersGallery /> },
  { path: "/speakers/:id", element: <SpeakerDetail /> },
  { path: "/gallery", element: <GalleryPage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/terms", element: <TermsPage /> },
];
```

### Data Management

**Hooks nuevos:**
```typescript
// hooks/useEvents.ts
export function useEvents() {
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    fetch('/config/events.json')
      .then(r => r.json())
      .then(data => setEvents(data.events));
  }, []);
  
  return {
    events,
    nextEvent: events[0],
    latestEvent: events.sort(...)[0],
    getEvent: (date) => events.find(...)
  };
}

// hooks/useSpeakers.ts
export function useSpeakers() {
  // Agregar speaker, obtener por ID, listar histórico
}

// hooks/useGallery.ts
export function useGallery() {
  // Listar fotos por evento, lazy-load, etc
}
```

### Dependencias a Agregar

```json
{
  "dependencies": {
    "react-router-dom": "^7.x",
    "@tanstack/react-query": "^5.x",
    "yet-another-react-lightbox": "^3.x",
    "date-fns": "^3.x",
    "zustand": "^4.x"
  },
  "devDependencies": {
    "@testing-library/react": "^15.x",
    "vitest": "^1.x"
  }
}
```

---

## 🎨 UX/DISEÑO — MEJORAS CLAVE

### 1. **Homepage Mejorada**
| Antes | Después |
|-------|---------|
| Solo fecha evento | Próximo evento + últimas 3 charlas |
| Sin contexto | Featured event + stats (45 asistentes, 4.7⭐) |
| Luma embed únicamente | Luma + mini timeline de próximos |

### 2. **Mejor Gestión de Speakers**
| Antes | Después |
|-------|---------|
| Solo 2 charlas en talks.json | Perfil completo con avatar, bio, social links |
| Sin repetición | Badge "Regular" para 3+ charlas |
| Sin búsqueda | Filtrable por tema + ordenable por frecuencia |

### 3. **Historial Accesible**
| Antes | Después |
|-------|---------|
| No hay forma de ver eventos pasados | Timeline + archive completo |
| Fotos desconectadas | Galería por evento con filtros |
| Charlas olvidadas | Cada talk linkea a speaker + evento |

### 4. **Engagement Post-Evento**
| Antes | Después |
|-------|---------|
| Fin del evento = fin de la plataforma | Feedback form, fotos, resultados públicos |
| Sin datos de satisfacción | Rating promedio, sugerencias destacadas |
| Comunidad desconectada | Speakers listados, reconocimiento de regulares |

### 5. **Mobile-First (Mejorado)**
| Antes | Después |
|-------|---------|
| Iframe Luma (pobre en mobile) | Card nativa con link a Luma |
| Timeline horizontal en móvil | Stack vertical, card por evento |
| Fotogalería no optimizada | Galería lazy-loaded, lightbox táctil |

### 6. **Social Proof Visible**
| Antes | Después |
|-------|---------|
| "Register on Luma" (borroso) | "45 asistentes", "8 charlas", "4.7⭐ promedio" |
| Speakers sin contexto | "Speaker regular" (3+ charlas) con avatar |
| Stats ocultos | Dashboard simple en header de eventos |

---

## 📋 PLAN DE IMPLEMENTACIÓN (8 Semanas)

### Fase 1: Arquitectura Base (2 semanas) — CRÍTICA

**Objetivos:**
- ✅ React Router integrado
- ✅ Data structure (events.json, speakers.json)
- ✅ Hooks de data management
- ✅ Layouts base (no todos los componentes)

**Tareas:**
1. Crear rama `feature/multi-event-platform`
2. Instalar React Router + TanStack Query
3. Crear `events.json` con datos de Feb 21
4. Crear `speakers.json` con 8+ speakers
5. Implementar hooks: `useEvents`, `useSpeakers`
6. Crear layouts: HomePage, EventDetail, EventsArchive
7. Refactor App.tsx → <Routes> wrapper
8. Test: Navegar entre rutas sin crashes

**Entregable:** PR con skeleton + datos poblados

---

### Fase 2: Event Details + Archive (2 semanas)

**Objetivos:**
- ✅ `/events/:date` funcional (detalles completos)
- ✅ `/archive` con timeline y filtros
- ✅ Speaker profiles expandidos

**Tareas:**
1. Crear `EventDetail.tsx` con:
   - Header (foto + stats)
   - Agenda + horarios
   - Speakers expandidos (links sociales, etc)
   - Skeleton loaders
2. Crear `EventsArchive.tsx` con:
   - Timeline visual (puede ser simple al inicio)
   - Grid de eventos
   - Filtros: mes, speaker, tema
3. Actualizar `talks.json` → Array de charlas con IDs
4. Crear `ExpandedSpeakerCard.tsx` con avatars
5. Testing: Navegar entre eventos, filtros funcionan

**Entregable:** `/events/2026-02-21` y `/archive` funcionales

---

### Fase 3: Galería + Feedback (2 semanas)

**Objetivos:**
- ✅ `/gallery` con fotos del Feb 21
- ✅ Feedback form integrado
- ✅ Resultados públicos

**Tareas:**
1. Recolectar + optimizar fotos del Feb 21
2. Crear estructura `/public/events/2026-02-21/photos/`
3. Implementar `PhotoGrid.tsx` + lightbox
4. Crear `InlineFeedbackForm.tsx` (Formspree)
5. Crear `FeedbackSummary.tsx` (mostrar rating, top charlas, sugerencias)
6. Actualizar `/events/:date` para incluir galería + feedback
7. Testing: Fotos cargan, lightbox funciona, form envía

**Entregable:** `/gallery` + feedback funcional

---

### Fase 4: Speakers Gallery + Polish (2 semanas)

**Objetivos:**
- ✅ `/speakers` galería completa
- ✅ Filtros y búsqueda
- ✅ SEO, performance, detalles UX

**Tareas:**
1. Crear `SpeakersGallery.tsx` grid layout
2. Implementar filtros: tema, frecuencia, nombre
3. Crear `SpeakerCard.tsx` con social links
4. Agregar badges: "Regular" (3+), "Debut" (primer evento)
5. Social links: avatars clickeables, nofollow en externos
6. Lazy loading en speakers grid
7. SEO: meta tags por speaker, Open Graph
8. Performance: medir Lighthouse, optimizar imágenes
9. Testing: Filtros, responsive, social links funcionan

**Entregable:** `/speakers` funcional, lighthouse 90+

---

### Fase 5: Testing + Deployment (1 semana)

**Objetivos:**
- ✅ Tests de rutas principais
- ✅ Deployment a producción
- ✅ Monitoreo de errors

**Tareas:**
1. Crear test suite (Vitest):
   - Navigation entre rutas
   - Data loading + error states
   - Form submissions
2. Criar CI/CD (GitHub Actions):
   - ESLint check
   - Type check (tsc)
   - Build verification
   - Deploy a Vercel/Netlify
3. Monitorear: errors en producción, analytics
4. Documentar: README actualizado, CONTRIBUTING.md

**Entregable:** Tests + CI/CD + versión live

---

### Fase 6: Iteración con Evento Real (Evento #2, Mar 7)

**Objetivos:**
- ✅ Datos del evento real funcionan
- ✅ Feedback real de asistentes
- ✅ Refinements basados en testing

**Tareas:**
1. Actualizar `events.json` con evento Mar 7
2. Recolectar + subir fotos
3. Ejecutar feedback form
4. Registrar métricas: CTR, feedback rate, time on page
5. Iterar based on feedback
6. Documenta learnings

**Entregable:** Datos reales del Mar 7 en platform

---

## 🔧 STACK TÉCNICO RECOMENDADO

### Mantener (actual)
- ✅ React 19
- ✅ TypeScript
- ✅ Vite
- ✅ Nostr auth
- ✅ i18n (ES/EN)

### Agregar (mínimo)
```bash
npm install react-router-dom@^7 \
  @tanstack/react-query@^5 \
  date-fns@^3 \
  zustand@^4

npm install -D yet-another-react-lightbox@^3
```

### Almacenamiento de Datos
- **Config JSONs:** Git-committed (versioning)
- **Feedback:** Formspree (email + webhook) o Basin.js
- **Fotos:** `/public/events/` (optimizadas)
- **Videos:** Links embedidos o S3 (futura)

### Hosting
- ✅ Vercel (recomendado para Vite + React Router)
- ✅ Netlify
- ✅ GitHub Pages (si es static)

---

## 📊 MÉTRICAS A TRACKEAR (una vez deployado)

### Engagement
```
- Visitantes únicos por mes
- Páginas más visitadas (home vs archive vs speakers)
- CTR en "Registrarse en Luma"
- Tiempo promedio en página
- Bounce rate
```

### Community
```
- # de speakers por evento (trend)
- Tasa de speakers recurrentes (Jan 2025: ?%)
- Rating promedio de eventos (target: 4.5+)
- # de feedback completados (target: 50%+ de asistentes)
```

### Content
```
- Charlas por evento (target: 8-12)
- Duración promedio de charla
- Fotos por evento
- Videos recolectados
```

### Growth
```
- Asistentes trend (mensual)
- Nuevos speakers vs repeats
- Geographic distribution
- Retención de asistentes
```

**Herramientas:** Google Analytics 4 (GA4) + custom events

---

## 📝 CHECKLIST DE TAREAS INMEDIATAS

### Semana 1 (Esta semana — Feb 23-Mar 1)

- [ ] Crear rama feature/multi-event-platform
- [ ] Setup React Router v6
- [ ] Crear `events.json` con evento Feb 21
- [ ] Crear `speakers.json` con 8+ speakers
- [ ] Implementar `useEvents` hook
- [ ] Refactor App.tsx → Routes wrapper
- [ ] Crear skeleton EventDetail.tsx
- [ ] PR con changes (review antes de merge)

### Semana 2 (Mar 2-8)

- [ ] Completar EventDetail + EventsArchive
- [ ] Test navegación en mobile
- [ ] Recolectar datos del evento Feb 21 (actualizar config)
- [ ] Agregar speaker avatars + sociales

### Semana 3 (Mar 9-15)

- [ ] Implementar feedback form (Formspree)
- [ ] Galería de fotos del Feb 21
- [ ] Dashboard de feedback (ratings públicos)

### Semana 4 (Mar 16-22)

- [ ] SpeakersGallery.tsx + filtros
- [ ] Optimización (Lighthouse 90+)
- [ ] Testing automatizado

### Semana 5 (Mar 23-29)

- [ ] Deploy a producción
- [ ] Monitoreo + hot fixes
- [ ] Documentación (README, CONTRIBUTING)

---

## 💰 ESTIMACIÓN DE ESFUERZO

| Fase | Horas | Dificultad | Prioridad |
|------|-------|-----------|-----------|
| Arquitectura base | 16h | 🟡 Medio | 🔴 Crítica |
| Event Details | 12h | 🟢 Bajo | 🔴 Alta |
| Archive | 8h | 🟢 Bajo | 🔴 Alta |
| Galería + Feedback | 12h | 🟡 Medio | 🟡 Media |
| Speakers Gallery | 10h | 🟡 Medio | 🟡 Media |
| Testing + Deploy | 10h | 🟢 Bajo | 🔴 Crítica |
| **TOTAL** | **68h** | — | — |

**Timeline realista:** 7-8 semanas (con pauses para eventos reales)

---

## 🎁 EXTRAS (Post-MVP, Future)

### Backend escalado
- Node.js + Express + Supabase
- Admin panel para Agustin
- Integración con Luma API (sync asistentes)

### Social features
- Comentarios en charlas
- Reacciones a fotos
- Mentions de speakers
- Nostr NIP-23 for blog posts

### Monetización (si aplica)
- Sponsors section
- Merchandise store
- Donation links

### Analytics avanzado
- Heatmaps
- Cohort analysis
- Retention curves

---

## 🎯 SUCCESS CRITERIA (MVP)

✅ **Fecha objetivo:** 31 de marzo (después del evento #2)

```
[ ] Rutas principales funcionan (/archive, /events/*, /speakers, /gallery)
[ ] Evento Feb 21 + evento Mar 7 cargados en events.json
[ ] Speakers con perfiles completos (avatar, sociales, # charlas)
[ ] Fotos del Feb 21 en galería
[ ] Feedback form recolectando respuestas
[ ] Rating promedio mostrado públicamente
[ ] SEO meta tags implementados
[ ] Mobile responsive (tested)
[ ] Lighthouse 90+
[ ] 0 console errors
[ ] Documentación actualizada
[ ] Deployado en Vercel/Netlify
```

---

## 📞 NEXT STEPS

1. ✅ **Aprobación:** ¿OK con dirección general?
2. 📋 **Prioritización:** ¿Cuáles son las 2 mejoras más importantes para Mar 7?
3. 🚀 **Kickoff:** Crear rama + primer PR esta semana
4. 📅 **Planning:** Agendar check-ins bi-semanales

---

## REFERENCIAS

- **Repo actual:** `/workspace/projects/openclaw-meetups`
- **Próximo evento:** Mar 7, 2026 @ La Crypta
- **Stack:** React 19 + TypeScript + Vite + Nostr
- **Design tokens:** `/src/lib/theme.ts`
- **Análisis previo:** `MEETUP-IMPROVEMENT-ANALYSIS.md` (más detallado)
