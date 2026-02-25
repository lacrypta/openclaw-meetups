"use client";

import { theme } from '../lib/theme';

interface Stat {
  label: string;
  value: number;
  color: string;
}

interface StatsBarProps {
  stats: Stat[];
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            background: theme.colors.cardBg,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '8px',
            padding: '1.25rem',
          }}
        >
          <div style={{ color: theme.colors.textMuted, fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            {stat.label}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: stat.color }}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
