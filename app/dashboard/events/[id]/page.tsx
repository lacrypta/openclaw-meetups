"use client";

import { use } from 'react';
import Link from 'next/link';
import { EventDetail } from '@/components/EventDetail';
import { theme } from '@/lib/theme';

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div>
      <Link
        href="/dashboard/events"
        style={{
          color: theme.colors.textMuted,
          textDecoration: 'none',
          fontSize: '0.85rem',
          display: 'inline-block',
          marginBottom: '1rem',
        }}
      >
        ← Back to Events
      </Link>
      <EventDetail eventId={id} />
    </div>
  );
}
