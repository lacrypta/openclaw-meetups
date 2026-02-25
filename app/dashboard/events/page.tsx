"use client";

import { useState } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { EventCard } from '@/components/EventCard';
import { EventForm } from '@/components/EventForm';
import { theme } from '@/lib/theme';
import type { EventStatus } from '@/lib/types';

const statusFilters: { label: string; value: EventStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function EventsPage() {
  const [filter, setFilter] = useState<EventStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);

  const { events, loading, error, createEvent } = useEvents(
    filter === 'all' ? undefined : { status: filter }
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Events</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '0.6rem 1.25rem',
            background: theme.colors.primary,
            color: theme.colors.text,
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          + Create Event
        </button>
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {statusFilters.map((sf) => (
          <button
            key={sf.value}
            onClick={() => setFilter(sf.value)}
            style={{
              padding: '0.4rem 0.85rem',
              background: filter === sf.value ? theme.colors.primary : theme.colors.cardBg,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
            }}
          >
            {sf.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: theme.colors.textMuted }}>Loading events...</div>}
      {error && <div style={{ padding: '1rem', background: theme.colors.error, color: theme.colors.errorText, borderRadius: '6px' }}>{error}</div>}

      {!loading && !error && events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: theme.colors.textMuted }}>
          No events found. Create your first event!
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {showForm && (
        <EventForm
          onSubmit={async (data) => {
            await createEvent(data);
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
