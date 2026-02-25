# Luma Clone - UI/UX & Functionality Overview

> Reference platform: **lu.ma** - Event management platform
> Goal: Capture the visual identity, interaction patterns, and feature set to guide the OpenClaw Meetups dashboard clone.

---

## 1. Visual Identity & Design System

### 1.1 Color Palette

#### Dark Theme (Primary - used in dashboard/admin views)
- **Background**: Deep dark navy/charcoal `#1a1a2e` to `#16161d`
- **Surface/Card**: Slightly lighter dark `#222233` with subtle borders `rgba(255,255,255,0.08)`
- **Text Primary**: White `#ffffff`
- **Text Secondary**: Muted gray `#9999aa` / `rgba(255,255,255,0.5)`
- **Accent/Brand**: Soft purple-pink gradient for highlights
- **Success/Confirmed**: Green badge `#34d399` / `#22c55e`
- **Warning/Waitlist**: Muted gray badge
- **Error/Rejected**: Orange-red `#ef4444`
- **Links**: Pink/magenta accent `#e879a8`

#### Event Creation Theme (Green/Nature variant)
- **Background**: Deep forest green `#1a2e1a` to `#0d1f0d`
- **Surface/Card**: Semi-transparent green-tinted overlay `rgba(255,255,255,0.06)`
- **Accent**: Bright lime/neon green for highlights
- **Input fields**: Dark green with subtle border, lighter green placeholder text

### 1.2 Typography
- **Headings (Event Title)**: Large serif/editorial font, italic style, light weight - approximately 36-48px for main event name placeholder
- **Section Headings**: Bold sans-serif, ~20-24px, white, all-caps for labels like "RESUMEN DEL EVENTO", "COMENTARIOS"
- **Body Text**: Clean sans-serif (Inter or similar), 14-16px, regular weight
- **Navigation**: Sans-serif, 14-16px, medium weight, with active state underline
- **Badges/Labels**: 12-13px, uppercase or sentence case, inside rounded pills
- **Numbers/Stats**: Large bold numerals (36-48px) for key metrics like attendee count

### 1.3 Spacing & Layout
- **Page max-width**: ~1100-1200px centered
- **Content padding**: 24-32px horizontal on desktop
- **Card padding**: 20-24px internal
- **Section gaps**: 32-48px between major sections
- **Card border-radius**: 12-16px (large, soft corners)
- **Badge border-radius**: Full rounded (pill shape) ~20px
- **Button border-radius**: 8-12px

### 1.4 Elevation & Effects
- **Cards**: No heavy shadows, rely on subtle background color difference and thin borders
- **Hover states**: Subtle brightness increase or border highlight
- **Active nav**: Underline decoration below active tab, white text vs muted inactive
- **Progress bars**: Segmented, color-coded (green for confirmed, yellow-green for waitlist, gray for remaining capacity)
- **Image overlays**: Event cover images with slight dark overlay for text readability

---

## 2. Layout Architecture

### 2.1 Top Navigation Bar (Global)
- **Position**: Fixed top, full-width
- **Height**: ~56-64px
- **Left side**: Icon + text nav items: "Eventos", "Calendarios", "Descubrir"
- **Right side**: Current time with timezone (e.g. "2:24 GMT-3"), "Crear evento" CTA button, search icon, notification bell (with red badge), user avatar
- **Style**: Dark background, semi-transparent or matching page bg

### 2.2 Event Management Header
- **Breadcrumb**: "Personal >" linking back to calendar
- **Event Title**: Large, bold, prominent
- **Action Button**: "Pagina del evento" with external link arrow, outlined/ghost style, top-right
- **Tab Navigation**: Horizontal tabs below title: Resumen | Invitados | Inscripcion | Difusiones | Informacion | Mas
  - Active tab: White text with underline
  - Inactive tab: Muted/gray text

### 2.3 Content Grid
- **Single column**: Primary content flows vertically
- **Two-column sections**: Side-by-side cards for summary + comments (on event summary page)
- **Full-width cards**: For lists like attendees, settings panels

---

## 3. Page-by-Page Breakdown

