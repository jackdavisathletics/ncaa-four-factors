'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GenderToggle, TeamSearch, GameCard, SeasonSelector } from '@/components';
import { Gender, Season, DEFAULT_SEASON, FOUR_FACTORS_META } from '@/lib/types';
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
      {/* Hero Section */}
      <section className="text-center mb-16 stagger-children relative z-10">
        <img
          src="/four-factors-logo.png"
          alt="Four Factors Logo"
          className="w-64 h-64 mx-auto mb-4 object-contain"
        />
        <h1 className="text-5xl sm:text-6xl lg:text-7xl mb-4 glow-text" style={{ color: 'var(--accent-primary)' }}>
          Four Factors
        </h1>
        <p className="text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto mb-8">
          Understand college basketball through the lens of Dean Oliver&apos;s Four Factors.
          Every game, every team, every stat that matters.
        </p>

        {/* Gender Toggle and Season Selector */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <GenderToggle value={gender} onChange={(g) => {
            setGender(g);
            setSelectedConference('all');
          }} />
          <SeasonSelector value={season} onChange={setSeason} />
        </div>

        {/* Search */}
        <div className="flex justify-center">
          <TeamSearch gender={gender} season={season} placeholder="Search for a team..." />
        </div>
      </section>

      {/* Four Factors Explanation */}
      <section className="mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {FOUR_FACTORS_META.map((factor, index) => {
            const colors = [
              'var(--factor-efg)',
              'var(--factor-tov)',
              'var(--factor-orb)',
              'var(--factor-ftr)',
            ];
            return (
              <div
                key={factor.key}
                className="card p-6 text-center group hover:border-opacity-50"
                style={{ '--hover-color': colors[index] } as React.CSSProperties}
              >
                <div
                  className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-3"
                  style={{
                    backgroundColor: colors[index] + '20',
                    color: colors[index],
                  }}
                >
                  {factor.shortLabel}
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-sans)' }}>
                  {factor.label}
                </h3>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {factor.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Games */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl">Recent Games</h2>
          <div className="flex items-center gap-4">
            <select
              value={selectedConference}
              onChange={(e) => setSelectedConference(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm bg-[var(--card-bg)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="all">All Conferences</option>
              {conferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.name}
                </option>
              ))}
            </select>
            <span className="text-sm text-[var(--foreground-muted)]">
              {gender === 'mens' ? "Men's" : "Women's"} Basketball
            </span>
          </div>
        </div>

        {recentGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {recentGames.map(game => (
              <GameCard key={game.id} game={game} gender={gender} season={season} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
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
