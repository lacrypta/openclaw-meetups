# Landing Page - UI/UX & Design System Reference

> Built with: **Framer**
> Goal: Capture the complete visual identity, interaction patterns, layout, and component design to guide the OpenClaw Meetups landing page.

---

## 1. Design Philosophy & Aesthetic

### Core Identity

- **Monochrome-only** palette: Pure black, white, and grays. Zero color accents anywhere.
- **Bold, oversized typography**: Section headings often exceed 100px visually, creating a high-impact editorial look.
- **Halftone/Dithered photography**: ALL images on the site use a distinctive halftone dot-matrix filter, giving a retro-print / newspaper aesthetic. This is the visual signature of the brand.
- **Extreme whitespace**: Sections are separated by generous gaps, often near-viewport-height spacing, creating a breathing, contemplative rhythm.
- **Minimal UI chrome**: No borders, no shadows, no gradients on UI elements. The design relies on contrast between surface colors and content weight.
- **Trailing period convention**: Major headings always end with a period — "About Us.", "Projects.", "Experiences.", "Services.", "Get in touch."

### Mood

Premium, editorial, high-fashion. The site feels like a luxury brand portfolio — monochrome restraint, confident typography, and curated whitespace. Every section is treated like a magazine spread.

---

## 2. Design Tokens

### 2.1 Color Palette

| Token            | Hex       | Usage                                                    |
| ---------------- | --------- | -------------------------------------------------------- |
| `--black`        | `#121212` | Page dark backgrounds (hero, services, contact sections) |
| `--near-black`   | `#171717` | Primary text color on light backgrounds                  |
| `--pure-black`   | `#0a0a0a` | Deepest black for buttons, strong elements               |
| `--white`        | `#ffffff` | Text on dark backgrounds, card backgrounds               |
| `--light-gray`   | `#f5f5f5` | Page background (light sections)                         |
| `--border-gray`  | `#e5e5e5` | Subtle dividers, input underlines                        |
| `--muted-gray`   | `#737373` | Secondary/descriptive text, muted labels                 |
| `--selection-bg` | `#383838` | Text selection background                                |

> **Critical**: There are NO brand colors, no blues, no greens, no accent hues. The entire site is grayscale.

### 2.2 Typography

| Property                  | Value                                                   |
| ------------------------- | ------------------------------------------------------- |
| **Font Family (primary)** | `Inter, Inter Placeholder, sans-serif`                  |
| **Font Family (mono)**    | `Fragment Mono, monospace`                              |
| **Weights used**          | 400 (regular), 500 (medium), 600 (semibold), 700 (bold) |
| **Base font size**        | `16px`                                                  |
| **Base line height**      | `1.2em`                                                 |
| **Base letter spacing**   | `0`                                                     |

#### Typography Scale (observed from screenshots)

| Element                                       | Size (approx) | Weight     | Style                            |
| --------------------------------------------- | ------------- | ---------- | -------------------------------- |
| Page title ("About Us.", "Projects.")         | 120-160px     | 700 (bold) | Normal, tight tracking `-0.04em` |
| Hero brand name ("La Crypta")                 | 180-220px     | 700        | Normal                           |
| Section heading ("Services.", "Testimonials") | 80-120px      | 700        | Normal                           |
| Sub-section heading ("Work with us.")         | 24-32px       | 700        | Normal                           |
| Body text / descriptions                      | 16-18px       | 400        | Normal, `#737373` on light bg    |
| Bold intro sentence                           | 20-24px       | 600-700    | `#171717`                        |
| Labels / small text                           | 12-13px       | 500        | Normal, often `#737373`          |
| Navigation links                              | 16px          | 500        | Normal                           |
| Button text                                   | 14-16px       | 500        | Normal                           |
| Numbered index "(001)"                        | 13-14px       | 400        | `Fragment Mono`, muted gray      |
| Copyright text                                | 13px          | 400        | `#737373`                        |

### 2.3 Spacing

