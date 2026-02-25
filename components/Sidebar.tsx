"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { theme } from '../lib/theme';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: '📊' },
  { label: 'Events', href: '/dashboard/events', icon: '📅' },
  { label: 'Attendees', href: '/dashboard/attendees', icon: '👥' },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <nav
      style={{
        width: theme.spacing.sidebarWidth,
        minHeight: '100vh',
        background: theme.colors.cardBg,
        borderRight: `1px solid ${theme.colors.border}`,
        padding: '1rem 0',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '0 1rem 1.5rem', borderBottom: `1px solid ${theme.colors.border}`, marginBottom: '0.5rem' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', color: theme.colors.text, fontWeight: 'bold', fontSize: '1.1rem' }}>
          OpenClaw CRM
        </Link>
      </div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            margin: '0.25rem 0.5rem',
            borderRadius: '6px',
            textDecoration: 'none',
            color: isActive(item.href) ? theme.colors.text : theme.colors.textMuted,
            background: isActive(item.href) ? theme.colors.primary + '20' : 'transparent',
            fontSize: '0.875rem',
            fontWeight: isActive(item.href) ? '600' : '400',
            transition: 'all 0.15s',
          }}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
