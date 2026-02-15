import type { Translations } from "./types";

export const en: Translations = {
  banner: {
    text: "First OpenClaw Meetup in Argentina!",
    cta: "Register on Luma",
  },
  nav: {
    about: "About",
    schedule: "Schedule",
    location: "Location",
    rsvp: "RSVP",
    login: "Connect",
    logout: "Logout",
  },
  hero: {
    title: "OpenClaw Meetups",
    subtitle: "at La Crypta, Buenos Aires",
    tagline: "Your own personal AI assistant, open-source and local",
    nextMeetup: "Next meetup",
    ctaLogin: "Come to the event",
    ctaRsvp: "Confirm attendance",
  },
  about: {
    title: "About the Meetup",
    openclawTitle: "What is OpenClaw?",
    openclawDesc:
      "OpenClaw is an open-source personal AI assistant that runs locally on your machine. It supports multiple channels like WhatsApp, Telegram, Slack and more. Your data, your AI, your control.",
    lacryptaTitle: "What is La Crypta?",
    lacryptaDesc:
      "La Crypta is an Argentine organization dedicated to the development, education, and sharing of knowledge within the Bitcoin and Nostr ecosystems. Located in Belgrano, Buenos Aires, it is a community space for freedom tech.",
    whyTitle: "Why these meetups?",
    whyDesc:
      "We combine open-source AI with sovereign technology. Learn to use OpenClaw, share experiences, and connect with the AI and Bitcoin community in Buenos Aires.",
  },
  schedule: {
    title: "Schedule",
    recurring: "1 monthly meetup",
    time: "7:00 PM (ART)",
    nextDate: "Next meetup",
    agenda: "Typical agenda",
    welcome: "Welcome and updates",
    talks: "Lightning talks and demos",
    workshop: "Hands-on workshop with OpenClaw",
    networking: "Networking and open discussion",
    free: "Free and open to everyone",
  },
  location: {
    title: "Location",
    name: "La Crypta",
    neighborhood: "Belgrano",
    city: "Buenos Aires, Argentina",
    directions:
      "Belgrano, Buenos Aires. Open for visits on Tuesday afternoons.",
    visitWebsite: "Visit website",
  },
  rsvp: {
    title: "RSVP",
    loginPrompt: "Connect with Nostr to confirm your attendance",
    loginDesc:
      "We use Nostr for identity. Connect with your extension (Alby, nos2x), bunker, or nsec.",
    attending: "You're attending!",
    confirmAttend: "I'll be there",
    cancelAttend: "Cancel attendance",
    confirmed: "Attendance confirmed",
  },
  footer: {
    openSource: "Open-source project",
    builtWith: "Built with Nostr and open-source",
    rights: "La Crypta x OpenClaw",
  },
  login: {
    title: "Nostr + Lightning",
    subtitle: "Connect your identity",
    extensionTab: "Extension",
    bunkerTab: "Bunker",
    nsecTab: "nsec",
    extensionDetected:
      "NIP-07 extension detected. Connect with Alby, nos2x or others.",
    extensionNotFound: "No NIP-07 extension detected. Install Alby or nos2x.",
    bunkerDesc: "Remote login via NIP-46 (nsecBunker)",
    nsecWarning: "For development only. Do not use your main nsec.",
    connecting: "Connecting...",
    connectExtension: "Connect with extension",
    connectBunker: "Connect with Bunker",
    loginNsec: "Login with nsec",
  },
  profile: {
    searching: "Searching profile on relays...",
    noProfile: "No profile (kind:0) found on relays.",
    logout: "Logout",
  },
};
