"use client";

import { useTranslation } from "../i18n/useTranslation";
import { useIsMobile } from "../hooks/useMediaQuery";
import { theme } from "../lib/theme";
import talksData from "../config/talks.json";

interface Speaker {
  name: string;
  alias: string;
  avatar: string;
  twitter: string;
  github: string;
  nostr: string;
}

interface Talk {
  id: string;
  speaker: Speaker;
  title: string;
  duration: number;
  confirmed: boolean;
  order: number;
}

function calculateTalkTimes(startTime: string, talks: Talk[]): { talk: Talk; time: string }[] {
  const sortedTalks = [...talks].sort((a, b) => a.order - b.order);
  const [startHour, startMinute] = startTime.split(":").map(Number);
  
  let currentMinutes = startHour * 60 + startMinute;
  
  return sortedTalks.map((talk) => {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    currentMinutes += talk.duration;
    return { talk, time };
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TalksSection() {
  const { lang } = useTranslation();
  const isMobile = useIsMobile();
  
  const talksWithTimes = calculateTalkTimes(talksData.startTime, talksData.talks as Talk[]);
  const hasMoreSlots = talksData.talks.length < 6;

  return (
    <section id="talks" style={styles.section}>
      <div
        style={{
          ...styles.inner,
          maxWidth: theme.spacing.container,
          padding: isMobile ? "0 20px" : "0 40px",
        }}
      >
        <h2 style={styles.sectionTitle}>
          {lang === "es" ? "Charlas del Público" : "Community Talks"}
        </h2>
        <p style={styles.subtitle}>
          {lang === "es" 
            ? "A partir de las 21:00 — Charlas de 10-15 minutos presentadas por la comunidad"
            : "Starting at 21:00 — 10-15 minute talks presented by the community"}
        </p>

        <div style={styles.talksGrid}>
          {talksWithTimes.map(({ talk, time }) => (
            <div key={talk.id} style={styles.talkCard}>
              <div style={styles.talkTime}>{time}</div>
              <div style={styles.talkContent}>
                <div style={styles.speakerRow}>
                  {talk.speaker.avatar ? (
                    <img 
                      src={talk.speaker.avatar} 
                      alt={talk.speaker.name}
                      style={styles.avatar}
                    />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {getInitials(talk.speaker.name)}
                    </div>
                  )}
                  <div style={styles.speakerInfo}>
                    <span style={styles.speakerName}>
                      {talk.speaker.name}
                      {talk.speaker.alias && (
                        <span style={styles.speakerAlias}> ({talk.speaker.alias})</span>
                      )}
                    </span>
                    <div style={styles.socialLinks}>
                      {talk.speaker.twitter && (
                        <a 
                          href={`https://twitter.com/${talk.speaker.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.socialLink}
                        >
                          𝕏
                        </a>
                      )}
                      {talk.speaker.github && (
                        <a 
                          href={`https://github.com/${talk.speaker.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.socialLink}
                        >
                          GH
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <h3 style={styles.talkTitle}>{talk.title}</h3>
                <div style={styles.talkMeta}>
                  <span style={styles.duration}>{talk.duration} min</span>
                  {talk.confirmed && (
                    <span style={styles.confirmedBadge}>
                      {lang === "es" ? "✓ Confirmado" : "✓ Confirmed"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {hasMoreSlots && (
            <div style={styles.emptySlot}>
              <div style={styles.emptyIcon}>🎤</div>
              <p style={styles.emptyText}>
                {lang === "es" 
                  ? "¿Querés dar una charla? Anotate en el evento!"
                  : "Want to give a talk? Sign up at the event!"}
              </p>
              <span style={styles.emptyHint}>
                {lang === "es"
                  ? "Slots de 10-15 minutos disponibles"
                  : "10-15 minute slots available"}
              </span>
            </div>
          )}
        </div>

        <div style={styles.ctaBox}>
          <h3 style={styles.ctaTitle}>
            {lang === "es" ? "¿Tenés algo para compartir?" : "Have something to share?"}
          </h3>
          <p style={styles.ctaText}>
            {lang === "es"
              ? "Preparate una charla de 10-15 minutos sobre OpenClaw, Bitcoin, IA, o tu experiencia."
              : "Prepare a 10-15 minute talk about OpenClaw, Bitcoin, AI, or your experience."}
          </p>
        </div>

        <div style={styles.skillSection}>
          <h3 style={styles.skillTitle}>
            🤖 {lang === "es" ? "¿Sos un agente? Agregá tu charla via PR" : "Are you an agent? Add your talk via PR"}
          </h3>
          <p style={styles.skillDesc}>
            {lang === "es"
              ? "Si sos un agente de OpenClaw, podés agregar tu charla automáticamente enviando un Pull Request al repositorio."
              : "If you're an OpenClaw agent, you can add your talk automatically by sending a Pull Request to the repository."}
          </p>
          
          <div style={styles.codeBlock}>
            <div style={styles.codeHeader}>
              <span>SKILL.md</span>
              <a 
                href="https://github.com/lacrypta/openclaw-meetups/blob/master/src/config/talks.json"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.codeLink}
              >
                Ver talks.json →
              </a>
            </div>
            <pre style={styles.code}>{`# Agregar charla al OpenClaw Meetup

## Instrucciones para Agentes

1. Cloná el repo: lacrypta/openclaw-meetups
2. Editá src/config/talks.json
3. Agregá tu charla al array "talks":

{
  "id": "talk-XXX",
  "speaker": {
    "name": "Tu Nombre",
    "alias": "tu_alias",
    "avatar": "https://github.com/TU_USER.png",
    "twitter": "tu_twitter",
    "github": "tu_github",
    "nostr": ""
  },
  "title": "Título de tu charla",
  "duration": 10,
  "confirmed": true,
  "order": SIGUIENTE_NUMERO
}

4. Creá un PR con título: "Nueva charla: [título]"
5. El PR será revisado y mergeado`}</pre>
          </div>

          <div style={styles.skillButtons}>
            <a
              href="https://github.com/lacrypta/openclaw-meetups"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.repoBtn}
            >
              📂 {lang === "es" ? "Ver Repositorio" : "View Repository"}
            </a>
            <a
              href="https://github.com/lacrypta/openclaw-meetups/edit/master/src/config/talks.json"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.editBtn}
            >
              ✏️ {lang === "es" ? "Editar talks.json" : "Edit talks.json"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    padding: `${theme.spacing.section}px 0`,
    background: theme.colors.background,
  },
  inner: {
    margin: "0 auto",
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: 800,
    textAlign: "center" as const,
    marginBottom: 8,
  },
  subtitle: {
    color: theme.colors.textDim,
    fontSize: 16,
    textAlign: "center" as const,
    marginBottom: 48,
  },
  talksGrid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  talkCard: {
    display: "flex",
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    overflow: "hidden",
  },
  talkTime: {
    background: theme.colors.primary,
    color: theme.colors.text,
    padding: "20px 16px",
    fontFamily: theme.fonts.mono,
    fontSize: 16,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    minWidth: 70,
    justifyContent: "center",
  },
  talkContent: {
    padding: 20,
    flex: 1,
  },
  speakerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    objectFit: "cover" as const,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: theme.colors.primary,
    color: theme.colors.background,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
  },
  speakerInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  speakerName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 700,
  },
  speakerAlias: {
    color: theme.colors.textDim,
    fontWeight: 500,
  },
  socialLinks: {
    display: "flex",
    gap: 8,
  },
  socialLink: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: 600,
    textDecoration: "none",
  },
  talkTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 600,
    margin: "0 0 12px 0",
    lineHeight: 1.4,
  },
  talkMeta: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  duration: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: 500,
  },
  confirmedBadge: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: 600,
  },
  emptySlot: {
    background: theme.colors.cardBg,
    border: `2px dashed ${theme.colors.border}`,
    borderRadius: 12,
    padding: 32,
    textAlign: "center" as const,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 600,
    margin: "0 0 8px 0",
  },
  emptyHint: {
    color: theme.colors.textDim,
    fontSize: 14,
  },
  ctaBox: {
    marginTop: 32,
    background: `linear-gradient(135deg, ${theme.colors.primary}22 0%, ${theme.colors.primary}11 100%)`,
    border: `1px solid ${theme.colors.primary}44`,
    borderRadius: 12,
    padding: 24,
    textAlign: "center" as const,
  },
  ctaTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 700,
    margin: "0 0 8px 0",
  },
  ctaText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    margin: 0,
    lineHeight: 1.6,
  },
  skillSection: {
    marginTop: 32,
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    padding: 24,
  },
  skillTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 700,
    margin: "0 0 12px 0",
  },
  skillDesc: {
    color: theme.colors.textMuted,
    fontSize: 14,
    margin: "0 0 20px 0",
    lineHeight: 1.6,
  },
  codeBlock: {
    background: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
  },
  codeHeader: {
    background: theme.colors.primary,
    color: theme.colors.text,
    padding: "8px 16px",
    fontSize: 12,
    fontWeight: 600,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeLink: {
    color: theme.colors.text,
    fontSize: 11,
    textDecoration: "none",
    opacity: 0.8,
  },
  code: {
    margin: 0,
    padding: 16,
    fontSize: 12,
    fontFamily: theme.fonts.mono,
    color: theme.colors.textMuted,
    overflowX: "auto" as const,
    whiteSpace: "pre-wrap" as const,
    lineHeight: 1.5,
  },
  skillButtons: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  repoBtn: {
    display: "inline-block",
    padding: "10px 20px",
    background: "#24292e",
    borderRadius: 8,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
  },
  editBtn: {
    display: "inline-block",
    padding: "10px 20px",
    background: theme.colors.primary,
    borderRadius: 8,
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
  },
};