| Token                  | Value      | Usage                              |
| ---------------------- | ---------- | ---------------------------------- |
| Section gap (vertical) | `80-130px` | Between major page sections        |
| Card padding           | `20-24px`  | Internal padding of cards          |
| Form gap               | `36-40px`  | Between form fields                |
| Nav padding            | `19-24px`  | Navigation bar horizontal padding  |
| Grid gap               | `10-20px`  | Between grid items (project cards) |
| Content max-width      | ~`1400px`  | Page content container             |

### 2.4 Border Radius

| Element                 | Radius                           |
| ----------------------- | -------------------------------- |
| Project cards           | `16-20px`                        |
| Dark section containers | `24-32px` (top corners)          |
| Buttons (pill)          | `50px` (full rounded)            |
| Contact person card     | `16px`                           |
| Client logo cards       | `12-16px`                        |
| Input fields            | `0` (no radius — underline only) |

### 2.5 Responsive Breakpoints

| Breakpoint | Range            |
| ---------- | ---------------- |
| Desktop    | `>= 1200px`      |
| Tablet     | `810px - 1199px` |
| Mobile     | `< 810px`        |

---

## 3. Global Layout

### 3.1 Navigation Bar (Sticky Header)

```
[Logo]          [About Us]          [Experiences ^11]          [Contact]          [≡ hamburger]
```

- **Position**: Fixed/sticky top, full-width
- **Height**: ~56-64px
- **Background**: White / transparent (matches page section bg)
- **Logo**: Logo with openclaw logo and la crypta left-aligned
- **Links**: 3 items evenly spaced in center area — "About Us", "Experiences" (with superscript count badge `11`), "Contact"
- **Hamburger**: Right side, 2-3 horizontal lines icon, opens a full-screen or slide-in menu
- **Style**: No borders, no shadows. Clean horizontal text links.

### 3.2 Footer

```
[+ markers scattered]

[openclaw@lacrypta.ar]          [Navigation]          [Social]
(underlined)          Home                   X ↗
                      About Us               Youtube ↗
                      Experiences
                      Contact

                                    [OpenClaw Meetups — giant watermark bottom-right]
```

- **Background**: Same light gray `#f5f5f5` as page
- **Layout**: 3-column — email left, nav links center, social links right
- **Email**: Bold, underlined, with "+" circle icon prefix
- **Nav links**: Plain text, no underlines, stacked vertically
- **Social links**: "X" and "Youtube" with external arrow icon `↗`
- **Decorative**: Cross `+` markers scattered in the space above
- **Watermark**: Giant "La Crypta Experiences" text, bottom-right, very large and faded/semi-transparent

---

## 4. Page Sections Breakdown (Home `/`)

### 4.1 Hero Section

**Layout**: Full-viewport height, dark background `#121212`

```
┌──────────────────────────────────────────────────────────────────┐
│ [Dark background with halftone/blurred event imagery]            │
│                                                                  │
│  OpenClaw Meetups              IRL Experiences                   │
│  (giant, 200px+)               Open Source AI                    │
│      Experiences               Branding                          │
│      (subtitle)                Content                           │
│                                                                  │
│  + ─────────── + ──────────── + ──────────── +   (cross markers) │
│                                                                  │
│                                    ┌─────────────────┐           │
│                                    │ [Photo] Title    │           │
│                                    │    at La Crypta  │           │
│  Your own personal AI assistant,   │  Name            │           │
│  open-source and local             │                   │           │
│  running locally on your machine  │  [Let's talk ●]  │           │
│                                     └─────────────────┘           │
│                    © 2025 La Crypta                            │
└──────────────────────────────────────────────────────────────────┘
```

**Key elements**:

- Dark bg with halftone-filtered background imagery (blurry, atmospheric)
- "La Crypta" in giant bold white text (~200px), "®" in a circle outline
- "Experiences" as subtitle below brand name
- Services list on the right: "IRL Experiences", "Social Media Campaigns", "Branding", "Content" — stacked, white text
- Cross `+` markers in a horizontal row as decorative dividers
- Tagline at bottom-left: "Brands matter when they're felt. And we design **experiences worth feeling.**" — italic emphasis on "experiences worth feeling"
- Floating contact card (bottom-right) — see Component #4 below
- Copyright text centered at bottom

