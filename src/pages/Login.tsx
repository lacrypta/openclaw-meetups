import { useState } from 'react';
import { login as authLogin } from '../lib/auth';
import { theme } from '../lib/theme';

interface LoginProps {
  onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLocalError(null);
    setLoading(true);
    try {
      await authLogin();
      onSuccess();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          background: theme.colors.cardBg,
          borderRadius: '12px',
          padding: '3rem',
          maxWidth: '400px',
          width: '100%',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: theme.colors.text,
          }}
        >
          Dashboard Login
        </h1>
        <p
          style={{
            color: theme.colors.textMuted,
            marginBottom: '2rem',
          }}
        >
          Sign in with your Nostr key to access the CRM dashboard
        </p>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            background: theme.colors.primary,
            color: theme.colors.text,
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = theme.colors.primaryHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.colors.primary;
          }}
        >
          {loading ? 'Signing in...' : 'Login with Nostr'}
        </button>

        {localError && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: theme.colors.error,
              color: theme.colors.errorText,
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          >
            {localError}
          </div>
        )}

        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: theme.colors.warning,
            color: theme.colors.warningText,
            borderRadius: '6px',
            fontSize: '0.875rem',
          }}
        >
          <strong>Note:</strong> You need a NIP-07 compatible browser extension (like nos2x or Alby) to log in.
        </div>
      </div>
    </div>
  );
}
