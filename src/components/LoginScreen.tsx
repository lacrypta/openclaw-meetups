import { useState, useEffect } from 'react';
import { checkNip07 } from '../lib/nostr';

interface Props {
  loading: boolean;
  error: string | null;
  onNip07: () => void;
  onNsec: (nsec: string) => void;
  onBunker: (url: string) => void;
}

export function LoginScreen({ loading, error, onNip07, onNsec, onBunker }: Props) {
  const [hasExtension, setHasExtension] = useState(false);
  const [nsec, setNsec] = useState('');
  const [bunkerUrl, setBunkerUrl] = useState('');
  const [tab, setTab] = useState<'nip07' | 'nsec' | 'bunker'>('nip07');

  useEffect(() => {
    checkNip07().then(setHasExtension);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>⚡</div>
        <h1 style={styles.title}>Nostr + Lightning</h1>
        <p style={styles.subtitle}>Boilerplate</p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === 'nip07' ? styles.tabActive : {}) }}
            onClick={() => setTab('nip07')}
          >
            🔌 Extensión
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'bunker' ? styles.tabActive : {}) }}
            onClick={() => setTab('bunker')}
          >
            🔐 Bunker
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'nsec' ? styles.tabActive : {}) }}
            onClick={() => setTab('nsec')}
          >
            🔑 nsec
          </button>
        </div>

        <div style={styles.tabContent}>
          {tab === 'nip07' && (
            <div>
              <p style={styles.desc}>
                {hasExtension
                  ? 'Extensión NIP-07 detectada. Conectá con Alby, nos2x u otra.'
                  : 'No se detectó extensión NIP-07. Instalá Alby o nos2x.'}
              </p>
              <button
                style={{ ...styles.btn, ...styles.btnPrimary, opacity: hasExtension ? 1 : 0.5 }}
                onClick={onNip07}
                disabled={loading || !hasExtension}
              >
                {loading ? 'Conectando...' : 'Conectar con extensión'}
              </button>
            </div>
          )}

          {tab === 'bunker' && (
            <div>
              <p style={styles.desc}>Login remoto via NIP-46 (nsecBunker)</p>
              <input
                style={styles.input}
                placeholder="bunker://pubkey?relay=wss://..."
                value={bunkerUrl}
                onChange={(e) => setBunkerUrl(e.target.value)}
              />
              <button
                style={{ ...styles.btn, ...styles.btnElectric }}
                onClick={() => onBunker(bunkerUrl)}
                disabled={loading || !bunkerUrl}
              >
                {loading ? 'Conectando...' : 'Conectar con Bunker'}
              </button>
            </div>
          )}

          {tab === 'nsec' && (
            <div>
              <div style={styles.warning}>
                ⚠️ Solo para desarrollo. No uses tu nsec principal.
              </div>
              <input
                style={styles.input}
                type="password"
                placeholder="nsec1..."
                value={nsec}
                onChange={(e) => setNsec(e.target.value)}
              />
              <button
                style={{ ...styles.btn, ...styles.btnAmber }}
                onClick={() => onNsec(nsec)}
                disabled={loading || !nsec}
              >
                {loading ? 'Conectando...' : 'Login con nsec'}
              </button>
            </div>
          )}
        </div>
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
    padding: 40,
    maxWidth: 440,
    width: '100%',
    boxShadow: '0 0 40px rgba(37, 99, 235, 0.15)',
  },
  logo: {
    fontSize: 48,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    textAlign: 'center' as const,
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
  },
  subtitle: {
    color: '#6b7280',
    textAlign: 'center' as const,
    marginTop: 4,
    marginBottom: 24,
  },
  error: {
    background: '#7f1d1d',
    color: '#fca5a5',
    padding: '10px 14px',
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    padding: '10px 8px',
    border: 'none',
    borderRadius: 8,
    background: '#1f2937',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  tabActive: {
    background: '#2563eb',
    color: '#fff',
  },
  tabContent: {
    minHeight: 140,
  },
  desc: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 16,
  },
  warning: {
    background: '#78350f',
    color: '#fbbf24',
    padding: '10px 14px',
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #374151',
    background: '#1f2937',
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  btn: {
    width: '100%',
    padding: '12px 20px',
    borderRadius: 8,
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnPrimary: {
    background: '#2563eb',
    color: '#fff',
  },
  btnAmber: {
    background: '#ff8c00',
    color: '#fff',
  },
  btnElectric: {
    background: '#2563eb',
    color: '#fff',
  },
};
