"use client";

import { useEffect } from 'react';
import { LoginScreen } from './LoginScreen';
import { theme } from '../lib/theme';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  onNip07: () => void;
  onNsec: (nsec: string) => void;
  onBunker: (url: string) => void;
}

export function LoginModal({ isOpen, onClose, loading, error, onNip07, onNsec, onBunker }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.content} onClick={(e) => e.stopPropagation()}>
        <button style={styles.close} onClick={onClose} aria-label="Close">
          ✕
        </button>
        <LoginScreen
          loading={loading}
          error={error}
          onNip07={() => { onNip07(); }}
          onNsec={(nsec) => { onNsec(nsec); }}
          onBunker={(url) => { onBunker(url); }}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.colors.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: 20,
  },
  content: {
    position: 'relative' as const,
    maxWidth: 500,
    width: '100%',
  },
  close: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    border: 'none',
    borderRadius: '50%',
    background: theme.colors.border,
    color: theme.colors.text,
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
};
