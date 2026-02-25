"use client";

import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNostr } from '../hooks/useNostr';
import { useProfile } from '../hooks/useProfile';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { theme } from '../lib/theme';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { pubkey, logout: dashboardLogout } = useAuth();
  const { pubkey: nostrPubkey, logout: nostrLogout } = useNostr();
  const { profile } = useProfile(nostrPubkey || pubkey);

  const handleLogout = () => {
    dashboardLogout();
    nostrLogout();
    router.push('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.colors.background }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header
          style={{
            background: theme.colors.cardBg,
            borderBottom: `1px solid ${theme.colors.border}`,
            padding: '0.75rem 2rem',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {profile?.picture ? (
              <img
                src={profile.picture}
                alt=""
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' as const }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: theme.colors.border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                👤
              </div>
            )}
            {profile?.display_name || profile?.name ? (
              <span style={{ color: theme.colors.textMuted, fontSize: '0.875rem' }}>
                {profile.display_name || profile.name}
              </span>
            ) : pubkey ? (
              <span style={{ color: theme.colors.textMuted, fontSize: '0.875rem' }}>
                {pubkey.slice(0, 8)}...{pubkey.slice(-8)}
              </span>
            ) : null}
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: 6,
                background: 'transparent',
                color: theme.colors.textMuted,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </header>
        {/* Content */}
        <main style={{ flex: 1, padding: '2rem', color: theme.colors.text }}>
          {children}
        </main>
      </div>
    </div>
  );
}
