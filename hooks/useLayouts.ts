"use client";

import { useState, useEffect, useCallback } from 'react';
import { getToken } from '../lib/auth';
import type { EmailLayout } from '../lib/types';

export function useLayouts() {
  const [layouts, setLayouts] = useState<EmailLayout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLayouts = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/layouts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch layouts');

      const data = await response.json();
      setLayouts(data.layouts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch layouts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLayouts();
  }, [fetchLayouts]);

  const createLayout = async (layout: {
    name: string;
    description?: string;
    html_content: string;
    is_default?: boolean;
  }) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/layouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(layout),
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Failed to create layout');
    }

    await fetchLayouts();
    return (await response.json()).layout;
  };

  const updateLayout = async (id: string, updates: Partial<EmailLayout>) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/api/layouts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Failed to update layout');
    }

    await fetchLayouts();
    return (await response.json()).layout;
  };

  const setDefault = async (id: string) => {
    return updateLayout(id, { is_default: true } as Partial<EmailLayout>);
  };

  const deleteLayout = async (id: string) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/api/layouts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Failed to delete layout');
    }

    await fetchLayouts();
  };

  return { layouts, loading, error, refetch: fetchLayouts, createLayout, updateLayout, setDefault, deleteLayout };
}
