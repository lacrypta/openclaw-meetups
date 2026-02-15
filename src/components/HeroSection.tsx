import { useTranslation } from "../i18n/useTranslation";
import { useIsMobile } from "../hooks/useMediaQuery";
import { getNextFirstThursday } from "../hooks/useRsvp";
import { theme } from "../lib/theme";

export function HeroSection() {
  const { t, lang } = useTranslation();
  const isMobile = useIsMobile();
  const nextDate = getNextFirstThursday();

  const formattedDate = nextDate.toLocaleDateString(
    lang === "es" ? "es-AR" : "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <section
      style={{
        ...styles.hero,
        paddingTop: theme.spacing.navHeight + (isMobile ? 40 : 80),
        minHeight: "100vh",
      }}
    >
      <div style={styles.bgGlow} />
      <div
        style={{ ...styles.content, padding: isMobile ? "0 20px" : "0 40px" }}
      >
        <div style={styles.logoRow}>
          <img
            src='/openclaw-logo.png'
            alt='OpenClaw'
            style={styles.heroLogo}
          />
          <span style={styles.logoX}>x</span>
          <img
            src='/lacrypta-logo.png'
            alt='La Crypta'
            style={styles.heroLogo}
          />
        </div>
        <h1
          style={{
            ...styles.title,
            fontSize: isMobile ? 36 : 56,
          }}
        >
          {t.hero.title}
        </h1>
        <p
          style={{
            ...styles.subtitle,
            fontSize: isMobile ? 18 : 24,
          }}
        >
          {t.hero.subtitle}
        </p>
        <p style={styles.tagline}>{t.hero.tagline}</p>

        <div style={styles.dateCard}>
          <span style={styles.dateLabel}>{t.hero.nextMeetup}</span>
          <span style={styles.dateValue}>{formattedDate}</span>
          <span style={styles.dateTime}>19:00 hs (ART)</span>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: theme.colors.background,
    overflow: "hidden",
  },
  bgGlow: {
    position: "absolute",
    top: "30%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 600,
    height: 600,
    borderRadius: "50%",
    background: `radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(255, 140, 0, 0.05) 50%, transparent 70%)`,
    pointerEvents: "none",
  },
  content: {
    position: "relative",
    zIndex: 1,
    textAlign: "center" as const,
    maxWidth: 800,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 16,
  },
  heroLogo: {
    width: 64,
    height: 64,
    objectFit: "contain" as const,
  },
  logoX: {
    fontSize: 24,
    fontWeight: 700,
    color: theme.colors.textDim,
  },
  title: {
    color: theme.colors.text,
    fontWeight: 800,
    lineHeight: 1.1,
    margin: "0 0 8px",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontWeight: 400,
    margin: "0 0 12px",
  },
  tagline: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    margin: "0 0 40px",
  },
  dateCard: {
    display: "inline-flex",
    flexDirection: "column" as const,
    gap: 4,
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    padding: "20px 32px",
    marginBottom: 32,
  },
  dateLabel: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  dateValue: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: 700,
    textTransform: "capitalize" as const,
  },
  dateTime: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: 600,
  },
};
