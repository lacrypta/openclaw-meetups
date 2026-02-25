"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useContacts } from '../hooks/useContacts';
import { ContactsTable } from './ContactsTable';
import { theme } from '../lib/theme';
import type { NostrProfile } from '../lib/nostr';

interface DashboardProps {
  onLogout: () => void;
  profile?: NostrProfile | null;
}

type FilterStatus = 'all' | 'approved' | 'waitlist' | 'checked_in';

export function Dashboard({ onLogout, profile }: DashboardProps) {
  const { pubkey } = useAuth();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const filters = useMemo(() => {
    if (filterStatus === 'all') return {};
    if (filterStatus === 'checked_in') return { checked_in: true };
    return { status: filterStatus };
  }, [filterStatus]);

  const { contacts, loading, error, refetch, updateContact } = useContacts(filters);

  const stats = useMemo(() => {
    const total = contacts.length;
    const approved = contacts.filter((c) => c.status === 'approved').length;
    const waitlist = contacts.filter((c) => c.status === 'waitlist').length;
    const checkedIn = contacts.filter((c) => c.checked_in).length;
    const emailsSent = contacts.filter((c) => c.email_sent).length;

    return { total, approved, waitlist, checkedIn, emailsSent };
  }, [contacts]);

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Approved', value: 'approved' },
    { label: 'Waitlist', value: 'waitlist' },
    { label: 'Checked In', value: 'checked_in' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.colors.background,
        color: theme.colors.text,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: theme.colors.cardBg,
          borderBottom: `1px solid ${theme.colors.border}`,
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>CRM Dashboard</h1>
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
            onClick={onLogout}
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
      </div>

      {/* Stats Bar */}
      <div
        style={{
          padding: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {[
          { label: 'Total Contacts', value: stats.total, color: theme.colors.primary },
          { label: 'Approved', value: stats.approved, color: theme.colors.success },
          { label: 'Waitlist', value: stats.waitlist, color: theme.colors.warningText },
          { label: 'Checked In', value: stats.checkedIn, color: theme.colors.secondary },
          { label: 'Emails Sent', value: stats.emailsSent, color: theme.colors.primary },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: theme.colors.cardBg,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '8px',
              padding: '1.5rem',
            }}
          >
            <div style={{ color: theme.colors.textMuted, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ padding: '0 2rem 1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilterStatus(btn.value)}
              style={{
                padding: '0.5rem 1rem',
                background: filterStatus === btn.value ? theme.colors.primary : theme.colors.cardBg,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s',
              }}
            >
              {btn.label}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            style={{
              padding: '0.5rem 1rem',
              background: theme.colors.cardBg,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginLeft: 'auto',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 2rem 2rem' }}>
        <div
          style={{
            background: theme.colors.cardBg,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '8px',
            padding: '1.5rem',
          }}
        >
          {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>}
          {error && (
            <div
              style={{
                padding: '1rem',
                background: theme.colors.error,
                color: theme.colors.errorText,
                borderRadius: '6px',
              }}
            >
              {error}
            </div>
          )}
          {!loading && !error && <ContactsTable contacts={contacts} onUpdateContact={updateContact} />}
        </div>
      </div>
    </div>
  );
}