### 4.2 Clients / Logos Section

**Background**: Light gray `#f5f5f5`

```
[+ Our clients]     [(2020 - 2025©)]

┌──────┐  ┌──────────┐  ┌──────┐  ┌──────────┐  ┌──────────┐
│ Sky  │  │ETHEREALIZE│  │ Spark│  │El Dorado │  │ Reserve  │
└──────┘  └──────────┘  └──────┘  └──────────┘  └──────────┘
```

- **Label**: "+ Our clients" with circle-plus icon, "(2020-2025©)" date range
- **Cards**: 5 white rounded cards in a horizontal row
- Each card contains a client logo (icon + wordmark) in black
- Cards have subtle white bg on light gray page, `border-radius: 12-16px`
- No borders, very subtle shadow or just bg contrast

### 4.3 Experiences Section

**Background**: Light gray `#f5f5f5`

```
(27)
Experiences.          ©2020 - 2025          [description text on right]

┌─────────────────────┐  ┌─────────────────────┐
│ Sky Launch Party     │  │ USDS Takes You There│
│ /2024          •••   │  │ /2025          •••   │
│ [halftone image      │  │ [halftone image      │
│  with logo overlay]  │  │  with logo overlay]  │
└─────────────────────┘  └─────────────────────┘
```

- **Count badge**: "(27)" in parentheses, top-left
- **Heading**: "Experiences." giant bold text with trailing period
- **Copyright / date**: "©2020 - 2025" left-aligned below heading
- **Description**: Right-aligned paragraph in muted gray
- **Grid**: 2-column layout of project cards
- **Card structure**:
  - Top strip: Project title (bold) + year "/2024" (muted) + "•••" more menu
  - Large image area: Halftone-filtered photography with white logo overlay centered
  - Cards have white background, rounded corners `16-20px`
- **Projects shown**: Sky Launch Party, USDS Takes You There, The Spark Night, Stars in the Sky: Singapore Edition, Etherealize Wall Street Report, Stars in the Sky: Cannes Edition

### 4.4 Testimonials Section

**Background**: Light gray `#f5f5f5`

```
[+ Testimonials]

Testimonials          ©2020 - 2025          5/5

[La Crypta logo]           ┌────────────┐  ┌────────────┐  ┌────────────┐
[Client icons]         │ Quote text │  │ Quote text │  │ Quote text │
Trusted by companies   │            │  │            │  │            │
with over $15B in TVL  │ [Avatar]   │  │ [Avatar]   │  │            │
                       │ Name       │  │ Name       │  │            │
                       │ Title      │  │ Title      │  │            │
                       └────────────┘  └────────────┘  └────────────┘
```

- **Label**: "+ Testimonials" with circle-plus prefix
- **Heading**: "Testimonials" giant bold text
- **Meta**: "©2020 - 2025" and "5/5" rating
- **Trust badge** (left column): La Crypta logo, row of client app icons, "Trusted by companies with over $15 billion in TVL"
- **Quote cards**: 3-column layout, white cards with:
  - Large quote text (16-18px, bold, black)
  - Avatar image (circular, small ~40px)
  - Name (bold)
  - Title/company (muted gray)
- **Subtitle**: "We are a boutique navy seal team dedicated to special missions"

### 4.5 Services Section

**Background**: Dark `#121212`, container has large rounded top corners

```
┌──────────────────────────────────────────────────────────────┐
│ [+ What we do]                                     (4)       │
│                                                              │
│ Services.                                                    │
│                                                              │
│ (001) IRL Experiences                                        │
│       We design and run your conferences...                  │
│       [IRL Experiences — tag/label]                          │
│ ──────────────────────────────────────────                   │
│ (002) Social Media Campaigns                                 │
│       We understand your audience...                         │
│ ──────────────────────────────────────────                   │
│ (003) Content                                                │
│       We produce creative campaigns...                       │
│ ──────────────────────────────────────────                   │
│ (004) Branding                                               │
│       We design your brand identity...                       │
│                                                              │
│ [Have questions?  Have questions?] — link/CTA                │
│                                                              │
│ [dark gradient background image at bottom]                   │
└──────────────────────────────────────────────────────────────┘
```

