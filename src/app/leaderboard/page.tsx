'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GenderToggle, LeaderboardTable, SeasonSelector } from '@/components';
import { Gender, Season, DEFAULT_SEASON } from '@/lib/types';
import { getStandings, getConferences, getTeamConference } from '@/lib/data';

export type ViewMode = 'percentages' | 'points-impact';

function LeaderboardPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [gender, setGender] = useState<Gender>(() => {
    const g = searchParams.get('gender');
    return g === 'womens' ? 'womens' : 'mens';
  });
  const [season, setSeason] = useState<Season>(() => {
    const s = searchParams.get('season');
    return (s === '2024-25' ? '2024-25' : DEFAULT_SEASON) as Season;
  });
  const [selectedConference, setSelectedConference] = useState<string>(() => {
    return searchParams.get('conference') || 'all';
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const v = searchParams.get('view');
    return v === 'points-impact' ? 'points-impact' : 'percentages';
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (gender !== 'mens') params.set('gender', gender);
    if (season !== DEFAULT_SEASON) params.set('season', season);
    if (selectedConference !== 'all') params.set('conference', selectedConference);
    if (viewMode !== 'percentages') params.set('view', viewMode);

    const queryString = params.toString();
    const newUrl = queryString ? `/leaderboard?${queryString}` : '/leaderboard';
    router.replace(newUrl, { scroll: false });
  }, [gender, season, selectedConference, viewMode, router]);

  const conferences = getConferences(gender, season);
  const allStandings = getStandings(gender, season);

  const standings = useMemo(() => {
    if (selectedConference === 'all') {
      return allStandings;
    }
    return allStandings.filter(team => {
      const conference = getTeamConference(gender, team.teamId, season);
      return conference?.id === selectedConference;
    });
  }, [allStandings, selectedConference, gender, season]);

  const currentConferenceName = selectedConference === 'all'
    ? 'All Conferences'
    : conferences.find(c => c.id === selectedConference)?.name || 'All Conferences';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Header - Mobile optimized */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl mb-1 sm:mb-2">Leaderboard</h1>
            <p className="text-sm sm:text-base text-[var(--foreground-muted)]">
              {currentConferenceName} {gender === 'mens' ? "Men's" : "Women's"} Basketball
            </p>
          </div>

          {/* Mobile: Filter toggle button */}
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="sm:hidden flex items-center justify-between w-full px-4 py-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]"
          >
            <span className="text-sm font-medium">Filters & Options</span>
            <svg
              className={`w-5 h-5 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Desktop: Always visible filters */}
          <div className="hidden sm:flex items-center gap-4">
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
            <SeasonSelector value={season} onChange={setSeason} />
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

        {/* Mobile: Expandable filters */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-200 ${
            filtersExpanded ? 'max-h-96 mt-4' : 'max-h-0'
          }`}
        >
          <div className="space-y-3 p-4 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]">
            {/* View Mode */}
            <div>
              <label className="block text-xs text-[var(--foreground-muted)] mb-2 uppercase tracking-wide">View Mode</label>
              <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
                <button
                  onClick={() => setViewMode('percentages')}
                  className={`flex-1 px-3 py-2 text-sm transition-colors ${
                    viewMode === 'percentages'
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--surface)] text-[var(--foreground-muted)]'
                  }`}
                >
                  Percentages
                </button>
                <button
                  onClick={() => setViewMode('points-impact')}
                  className={`flex-1 px-3 py-2 text-sm transition-colors ${
                    viewMode === 'points-impact'
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--surface)] text-[var(--foreground-muted)]'
                  }`}
                >
                  Points Impact
                </button>
              </div>
            </div>

            {/* Season */}
            <div>
              <label className="block text-xs text-[var(--foreground-muted)] mb-2 uppercase tracking-wide">Season</label>
              <SeasonSelector value={season} onChange={setSeason} />
            </div>

            {/* Conference */}
            <div>
              <label className="block text-xs text-[var(--foreground-muted)] mb-2 uppercase tracking-wide">Conference</label>
              <select
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] text-sm"
              >
                <option value="all">All Conferences</option>
                {conferences.map(conf => (
                  <option key={conf.id} value={conf.id}>
                    {conf.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs text-[var(--foreground-muted)] mb-2 uppercase tracking-wide">Gender</label>
              <GenderToggle value={gender} onChange={setGender} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {standings.length > 0 ? (
          <LeaderboardTable standings={standings} gender={gender} viewMode={viewMode} selectedConference={selectedConference} />
        ) : (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-[var(--foreground-muted)]">
              No standings data available. Please run the data fetch script.
            </p>
          </div>
        )}
      </div>

      {/* Factor descriptions - Stack on mobile */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--accent-primary)' }}>
            Offensive Factors
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-primary)] shrink-0">eFG%</dt>
              <dd className="text-[var(--foreground-muted)]">Effective field goal percentage (accounts for 3-pointers)</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-primary)] shrink-0">TOV%</dt>
              <dd className="text-[var(--foreground-muted)]">Turnover rate per possession (lower is better)</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-primary)] shrink-0">ORB%</dt>
              <dd className="text-[var(--foreground-muted)]">Offensive rebound percentage</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-primary)] shrink-0">FTR</dt>
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
              <dt className="font-mono text-[var(--accent-secondary)] shrink-0">oeFG%</dt>
              <dd className="text-[var(--foreground-muted)]">Opponent eFG% allowed (lower is better)</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-secondary)] shrink-0">oTOV%</dt>
              <dd className="text-[var(--foreground-muted)]">Opponent turnover rate forced (higher is better)</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-secondary)] shrink-0">oORB%</dt>
              <dd className="text-[var(--foreground-muted)]">Opponent ORB% allowed (lower is better)</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-mono text-[var(--accent-secondary)] shrink-0">oFTR</dt>
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
