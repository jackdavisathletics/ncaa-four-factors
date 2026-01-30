'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GenderToggle, LeaderboardTable } from '@/components';
import { Gender } from '@/lib/types';
import { getStandings, getConferences, getTeamConference } from '@/lib/data';

export type ViewMode = 'percentages' | 'points-impact';

function LeaderboardPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [gender, setGender] = useState<Gender>(() => {
    const g = searchParams.get('gender');
    return g === 'womens' ? 'womens' : 'mens';
  });
  const [selectedConference, setSelectedConference] = useState<string>(() => {
    return searchParams.get('conference') || 'all';
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const v = searchParams.get('view');
    return v === 'points-impact' ? 'points-impact' : 'percentages';
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (gender !== 'mens') params.set('gender', gender);
    if (selectedConference !== 'all') params.set('conference', selectedConference);
    if (viewMode !== 'percentages') params.set('view', viewMode);

    const queryString = params.toString();
    const newUrl = queryString ? `/leaderboard?${queryString}` : '/leaderboard';
    router.replace(newUrl, { scroll: false });
  }, [gender, selectedConference, viewMode, router]);

  const conferences = getConferences(gender);
  const allStandings = getStandings(gender);

  const standings = useMemo(() => {
    if (selectedConference === 'all') {
      return allStandings;
    }
    return allStandings.filter(team => {
      const conference = getTeamConference(gender, team.teamId);
      return conference?.id === selectedConference;
    });
  }, [allStandings, selectedConference, gender]);

  const currentConferenceName = selectedConference === 'all'
    ? 'All Conferences'
    : conferences.find(c => c.id === selectedConference)?.name || 'All Conferences';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl mb-2">Leaderboard</h1>
          <p className="text-[var(--foreground-muted)]">
            {currentConferenceName} {gender === 'mens' ? "Men's" : "Women's"} Basketball - Season Four Factors
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
            <button
              onClick={() => setViewMode('percentages')}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === 'percentages'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--surface)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              Percentages
            </button>
            <button
              onClick={() => setViewMode('points-impact')}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === 'points-impact'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--surface)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              Points Impact
            </button>
          </div>
          <select
            value={selectedConference}
            onChange={(e) => setSelectedConference(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer"
          >
            <option value="all">All Conferences</option>
            {conferences.map(conf => (
              <option key={conf.id} value={conf.id}>
                {conf.name}
              </option>
            ))}
          </select>
          <GenderToggle value={gender} onChange={setGender} />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {standings.length > 0 ? (
          <LeaderboardTable standings={standings} gender={gender} viewMode={viewMode} selectedConference={selectedConference} />
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

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">Loading...</div>}>
      <LeaderboardPageContent />
    </Suspense>
  );
}
