"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { useEvents } from '@/hooks/useEvents';
import { useContacts } from '@/hooks/useContacts';
import { EventCard } from '@/components/EventCard';
import { StatsBar } from '@/components/StatsBar';
import { theme } from '@/lib/theme';

export default function DashboardOverviewPage() {
  const { events, loading: eventsLoading } = useEvents();
  const { contacts, loading: contactsLoading } = useContacts();

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.date) >= now && e.status !== 'cancelled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [events]);

  const overallStats = useMemo(() => [
    { label: 'Total Events', value: events.length, color: theme.colors.primary },
    { label: 'Active Events', value: events.filter(e => e.status === 'published').length, color: theme.colors.success },
    { label: 'Total Attendees', value: contacts.length, color: theme.colors.secondary },
    { label: 'Total Check-ins', value: events.reduce((sum, e) => sum + e.checked_in_count, 0), color: theme.colors.warningText },
  ], [events, contacts]);

  const recentRegistrations = useMemo(() => {
    return [...contacts]
      .sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime())
      .slice(0, 8);
  }, [contacts]);

  const loading = eventsLoading || contactsLoading;

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Overview</h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: theme.colors.textMuted }}>Loading...</div>
      ) : (
        <>
          <StatsBar stats={overallStats} />

          {/* Upcoming events */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '600' }}>Upcoming Events</h2>
              <Link href="/dashboard/events" style={{ color: theme.colors.primary, textDecoration: 'none', fontSize: '0.85rem' }}>
                View all →
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div style={{ color: theme.colors.textMuted, padding: '1.5rem', background: theme.colors.cardBg, border: `1px solid ${theme.colors.border}`, borderRadius: '8px' }}>
                No upcoming events.{' '}
                <Link href="/dashboard/events" style={{ color: theme.colors.primary, textDecoration: 'none' }}>Create one</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>

          {/* Recent registrations */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '600' }}>Recent Registrations</h2>
              <Link href="/dashboard/attendees" style={{ color: theme.colors.primary, textDecoration: 'none', fontSize: '0.85rem' }}>
                View all →
              </Link>
            </div>
            <div
              style={{
                background: theme.colors.cardBg,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: theme.colors.textMuted, fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: theme.colors.textMuted, fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: theme.colors.textMuted, fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: theme.colors.textMuted, fontWeight: '600' }}>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRegistrations.map((c) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Link href={`/dashboard/attendees/${c.id}`} style={{ color: theme.colors.text, textDecoration: 'none' }}>
                          {c.name}
                        </Link>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: theme.colors.textMuted }}>{c.email}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            background:
                              (c.status === 'approved' ? theme.colors.success : c.status === 'waitlist' ? theme.colors.warningText : theme.colors.errorText) + '20',
                            color:
                              c.status === 'approved' ? theme.colors.success : c.status === 'waitlist' ? theme.colors.warningText : theme.colors.errorText,
                            fontSize: '0.75rem',
                            fontWeight: '600',
                          }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: theme.colors.textMuted }}>
                        {new Date(c.registered_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
