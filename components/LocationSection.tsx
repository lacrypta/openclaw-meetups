"use client";

import { useTranslation } from '../i18n/useTranslation';
import { useIsMobile } from '../hooks/useMediaQuery';
import { theme } from '../lib/theme';

export function LocationSection() {
  const { t, lang } = useTranslation();
  const isMobile = useIsMobile();

  const googleMapsUrl = "https://www.google.com/maps/search/?api=1&query=Villanueva+1367+Buenos+Aires+Argentina";

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
            <p style={styles.address}>📍 Villanueva 1367</p>
            <p style={styles.venueDetail}>{t.location.neighborhood}, {t.location.city}</p>
            <p style={styles.venueDirections}>
              {lang === "es" 
                ? "Barrio Belgrano, a pasos de la estación Juramento (Línea D)"
                : "Belgrano neighborhood, steps from Juramento station (Line D)"}
            </p>
            <div style={styles.btnGroup}>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.mapsBtn}
              >
                🗺️ {lang === "es" ? "Abrir en Google Maps" : "Open in Google Maps"}
              </a>
              <a
                href="https://lacrypta.ar"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.websiteBtn}
              >
                {t.location.visitWebsite} →
              </a>
            </div>
          </div>

          <div style={styles.mapCard}>
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <img 
                src="https://files.catbox.moe/65txy5.jpg" 
                alt="Mapa La Crypta Belgrano"
                style={styles.mapImage}
              />
            </a>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.mapLink}
            >
              {lang === "es" ? "Ver en Google Maps" : "View on Google Maps"} →
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
  address: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: 700,
    margin: '8px 0',
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
  btnGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    marginTop: 16,
  },
  mapsBtn: {
    display: 'inline-block',
    padding: '12px 20px',
    background: '#4285f4',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  websiteBtn: {
    display: 'inline-block',
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
  mapImage: {
    width: '100%',
    height: 300,
    objectFit: 'cover' as const,
    display: 'block',
    cursor: 'pointer',
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
