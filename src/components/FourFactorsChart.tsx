'use client';

import { useMemo } from 'react';
import { FOUR_FACTORS_META, GameTeamStats } from '@/lib/types';

interface FourFactorsChartProps {
  homeTeam: GameTeamStats;
  awayTeam: GameTeamStats;
  showLabels?: boolean;
}

export function FourFactorsChart({ homeTeam, awayTeam, showLabels = true }: FourFactorsChartProps) {
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
      const maxValue = Math.max(homeValue, awayValue);
      const minValue = Math.min(homeValue, awayValue);

      // Normalize to 0-50 scale for each side
      const homePercent = maxValue > 0 ? (homeValue / (homeValue + awayValue)) * 100 : 50;
      const awayPercent = 100 - homePercent;

      return {
        ...meta,
        homeValue,
        awayValue,
        homeBetter,
        awayBetter: !homeBetter && diff > 0.5,
        homePercent,
        awayPercent,
        diff,
      };
    });
  }, [homeTeam, awayTeam]);

  const factorColors = [
    'var(--factor-efg)',
    'var(--factor-tov)',
    'var(--factor-orb)',
    'var(--factor-ftr)',
  ];

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
                {factor.higherIsBetter ? '↑ higher is better' : '↓ lower is better'}
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
                {factor.format(factor.homeValue)}
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
                {factor.format(factor.awayValue)}
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
                {factor.homeBetter ? homeTeam.teamAbbreviation : awayTeam.teamAbbreviation} +{factor.diff.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
