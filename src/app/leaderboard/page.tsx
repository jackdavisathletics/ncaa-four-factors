'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GenderToggle, LeaderboardTable, SeasonSelector, ScopeToggle, type StatsScope } from '@/components';
import { Gender, Season, DEFAULT_SEASON } from '@/lib/types';
import { getStandings, getConferences, getTeamConference, getConferenceOnlyStandings } from '@/lib/data';

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
    return (['2024-25', '2023-24', '2022-23', '2021-22'].includes(s || '') ? s : DEFAULT_SEASON) as Season;
  });
  const [selectedConference, setSelectedConference] = useState<string>(() => {
    return searchParams.get('conference') || 'all';
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const v = searchParams.get('view');
    return v === 'points-impact' ? 'points-impact' : 'percentages';
  });
  const [scope, setScope] = useState<StatsScope>(() => {
    const s = searchParams.get('scope');
    return s === 'conference' ? 'conference' : 'di';
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (gender !== 'mens') params.set('gender', gender);
    if (season !== DEFAULT_SEASON) params.set('season', season);
    if (selectedConference !== 'all') params.set('conference', selectedConference);
    if (viewMode !== 'percentages') params.set('view', viewMode);
    if (scope !== 'di') params.set('scope', scope);

    const queryString = params.toString();
    const newUrl = queryString ? `/leaderboard?${queryString}` : '/leaderboard';
    router.replace(newUrl, { scroll: false });
  }, [gender, season, selectedConference, viewMode, scope, router]);

  const conferences = getConferences(gender, season);

  // Get standings based on scope
  const standings = useMemo(() => {
    if (scope === 'conference') {
      // Conference mode: stats from conference games only
      const confStandings = getConferenceOnlyStandings(gender, season, selectedConference);
      return confStandings;
    } else {
      // DI mode: stats from all DI games
      const allStandings = getStandings(gender, season);
      if (selectedConference === 'all') {
        return allStandings;
      }
      return allStandings.filter(team => {
        const conference = getTeamConference(gender, team.teamId, season);
        return conference?.id === selectedConference;
      });
    }
  }, [gender, season, selectedConference, scope]);

  const currentConferenceName = selectedConference === 'all'
    ? 'All Conferences'
    : conferences.find(c => c.id === selectedConference)?.name || 'All Conferences';

  const scopeLabel = scope === 'di' ? 'all DI games' : 'conference games only';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Header - Mobile optimized */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl mb-1 sm:mb-2">Leaderboard</h1>
            <p className="text-sm sm:text-base text-[var(--foreground-muted)]">
              {currentConferenceName} {gender === 'mens' ? "Men's" : "Women's"} Basketball
              <span className="text-xs ml-2">({scopeLabel})</span>
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
            <ScopeToggle value={scope} onChange={setScope} conferenceName="Conf" />
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg p-1 bg-[var(--background-tertiary)] border border-[var(--border)]">
              <button
                onClick={() => setViewMode(viewMode === 'percentages' ? 'points-impact' : 'percentages')}
                className={`
                  relative px-4 py-1.5 rounded-md text-sm font-semibold tracking-wide
                  transition-all duration-200
                  ${viewMode === 'percentages'
                    ? 'bg-[var(--accent-primary)] text-[var(--background)] shadow-lg'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }
                `}
              >
                <span className="relative z-10">%</span>
                {viewMode === 'percentages' && (
                  <div className="absolute inset-0 rounded-md bg-[var(--accent-primary)] opacity-20 blur-md" />
                )}
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'points-impact' ? 'percentages' : 'points-impact')}
                className={`
                  relative px-4 py-1.5 rounded-md text-sm font-semibold tracking-wide
                  transition-all duration-200
                  ${viewMode === 'points-impact'
                    ? 'bg-[var(--accent-primary)] text-[var(--background)] shadow-lg'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }
                `}
                title="Points Impact"
              >
                <span className="relative z-10">Pts</span>
                {viewMode === 'points-impact' && (
                  <div className="absolute inset-0 rounded-md bg-[var(--accent-primary)] opacity-20 blur-md" />
                )}
              </button>
            </div>
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
              <div className="inline-flex rounded-lg p-1 bg-[var(--background-tertiary)] border border-[var(--border)]">
                <button
                  onClick={() => setViewMode(viewMode === 'percentages' ? 'points-impact' : 'percentages')}
                  className={`
                    relative px-4 py-1.5 rounded-md text-sm font-semibold tracking-wide
                    transition-all duration-200
                    ${viewMode === 'percentages'
                      ? 'bg-[var(--accent-primary)] text-[var(--background)] shadow-lg'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }
                  `}
                >
                  <span className="relative z-10">Percentages</span>
                  {viewMode === 'percentages' && (
                    <div className="absolute inset-0 rounded-md bg-[var(--accent-primary)] opacity-20 blur-md" />
                  )}
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'points-impact' ? 'percentages' : 'points-impact')}
                  className={`
                    relative px-4 py-1.5 rounded-md text-sm font-semibold tracking-wide
                    transition-all duration-200
                    ${viewMode === 'points-impact'
                      ? 'bg-[var(--accent-primary)] text-[var(--background)] shadow-lg'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }
                  `}
                >
                  <span className="relative z-10">Points Impact</span>
                  {viewMode === 'points-impact' && (
                    <div className="absolute inset-0 rounded-md bg-[var(--accent-primary)] opacity-20 blur-md" />
                  )}
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

            {/* Scope */}
            <div>
              <label className="block text-xs text-[var(--foreground-muted)] mb-2 uppercase tracking-wide">Stats From</label>
              <ScopeToggle value={scope} onChange={setScope} conferenceName="Conf" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {standings.length > 0 ? (
          <LeaderboardTable standings={standings} gender={gender} viewMode={viewMode} selectedConference={selectedConference} scope={scope} />
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
