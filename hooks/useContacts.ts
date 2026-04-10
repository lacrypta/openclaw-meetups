"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { getToken } from '../lib/auth';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  pubkey?: string;
  subscribed?: boolean;
  role?: string;
  notes?: string;
  created_at: string;
  // Event-context fields (populated when used from EventDetail)
  status?: 'approved' | 'waitlist' | 'declined';
  checked_in?: boolean;
  attendance_confirmed?: boolean;
  registered_at?: string;
}

export function useContacts(filters?: Record<string, unknown>) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stabilize filters by serializing — avoids infinite loop when caller
  // passes a new object literal (e.g. `useContacts({})`) on every render.
  const filtersKey = JSON.stringify(filters ?? {});
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchContacts = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      const url = `/api/contacts${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }

      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch contacts';
      setError(message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/contacts', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!response.ok) {
      throw new Error('Failed to update contact');
    }

    await fetchContacts(); // Refresh list
  };

  return {
    contacts,
    loading,
    error,
    refetch: fetchContacts,
    updateContact,
  };
}
