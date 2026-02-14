import { useTranslation } from '../i18n/useTranslation';
import { useIsMobile } from '../hooks/useMediaQuery';
import { theme } from '../lib/theme';

export function LocationSection() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <section id="location" style={styles.section}>
      <div
        style={{
          ...styles.inner,
          maxWidth: theme.spacing.container,
          padding: isMobile ? '0 20px' : '0 40px',
        }}
      >
        <h2 style={styles.sectionTitle}>{t.location.title}</h2>

        <div
          style={{
            ...styles.grid,
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          }}
        >
          <div style={styles.infoCard}>
            <div style={styles.venueIcon}>⚡</div>
            <h3 style={styles.venueName}>{t.location.name}</h3>
            <p style={styles.venueDetail}>{t.location.neighborhood}</p>
            <p style={styles.venueDetail}>{t.location.city}</p>
            <p style={styles.venueDirections}>{t.location.directions}</p>
            <a
              href="https://lacrypta.ar"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.websiteBtn}
            >
              {t.location.visitWebsite} →
            </a>
          </div>

          <div style={styles.mapCard}>
            <iframe
              title="La Crypta Location"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-58.4650%2C-34.5650%2C-58.4500%2C-34.5550&layer=mapnik&marker=-34.5600%2C-58.4575"
              style={styles.map}
              loading="lazy"
            />
            <a
              href="https://www.openstreetmap.org/?mlat=-34.5600&mlon=-58.4575#map=16/-34.5600/-58.4575"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.mapLink}
            >
              Open in OpenStreetMap →
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
    alignItems: 'start',
  },
  infoCard: {
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 16,
    padding: 32,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  venueIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  venueName: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: 800,
    margin: 0,
  },
  venueDetail: {
    color: theme.colors.textMuted,
    fontSize: 15,
    margin: 0,
  },
  venueDirections: {
    color: theme.colors.textDim,
    fontSize: 14,
    margin: '8px 0',
    lineHeight: 1.6,
  },
  websiteBtn: {
    display: 'inline-block',
    marginTop: 8,
    padding: '10px 20px',
    border: `1px solid ${theme.colors.primary}`,
    borderRadius: 8,
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border}`,
  },
  map: {
    width: '100%',
    height: 300,
    border: 0,
    display: 'block',
  },
  mapLink: {
    display: 'block',
    padding: '12px 16px',
    background: theme.colors.cardBg,
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
};