### 3.1 Events List Page (`/eventos`)

#### Layout
- **Title**: "Eventos" - large, bold, left-aligned
- **Toggle**: "Proximos | Pasados" pill toggle, top-right
- **Timeline**: Vertical timeline with date labels on the left, event cards on the right

#### Event Card (Timeline Item)
- **Date column** (left): Day number + day name + month, muted text
- **Timeline dot**: Small circle on the vertical line
- **Card** (right): Full-width card containing:
  - **Time**: "19:00" in accent color
  - **Title**: Bold, large text
  - **Location**: Icon + address text, muted
  - **Attendees count**: Icon + "147 invitados", muted
  - **Event image**: Square thumbnail on the right side (~120x120px), rounded corners
  - **Action**: "Administrar evento ->" button/link
  - **Avatar stack**: Overlapping circular avatars (4-5 visible) + "+142" count

#### States
- **Hosted events**: Full card with manage button + avatar stack
- **Invited events**: "Invitado" green badge, event by external organizer shows organizer name/avatar
- **Past vs Upcoming**: Same visual, filtered by toggle

### 3.2 Event Summary Page (`/evento/:id/resumen`)

#### "Event Ended" Banner
- **Bold heading**: "Este evento ha finalizado"
- **Subtext**: Thank you message
- **Action**: "Informacion" button with external arrow, top-right of banner

#### Summary Grid (Two Columns)
**Left Card - "RESUMEN DEL EVENTO"**
- Edit icon (pencil) top-right of card
- List items with icons:
  - Calendar icon + Date (e.g. "viernes, 20 feb")
  - Clock icon + Time with timezone (e.g. "19:00 GMT-3")
  - Pin icon + Location address
  - People icon + Attendee count (e.g. "61 invitados registrados")

**Right Card - "COMENTARIOS"**
- Empty state: Chat bubble icon
- Message: "No se recopilaron comentarios"
- Subtext: Explanation
- CTA link: "Programar correo de comentarios" in pink/accent

#### Guests Section
- **Title**: "Invitados"
- **Key Metric**: Large green number "147" + "Asistire" label
- **Capacity bar**: "cupo 150" on right
- **Progress bar**: Segmented horizontal bar
  - Green segment: Confirmed attendees
  - Yellow-green segment: Waitlisted
  - Gray segment: Remaining capacity
- **Legend**: "61 registrados" (green) + "33 en lista de espera" (dot) + "2 No asistiran" (dot)

#### Recent Registrations List
- **Header**: "Inscripciones recientes" + "Todos los invitados ->" link button
- **List items**: Full-width rows with:
  - Avatar (circular, 32-36px)
  - Name (bold)
  - Email (muted, gray)
  - Status badge (right side): "Asistire" green or "Lista de espera" gray
  - Date (right side, muted): "20 feb"

#### Invitations Section
- **Title**: "Invitaciones" + "+ Invitar invitados" button
- **Empty state card**: Mail icon + "No se enviaron invitaciones" + helper text

### 3.3 Event Registration/Inscription Page (`/evento/:id/inscripcion`)

#### Status Cards Row (Three horizontal cards)
1. **Inscripcion**: Green highlight/selected state, "Abierto" subtitle, icon with green bg
2. **Cupo del evento**: Purple icon, "150 - Lista de espera activa" subtitle
3. **Registro grupal**: Purple icon, "Desactivado" subtitle

#### Tickets Section ("Entradas")
- **Header**: "Entradas" + "+ Nuevo tipo de entrada" button
- **Stripe integration banner**: Luma + Stripe logos, CTA to connect payments, dismiss X
- **Ticket row**: "Standard" + "Gratis" label + people icon with count "147"

#### Registration Emails Section ("Correos de registro")
- **Description text**: Explains email automation for registration
- **Three email template cards**:
  1. **Pending/Waitlist**: Orange icon, placeholder lines, "Pendiente de aprobacion / Lista de espera"
  2. **Confirmed**: Green checkmark icon, "Asistire"
  3. **Rejected**: Red X icon, "Rechazado"
