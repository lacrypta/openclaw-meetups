"use client";

import { use } from 'react';
import Link from 'next/link';
import { AttendeeProfile } from '@/components/AttendeeProfile';
import { theme } from '@/lib/theme';

export default function AttendeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div>
      <Link
        href="/dashboard/attendees"
        style={{
          color: theme.colors.textMuted,
          textDecoration: 'none',
          fontSize: '0.85rem',
          display: 'inline-block',
          marginBottom: '1rem',
        }}
      >
        ← Back to Attendees
      </Link>
      <AttendeeProfile attendeeId={id} />
    </div>
  );
}
