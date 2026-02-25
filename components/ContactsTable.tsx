"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { theme } from '../lib/theme';
import type { Contact } from '../hooks/useContacts';

interface ContactsTableProps {
  contacts: Contact[];
  onUpdateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  eventId?: string;
}

type SortField = 'name' | 'email' | 'status' | 'registered_at' | 'checked_in';
type SortDirection = 'asc' | 'desc';

export function ContactsTable({ contacts, onUpdateContact, eventId }: ContactsTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('registered_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let filtered = contacts;

    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'registered_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (typeof aVal === 'boolean') {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contacts, search, sortField, sortDirection]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme.colors.success;
      case 'waitlist':
        return theme.colors.warningText;
      case 'declined':
        return theme.colors.errorText;
      default:
        return theme.colors.textMuted;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            background: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '8px',
            color: theme.colors.text,
            fontSize: '0.9rem',
          }}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              {[
                { field: 'name' as SortField, label: 'Name' },
                { field: 'email' as SortField, label: 'Email' },
                { field: 'status' as SortField, label: 'Status' },
                { field: 'checked_in' as SortField, label: 'Checked In' },
                { field: 'registered_at' as SortField, label: 'Registered' },
              ].map(({ field, label }) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    color: theme.colors.textMuted,
                    fontWeight: '600',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {label} {sortField === field && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              ))}
              <th style={{ padding: '1rem', color: theme.colors.textMuted, fontWeight: '600' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((contact) => (
              <tr
                key={contact.id}
                style={{
                  borderBottom: `1px solid ${theme.colors.border}`,
                }}
              >
                <td style={{ padding: '1rem' }}>
                  <Link
                    href={`/dashboard/attendees/${contact.id}`}
                    style={{ color: theme.colors.text, textDecoration: 'none' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {contact.name}
                  </Link>
                </td>
                <td style={{ padding: '1rem', color: theme.colors.textMuted }}>{contact.email}</td>
                <td style={{ padding: '1rem' }}>
                  {eventId ? (
                    <select
                      value={contact.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        onUpdateContact(contact.id, { status: e.target.value as Contact['status'] });
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        background: getStatusColor(contact.status) + '20',
                        color: getStatusColor(contact.status),
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        border: `1px solid ${getStatusColor(contact.status)}40`,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="approved">approved</option>
                      <option value="waitlist">waitlist</option>
                      <option value="declined">declined</option>
                    </select>
                  ) : (
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        background: getStatusColor(contact.status) + '20',
                        color: getStatusColor(contact.status),
                        fontSize: '0.75rem',
                        fontWeight: '600',
                      }}
                    >
                      {contact.status}
                    </span>
                  )}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {eventId ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateContact(contact.id, { checked_in: !contact.checked_in });
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
                      {contact.checked_in ? '✅' : '❌'}
                    </button>
                  ) : (
                    <span>{contact.checked_in ? '✅' : '❌'}</span>
                  )}
                </td>
                <td style={{ padding: '1rem', color: theme.colors.textMuted }}>
                  {new Date(contact.registered_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateContact(contact.id, { email_sent: !contact.email_sent });
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: theme.colors.primary,
                      color: theme.colors.text,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    {contact.email_sent ? 'Mark Unsent' : 'Mark Sent'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
