"use client";

import { useState, useEffect, useCallback } from 'react';
import { getToken } from '../lib/auth';

export interface Contact {
  id: string;
  name: string;
  email: string;
  pubkey?: string;
  status: 'approved' | 'waitlist' | 'declined';
  checked_in: boolean;
  notes?: string;
  registered_at: string;
}

export function useContacts(filters?: { status?: string; checked_in?: boolean }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (filters?.status) params.append('status', filters.status);
      if (filters?.checked_in !== undefined) params.append('checked_in', String(filters.checked_in));

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
  }, [filters]);

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
