"use client";

import { useState, useEffect, useCallback } from 'react';
import { getToken } from '../lib/auth';
import type { EventAttendee } from '../lib/types';

export function useEventAttendees(eventId: string | null) {
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendees = useCallback(async () => {
    if (!eventId) return;

    const token = getToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/attendees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch attendees');

      const data = await response.json();
      setAttendees(data.attendees || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendees');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  const addAttendee = async (attendeeId: string, status?: string) => {
    if (!eventId) throw new Error('No event ID');

    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/api/events/${eventId}/attendees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ attendee_id: attendeeId, status }),
    });

    if (!response.ok) throw new Error('Failed to add attendee');

    await fetchAttendees();
  };

  const updateAttendee = async (attendeeId: string, updates: { status?: string; checked_in?: boolean; notes?: string }) => {
    if (!eventId) throw new Error('No event ID');

    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/api/events/${eventId}/attendees`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ attendee_id: attendeeId, ...updates }),
    });

    if (!response.ok) throw new Error('Failed to update attendee');

    await fetchAttendees();
  };

  return { attendees, loading, error, refetch: fetchAttendees, addAttendee, updateAttendee };
}
