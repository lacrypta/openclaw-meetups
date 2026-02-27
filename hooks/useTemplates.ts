"use client";

import { useState, useEffect, useCallback } from 'react';
import { getToken } from '../lib/auth';
import type { EmailTemplate, EmailJobSegment } from '../lib/types';

export function useTemplates(filters?: { segment?: EmailJobSegment }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.segment) params.append('segment', filters.segment);

      const url = `/api/templates${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  }, [filters?.segment]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (template: {
    name: string;
    description?: string;
    segment: EmailJobSegment;
    subject: string;
    html_content: string;
    text_content?: string;
    variables?: string[];
    layout_id?: string | null;
    is_active?: boolean;
  }) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(template),
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Failed to create template');
    }

    await fetchTemplates();
    return (await response.json()).template;
  };

  const updateTemplate = async (id: string, updates: Partial<EmailTemplate>) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/api/templates/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Failed to update template');
    }

    await fetchTemplates();
    return (await response.json()).template;
  };

  const deleteTemplate = async (id: string) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/api/templates/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Failed to delete template');
    }

    await fetchTemplates();
  };

  return { templates, loading, error, refetch: fetchTemplates, createTemplate, updateTemplate, deleteTemplate };
}
