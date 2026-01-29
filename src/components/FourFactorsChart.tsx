'use client';

import { useMemo } from 'react';
import { FOUR_FACTORS_META, GameTeamStats, calculatePointsImpact, formatPointsImpact } from '@/lib/types';

export type DisplayMode = 'percentage' | 'points';

interface FourFactorsChartProps {
  homeTeam: GameTeamStats;
  awayTeam: GameTeamStats;
  showLabels?: boolean;
  displayMode?: DisplayMode;
}

export function FourFactorsChart({
  homeTeam,
  awayTeam,
  showLabels = true,
  displayMode = 'percentage'
}: FourFactorsChartProps) {
  const factors = useMemo(() => {
    return FOUR_FACTORS_META.map(meta => {
      const homeValue = homeTeam[meta.key];
      const awayValue = awayTeam[meta.key];

      // Calculate who has the advantage
      const homeBetter = meta.higherIsBetter
        ? homeValue > awayValue
        : homeValue < awayValue;

      // Calculate differential for bar width
      const diff = Math.abs(homeValue - awayValue);

      // Normalize to 0-50 scale for each side
      const homePercent = (homeValue + awayValue) > 0
        ? (homeValue / (homeValue + awayValue)) * 100
        : 50;
      const awayPercent = 100 - homePercent;

      // Calculate points impact
      // For home team: positive diff means home is better (for higherIsBetter factors)
      // For TOV%: higher is worse, so we need to flip the sign
      const homeDiff = homeValue - awayValue;
      const homePointsImpact = calculatePointsImpact(meta.key, homeDiff, true);
      const awayPointsImpact = -homePointsImpact;

      return {
        ...meta,
        homeValue,
        awayValue,
        homeBetter,
        awayBetter: !homeBetter && diff > 0.5,
        homePercent,
        awayPercent,
        diff,
        homePointsImpact,
        awayPointsImpact,
      };
    });
  }, [homeTeam, awayTeam]);

  const factorColors = [
    'var(--factor-efg)',
    'var(--factor-tov)',
    'var(--factor-orb)',
    'var(--factor-ftr)',
  ];

  // Calculate total points impact
  const totalHomePoints = factors.reduce((sum, f) => sum + f.homePointsImpact, 0);
  const totalAwayPoints = factors.reduce((sum, f) => sum + f.awayPointsImpact, 0);

  return (
    <div className="space-y-4">
      {factors.map((factor, index) => (
        <div key={factor.key} className="group">
          {showLabels && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
                {factor.shortLabel}
              </span>
              <span className="text-xs text-[var(--foreground-muted)]">
                {displayMode === 'percentage'
                  ? (factor.higherIsBetter ? '↑ higher is better' : '↓ lower is better')
                  : 'est. points impact'
                }
              </span>
            </div>
          )}

          <div className="relative h-10 flex rounded-lg overflow-hidden bg-[var(--background-tertiary)]">
            {/* Home team bar (left side) */}
            <div
              className="h-full flex items-center justify-end px-3 transition-all duration-500"
              style={{
                width: `${factor.homePercent}%`,
                backgroundColor: factor.homeBetter
                  ? factorColors[index]
                  : 'var(--background-secondary)',
              }}
            >
              <span
                className={`
                  stat-number text-sm font-semibold
                  ${factor.homeBetter ? 'text-[var(--background)]' : 'text-[var(--foreground-muted)]'}
                `}
              >
                {displayMode === 'percentage'
                  ? factor.format(factor.homeValue)
                  : formatPointsImpact(factor.homePointsImpact)
                }
              </span>
            </div>

            {/* Divider */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border)] z-10" />

            {/* Away team bar (right side) */}
            <div
              className="h-full flex items-center px-3 transition-all duration-500"
              style={{
                width: `${factor.awayPercent}%`,
                backgroundColor: factor.awayBetter
                  ? factorColors[index]
                  : 'var(--background-secondary)',
              }}
            >
              <span
                className={`
                  stat-number text-sm font-semibold
                  ${factor.awayBetter ? 'text-[var(--background)]' : 'text-[var(--foreground-muted)]'}
                `}
              >
                {displayMode === 'percentage'
                  ? factor.format(factor.awayValue)
                  : formatPointsImpact(factor.awayPointsImpact)
                }
              </span>
            </div>
          </div>

          {/* Advantage indicator */}
          {factor.diff > 0.5 && (
            <div className="mt-1 flex justify-center">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{
                  color: factorColors[index],
                  backgroundColor: factorColors[index] + '15',
                }}
              >
                {displayMode === 'percentage'
                  ? `${factor.homeBetter ? homeTeam.teamAbbreviation : awayTeam.teamAbbreviation} +${factor.diff.toFixed(1)}`
                  : `${factor.homeBetter ? homeTeam.teamAbbreviation : awayTeam.teamAbbreviation} ${formatPointsImpact(Math.abs(factor.homePointsImpact))} pts`
                }
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Total points impact summary */}
      {displayMode === 'points' && (
        <div className="mt-6 pt-4 border-t border-[var(--border)]">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <p className="text-xs text-[var(--foreground-muted)] uppercase">
                {homeTeam.teamAbbreviation} Total
              </p>
              <p
                className={`stat-number text-xl font-bold ${totalHomePoints >= 0 ? 'text-[var(--accent-success)]' : 'text-[var(--accent-secondary)]'}`}
              >
                {formatPointsImpact(totalHomePoints)}
              </p>
            </div>
            <div className="text-xs text-[var(--foreground-muted)] text-center px-4">
              Est. points from<br />Four Factors edge
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--foreground-muted)] uppercase">
                {awayTeam.teamAbbreviation} Total
              </p>
              <p
                className={`stat-number text-xl font-bold ${totalAwayPoints >= 0 ? 'text-[var(--accent-success)]' : 'text-[var(--accent-secondary)]'}`}
              >
                {formatPointsImpact(totalAwayPoints)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
