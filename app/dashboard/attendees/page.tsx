"use client";

import { useState, useMemo } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { ContactsTable } from '@/components/ContactsTable';
import { StatsBar } from '@/components/StatsBar';
import { theme } from '@/lib/theme';

type FilterStatus = 'all' | 'approved' | 'waitlist' | 'checked_in';

export default function AttendeesPage() {
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

    return [
      { label: 'Total Contacts', value: total, color: theme.colors.primary },
      { label: 'Approved', value: approved, color: theme.colors.success },
      { label: 'Waitlist', value: waitlist, color: theme.colors.warningText },
      { label: 'Checked In', value: checkedIn, color: theme.colors.secondary },
      { label: 'Emails Sent', value: emailsSent, color: theme.colors.primary },
    ];
  }, [contacts]);

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Approved', value: 'approved' },
    { label: 'Waitlist', value: 'waitlist' },
    { label: 'Checked In', value: 'checked_in' },
  ];

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Attendees</h1>

      <StatsBar stats={stats} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilterStatus(btn.value)}
            style={{
              padding: '0.4rem 0.85rem',
              background: filterStatus === btn.value ? theme.colors.primary : theme.colors.cardBg,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
            }}
          >
            {btn.label}
          </button>
        ))}
        <button
          onClick={() => refetch()}
          style={{
            padding: '0.4rem 0.85rem',
            background: theme.colors.cardBg,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            marginLeft: 'auto',
          }}
        >
          Refresh
        </button>
      </div>

      {/* Content */}
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
          <div style={{ padding: '1rem', background: theme.colors.error, color: theme.colors.errorText, borderRadius: '6px' }}>
            {error}
          </div>
        )}
        {!loading && !error && <ContactsTable contacts={contacts} onUpdateContact={updateContact} />}
      </div>
    </div>
  );
}
