'use client';

import { useState } from 'react';
import { GenderToggle, LeaderboardTable } from '@/components';
import { Gender } from '@/lib/types';
import { getStandings } from '@/lib/data';

export default function LeaderboardPage() {
  const [gender, setGender] = useState<Gender>('mens');
  const standings = getStandings(gender);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl mb-2">Leaderboard</h1>
          <p className="text-[var(--foreground-muted)]">
            Conference USA {gender === 'mens' ? "Men's" : "Women's"} Basketball - Season Four Factors
          </p>
        </div>
        <GenderToggle value={gender} onChange={setGender} />
      </div>

      {/* Legend */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
            <span className="text-[var(--foreground-muted)]">Offensive Factors (Team)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent-secondary)' }} />
            <span className="text-[var(--foreground-muted)]">Defensive Factors (Opponent)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent-success)' }} />
            <span className="text-[var(--foreground-muted)]">Top Tier</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent-secondary)' }} />
            <span className="text-[var(--foreground-muted)]">Bottom Tier</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {standings.length > 0 ? (
          <LeaderboardTable standings={standings} gender={gender} />
        ) : (
          <div className="p-12 text-center">
            <p className="text-[var(--foreground-muted)]">
              No standings data available. Please run the data fetch script.
            </p>
          </div>
        )}
      </div>

      {/* Factor descriptions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--accent-primary)' }}>
            Offensive Factors
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-primary)]">eFG%</dt>
              <dd className="text-[var(--foreground-muted)]">Effective field goal percentage (accounts for 3-pointers)</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-primary)]">TOV%</dt>
              <dd className="text-[var(--foreground-muted)]">Turnover rate per possession (lower is better)</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-primary)]">ORB%</dt>
              <dd className="text-[var(--foreground-muted)]">Offensive rebound percentage</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-primary)]">FTR</dt>
              <dd className="text-[var(--foreground-muted)]">Free throw rate (FTM per FGA)</dd>
            </div>
          </dl>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--accent-secondary)' }}>
            Defensive Factors (What They Allow)
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-secondary)]">oeFG%</dt>
              <dd className="text-[var(--foreground-muted)]">Opponent eFG% allowed (lower is better)</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-secondary)]">oTOV%</dt>
              <dd className="text-[var(--foreground-muted)]">Opponent turnover rate forced (higher is better)</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-secondary)]">oORB%</dt>
              <dd className="text-[var(--foreground-muted)]">Opponent ORB% allowed (lower is better)</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-secondary)]">oFTR</dt>
              <dd className="text-[var(--foreground-muted)]">Opponent free throw rate allowed (lower is better)</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
