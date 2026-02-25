"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { theme } from '../lib/theme';
import { getToken } from '../lib/auth';
import type { Attendee, AttendeeStatus } from '../lib/types';

interface AttendeeEvent {
  event_id: string;
  event_name: string;
  event_date: string;
  status: AttendeeStatus;
  checked_in: boolean;
  registered_at: string;
}

interface AttendeeProfileProps {
  attendeeId: string;
}

const statusColors: Record<string, string> = {
  approved: theme.colors.success,
  waitlist: theme.colors.warningText,
  declined: theme.colors.errorText,
};

export function AttendeeProfile({ attendeeId }: AttendeeProfileProps) {
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [events, setEvents] = useState<AttendeeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) return;

      setLoading(true);
      try {
        // Fetch attendee info from contacts API
        const contactsRes = await fetch('/api/contacts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (contactsRes.ok) {
          const { contacts } = await contactsRes.json();
          const found = contacts.find((c: any) => c.id === attendeeId);
          if (found) {
            setAttendee({
              id: found.id,
              name: found.name,
              email: found.email,
              pubkey: found.pubkey || null,
              email_sent: found.email_sent,
              email_type: found.email_type || null,
            });
          }
        }

        // Fetch all events and find attendee's registrations
        const eventsRes = await fetch('/api/events', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (eventsRes.ok) {
          const { events: allEvents } = await eventsRes.json();
          const attendeeEvents: AttendeeEvent[] = [];

          for (const evt of allEvents) {
            const eaRes = await fetch(`/api/events/${evt.id}/attendees`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (eaRes.ok) {
              const { attendees: eventAttendees } = await eaRes.json();
              const match = eventAttendees.find((ea: any) => String(ea.attendee_id) === String(attendeeId));
              if (match) {
                attendeeEvents.push({
                  event_id: evt.id,
                  event_name: evt.name,
                  event_date: evt.date,
                  status: match.status,
                  checked_in: match.checked_in,
                  registered_at: match.registered_at,
                });
              }
            }
          }
          setEvents(attendeeEvents);
        }
      } catch (err) {
        console.error('Failed to load attendee profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [attendeeId]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: theme.colors.textMuted }}>Loading profile...</div>;
  }

  if (!attendee) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: theme.colors.errorText }}>Attendee not found</div>;
  }

  return (
    <div>
      {/* Profile card */}
      <div
        style={{
          background: theme.colors.cardBg,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 'bold' }}>{attendee.name}</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
          <div>
            <span style={{ color: theme.colors.textMuted }}>Email: </span>
            <span style={{ color: theme.colors.text }}>{attendee.email}</span>
          </div>
          {attendee.pubkey && (
            <div>
              <span style={{ color: theme.colors.textMuted }}>Pubkey: </span>
              <span style={{ color: theme.colors.textDim, fontFamily: theme.fonts.mono, fontSize: '0.8rem' }}>
                {attendee.pubkey.slice(0, 16)}...{attendee.pubkey.slice(-8)}
              </span>
            </div>
          )}
          <div>
            <span style={{ color: theme.colors.textMuted }}>Email sent: </span>
            <span>{attendee.email_sent ? '✅' : '❌'}</span>
          </div>
        </div>
      </div>

      {/* Event history */}
      <div
        style={{
          background: theme.colors.cardBg,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '600' }}>Event Activity</h2>

        {events.length === 0 ? (
          <div style={{ color: theme.colors.textMuted, padding: '1rem 0' }}>No event registrations found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: theme.colors.textMuted, fontWeight: '600' }}>Event</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: theme.colors.textMuted, fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: theme.colors.textMuted, fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: theme.colors.textMuted, fontWeight: '600' }}>Checked In</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: theme.colors.textMuted, fontWeight: '600' }}>Registered</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt.event_id} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <Link
                        href={`/dashboard/events/${evt.event_id}`}
                        style={{ color: theme.colors.primary, textDecoration: 'none' }}
                      >
                        {evt.event_name}
                      </Link>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: theme.colors.textMuted }}>
                      {new Date(evt.event_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          background: (statusColors[evt.status] || theme.colors.textMuted) + '20',
                          color: statusColors[evt.status] || theme.colors.textMuted,
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}
                      >
                        {evt.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {evt.checked_in ? '✅' : '❌'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: theme.colors.textMuted }}>
                      {new Date(evt.registered_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
