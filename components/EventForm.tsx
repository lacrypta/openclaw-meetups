"use client";

import { useState } from 'react';
import { theme } from '../lib/theme';
import type { EventStatus } from '../lib/types';

interface EventFormData {
  name: string;
  description: string;
  date: string;
  location: string;
  capacity: string;
  status: EventStatus;
}

interface EventFormProps {
  initial?: Partial<EventFormData>;
  onSubmit: (data: {
    name: string;
    description?: string;
    date: string;
    location?: string;
    capacity?: number;
    status: EventStatus;
  }) => Promise<void>;
  onClose: () => void;
  title?: string;
}

export function EventForm({ initial, onSubmit, onClose, title = 'Create Event' }: EventFormProps) {
  const [form, setForm] = useState<EventFormData>({
    name: initial?.name || '',
    description: initial?.description || '',
    date: initial?.date || '',
    location: initial?.location || '',
    capacity: initial?.capacity || '',
    status: initial?.status || 'draft',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name,
        description: form.description || undefined,
        date: form.date,
        location: form.location || undefined,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        status: form.status,
      });
      onClose();
    } catch {
      // error handled by caller
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    background: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '6px',
    color: theme.colors.text,
    fontSize: '0.9rem',
  } as const;

  const labelStyle = {
    display: 'block',
    color: theme.colors.textMuted,
    fontSize: '0.8rem',
    marginBottom: '0.35rem',
    fontWeight: '500' as const,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: theme.colors.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.colors.cardBg,
          borderRadius: '12px',
          padding: '2rem',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflow: 'auto',
          border: `1px solid ${theme.colors.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: theme.colors.text, margin: '0 0 1.5rem', fontSize: '1.25rem' }}>{title}</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
              placeholder="Event name"
            />
          </div>

          <div>
            <label style={labelStyle}>Date & Time *</label>
            <input
              required
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              style={inputStyle}
              placeholder="Venue or address"
            />
          </div>

          <div>
            <label style={labelStyle}>Capacity</label>
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              style={inputStyle}
              placeholder="Max attendees"
            />
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
              style={inputStyle}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' as const }}
              placeholder="Event description"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.25rem',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '6px',
                background: 'transparent',
                color: theme.colors.textMuted,
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.6rem 1.25rem',
                border: 'none',
                borderRadius: '6px',
                background: theme.colors.primary,
                color: theme.colors.text,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Saving...' : title}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