- **Container**: Dark bg with rounded top corners (~24-32px), creating a "card" effect within the light page
- **Label**: "+ What we do" with circle-plus prefix, white text
- **Count**: "(4)" on the right
- **Heading**: "Services." giant bold white text
- **Items**: Numbered list with:
  - Index: "(001)", "(002)" etc in monospace/gray
  - Service name: Bold, white, ~20-24px
  - Description: Gray text below, 16px
  - Service label/tag: Repeated name as a small label
  - Divider: Subtle horizontal line between items
- **CTA**: "Have questions?" text repeated (hover animation effect), links to contact
- **Bottom**: Dark gradient image overlay at section bottom

### 4.6 Approach / Philosophy Section

**Background**: Light gray `#f5f5f5`

```
Every project we take on is          Our approach is direct: we
designed for long-term success.       design experiences people
                                      remember. Every project is
                                      built to make people feel

                                      We build moments, stories,
                                      and systems that mean
                                      something to the audiences
                                      they're made for

                                      [To Experiences ●] button
```

- **Layout**: 2-column — small text left, large animated/faded text right
- **Left**: Small bold text, below La Crypta logo
- **Right**: Large text with word-by-word fade-in animation effect (text appears progressively as you scroll)
- **CTA**: "To Experiences" dark pill button with dot
- **Below**: "Our clients (2020 - 2025©)" label with client cards row (same as section 4.2)

### 4.7 Case Study Section

**Background**: White card on light gray

- **Labels**: "Case study", "Intellectual Property", "Live website" link
- **Heading**: "From zero to millions. We did it all."
- **Quote**: Blockquote with testimonial, attributed to "Vivek Raman. CEO, Etherealize"
- **Stats grid**:
  - "5 Production days" — "All created by our internal team."
  - "0M+ / +30% Total impression"
  - "+1k creators joined"
  - "+8% engagement rate"
  - "+400 content submissions"
- **Dark gradient image** as background

### 4.8 Team Section

**Background**: Light gray `#f5f5f5`, white card container

```
The faces behind the projects.

Work with us.                        [Description paragraph]
If you're ready to create
and collaborate, we'd love
to hear from you.

[Team member cards — horizontal scrollable row]
┌──────────┐ ┌──────────┐ ┌──────────┐ ...
│ [Photo]  │ │ [Photo]  │ │ [Photo]  │
│ CEO      │ │ COO      │ │ CFO      │
│ at La Crypta  │ │ at La Crypta  │ │ at La Crypta  │
│ Name     │ │ Name     │ │ Name     │
└──────────┘ └──────────┘ └──────────┘
```

- **Heading**: "The faces behind the projects." — large bold, word-by-word layout
- **Sub-section**: "Work with us." bold + description text
- **Team grid**: Horizontal row of member cards, each containing:
  - Halftone-filtered portrait photo (circular or rounded)
  - Role title (bold, small)
  - "at La Crypta" (muted)
  - Full name (bold, larger)
- **Members**: CEO, COO, CFO, Marketing Lead, PR Manager, Community Manager, Operations Manager, Tech Lead, Team Lead

### 4.9 Contact Section (Inline)

**Background**: Dark `#121212`, full-width dark container with halftone imagery

```
┌──────────────────────────────────────────────────────────────┐
│ [Halftone background imagery — abstract/isometric design]    │
│                                                              │
│ ┌──────────────────┐                                         │
│ │ Have a project   │    Tell us about                        │
│ │   in mind?       │      your next experience.              │
│ │                  │                                         │
│ │ Your name* _____ │    Quick response.                      │
│ │ E-mail*   _____ │    If you're ready to create...          │
│ │ Message   _____ │                                         │
│ │                  │    Clear next steps.                     │
│ │ [Send Message]   │    After the consultation...             │
│ │                  │                                         │
│ │ By submitting... │    ┌─────────────────┐                  │
│ └──────────────────┘    │ [Photo] Title    │                  │
│                         │         at La Crypta  │                  │
│                         │  Emilia Senna    │                  │
│ [La Crypta logo]             │  [Let's talk ●]  │                  │
│                         └─────────────────┘                  │
└──────────────────────────────────────────────────────────────┘
```

