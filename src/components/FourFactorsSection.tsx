'use client';

import { useMemo } from 'react';
import { GameTeamStats, calculatePossessions } from '@/lib/types';
import { WaterfallChart } from './WaterfallChart';

interface FourFactorsSectionProps {
  homeTeam: GameTeamStats;
  awayTeam: GameTeamStats;
}

export function FourFactorsSection({ homeTeam, awayTeam }: FourFactorsSectionProps) {
  // Calculate actual game possessions (average of both teams' estimates)
  const possessions = useMemo(() => {
    const homePoss = calculatePossessions(homeTeam);
    const awayPoss = calculatePossessions(awayTeam);
    return Math.round((homePoss + awayPoss) / 2);
  }, [homeTeam, awayTeam]);

  return (
    <div>
      <WaterfallChart
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        possessions={possessions}
      />

      {/* Info tooltip for points mode */}
      <p className="mt-4 text-xs text-[var(--foreground-muted)] text-center">
        Points impact calculated using {possessions} possessions (actual game pace).
        Coefficients from &quot;Dean Oliver&apos;s Four Factors Revisited&quot; (2023).
      </p>
    </div>
  );
}
