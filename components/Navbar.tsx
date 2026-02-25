"use client";

import { useState } from "react";
import { useTranslation } from "../i18n/useTranslation";
import type { Language } from "../i18n/context";
import { useIsMobile } from "../hooks/useMediaQuery";
import { theme } from "../lib/theme";
import type { NostrProfile } from "../lib/nostr";

interface Props {
  pubkey: string | null;
  profile: NostrProfile | null;
  onLoginClick: () => void;
  onLogout: () => void;
  dashboardHref?: string;
}

export function Navbar({ pubkey, profile, onLoginClick, onLogout, dashboardHref }: Props) {
  const { t, lang, setLang } = useTranslation();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "#about", label: t.nav.about },
    { href: "#schedule", label: t.nav.schedule },
    { href: "#location", label: t.nav.location },
  ];

  const toggleLang = (l: Language) => {
    setLang(l);
  };

  return (
    <nav style={styles.nav}>
      <div style={{ ...styles.inner, maxWidth: theme.spacing.container }}>
        <a href='#' style={styles.brand}>
          <img src='/openclaw-logo.png' alt='OpenClaw' style={styles.navLogo} />
          <span style={styles.brandAccent}>OpenClaw</span>
          <span style={styles.brandDivider}>x</span>
          <img
            src='/lacrypta-logo.png'
            alt='La Crypta'
            style={styles.navLogo}
          />
          <span style={styles.brandText}>La Crypta</span>
        </a>

        {!isMobile && (
          <div style={styles.links}>
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} style={styles.link}>
                {link.label}
              </a>
            ))}
          </div>
        )}

        <div style={styles.actions}>
          <div style={styles.langSwitch}>
            <button
              style={{
                ...styles.langBtn,
                ...(lang === "es" ? styles.langBtnActive : {}),
              }}
              onClick={() => toggleLang("es")}
            >
              ES
            </button>
            <button
              style={{
                ...styles.langBtn,
                ...(lang === "en" ? styles.langBtnActive : {}),
              }}
              onClick={() => toggleLang("en")}
            >
              EN
            </button>
          </div>

          {pubkey ? (
            <div style={styles.profileArea}>
              {profile?.picture ? (
                <img src={profile.picture} alt='' style={styles.profilePic} />
              ) : (
                <div style={styles.profilePlaceholder}>👤</div>
              )}
              {dashboardHref && (
                <a href={dashboardHref} style={styles.dashboardBtn}>
                  Dashboard
                </a>
              )}
              <button style={styles.logoutBtn} onClick={onLogout}>
                {t.nav.logout}
              </button>
            </div>
          ) : (
            <button style={styles.connectBtn} onClick={onLoginClick}>
              {t.nav.login}
            </button>
          )}

          {isMobile && (
            <button
              style={styles.hamburger}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label='Menu'
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          )}
        </div>
      </div>

      {isMobile && menuOpen && (
        <div style={styles.mobileMenu}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: theme.spacing.navHeight,
    background: "rgba(10, 15, 26, 0.95)",
    backdropFilter: "blur(12px)",
    borderBottom: `1px solid ${theme.colors.border}`,
    zIndex: 1000,
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
    margin: "0 auto",
    padding: "0 24px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    color: theme.colors.text,
  },
  navLogo: {
    width: 24,
    height: 24,
    objectFit: "contain" as const,
  },
  brandText: {
    fontSize: 18,
    fontWeight: 700,
  },
  brandDivider: {
    color: theme.colors.textDim,
    fontSize: 14,
  },
  brandAccent: {
    fontSize: 16,
    fontWeight: 600,
    color: theme.colors.secondary,
  },
  links: {
    display: "flex",
    gap: 32,
  },
  link: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none",
    transition: "color 0.2s",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  langSwitch: {
    display: "flex",
    gap: 2,
    background: theme.colors.border,
    borderRadius: 6,
    padding: 2,
  },
  langBtn: {
    padding: "4px 10px",
    border: "none",
    borderRadius: 4,
    background: "transparent",
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  langBtnActive: {
    background: theme.colors.secondary,
    color: theme.colors.text,
  },
  connectBtn: {
    padding: "8px 16px",
    border: "none",
    borderRadius: 8,
    background: theme.colors.primary,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  profileArea: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    objectFit: "cover" as const,
  },
  profilePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: theme.colors.border,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
  },
  dashboardBtn: {
    padding: "6px 12px",
    border: "none",
    borderRadius: 6,
    background: theme.colors.primary,
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
  },
  logoutBtn: {
    padding: "6px 12px",
    border: `1px solid ${theme.colors.borderLight}`,
    borderRadius: 6,
    background: "transparent",
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
  },
  hamburger: {
    padding: "4px 8px",
    border: "none",
    background: "transparent",
    color: theme.colors.text,
    fontSize: 20,
    cursor: "pointer",
  },
  mobileMenu: {
    position: "absolute" as const,
    top: theme.spacing.navHeight,
    left: 0,
    right: 0,
    background: "rgba(10, 15, 26, 0.98)",
    borderBottom: `1px solid ${theme.colors.border}`,
    padding: "16px 24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  mobileLink: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: 500,
    textDecoration: "none",
    padding: "8px 0",
  },
};