- Each card shows a mini email preview with placeholder content lines

### 3.4 Event Creation Page (`/crear-evento`)

#### Two-Column Layout
**Left Column (~35%)**:
- **Cover image**: Large square/portrait image upload area with camera icon overlay (bottom-right)
- **Theme selector**: "Tema" label + theme name (e.g. "Minimalista") + dropdown arrow + shuffle/random button

**Right Column (~65%)**:
- **Calendar selector**: Dropdown "Calendario personal"
- **Visibility toggle**: "Publico" with globe icon, dropdown
- **Event name**: Large italic placeholder "Nombre del evento", editable inline
- **Date/Time section**:
  - Start row: "Inicio" label + date picker ("mie, 25 feb") + time picker ("02:30 AM")
  - End row: "Fin" label + date picker + time picker
  - Timezone: Globe icon + "GMT-03:00 Buenos Aires"
  - Visual connector: Dotted vertical line between start/end dots
- **Location**: Icon + "Agregar ubicacion del evento" + subtext "Ubicacion fisica o enlace virtual"
- **Description**: Icon + "Agregar descripcion"

#### Event Options Section ("Opciones del evento")
- **Ticket price**: "Precio de la entrada" + "Gratis" value + edit icon
- **Approval required**: "Requiere aprobacion" + toggle switch (off state)
- **Capacity**: "Cupo" + "Ilimitado" value + edit icon

#### Submit Button
- **Full-width**: "Crear evento" button, prominent, large padding, rounded corners

---

## 4. Component Library

### 4.1 Buttons
| Variant | Style | Usage |
|---------|-------|-------|
| Primary | Solid bg, white text, rounded 8-12px, full-width or auto | "Crear evento", form submissions |
| Secondary/Ghost | Outlined border, transparent bg, white text | "Pagina del evento", "Informacion" |
| Text/Link | No border, accent color (pink), with arrow icon | "Todos los invitados ->", "Programar correo" |
| Icon Button | Square/circle, icon only, subtle bg | Edit pencil, shuffle theme |
| Toggle Pill | Two options in a pill container, active has solid bg | "Proximos / Pasados" |

### 4.2 Badges/Pills
| Variant | Style |
|---------|-------|
| Success (Asistire) | Green bg with slight transparency, green text, pill shape |
| Neutral (Lista de espera) | Gray bg, gray text, pill shape |
| Info (Invitado) | Green solid bg, white text |
| Status (Abierto) | Within card, subtitle text |

### 4.3 Form Controls
| Control | Style |
|---------|-------|
| Date Picker | Dark input field, shows formatted date, click to open calendar |
| Time Picker | Dark input field, shows AM/PM time format |
| Toggle Switch | Rounded track, circle thumb, off=gray, on=accent color |
| Dropdown | Dark bg, subtle border, chevron icon right |
| Inline Edit | Click-to-edit with pencil icon, value displayed as text |

### 4.4 Cards
- **Surface card**: Slightly lighter than background, thin border, 12-16px radius, 20-24px padding
- **Selectable card** (status cards): Border highlight when selected, accent color left border or glow
- **Email template card**: Dark card with icon, placeholder content lines (gray bars), label text at bottom
- **Event card**: Full-width, contains mixed content (text, image, buttons, avatars)

### 4.5 Lists
- **Attendee row**: Avatar + Name (bold) + Email (muted) + Badge (right) + Date (right, muted)
- **Settings row**: Icon + Label + Value/Control (right-aligned)
- **Dividers**: Subtle horizontal lines between sections, `rgba(255,255,255,0.06)`

### 4.6 Avatar Stack
- Overlapping circular avatars (32px each, -8px overlap)
- 4-5 visible, then "+N" count in gray circle
- Used in event cards and attendee lists

### 4.7 Progress Bar
- **Segmented bar**: Multiple colored segments representing different statuses
- **Height**: ~8-10px
- **Border-radius**: Full rounded
- **Colors**: Green (confirmed), Yellow-green (waitlist), Gray (remaining/empty)

### 4.8 Timeline
- **Vertical line**: Thin gray line on the left
- **Date nodes**: Small filled circles on the line
- **Content**: Cards positioned to the right of the timeline

