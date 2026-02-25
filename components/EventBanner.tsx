"use client";

import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { theme } from '../lib/theme';

const LUMA_URL = 'https://luma.com/rm5v3k5r';

export function EventBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.inner}>
        <span style={styles.emoji}>🦞🇦🇷</span>
        <span style={styles.text}>{t.banner.text}</span>
        <a
          href={LUMA_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.cta}
        >
          {t.banner.cta} →
        </a>
        <button
          style={styles.close}
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    position: 'fixed',
    top: theme.spacing.navHeight,
    left: 0,
    right: 0,
    background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
    zIndex: 999,
    padding: '10px 24px',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    maxWidth: theme.spacing.container,
    margin: '0 auto',
    flexWrap: 'wrap' as const,
  },
  emoji: {
    fontSize: 18,
  },
  text: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: 700,
  },
  cta: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: 700,
    textDecoration: 'none',
    background: 'rgba(255, 255, 255, 0.2)',
    padding: '4px 14px',
    borderRadius: 20,
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  close: {
    position: 'absolute' as const,
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    cursor: 'pointer',
    padding: 4,
  },
};
