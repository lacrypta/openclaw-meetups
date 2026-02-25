"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';

function getNextFirstThursday(): Date {
  const now = new Date();
  for (let attempt = 0; attempt < 3; attempt++) {
    const year = now.getFullYear();
    const month = now.getMonth() + attempt;
    const candidate = new Date(year, month, 1);
    const day = candidate.getDay();
    const firstThursday = day <= 4 ? 1 + (4 - day) : 1 + (11 - day);
    candidate.setDate(firstThursday);
    candidate.setHours(19, 0, 0, 0);
    if (candidate > now) return candidate;
  }
  return now;
}

function getRsvpKey(): string {
  const next = getNextFirstThursday();
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, '0');
  return `openclaw-rsvp-${year}-${month}`;
}

function getAttendees(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(getRsvpKey());
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAttendees(attendees: string[]) {
  localStorage.setItem(getRsvpKey(), JSON.stringify(attendees));
}

export function useRsvp(pubkey: string | null) {
  const [attendees, setAttendees] = useState<string[]>([]);

  useEffect(() => {
    setAttendees(getAttendees());
  }, []);

  // Re-read attendees when pubkey changes by deriving state
  const currentAttendees = useMemo(() => {
    if (pubkey === null) return attendees;
    return getAttendees();
  }, [pubkey, attendees]);

  const isAttending = pubkey ? currentAttendees.includes(pubkey) : false;

  const toggleRsvp = useCallback(() => {
    if (!pubkey) return;
    const current = getAttendees();
    let updated: string[];
    if (current.includes(pubkey)) {
      updated = current.filter((p) => p !== pubkey);
    } else {
      updated = [...current, pubkey];
    }
    saveAttendees(updated);
    setAttendees(updated);
  }, [pubkey]);

  return { isAttending, attendeeCount: attendees.length, toggleRsvp };
}

export { getNextFirstThursday };
