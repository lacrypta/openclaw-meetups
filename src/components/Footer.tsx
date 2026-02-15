import { useTranslation } from "../i18n/useTranslation";
import { useIsMobile } from "../hooks/useMediaQuery";
import { theme } from "../lib/theme";

export function Footer() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <footer style={styles.footer}>
      <div
        style={{
          ...styles.inner,
          maxWidth: theme.spacing.container,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 32 : 48,
        }}
      >
        <div style={styles.column}>
          <h4 style={styles.columnTitle}>🦞 OpenClaw</h4>
          <a
            href='https://github.com/openclaw/openclaw'
            target='_blank'
            rel='noopener noreferrer'
            style={styles.footerLink}
          >
            GitHub
          </a>
          <a
            href='https://openclaw.ai'
            target='_blank'
            rel='noopener noreferrer'
            style={styles.footerLink}
          >
            Website
          </a>
          <span style={styles.tagline}>EXFOLIATE! EXFOLIATE!</span>
        </div>

        <div style={styles.column}>
          <h4 style={styles.columnTitle}>La Crypta</h4>
          <a
            href='https://lacrypta.ar'
            target='_blank'
            rel='noopener noreferrer'
            style={styles.footerLink}
          >
            lacrypta.ar
          </a>
          <a
            href='https://github.com/lacrypta'
            target='_blank'
            rel='noopener noreferrer'
            style={styles.footerLink}
          >
            GitHub
          </a>
          <span style={styles.tagline}>
            A revolution disguised as an investment
          </span>
        </div>

        <div style={styles.column}>
          <h4 style={styles.columnTitle}>Nostr</h4>
          <a
            href='https://nostr.com'
            target='_blank'
            rel='noopener noreferrer'
            style={styles.footerLink}
          >
            What is Nostr?
          </a>
          <a
            href='https://getalby.com'
            target='_blank'
            rel='noopener noreferrer'
            style={styles.footerLink}
          >
            Get Alby
          </a>
        </div>
      </div>

      <div style={styles.bottom}>
        <p style={styles.bottomText}>
          {t.footer.builtWith} 🦞⚡ &middot; {t.footer.rights} &middot;{" "}
          {new Date().getFullYear()}
        </p>
        <p style={styles.bottomText}>
          <a
            href='https://github.com/agustinkassis/nostr-lightning-boilerplate'
            target='_blank'
            rel='noopener noreferrer'
            style={styles.sourceLink}
          >
            {t.footer.openSource}
          </a>
        </p>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    background: theme.colors.cardBg,
    borderTop: `1px solid ${theme.colors.border}`,
    padding: "48px 24px 24px",
  },
  inner: {
    display: "flex",
    margin: "0 auto",
    justifyContent: "space-between",
  },
  column: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  columnTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
  },
  footerLink: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textDecoration: "none",
  },
  tagline: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  relay: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontFamily: theme.fonts.mono,
    marginTop: 4,
  },
  bottom: {
    borderTop: `1px solid ${theme.colors.border}`,
    marginTop: 32,
    paddingTop: 16,
    textAlign: "center" as const,
  },
  bottomText: {
    color: theme.colors.textDim,
    fontSize: 13,
    marginBottom: 4,
  },
  sourceLink: {
    color: theme.colors.primary,
    textDecoration: "none",
  },
};
