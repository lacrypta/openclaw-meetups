import { useTranslation } from "../i18n/useTranslation";
import { useIsMobile } from "../hooks/useMediaQuery";
import { theme } from "../lib/theme";
import meetupConfig from "../config/meetup.json";

export function ScheduleSection() {
  const { t, lang } = useTranslation();
  const isMobile = useIsMobile();
  const nextDate = new Date(meetupConfig.nextMeetupDate);

  const formattedDate = nextDate.toLocaleDateString(
    lang === "es" ? "es-AR" : "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const agendaItems = [
    { 
      time: "19:00", 
      label: lang === "es" ? "Puertas abiertas" : "Doors open", 
      speaker: "",
      icon: "🚪" 
    },
    { 
      time: "20:00", 
      label: lang === "es" ? "Bienvenida + La Crypta" : "Welcome + La Crypta", 
      speaker: "Agustin Kassis",
      icon: "👋" 
    },
    { 
      time: "20:05", 
      label: lang === "es" ? "Introducción a OpenClaw" : "Introduction to OpenClaw", 
      speaker: "Cami Velasco",
      icon: "🦞" 
    },
    { 
      time: "20:20", 
      label: lang === "es" ? "Experiencia construyendo con OpenClaw" : "Building with OpenClaw", 
      speaker: "Agustin Kassis",
      icon: "⚡" 
    },
    { 
      time: "20:35", 
      label: lang === "es" ? "Charla iterativa con el público" : "Interactive talk with audience", 
      speaker: "Camila Velasco & Agustin Kassis",
      icon: "💬" 
    },
    { 
      time: "21:00", 
      label: lang === "es" ? "Charlas de 10-15 min + Workshop" : "10-15 min talks + Workshop", 
      speaker: lang === "es" ? "El público" : "The audience",
      icon: "🎤" 
    },
  ];

  return (
    <section id='schedule' style={styles.section}>
      <div
        style={{
          ...styles.inner,
          maxWidth: theme.spacing.container,
          padding: isMobile ? "0 20px" : "0 40px",
        }}
      >
        <h2 style={styles.sectionTitle}>{t.schedule.title}</h2>

        <div
          style={{
            ...styles.grid,
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          }}
        >
          <div style={styles.infoCard}>
            <div style={styles.eventBadge}>
              {lang === "es" ? "Primer Meetup en Argentina" : "First Meetup in Argentina"}
            </div>
            <div style={styles.nextDate}>
              <span style={styles.nextLabel}>{t.schedule.nextDate}</span>
              <span style={styles.nextValue}>{formattedDate}</span>
              <span style={styles.nextTime}>19:00 - 22:00 hs (ART)</span>
            </div>
            <div style={styles.freeTag}>✓ {t.schedule.free}</div>
            <div style={styles.capacityBox}>
              <span style={styles.capacityNumber}>20</span>
              <span style={styles.capacityLabel}>
                {lang === "es" ? "lugares disponibles de 100" : "spots available of 100"}
              </span>
            </div>
          </div>

          <div style={styles.agendaCard}>
            <h3 style={styles.agendaTitle}>
              {lang === "es" ? "Itinerario" : "Schedule"}
            </h3>
            <div style={styles.timeline}>
              {agendaItems.map((item, i) => (
                <div key={i} style={styles.timelineItem}>
                  <div style={styles.timelineDot} />
                  {i < agendaItems.length - 1 && (
                    <div style={styles.timelineLine} />
                  )}
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineHeader}>
                      <span style={styles.timelineTime}>{item.time}</span>
                      <span style={styles.timelineIcon}>{item.icon}</span>
                      <span style={styles.timelineLabel}>{item.label}</span>
                    </div>
                    {item.speaker && (
                      <span style={styles.timelineSpeaker}>— {item.speaker}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    padding: `${theme.spacing.section}px 0`,
    background: theme.colors.cardBg,
  },
  inner: {
    margin: "0 auto",
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: 800,
    textAlign: "center" as const,
    marginBottom: 48,
  },
  grid: {
    display: "grid",
    gap: 24,
  },
  infoCard: {
    background: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 16,
    padding: 32,
    display: "flex",
    flexDirection: "column" as const,
    gap: 24,
    alignItems: "center",
    textAlign: "center" as const,
  },
  eventBadge: {
    background: theme.colors.primary,
    color: theme.colors.text,
    padding: "10px 24px",
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  nextDate: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  nextLabel: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  nextValue: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: 700,
    textTransform: "capitalize" as const,
  },
  nextTime: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: 600,
  },
  freeTag: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: 600,
  },
  capacityBox: {
    background: "linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)",
    padding: "16px 24px",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 4,
  },
  capacityNumber: {
    color: "#fff",
    fontSize: 32,
    fontWeight: 800,
  },
  capacityLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: 500,
  },
  agendaCard: {
    background: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 16,
    padding: 32,
  },
  agendaTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 24,
  },
  timeline: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 0,
  },
  timelineItem: {
    position: "relative" as const,
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    paddingLeft: 20,
    paddingBottom: 20,
  },
  timelineDot: {
    position: "absolute" as const,
    left: 0,
    top: 6,
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: theme.colors.primary,
  },
  timelineLine: {
    position: "absolute" as const,
    left: 4,
    top: 18,
    width: 2,
    height: "calc(100% - 12px)",
    background: theme.colors.border,
  },
  timelineContent: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  timelineHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  timelineTime: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: theme.fonts.mono,
    minWidth: 44,
  },
  timelineIcon: {
    fontSize: 16,
  },
  timelineLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: 600,
  },
  timelineSpeaker: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontStyle: "italic" as const,
    marginLeft: 52,
  },
};
