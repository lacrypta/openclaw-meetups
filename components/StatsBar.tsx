"use client";

import { Card } from "@/components/ui/card";

interface Stat {
  label: string;
  value: number;
  color: string;
}

interface StatsBarProps {
  stats: Stat[];
  loading?: boolean;
}

function Spinner({ color }: { color: string }) {
  return (
    <svg
      className="animate-spin h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      style={{ color }}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  );
}

export function StatsBar({ stats, loading }: StatsBarProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5">
          <div className="text-muted-foreground text-xs mb-2">
            {stat.label}
          </div>
          <div className="text-[1.75rem] font-bold" style={{ color: stat.color }}>
            {loading ? <Spinner color={stat.color} /> : stat.value}
          </div>
        </Card>
      ))}
    </div>
  );
}
