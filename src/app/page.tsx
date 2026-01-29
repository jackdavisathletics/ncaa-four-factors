'use client';

import { useState } from 'react';
import { GenderToggle, TeamSearch, GameCard } from '@/components';
import { Gender, FOUR_FACTORS_META } from '@/lib/types';
import { getRecentGames } from '@/lib/data';

export default function HomePage() {
  const [gender, setGender] = useState<Gender>('mens');
  const recentGames = getRecentGames(gender, 12);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16 stagger-children">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl mb-4 glow-text" style={{ color: 'var(--accent-primary)' }}>
          Four Factors
        </h1>
        <p className="text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto mb-8">
          Understand college basketball through the lens of Dean Oliver&apos;s Four Factors.
          Every game, every team, every stat that matters.
        </p>

        {/* Gender Toggle */}
        <div className="flex justify-center mb-8">
          <GenderToggle value={gender} onChange={setGender} />
        </div>

        {/* Search */}
        <div className="flex justify-center">
          <TeamSearch gender={gender} placeholder="Search for a team..." />
        </div>
      </section>

      {/* Four Factors Explanation */}
      <section className="mb-16">
        <h2 className="text-2xl mb-6 text-center">The Four Factors</h2>
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
          <span className="text-sm text-[var(--foreground-muted)]">
            {gender === 'mens' ? "Men's" : "Women's"} Basketball
          </span>
        </div>

        {recentGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {recentGames.map(game => (
              <GameCard key={game.id} game={game} gender={gender} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-[var(--foreground-muted)]">
              No games found. Data may still be loading.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