---

## 5. Interaction Patterns

### 5.1 Navigation
- Tab-based navigation within event management (Resumen, Invitados, etc.)
- Breadcrumb for hierarchy (Personal > Event Name)
- Top-level nav for major sections (Eventos, Calendarios, Descubrir)
- Toggle switches for list filtering (Proximos/Pasados)

### 5.2 Inline Editing
- Click pencil icon to edit values (ticket price, capacity, event summary details)
- Large text fields (event name, description) are directly editable inline
- Toggle switches for boolean settings (approval required)

### 5.3 Empty States
- Descriptive message explaining what's missing
- Optional CTA to take action (e.g., "Programar correo de comentarios", "Invitar invitados")
- Subtle icon illustration above message

### 5.4 Status Indicators
- Color-coded badges for registration status
- Progress bars for capacity visualization
- Notification badges (red dot) on nav icons
- "Abierto/Cerrado" status labels on registration

### 5.5 Image Upload
- Large preview area for event cover image
- Camera icon overlay indicating uploadability
- Theme selector below for pre-built visual styles

---

## 6. Key Features to Clone

### 6.1 Event Management (CRUD)
- [x] Create event with name, date/time, location, description
- [x] Event cover image upload with theme selection
- [x] Set visibility (Public/Private)
- [x] Set capacity (Unlimited or fixed number)
- [x] Toggle approval requirement
- [x] Set ticket pricing (Free or paid)
- [x] Edit event details inline

### 6.2 Registration & Ticketing
- [ ] Multiple ticket types support
- [x] Free ticket registration
- [ ] Paid tickets with Stripe integration
- [x] Capacity limits with waitlist when full
- [x] Approval-based registration flow
- [ ] Registration email customization (Pending, Confirmed, Rejected)
- [ ] Group registration option

### 6.3 Attendee Management
- [x] View all attendees with status (Confirmed, Waitlisted, Rejected)
- [x] Recent registrations feed with avatar, name, email, status, date
- [x] Attendee count and capacity visualization
- [ ] Approve/reject individual attendees
- [ ] Export attendee list

### 6.4 Event Summary/Dashboard
- [x] Post-event summary view
- [x] Key metrics: attendee count, capacity usage
- [x] Segmented progress bar for registration status breakdown
- [ ] Comments/feedback collection
- [ ] Invitation management (email/SMS)

### 6.5 Events List
- [x] Timeline view of events
- [x] Past/Upcoming toggle filter
- [x] Event cards with key info (time, title, location, attendee count, image)
- [x] Quick access to event management
- [x] Avatar stack showing recent attendees

### 6.6 Calendar Integration
- [ ] Personal calendar view
- [ ] Calendar-based event discovery
- [ ] Timezone-aware date/time display

---

## 7. Responsive Considerations

Based on the screenshots (desktop views ~1400px wide):
- **Desktop**: Full layout with sidebar, two-column cards, timeline
- **Tablet**: Stack two-column sections, maintain tab navigation
- **Mobile**: Single column, collapsed navigation (hamburger), full-width cards, simplified timeline

---

## 8. Animations & Micro-interactions (Inferred)

- Smooth tab transitions between event management sections
- Hover effects on cards (subtle border glow or brightness increase)
- Toggle switch smooth slide animation
- Badge count animations when new registrations arrive
- Progress bar animated fill on page load
- Avatar stack hover to reveal full avatar/name tooltip

---

## 9. Technical Notes

### Theme System
Luma supports multiple visual themes for event creation pages (e.g., "Minimalista" with deep green tones). Each theme applies:
- Different background colors/gradients
- Different accent colors
- Consistent component structure with themed tokens

### Timezone Handling
- All times display with explicit timezone (GMT-3, GMT-5)
- Timezone selector in event creation
- Local time conversion for attendees in different zones

### Internationalization
- Full Spanish language support (as shown in screenshots)
- Date formatting follows locale (e.g., "mie, 25 feb", "viernes, 20 feb")
- Currency and number formatting locale-aware
