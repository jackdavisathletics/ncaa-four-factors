'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FOUR_FACTORS_META, calculateCombinedPointsImpact, formatPointsImpact, FourFactorsAverages, FourFactorsPercentiles, TeamStandings, Team, Gender, Season } from '@/lib/types';
import { CalculatedStats } from '@/lib/data';
import { FactorBar, ScopeToggle, TeamGenderToggle, GamesCarousel, type StatsScope } from '@/components';
import { TeamSeasonSelector } from './TeamSeasonSelector';
import { Game } from '@/lib/types';

const AVERAGE_PACE = 70;

const factorColors = [
  'var(--factor-efg)',
  'var(--factor-tov)',
  'var(--factor-orb)',
  'var(--factor-ftr)',
];

interface TeamPageClientProps {
  team: Team;
  gender: Gender;
  season: Season;
  conferenceName: string;
  games: Game[];
  // DI mode data
  diStats: TeamStandings;
  diAverages: FourFactorsAverages;
  diPercentiles: FourFactorsPercentiles;
  // Conference mode data
  conferenceStats: CalculatedStats;
  conferenceAverages: FourFactorsAverages;
  conferencePercentiles: FourFactorsPercentiles;
}

export function TeamPageClient({
  team,
  gender,
  season,
  conferenceName,
  games,
  diStats,
  diAverages,
  diPercentiles,
  conferenceStats,
  conferenceAverages,
  conferencePercentiles,
}: TeamPageClientProps) {
  const [scope, setScope] = useState<StatsScope>('di');

  // Select data based on scope
  const stats = scope === 'di' ? diStats : conferenceStats;
  const averages = scope === 'di' ? diAverages : conferenceAverages;
  const percentiles = scope === 'di' ? diPercentiles : conferencePercentiles;
  const scopeLabel = scope === 'di' ? 'DI' : conferenceName;
  const gamesLabel = scope === 'di' ? 'all DI games' : 'conference games only';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Team Header */}
      <div className="card p-4 sm:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-4 mb-4">
          <TeamSeasonSelector currentSeason={season} />
          <TeamGenderToggle currentGender={gender} teamId={team.id} />
          <ScopeToggle value={scope} onChange={setScope} conferenceName={conferenceName} />
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {/* Team Logo */}
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
            style={{ backgroundColor: team.color + '20' }}
          >
            {team.logo ? (
              <img
                src={team.logo}
                alt={team.name}
                width={64}
                height={64}
                className="object-contain w-12 h-12 sm:w-16 sm:h-16"
              />
            ) : (
              <span
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: team.color }}
              >
                {team.abbreviation}
              </span>
            )}
          </div>

          {/* Team Info */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
              {gender === 'mens' ? "Men's" : "Women's"} Basketball &bull; {season}
            </p>
            <h1 className="text-3xl sm:text-4xl mb-1 sm:mb-2" style={{ color: team.color }}>
              {team.displayName}
            </h1>
            <p className="text-[var(--foreground-muted)]">{team.conference}</p>
          </div>

          {/* Record */}
          {diStats && (
            <div className="text-center sm:text-right mt-2 sm:mt-0">
              <p className="text-3xl sm:text-4xl font-bold stat-number">
                {diStats.wins}-{diStats.losses}
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                {diStats.confWins}-{diStats.confLosses} Conf
              </p>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                {diStats.ppg.toFixed(1)} PPG / {diStats.oppPpg.toFixed(1)} Opp
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Conference games notice */}
      {scope === 'conference' && (
        <div className="mb-4 text-sm text-[var(--foreground-muted)] text-center">
          Showing stats from {conferenceStats.gamesPlayed} conference game{conferenceStats.gamesPlayed !== 1 ? 's' : ''}
          {conferenceStats.gamesPlayed === 0 && ' (no conference games played yet)'}
        </div>
      )}

      {/* Four Factors Summary */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Offensive Factors */}
          <div className="card p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl mb-3 sm:mb-4" style={{ color: 'var(--accent-primary)' }}>
              Offensive Factors
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {FOUR_FACTORS_META.map((factor) => {
                const value = stats[factor.key as keyof typeof stats] as number;
                const average = averages[factor.key as keyof FourFactorsAverages];
                const factorPercentiles = percentiles[factor.key as keyof FourFactorsPercentiles];
                return (
                  <FactorBar
                    key={factor.key}
                    label={factor.label}
                    value={value}
                    average={average}
                    percentiles={factorPercentiles}
                    higherIsBetter={factor.higherIsBetter}
                    teamAbbreviation={team.abbreviation}
                    scopeLabel={scopeLabel}
                  />
                );
              })}
            </div>
          </div>

          {/* Defensive Factors */}
          <div className="card p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl mb-3 sm:mb-4" style={{ color: 'var(--accent-secondary)' }}>
              Defensive Factors (Allowed)
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {[
                { key: 'oppEfg' as const, label: 'Opp eFG%', higherIsBetter: false },
                { key: 'oppTov' as const, label: 'Opp TOV%', higherIsBetter: true },
                { key: 'oppOrb' as const, label: 'Opp ORB%', higherIsBetter: false },
                { key: 'oppFtr' as const, label: 'Opp FTR', higherIsBetter: false },
              ].map((factor) => {
                const value = stats[factor.key as keyof typeof stats] as number;
                const average = averages[factor.key as keyof FourFactorsAverages];
                const factorPercentiles = percentiles[factor.key as keyof FourFactorsPercentiles];
                return (
                  <FactorBar
                    key={factor.key}
                    label={factor.label}
                    value={value}
                    average={average}
                    percentiles={factorPercentiles}
                    higherIsBetter={factor.higherIsBetter}
                    teamAbbreviation={team.abbreviation}
                    scopeLabel={scopeLabel}
                  />
                );
              })}
            </div>
          </div>

          {/* Points Impact - Waterfall Chart */}
          <div className="card p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl mb-3 sm:mb-4" style={{ color: 'var(--accent-success)' }}>
              Points Impact
            </h2>
            <div className="space-y-3">
              {(() => {
                let runningTotal = 0;
                const waterfallData = FOUR_FACTORS_META.map((factor, index) => {
                  const offValue = stats[factor.key as keyof typeof stats] as number;
                  const defKey = `opp${factor.key.charAt(0).toUpperCase()}${factor.key.slice(1)}` as keyof typeof stats;
                  const defValue = stats[defKey] as number;

                  const pointsImpact = calculateCombinedPointsImpact(factor.key, offValue, defValue, averages, AVERAGE_PACE);

                  const previousTotal = runningTotal;
                  runningTotal += pointsImpact;

                  return {
                    label: factor.shortLabel,
                    pointsImpact,
                    previousTotal,
                    runningTotal,
                    color: factorColors[index],
                  };
                });

                const totalImpact = runningTotal;

                let maxAbsValue = Math.abs(totalImpact);
                waterfallData.forEach(bar => {
                  maxAbsValue = Math.max(maxAbsValue, Math.abs(bar.runningTotal), Math.abs(bar.previousTotal));
                });
                maxAbsValue = Math.max(maxAbsValue * 1.2, 5);

                const valueToPercent = (value: number) => 50 + (value / maxAbsValue) * 50;

                return (
                  <>
                    {waterfallData.map((data, index) => {
                      const startPercent = valueToPercent(data.previousTotal);
                      const endPercent = valueToPercent(data.runningTotal);
                      const left = Math.min(startPercent, endPercent);
                      const width = Math.abs(endPercent - startPercent);
                      const isPositive = data.pointsImpact >= 0;

                      return (
                        <div key={data.label}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                              {data.label}
                            </span>
                            <span
                              className="stat-number text-xs sm:text-sm font-bold"
                              style={{ color: isPositive ? 'var(--accent-success)' : 'var(--accent-secondary)' }}
                            >
                              {formatPointsImpact(data.pointsImpact)}
                            </span>
                          </div>
                          <div className="h-5 sm:h-6 bg-[var(--background-tertiary)] rounded overflow-hidden relative">
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border)] z-10" />
                            {index > 0 && (
                              <div
                                className="absolute top-0 bottom-0 w-px bg-[var(--foreground-muted)] opacity-30"
                                style={{ left: `${startPercent}%` }}
                              />
                            )}
                            <div
                              className="absolute top-1 bottom-1 rounded transition-all duration-500 flex items-center justify-center"
                              style={{
                                left: `${left}%`,
                                width: `${Math.max(width, 1)}%`,
                                backgroundColor: isPositive ? 'var(--accent-success)' : 'var(--accent-secondary)',
                              }}
                            >
                              {width > 8 && (
                                <span className="text-[10px] sm:text-xs font-bold text-white drop-shadow-sm">
                                  {Math.abs(data.pointsImpact).toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-3 mt-1 border-t border-[var(--border)]">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-medium">Total Impact</span>
                        <span
                          className="stat-number text-lg sm:text-xl font-bold"
                          style={{ color: totalImpact >= 0 ? 'var(--accent-success)' : 'var(--accent-secondary)' }}
                        >
                          {formatPointsImpact(totalImpact)} pts
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-1">
                        vs {scopeLabel} avg @ {AVERAGE_PACE} pace ({gamesLabel})
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Games List */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl">Games ({games.length})</h2>
          <Link
            href={`/leaderboard`}
            className="text-sm text-[var(--accent-primary)] hover:underline"
          >
            View Leaderboard →
          </Link>
        </div>

        {games.length > 0 ? (
          <GamesCarousel games={games} gender={gender} season={season} showFactors />
        ) : (
          <div className="card p-8 sm:p-12 text-center">
            <p className="text-[var(--foreground-muted)]">No games found for this team.</p>
          </div>
        )}
      </section>
    </div>
  );
}
