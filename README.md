# OpenClaw Meetups | La Crypta Buenos Aires

Landing page for monthly OpenClaw meetups hosted at [La Crypta](https://lacrypta.ar), Belgrano, Buenos Aires, Argentina.

**Live event:** [Register on Luma](https://luma.com/rm5v3k5r)

## Features

- **Bilingual (ES/EN)** — language switcher with auto-detection and localStorage persistence
- **Nostr login** — 3 authentication methods:
  - NIP-07 browser extension (Alby, nos2x)
  - NIP-46 remote signer (nsecBunker)
  - Direct nsec (development only)
- **RSVP system** — confirm attendance after Nostr login (localStorage-based, upgradeable to NIP-52)
- **Auto-computed schedule** — next meetup date calculated automatically (first Thursday of each month)
- **Event banner** — prominent banner linking to Luma registration
- **Responsive** — mobile-first with hamburger menu
- **La Crypta branding** — dark theme with blue/amber accents

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── App.tsx                         # Landing page shell with modal login
├── main.tsx                        # Entry point with LanguageProvider
├── index.css                       # Global styles
├── i18n/
│   ├── context.ts                  # Language context definition
│   ├── LanguageContext.tsx          # LanguageProvider component
│   ├── useTranslation.ts           # useTranslation hook
│   ├── types.ts                    # Translation key types
│   ├── es.ts                       # Spanish translations
│   └── en.ts                       # English translations
├── components/
│   ├── Navbar.tsx                  # Fixed navbar with language switch + Nostr login
│   ├── EventBanner.tsx             # Luma event banner
│   ├── HeroSection.tsx             # Hero with next meetup date
│   ├── AboutSection.tsx            # About OpenClaw + La Crypta
│   ├── ScheduleSection.tsx         # Monthly schedule + agenda
│   ├── LocationSection.tsx         # La Crypta address + OpenStreetMap
│   ├── RsvpSection.tsx             # RSVP after Nostr login
│   ├── Footer.tsx                  # Links and credits
│   ├── LoginModal.tsx              # Modal wrapper for login
│   ├── LoginScreen.tsx             # Login UI with 3 Nostr methods
│   └── ProfileView.tsx             # Nostr profile display
├── hooks/
│   ├── useNostr.ts                 # Nostr auth state management
│   ├── useProfile.ts              # Profile fetching from relays
│   ├── useRsvp.ts                  # RSVP state + date computation
│   └── useMediaQuery.ts           # Responsive breakpoint hook
└── lib/
    ├── nostr.ts                    # Nostr utilities (relays, fetch, NIP-07)
    └── theme.ts                    # Design tokens (colors, spacing, fonts)
```

## Relays

- `wss://relay.damus.io`
- `wss://relay.nostr.band`
- `wss://nos.lol`
- `wss://relay.lacrypta.ar`

## Tech Stack

- React 19 + TypeScript
- Vite
- nostr-tools

## Forked From

[claudiomolt/nostr-lightning-boilerplate](https://github.com/claudiomolt/nostr-lightning-boilerplate)

## License

MIT
