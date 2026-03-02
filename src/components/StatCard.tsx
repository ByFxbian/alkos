import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
}

export default function StatCard({ title, value, subtext }: StatCardProps) {
  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
      <p className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
        {title}
      </p>
      <p className="text-4xl font-bold mt-2">{value}</p>
      <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
        {subtext}
      </p>
    </div>
  );
}