- **Container**: Dark bg with halftone background imagery (abstract/isometric pattern)
- **Form card** (left): Semi-transparent/glassmorphism card containing:
  - "Have a project in mind?" heading
  - 3 input fields: Your name*, E-mail*, Message
  - Input style: Underline-only (no borders, no bg), white text, gray placeholder
  - "Send Message" button — dark semi-transparent pill
  - Legal text: "By submitting, you agree to our Terms and Privacy Policy."
- **Info panel** (right):
  - "Let's talk." heading
  - "Tell us about your next experience." description
  - "Quick response." + explanation
  - "Clear next steps." + explanation
  - Floating contact card (Emilia Senna) — same component as hero

---

## 5. Subpage Layouts

### 5.1 About Page (`/about`)

```
[Giant "About Us." heading — 120-160px, full-width]

[+ About us]    We're a creative company focused    Just real impact.
                on brand, campaigns, and experiences.
                From gtm to global events...

[Client icon row]  Trusted by companies with over $15B in TVL

[Full-width halftone team photo — rounded corners]

20m                30+               5,000+            15+
Social impressions  Talks, panels    People engaged    Experiential
generated by        and content      through live      activations
content campaigns   pieces produced  experiences       worldwide

────────────────────────────────────────────────────────

[La Crypta logo]    Our approach is direct: we design
               experiences people remember...

Every project  We build moments, stories, and systems
we take on is  that mean something to the audiences
designed for   they're made for
long-term
success.       [To Experiences ●]

[+ Our clients]  [(2020 - 2025©)]
[Client logo cards row — same as home]
```

- **Stats row**: 4 columns, each with giant bold number + description below in gray
- **Halftone photo**: Full-width team photo with dithered effect, `border-radius: 16-20px`

### 5.2 Projects Page (`/projects`)

```
Projects.                    (2016-25©)
                             We've helped businesses across
                             industries achieve their goals.

[Search... ____]  [Category ▾]

┌────────────────────────┐  ┌────────────────────────┐
│ Sky Launch Party /2024 │  │ USDS Takes You... /2025│
│ [halftone image]  •••  │  │ [halftone image]  •••  │
└────────────────────────┘  └────────────────────────┘
┌────────────────────────┐  ┌────────────────────────┐
│ The Spark Night  /2024 │  │ Stars in the Sky /2025 │
│ [halftone image]  •••  │  │ [halftone image]  •••  │
└────────────────────────┘  └────────────────────────┘
```

- **Search**: Minimal input with placeholder "Search...", underline style, on white bg card
- **Category filter**: Dropdown with "Category" label + chevron
- **Grid**: 2-column project cards (same design as home experiences section)

### 5.3 Contact Page (`/contact`)

```
[Giant "Get in touch." heading — 120-160px]

Have a project in mind?              Your name* _______________
Reach out to us, and we'll           Email*     _______________
discuss the best way to              Your message ______________
move forward.                        ─
                                     [Submit ●]
[Client icons]                       By submitting, you agree to
Trusted by companies with            our Terms and Privacy Policy.
over $15B in TVL
```

- **Layout**: 2-column — info/trust left, form right
- **Form**: Cleaner version (no glassmorphism, light bg)
- **Inputs**: Underline-only style, gray placeholder text
- **Button**: "Submit" dark pill with white dot

### 5.4 404 Page

```
              404
    Looks like you took a wrong turn.
    Let's take you back where things make sense.

              [Go back home ●]
```

- **Centered layout**, vertically and horizontally
- **"404"**: Giant bold number
- **Message**: Friendly, two lines
- **Button**: "Go back home" dark pill with dot

