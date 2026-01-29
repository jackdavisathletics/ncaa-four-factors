'use client';

import { Gender } from '@/lib/types';

interface GenderToggleProps {
  value: Gender;
  onChange: (gender: Gender) => void;
}

export function GenderToggle({ value, onChange }: GenderToggleProps) {
  return (
    <div className="inline-flex rounded-lg p-1 bg-[var(--background-tertiary)] border border-[var(--border)]">
      <button
        onClick={() => onChange('mens')}
        className={`
          relative px-5 py-2 rounded-md text-sm font-semibold uppercase tracking-wider
          transition-all duration-200
          ${value === 'mens'
            ? 'bg-[var(--accent-primary)] text-[var(--background)] shadow-lg'
            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }
        `}
      >
        <span className="relative z-10">Men&apos;s</span>
        {value === 'mens' && (
          <div className="absolute inset-0 rounded-md bg-[var(--accent-primary)] opacity-20 blur-md" />
        )}
      </button>
      <button
        onClick={() => onChange('womens')}
        className={`
          relative px-5 py-2 rounded-md text-sm font-semibold uppercase tracking-wider
          transition-all duration-200
          ${value === 'womens'
            ? 'bg-[var(--accent-secondary)] text-white shadow-lg'
            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }
        `}
      >
        <span className="relative z-10">Women&apos;s</span>
        {value === 'womens' && (
          <div className="absolute inset-0 rounded-md bg-[var(--accent-secondary)] opacity-20 blur-md" />
        )}
      </button>
    </div>
  );
}
