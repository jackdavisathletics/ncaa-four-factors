'use client';

import { useState, useMemo } from 'react';
import { GameTeamStats, calculatePossessions } from '@/lib/types';
import { FourFactorsChart, DisplayMode } from './FourFactorsChart';

interface FourFactorsSectionProps {
  homeTeam: GameTeamStats;
  awayTeam: GameTeamStats;
}

export function FourFactorsSection({ homeTeam, awayTeam }: FourFactorsSectionProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('percentage');

  // Calculate actual game possessions (average of both teams' estimates)
  const possessions = useMemo(() => {
    const homePoss = calculatePossessions(homeTeam);
    const awayPoss = calculatePossessions(awayTeam);
    return Math.round((homePoss + awayPoss) / 2);
  }, [homeTeam, awayTeam]);

  return (
    <div>
      {/* Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg bg-[var(--background-tertiary)] p-1">
          <button
            onClick={() => setDisplayMode('percentage')}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
              ${displayMode === 'percentage'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }
            `}
          >
            Percentages
          </button>
          <button
            onClick={() => setDisplayMode('points')}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
              ${displayMode === 'points'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }
            `}
          >
            Points Impact
          </button>
        </div>
      </div>

      {/* Team labels */}
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: awayTeam.teamColor + '20' }}
          >
            {awayTeam.teamLogo ? (
              <img
                src={awayTeam.teamLogo}
                alt={awayTeam.teamName}
                width={16}
                height={16}
                className="object-contain"
              />
            ) : null}
          </div>
          <span className="font-medium">{awayTeam.teamAbbreviation}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{homeTeam.teamAbbreviation}</span>
          <div
            className="w-6 h-6 rounded flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: homeTeam.teamColor + '20' }}
          >
            {homeTeam.teamLogo ? (
              <img
                src={homeTeam.teamLogo}
                alt={homeTeam.teamName}
                width={16}
                height={16}
                className="object-contain"
              />
            ) : null}
          </div>
        </div>
      </div>

      <FourFactorsChart
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        displayMode={displayMode}
        possessions={possessions}
      />

      {/* Info tooltip for points mode */}
      {displayMode === 'points' && (
        <p className="mt-4 text-xs text-[var(--foreground-muted)] text-center">
          Points impact calculated using {possessions} possessions (actual game pace).
          Coefficients from &quot;Dean Oliver&apos;s Four Factors Revisited&quot; (2023).
        </p>
      )}
    </div>
  );
}
