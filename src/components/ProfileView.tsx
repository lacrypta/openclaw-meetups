import type { NostrProfile } from '../lib/nostr';
import { npubEncode } from '../lib/nostr';

interface Props {
  pubkey: string;
  profile: NostrProfile | null;
  loading: boolean;
  method: string | null;
  onLogout: () => void;
}

export function ProfileView({ pubkey, profile, loading, method, onLogout }: Props) {
  const npub = npubEncode(pubkey);
  const shortNpub = npub.slice(0, 16) + '...' + npub.slice(-8);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}>⏳</div>
          <p style={styles.loadingText}>Buscando perfil en relays...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {profile?.banner && (
          <div style={{ ...styles.banner, backgroundImage: `url(${profile.banner})` }} />
        )}

        <div style={styles.avatarWrap}>
          {profile?.picture ? (
            <img src={profile.picture} alt="avatar" style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>👤</div>
          )}
        </div>

        <h1 style={styles.name}>
          {profile?.display_name || profile?.name || 'Anon'}
        </h1>

        {profile?.nip05 && <p style={styles.nip05}>✅ {profile.nip05}</p>}

        <p style={styles.npub} title={npub}>{shortNpub}</p>

        <div style={styles.badge}>
          {method === 'nip07' && '🔌 NIP-07'}
          {method === 'nsec' && '🔑 nsec'}
          {method === 'bunker' && '🔐 Bunker'}
        </div>

        {profile?.about && <p style={styles.about}>{profile.about}</p>}

        {profile?.lud16 && (
          <div style={styles.lightning}>
            <span style={styles.lightningIcon}>⚡</span>
            <span>{profile.lud16}</span>
          </div>
        )}

        {!profile && (
          <p style={styles.noProfile}>No se encontró perfil (kind:0) en los relays.</p>
        )}

        <button style={styles.logoutBtn} onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0f1a',
    padding: 20,
  },
  card: {
    background: '#111827',
    borderRadius: 16,
    padding: 0,
    maxWidth: 440,
    width: '100%',
    overflow: 'hidden',
    boxShadow: '0 0 40px rgba(37, 99, 235, 0.15)',
  },
  banner: {
    height: 120,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    background: 'linear-gradient(135deg, #2563eb, #ff8c00)',
  },
  avatarWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: -40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    border: '4px solid #111827',
    objectFit: 'cover' as const,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    border: '4px solid #111827',
    background: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 36,
  },
  name: {
    color: '#fff',
    textAlign: 'center' as const,
    margin: '12px 0 4px',
    fontSize: 24,
    fontWeight: 700,
    padding: '0 24px',
  },
  nip05: {
    color: '#34d399',
    textAlign: 'center' as const,
    fontSize: 13,
    margin: '0 0 4px',
  },
  npub: {
    color: '#6b7280',
    textAlign: 'center' as const,
    fontSize: 12,
    fontFamily: 'monospace',
    margin: '0 0 8px',
  },
  badge: {
    textAlign: 'center' as const,
    marginBottom: 16,
    fontSize: 13,
    color: '#9ca3af',
  },
  about: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 1.6,
    padding: '0 24px',
    marginBottom: 16,
  },
  lightning: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px 24px',
    background: '#1f2937',
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: 500,
  },
  lightningIcon: {
    fontSize: 18,
  },
  noProfile: {
    color: '#6b7280',
    textAlign: 'center' as const,
    fontSize: 14,
    padding: '0 24px',
    marginBottom: 16,
  },
  logoutBtn: {
    width: '100%',
    padding: '14px',
    border: 'none',
    background: '#7f1d1d',
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  spinner: {
    fontSize: 48,
    textAlign: 'center' as const,
    marginTop: 40,
  },
  loadingText: {
    color: '#9ca3af',
    textAlign: 'center' as const,
    padding: '16px 24px 40px',
  },
};