---

## 6. Component Library

### 6.1 Primary Button (Dark Pill)

```
┌──────────────────┐
│  Label text   ●  │
└──────────────────┘
```

- **Background**: `#0a0a0a` / `#171717` (near-black)
- **Text**: White, 14-16px, medium weight
- **Shape**: Fully rounded pill (`border-radius: 50px`)
- **Icon**: Small white circle/dot (`●`) on the right side, ~8px diameter
- **Padding**: `12px 24px`
- **Hover**: Subtle brightness increase or scale
- **Variants**: "Let's talk", "To Experiences", "Submit", "Send Message", "Go back home"

### 6.2 Floating Contact Card

```
┌─────────────────────────────┐
│ ┌─────────┐  Role Title     │
│ │ [Photo] │  at La Crypta        │
│ │ halftone│                  │
│ │         │  Full Name       │
│ └─────────┘                  │
│  ┌────────────────┐          │
│  │ Let's talk  ●  │          │
│  └────────────────┘          │
└─────────────────────────────┘
```

- **Background**: White `#ffffff`
- **Border-radius**: `16px`
- **Shadow**: None or very subtle
- **Photo**: Square with rounded corners, halftone-filtered, left side
- **Text**: Role (bold, small), "at La Crypta" (muted), Name (bold, larger)
- **CTA**: "Let's talk" dark pill button
- **Usage**: Appears in hero (bottom-right) and contact section (bottom-right), linked to `/contact`

### 6.3 Project Card

```
┌──────────────────────────────┐
│ Project Name    /2024    ••• │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │   [halftone image with   │ │
│ │    white logo overlay]   │ │
│ │                          │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- **Background**: White `#ffffff`
- **Border-radius**: `16-20px`
- **Header row**: Project name (bold, 16-18px) + year in muted gray + "•••" options icon
- **Image**: Large area, halftone-filtered photo with centered white brand logo overlay
- **Image border-radius**: Matches card inner radius
- **Hover**: Likely subtle scale or shadow transition

### 6.4 Client Logo Card

```
┌────────────────┐
│  [icon] Name   │
└────────────────┘
```

- **Background**: White `#ffffff`
- **Border-radius**: `12-16px`
- **Content**: Client logo (icon + wordmark), centered, black on white
- **Size**: ~180-240px wide, ~80-100px tall

### 6.5 Testimonial Quote Card

```
┌──────────────────────────┐
│                          │
│ "Quote text here in      │
│ bold, quite large,       │
│ filling the card..."     │
│                          │
│ [●] Name                 │
│     Title - Company      │
└──────────────────────────┘
```

- **Background**: White `#ffffff`
- **Border-radius**: `16px`
- **Quote text**: Bold, 16-18px, `#171717`
- **Avatar**: Small circular image (~36-40px)
- **Name**: Bold, 14-16px
- **Title**: Muted gray, 13-14px

### 6.6 Stats Number

```
20m
Social impressions generated
by content campaigns
```

- **Number**: Giant bold, 60-80px, `#171717`
- **Description**: Small muted gray, 13-14px, 2-3 lines

### 6.7 Service Item (Accordion-style)

```
(001)  Service Name
       Description text in muted gray.
       [Service Name — label tag]
───────────────────────────────────────
```

- **Index**: Monospace parenthesized number, muted gray
- **Name**: Bold, white (on dark bg), 20-24px
- **Description**: Regular, muted gray, 14-16px
- **Label**: Repeated service name as small tag/badge
- **Divider**: Subtle horizontal line below

### 6.8 Section Label

```
[+] Label Text
```

- **"+" icon**: Circle with plus inside, small (~16-20px)
- **Text**: Regular weight, 14-16px, muted or dark depending on section bg
- **Usage**: "About us", "Our clients", "Testimonials", "What we do"

### 6.9 Form Input (Underline Style)

```
Label*
[placeholder text________________]
```

