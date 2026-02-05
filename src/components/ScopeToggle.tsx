'use client';

export type StatsScope = 'di' | 'conference';

interface ScopeToggleProps {
  value: StatsScope;
  onChange: (scope: StatsScope) => void;
  conferenceName?: string;
}

export function ScopeToggle({ value, onChange, conferenceName }: ScopeToggleProps) {
  return (
    <div className="inline-flex rounded-lg p-1 bg-[var(--background-tertiary)] border border-[var(--border)]">
      <button
        onClick={() => onChange(value === 'di' ? 'conference' : 'di')}
        className={`
          relative px-4 py-1.5 rounded-md text-sm font-semibold tracking-wide
          transition-all duration-200
          ${value === 'di'
            ? 'bg-[var(--accent-primary)] text-[var(--background)] shadow-lg'
            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }
        `}
      >
        <span className="relative z-10">DI</span>
        {value === 'di' && (
          <div className="absolute inset-0 rounded-md bg-[var(--accent-primary)] opacity-20 blur-md" />
        )}
      </button>
      <button
        onClick={() => onChange(value === 'conference' ? 'di' : 'conference')}
        className={`
          relative px-4 py-1.5 rounded-md text-sm font-semibold tracking-wide
          transition-all duration-200
          ${value === 'conference'
            ? 'bg-[var(--accent-primary)] text-[var(--background)] shadow-lg'
            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }
        `}
        title={conferenceName ? `${conferenceName} games only` : 'Conference games only'}
      >
        <span className="relative z-10">Conf</span>
        {value === 'conference' && (
          <div className="absolute inset-0 rounded-md bg-[var(--accent-primary)] opacity-20 blur-md" />
        )}
      </button>
    </div>
  );
}
