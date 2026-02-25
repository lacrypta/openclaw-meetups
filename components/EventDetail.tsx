"use client";

import { useState, useMemo } from 'react';
import { theme } from '../lib/theme';
import { StatsBar } from './StatsBar';
import { ContactsTable } from './ContactsTable';
import { EventForm } from './EventForm';
import { useEvent } from '../hooks/useEvent';
import { useEventAttendees } from '../hooks/useEventAttendees';
import type { EventWithCounts } from '../lib/types';
import type { Contact } from '../hooks/useContacts';

interface EventDetailProps {
  eventId: string;
}

const statusColors: Record<string, string> = {
  draft: theme.colors.textMuted,
  published: theme.colors.success,
  cancelled: theme.colors.errorText,
  completed: theme.colors.primary,
};

export function EventDetail({ eventId }: EventDetailProps) {
  const { event, loading: eventLoading, updateEvent } = useEvent(eventId);
  const { attendees, loading: attendeesLoading, updateAttendee } = useEventAttendees(eventId);
  const [editing, setEditing] = useState(false);

  const stats = useMemo(() => {
    if (!event) return [];
    return [
      { label: 'Total Registered', value: event.attendee_count, color: theme.colors.primary },
      { label: 'Approved', value: event.approved_count, color: theme.colors.success },
      { label: 'Waitlist', value: event.attendee_count - event.approved_count - (attendees.filter(a => a.status === 'declined').length), color: theme.colors.warningText },
      { label: 'Checked In', value: event.checked_in_count, color: theme.colors.secondary },
    ];
  }, [event, attendees]);

  // Map event attendees to Contact shape for ContactsTable reuse
  const contactsFromAttendees: Contact[] = useMemo(() => {
    return attendees.map((ea) => ({
      id: String(ea.attendee_id),
      name: ea.name,
      email: ea.email,
      pubkey: ea.pubkey || undefined,
      status: ea.status,
      checked_in: ea.checked_in,
      email_sent: ea.email_sent,
      email_type: ea.email_type || undefined,
      notes: ea.notes || undefined,
      registered_at: ea.registered_at,
    }));
  }, [attendees]);

  const handleUpdateContact = async (id: string, updates: Partial<Contact>) => {
    await updateAttendee(id, {
      status: updates.status,
      checked_in: updates.checked_in,
      notes: updates.notes,
    });
  };

  if (eventLoading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: theme.colors.textMuted }}>Loading event...</div>;
  }

  if (!event) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: theme.colors.errorText }}>Event not found</div>;
  }

  const capacityPct = event.capacity ? Math.min((event.attendee_count / event.capacity) * 100, 100) : 0;

  return (
    <div>
      {/* Event header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.75rem', fontWeight: 'bold' }}>{event.name}</h1>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: theme.colors.textMuted, fontSize: '0.9rem' }}>
            <span>
              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {' '}
              {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {event.location && <span>{event.location}</span>}
          </div>
          {event.description && (
            <p style={{ color: theme.colors.textDim, marginTop: '0.75rem', fontSize: '0.9rem' }}>{event.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <span
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '12px',
              background: (statusColors[event.status] || theme.colors.textMuted) + '20',
              color: statusColors[event.status] || theme.colors.textMuted,
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
            }}
          >
            {event.status}
          </span>
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: '0.3rem 0.75rem',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '6px',
              background: 'transparent',
              color: theme.colors.textMuted,
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Capacity bar */}
      {event.capacity && (
        <div style={{ marginBottom: '1.5rem', background: theme.colors.cardBg, border: `1px solid ${theme.colors.border}`, borderRadius: '8px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: theme.colors.textMuted, marginBottom: '0.5rem' }}>
            <span>Capacity: {event.attendee_count} / {event.capacity}</span>
            <span>{Math.round(capacityPct)}%</span>
          </div>
          <div style={{ height: 6, background: theme.colors.border, borderRadius: 3 }}>
            <div
              style={{
                height: '100%',
                width: `${capacityPct}%`,
                background: capacityPct >= 90 ? theme.colors.warningText : theme.colors.primary,
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      )}

      <StatsBar stats={stats} />

      {/* Attendees table */}
      <div
        style={{
          background: theme.colors.cardBg,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '600' }}>Attendees</h2>
        {attendeesLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: theme.colors.textMuted }}>Loading attendees...</div>
        ) : (
          <ContactsTable
            contacts={contactsFromAttendees}
            onUpdateContact={handleUpdateContact}
            eventId={eventId}
          />
        )}
      </div>

      {editing && (
        <EventForm
          title="Edit Event"
          initial={{
            name: event.name,
            description: event.description || '',
            date: event.date.slice(0, 16),
            location: event.location || '',
            capacity: event.capacity?.toString() || '',
            status: event.status,
          }}
          onSubmit={async (data) => {
            await updateEvent(data);
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
