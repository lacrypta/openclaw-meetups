import type { Translations } from "./types";

export const es: Translations = {
  banner: {
    text: "Primer OpenClaw Meetup en Argentina!",
    cta: "Registrate en Luma",
  },
  nav: {
    about: "Acerca",
    schedule: "Agenda",
    location: "Lugar",
    rsvp: "Asistir",
    login: "Conectar",
    logout: "Salir",
  },
  hero: {
    title: "OpenClaw Meetups",
    subtitle: "en La Crypta, Buenos Aires",
    tagline: "Tu asistente de IA personal, open-source y local",
    nextMeetup: "Proximo meetup",
    ctaLogin: "Vení al primer evento",
    ctaRsvp: "Confirmar asistencia",
  },
  about: {
    title: "Sobre el Meetup",
    openclawTitle: "Que es OpenClaw?",
    openclawDesc:
      "OpenClaw es un asistente de IA personal y open-source que corre localmente en tu maquina. Soporta multiples canales como WhatsApp, Telegram, Slack y mas. Tu datos, tu IA, tu control.",
    lacryptaTitle: "Que es La Crypta?",
    lacryptaDesc:
      "La Crypta es una organizacion argentina dedicada al desarrollo, educacion y difusion de los ecosistemas Bitcoin y Nostr. Ubicada en Belgrano, Buenos Aires, es un espacio comunitario para la libertad tecnologica.",
    whyTitle: "Por que estos meetups?",
    whyDesc:
      "Combinamos IA open-source con tecnologia soberana. Aprende a usar OpenClaw, comparte experiencias, y conecta con la comunidad de IA y Bitcoin en Buenos Aires.",
  },
  schedule: {
    title: "Agenda",
    recurring: "1 encuentro mensual",
    time: "19:00 hs (ART)",
    nextDate: "Proximo encuentro",
    agenda: "Programa tipico",
    welcome: "Bienvenida y novedades",
    talks: "Introducción a OpenClaw",
    workshop: "Taller hands-on con OpenClaw",
    networking: "Networking y debate abierto",
    free: "Gratis y abierto a todos",
  },
  location: {
    title: "Ubicacion",
    name: "La Crypta",
    neighborhood: "Belgrano",
    city: "Buenos Aires, Argentina",
    directions: "Belgrano, Buenos Aires. Visitas los martes por la tarde.",
    visitWebsite: "Ver sitio web",
  },
  rsvp: {
    title: "Confirmar Asistencia",
    loginPrompt: "Conecta con Nostr para confirmar tu asistencia",
    loginDesc:
      "Usamos Nostr para la identidad. Conecta con tu extension (Alby, nos2x), bunker o nsec.",
    attending: "Vas a asistir!",
    confirmAttend: "Voy a asistir",
    cancelAttend: "Cancelar asistencia",
    confirmed: "Asistencia confirmada",
  },
  footer: {
    openSource: "Proyecto open-source",
    builtWith: "Hecho con Nostr y open-source",
    rights: "La Crypta x OpenClaw",
  },
  login: {
    title: "Nostr + Lightning",
    subtitle: "Conecta tu identidad",
    extensionTab: "Extension",
    bunkerTab: "Bunker",
    nsecTab: "nsec",
    extensionDetected:
      "Extension NIP-07 detectada. Conecta con Alby, nos2x u otra.",
    extensionNotFound: "No se detecto extension NIP-07. Instala Alby o nos2x.",
    bunkerDesc: "Login remoto via NIP-46 (nsecBunker)",
    nsecWarning: "Solo para desarrollo. No uses tu nsec principal.",
    connecting: "Conectando...",
    connectExtension: "Conectar con extension",
    connectBunker: "Conectar con Bunker",
    loginNsec: "Login con nsec",
  },
  profile: {
    searching: "Buscando perfil en relays...",
    noProfile: "No se encontro perfil (kind:0) en los relays.",
    logout: "Cerrar sesion",
  },
};