- **Label**: Small bold text above, 13-14px
- **Input**: No border, no background, underline-only at bottom
- **Underline color**: `#e5e5e5` (rest) / `#171717` (focus)
- **Placeholder**: Muted gray `#737373`
- **Text**: `#171717` (light bg) or `#ffffff` (dark bg)

### 6.10 Decorative Cross Markers

```
+              +              +              +
```

- Small `+` characters scattered horizontally or in grid patterns
- Color: `#e5e5e5` or `rgba(255,255,255,0.3)` on dark bg
- Used as visual rhythm/grid indicators between sections

---

## 7. Interaction Patterns

### 7.1 Scroll-Driven Animations

- **Text reveal**: Words in the approach/philosophy section appear to fade in progressively as the user scrolls, creating a typewriter-like reading experience
- **Section entrance**: Sections likely fade-in or slide-up on scroll (standard Framer scroll animations)
- **Parallax hints**: Background images may have subtle parallax movement

### 7.2 Hover States

- **Buttons**: Subtle brightness/scale increase
- **Project cards**: Possible subtle lift or shadow appearance
- **Navigation links**: Underline animation or opacity change
- **"Have questions?"**: Text appears duplicated (shadow text that shifts on hover)
- **"Let's talk"**: Button text + dot shift animation
- **"Send Message"**: Same dual-text hover pattern

### 7.3 Scroll Behavior

- Sections occupy large vertical spaces with generous padding
- No snap-scrolling — smooth native scroll
- Sticky header follows scroll
- Content loads progressively (images, text)

### 7.4 Navigation Pattern

- **Desktop**: Horizontal text links in sticky header
- **Mobile**: Hamburger menu (2-3 lines) opens full-screen nav overlay with: Home, About Us, Experiences, Contact — stacked vertically, plus email and copyright
- **Hidden mobile nav** also includes "openclaw@lacrypta.ar" and "© 2025 La Crypta"

---

## 8. Image Treatment: Halftone/Dither Filter

This is the **signature visual element** of the entire site. Every photograph is processed with a halftone dot-matrix / dithered effect that gives images a retro newspaper print look.

### Characteristics

- **Black and white only** — no color in any photo
- **Dot pattern**: Visible circular dots at different sizes simulating grayscale tones
- **Higher contrast**: Shadows become pure black, highlights become white/light gray
- **Application**: Team photos, event photos, project images, background imagery
- **CSS/Tech**: Likely applied via CSS filter combination, SVG filter, or pre-processed images. Can be replicated with:
  - CSS: `filter: grayscale(100%) contrast(1.2)` + SVG `<feTurbulence>` filter
  - Canvas: Floyd-Steinberg dithering algorithm
  - Pre-processed: Photoshop halftone pattern filter

### Implementation suggestion for clone

```css
.halftone-image {
  filter: grayscale(100%) contrast(1.3);
  /* Combine with an SVG filter or CSS mix-blend-mode for dot pattern */
}
```

Or use a CSS-only halftone trick with radial-gradient overlay.

---

## 9. Key Differences from Luma (docs/OVERVIEW.md)

| Aspect         | Luma (OVERVIEW.md)                                    | La Crypta (this doc)                             |
| -------------- | ----------------------------------------------------- | ------------------------------------------------ |
| Color scheme   | Dark theme with colored accents (green, purple, pink) | Pure monochrome (black, white, grays only)       |
| Typography     | Mix of serif + sans-serif, moderate sizes             | Giant bold Inter only, extreme sizes             |
| Photography    | Full color, normal                                    | Halftone/dithered, B&W only                      |
| Layout density | Dense, data-rich dashboards                           | Sparse, editorial, lots of whitespace            |
| UI Components  | Complex (toggles, progress bars, badges)              | Minimal (buttons, cards, forms)                  |
| Purpose        | Event management app (functional)                     | Agency portfolio/landing (presentational)        |
| Background     | Dark navy/charcoal dominant                           | Light gray `#f5f5f5` dominant with dark sections |
| Interactions   | Tab-based navigation, form controls                   | Scroll-driven, section-based                     |
