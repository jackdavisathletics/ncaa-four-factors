'use client';

import { GameTeamStats, LEAGUE_EFFICIENCY, LEAGUE_OREB_PCT } from '@/lib/types';
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
        Point contributions calculated using Dean Oliver&apos;s Four Factors formulas
        (LgEffic={LEAGUE_EFFICIENCY}, LgOR%={Math.round(LEAGUE_OREB_PCT * 100)}%).
      </p>
    </div>
  );
}
