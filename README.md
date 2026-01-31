# ⚡ Nostr + Lightning Boilerplate

Webapp boilerplate con React + TypeScript + Vite para autenticación Nostr y Lightning.

## Features

- **3 métodos de login:**
  - 🔌 **NIP-07** — Extensión del browser (Alby, nos2x)
  - 🔐 **nsecBunker** — Login remoto via NIP-46
  - 🔑 **nsec directo** — Para desarrollo (con warning de seguridad)
- **Perfil Nostr** — Busca kind:0 en múltiples relays
- **Dark mode** — Diseño navy/amber/electric
- **Lightning ready** — Muestra lud16 (Lightning address) del perfil

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Estructura

```
src/
├── App.tsx                    # Routing login/profile
├── components/
│   ├── LoginScreen.tsx        # Pantalla de login con 3 métodos
│   └── ProfileView.tsx        # Vista del perfil Nostr
├── hooks/
│   ├── useNostr.ts            # Hook de conexión Nostr
│   └── useProfile.ts          # Hook para buscar perfil
└── lib/
    └── nostr.ts               # Utilidades Nostr (relays, fetch, etc.)
```

## Relays

- `wss://relay.damus.io`
- `wss://relay.nostr.band`
- `wss://nos.lol`
- `wss://relay.lacrypta.ar`

## Qué agregar

- [ ] Zaps (NIP-57) — enviar Lightning payments via Nostr
- [ ] Publicar notas (kind:1)
- [ ] Feed de notas
- [ ] NIP-46 completo con handshake
- [ ] Gestión de relays del usuario
- [ ] Firma de eventos con NIP-07

## Tech Stack

- React 19 + TypeScript
- Vite
- nostr-tools

## License

MIT
