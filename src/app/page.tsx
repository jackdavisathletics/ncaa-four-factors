'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GenderToggle, TeamSearch, SeasonSelector, FourFactorsAccordion, GamesCarousel } from '@/components';
import { Gender, Season, DEFAULT_SEASON } from '@/lib/types';
import { getRecentGames, getConferences, getTeams } from '@/lib/data';

function HomePageContent() {
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

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (gender !== 'mens') params.set('gender', gender);
    if (season !== DEFAULT_SEASON) params.set('season', season);
    if (selectedConference !== 'all') params.set('conference', selectedConference);

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : '/';
    router.replace(newUrl, { scroll: false });
  }, [gender, season, selectedConference, router]);

  const conferences = getConferences(gender, season);
  const teams = getTeams(gender, season);
  const teamConferenceMap = new Map(teams.map(t => [t.id, t.conferenceId]));

  const allRecentGames = getRecentGames(gender, 100, season);
  const recentGames = selectedConference === 'all'
    ? allRecentGames.slice(0, 12)
    : allRecentGames
        .filter(game => {
          const homeConf = teamConferenceMap.get(game.homeTeam.teamId);
          const awayConf = teamConferenceMap.get(game.awayTeam.teamId);
          return homeConf === selectedConference || awayConf === selectedConference;
        })
        .slice(0, 12);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Hero Section - Mobile Optimized */}
      <section className="text-center mb-8 sm:mb-16 stagger-children relative z-10">
        <img
          src="/four-factors-logo.png"
          alt="Four Factors Logo"
          className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 mx-auto mb-2 sm:mb-4 object-contain"
        />
        <h1 className="text-4xl sm:text-5xl lg:text-7xl mb-2 sm:mb-4 glow-text" style={{ color: 'var(--accent-primary)' }}>
          Four Factors
        </h1>
        <p className="text-base sm:text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
          Understand college basketball through the lens of Dean Oliver&apos;s Four Factors.
          <span className="hidden sm:inline"> Every game, every team, every stat that matters.</span>
        </p>

        {/* Gender Toggle and Season Selector - Stack on mobile */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <GenderToggle value={gender} onChange={(g) => {
            setGender(g);
            setSelectedConference('all');
          }} />
          <SeasonSelector value={season} onChange={setSeason} />
        </div>

        {/* Search - Full width on mobile */}
        <div className="flex justify-center px-2 sm:px-0">
          <TeamSearch gender={gender} season={season} placeholder="Search for a team..." />
        </div>
      </section>

      {/* Four Factors Explanation - Accordion on mobile, grid on desktop */}
      <section className="mb-8 sm:mb-16">
        <FourFactorsAccordion />
      </section>

      {/* Recent Games */}
      <section>
        {/* Header - Stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl">Recent Games</h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <select
              value={selectedConference}
              onChange={(e) => setSelectedConference(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-sm bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="all">All Conferences</option>
              {conferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.name}
                </option>
              ))}
            </select>
            <span className="hidden sm:inline text-sm text-[var(--foreground-muted)]">
              {gender === 'mens' ? "Men's" : "Women's"} Basketball
            </span>
          </div>
        </div>

        {/* Games - Carousel on mobile, grid on desktop */}
        {recentGames.length > 0 ? (
          <GamesCarousel games={recentGames} gender={gender} season={season} />
        ) : (
          <div className="card p-8 sm:p-12 text-center">
            <p className="text-[var(--foreground-muted)]">
              {selectedConference === 'all'
                ? 'No games found. Data may still be loading.'
                : 'No recent games found for this conference.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
