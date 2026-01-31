'use client';

import { Season, AVAILABLE_SEASONS } from '@/lib/types';

interface SeasonSelectorProps {
  value: Season;
  onChange: (season: Season) => void;
}

// Format season for display (e.g., "2025-26" -> "2025-26")
function formatSeason(season: Season): string {
  return season;
}

export function SeasonSelector({ value, onChange }: SeasonSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Season)}
      className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer"
      aria-label="Select season"
    >
      {AVAILABLE_SEASONS.map((season) => (
        <option key={season} value={season}>
          {formatSeason(season)}
        </option>
      ))}
    </select>
  );
}
