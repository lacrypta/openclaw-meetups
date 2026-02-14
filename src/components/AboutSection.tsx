import { useTranslation } from '../i18n/useTranslation';
import { useIsMobile } from '../hooks/useMediaQuery';
import { theme } from '../lib/theme';

export function AboutSection() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <section id="about" style={styles.section}>
      <div
        style={{
          ...styles.inner,
          maxWidth: theme.spacing.container,
          padding: isMobile ? '0 20px' : '0 40px',
        }}
      >
        <h2 style={styles.sectionTitle}>{t.about.title}</h2>

        <div
          style={{
            ...styles.grid,
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          }}
        >
          <div style={styles.card}>
            <div style={styles.cardIcon}>🦞</div>
            <h3 style={styles.cardTitle}>{t.about.openclawTitle}</h3>
            <p style={styles.cardText}>{t.about.openclawDesc}</p>
            <div style={styles.cardLinks}>
              <a
                href="https://github.com/openclaw/openclaw"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.cardLink}
              >
                GitHub →
              </a>
              <a
                href="https://openclaw.ai"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.cardLink}
              >
                openclaw.ai →
              </a>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardIcon}>⚡</div>
            <h3 style={styles.cardTitle}>{t.about.lacryptaTitle}</h3>
            <p style={styles.cardText}>{t.about.lacryptaDesc}</p>
            <div style={styles.cardLinks}>
              <a
                href="https://lacrypta.ar"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.cardLink}
              >
                lacrypta.ar →
              </a>
              <a
                href="https://github.com/lacrypta"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.cardLink}
              >
                GitHub →
              </a>
            </div>
          </div>
        </div>

        <div style={styles.whyCard}>
          <h3 style={styles.whyTitle}>{t.about.whyTitle}</h3>
          <p style={styles.whyText}>{t.about.whyDesc}</p>
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
    margin: '0 auto',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: 800,
    textAlign: 'center' as const,
    marginBottom: 48,
  },
  grid: {
    display: 'grid',
    gap: 24,
    marginBottom: 32,
  },
  card: {
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 16,
    padding: 32,
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 12,
  },
  cardText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 1.7,
    marginBottom: 16,
  },
  cardLinks: {
    display: 'flex',
    gap: 16,
  },
  cardLink: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
  },
  whyCard: {
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 16,
    padding: 32,
    textAlign: 'center' as const,
  },
  whyTitle: {
    color: theme.colors.secondary,
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 12,
  },
  whyText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 1.7,
    maxWidth: 600,
    margin: '0 auto',
  },
};
