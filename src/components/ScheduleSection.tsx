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
    { time: "19:00", label: t.schedule.welcome, icon: "👋" },
    { time: "19:30", label: t.schedule.talks, icon: "⚡" },
    { time: "20:15", label: t.schedule.workshop, icon: "🦞" },
    { time: "21:00", label: t.schedule.networking, icon: "🤝" },
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
            <div style={styles.recurringBadge}>{t.schedule.recurring}</div>
            <div style={styles.nextDate}>
              <span style={styles.nextLabel}>{t.schedule.nextDate}</span>
              <span style={styles.nextValue}>{formattedDate}</span>
              <span style={styles.nextTime}>{t.schedule.time}</span>
            </div>
            <div style={styles.freeTag}>✓ {t.schedule.free}</div>
          </div>

          <div style={styles.agendaCard}>
            <h3 style={styles.agendaTitle}>{t.schedule.agenda}</h3>
            <div style={styles.timeline}>
              {agendaItems.map((item, i) => (
                <div key={i} style={styles.timelineItem}>
                  <div style={styles.timelineDot} />
                  {i < agendaItems.length - 1 && (
                    <div style={styles.timelineLine} />
                  )}
                  <span style={styles.timelineTime}>{item.time}</span>
                  <span style={styles.timelineIcon}>{item.icon}</span>
                  <span style={styles.timelineLabel}>{item.label}</span>
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
  recurringBadge: {
    background: theme.colors.primary,
    color: theme.colors.text,
    padding: "8px 20px",
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 700,
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
    alignItems: "center",
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
  timelineTime: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: theme.fonts.mono,
    minWidth: 44,
  },
  timelineIcon: {
    fontSize: 18,
  },
  timelineLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: 500,
  },
};
