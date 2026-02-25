"use client";

import Link from 'next/link';
import { theme } from '../lib/theme';
import type { EventWithCounts } from '../lib/types';

interface EventCardProps {
  event: EventWithCounts;
}

const statusColors: Record<string, string> = {
  draft: theme.colors.textMuted,
  published: theme.colors.success,
  cancelled: theme.colors.errorText,
  completed: theme.colors.primary,
};

export function EventCard({ event }: EventCardProps) {
  const capacityPct = event.capacity ? Math.min((event.attendee_count / event.capacity) * 100, 100) : 0;

  return (
    <Link href={`/dashboard/events/${event.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: theme.colors.cardBg,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          padding: '1.5rem',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.colors.borderLight)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.colors.border)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <h3 style={{ color: theme.colors.text, fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
            {event.name}
          </h3>
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
              background: (statusColors[event.status] || theme.colors.textMuted) + '20',
              color: statusColors[event.status] || theme.colors.textMuted,
              fontSize: '0.7rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              flexShrink: 0,
              marginLeft: '0.5rem',
            }}
          >
            {event.status}
          </span>
        </div>

        <div style={{ color: theme.colors.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          {' '}
          {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>

        {event.location && (
          <div style={{ color: theme.colors.textDim, fontSize: '0.8rem', marginBottom: '1rem' }}>
            {event.location}
          </div>
        )}

        {/* Capacity bar */}
        {event.capacity && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: theme.colors.textMuted, marginBottom: '0.25rem' }}>
              <span>{event.attendee_count} registered</span>
              <span>{event.capacity} capacity</span>
            </div>
            <div style={{ height: 4, background: theme.colors.border, borderRadius: 2 }}>
              <div
                style={{
                  height: '100%',
                  width: `${capacityPct}%`,
                  background: capacityPct >= 90 ? theme.colors.warningText : theme.colors.primary,
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: theme.colors.textMuted }}>
          <span>{event.approved_count} approved</span>
          <span>{event.checked_in_count} checked in</span>
        </div>
      </div>
    </Link>
  );
}
