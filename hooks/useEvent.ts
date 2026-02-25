"use client";

import { useState, useEffect, useCallback } from 'react';
import { getToken } from '../lib/auth';
import type { EventWithCounts } from '../lib/types';

export function useEvent(id: string | null) {
  const [event, setEvent] = useState<EventWithCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id) return;

    const token = getToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch event');

      const data = await response.json();
      setEvent(data.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const updateEvent = async (updates: Record<string, any>) => {
    if (!id) throw new Error('No event ID');

    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) throw new Error('Failed to update event');

    await fetchEvent();
    return (await response.json()).event;
  };

  return { event, loading, error, refetch: fetchEvent, updateEvent };
}
