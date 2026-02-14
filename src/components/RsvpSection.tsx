import { useTranslation } from '../i18n/useTranslation';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useRsvp } from '../hooks/useRsvp';
import { theme } from '../lib/theme';
import type { NostrProfile } from '../lib/nostr';

interface Props {
  pubkey: string | null;
  profile: NostrProfile | null;
  onLoginClick: () => void;
}

export function RsvpSection({ pubkey, profile, onLoginClick }: Props) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { isAttending, attendeeCount, toggleRsvp } = useRsvp(pubkey);

  return (
    <section id="rsvp" style={styles.section}>
      <div
        style={{
          ...styles.inner,
          maxWidth: 600,
          padding: isMobile ? '0 20px' : '0 40px',
        }}
      >
        <h2 style={styles.sectionTitle}>{t.rsvp.title}</h2>

        {!pubkey ? (
          <div style={styles.loginPrompt}>
            <div style={styles.lockIcon}>🔐</div>
            <p style={styles.promptText}>{t.rsvp.loginPrompt}</p>
            <p style={styles.promptDesc}>{t.rsvp.loginDesc}</p>
            <button style={styles.loginBtn} onClick={onLoginClick}>
              ⚡ {t.hero.ctaLogin}
            </button>
          </div>
        ) : (
          <div style={styles.rsvpCard}>
            <div style={styles.profileMini}>
              {profile?.picture ? (
                <img src={profile.picture} alt="" style={styles.profilePic} />
              ) : (
                <div style={styles.profilePlaceholder}>👤</div>
              )}
              <span style={styles.profileName}>
                {profile?.display_name || profile?.name || 'Anon'}
              </span>
            </div>

            {isAttending ? (
              <div style={styles.attendingBlock}>
                <div style={styles.checkmark}>✓</div>
                <p style={styles.attendingText}>{t.rsvp.attending}</p>
                <button style={styles.cancelBtn} onClick={toggleRsvp}>
                  {t.rsvp.cancelAttend}
                </button>
              </div>
            ) : (
              <button style={styles.confirmBtn} onClick={toggleRsvp}>
                🦞 {t.rsvp.confirmAttend}
              </button>
            )}

            {attendeeCount > 0 && (
              <p style={styles.attendeeCount}>
                {attendeeCount} {t.rsvp.confirmed.toLowerCase()}
              </p>
            )}
          </div>
        )}
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
    margin: '0 auto',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: 800,
    textAlign: 'center' as const,
    marginBottom: 48,
  },
  loginPrompt: {
    background: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 16,
    padding: 40,
    textAlign: 'center' as const,
  },
  lockIcon: {
    fontSize: 36,
    marginBottom: 16,
  },
  promptText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
  },
  promptDesc: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 24,
  },
  loginBtn: {
    padding: '14px 32px',
    border: 'none',
    borderRadius: 10,
    background: theme.colors.primary,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
  rsvpCard: {
    background: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 16,
    padding: 32,
    textAlign: 'center' as const,
  },
  profileMini: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: theme.colors.border,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  profileName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 600,
  },
  confirmBtn: {
    padding: '14px 32px',
    border: 'none',
    borderRadius: 10,
    background: theme.colors.secondary,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    maxWidth: 300,
  },
  attendingBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
  },
  checkmark: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'rgba(52, 211, 153, 0.15)',
    color: theme.colors.success,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 700,
  },
  attendingText: {
    color: theme.colors.success,
    fontSize: 18,
    fontWeight: 700,
  },
  cancelBtn: {
    padding: '8px 20px',
    border: `1px solid ${theme.colors.borderLight}`,
    borderRadius: 8,
    background: 'transparent',
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  attendeeCount: {
    color: theme.colors.textDim,
    fontSize: 13,
    marginTop: 16,
  },
};
