'use client';

import { GameTeamStats } from '@/lib/types';
import { WaterfallChart } from './WaterfallChart';

interface FourFactorsSectionProps {
  homeTeam: GameTeamStats;
  awayTeam: GameTeamStats;
}

export function FourFactorsSection({ homeTeam, awayTeam }: FourFactorsSectionProps) {
  return (
    <div>
      <WaterfallChart
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />

      {/* Info tooltip for points mode */}
      <p className="mt-4 text-xs text-[var(--foreground-muted)] text-center">
        Point impact estimated per 1% difference: eFG% ±1.77, TOV% ±1.34, ORB% ±0.62, FTR ±0.25 pts/100 poss.
      </p>
    </div>
  );
}
