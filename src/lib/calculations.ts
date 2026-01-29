import { BoxScoreStats, FourFactors } from './types';

/**
 * Calculate Effective Field Goal Percentage
 * eFG% = (FGM + 0.5 * 3PM) / FGA
 * Adjusts for the fact that 3-pointers are worth more
 */
export function calculateEfg(stats: Pick<BoxScoreStats, 'fgm' | 'fg3m' | 'fga'>): number {
  if (stats.fga === 0) return 0;
  return ((stats.fgm + 0.5 * stats.fg3m) / stats.fga) * 100;
}

/**
 * Calculate Turnover Rate
 * TOV% = TOV / (FGA + 0.44 * FTA + TOV)
 * Estimates turnovers per possession
 */
export function calculateTov(stats: Pick<BoxScoreStats, 'turnovers' | 'fga' | 'fta'>): number {
  const possessions = stats.fga + 0.44 * stats.fta + stats.turnovers;
  if (possessions === 0) return 0;
  return (stats.turnovers / possessions) * 100;
}

/**
 * Calculate Offensive Rebound Percentage
 * ORB% = ORB / (ORB + Opponent DRB)
 * Percentage of available offensive rebounds grabbed
 */
export function calculateOrb(ownOreb: number, oppDreb: number): number {
  const total = ownOreb + oppDreb;
  if (total === 0) return 0;
  return (ownOreb / total) * 100;
}

/**
 * Calculate Free Throw Rate
 * FTR = FTM / FGA
 * Free throws made per field goal attempt
 */
export function calculateFtr(stats: Pick<BoxScoreStats, 'ftm' | 'fga'>): number {
  if (stats.fga === 0) return 0;
  return (stats.ftm / stats.fga) * 100;
}

/**
 * Calculate all four factors from box score stats
 */
export function calculateFourFactors(
  stats: BoxScoreStats,
  opponentDreb: number
): FourFactors {
  return {
    efg: calculateEfg(stats),
    tov: calculateTov(stats),
    orb: calculateOrb(stats.oreb, opponentDreb),
    ftr: calculateFtr(stats),
  };
}

/**
 * Calculate the differential between two teams for a factor
 * Positive means team1 has the advantage (accounting for factor direction)
 */
export function calculateDifferential(
  team1Value: number,
  team2Value: number,
  higherIsBetter: boolean
): number {
  const diff = team1Value - team2Value;
  return higherIsBetter ? diff : -diff;
}

/**
 * Determine winner advantage explanation based on four factors
 */
export function explainGameOutcome(
  winner: FourFactors,
  loser: FourFactors
): { factor: string; advantage: number; description: string }[] {
  const factors = [
    {
      key: 'efg' as const,
      name: 'Shooting Efficiency',
      higherBetter: true,
    },
    {
      key: 'tov' as const,
      name: 'Ball Security',
      higherBetter: false,
    },
    {
      key: 'orb' as const,
      name: 'Second Chances',
      higherBetter: true,
    },
    {
      key: 'ftr' as const,
      name: 'Free Throw Generation',
      higherBetter: true,
    },
  ];

  return factors.map(({ key, name, higherBetter }) => {
    const winnerVal = winner[key];
    const loserVal = loser[key];
    const rawDiff = winnerVal - loserVal;
    const advantage = higherBetter ? rawDiff : -rawDiff;

    let description: string;
    if (Math.abs(advantage) < 1) {
      description = 'Even';
    } else if (advantage > 0) {
      description = `Winner +${Math.abs(rawDiff).toFixed(1)}`;
    } else {
      description = `Loser +${Math.abs(rawDiff).toFixed(1)}`;
    }

    return { factor: name, advantage, description };
  }).sort((a, b) => b.advantage - a.advantage);
}

/**
 * Calculate season averages for four factors
 */
export function calculateSeasonAverages(
  games: { own: FourFactors; opp: FourFactors }[]
): { own: FourFactors; opp: FourFactors } {
  if (games.length === 0) {
    return {
      own: { efg: 0, tov: 0, orb: 0, ftr: 0 },
      opp: { efg: 0, tov: 0, orb: 0, ftr: 0 },
    };
  }

  const sum = games.reduce(
    (acc, game) => ({
      own: {
        efg: acc.own.efg + game.own.efg,
        tov: acc.own.tov + game.own.tov,
        orb: acc.own.orb + game.own.orb,
        ftr: acc.own.ftr + game.own.ftr,
      },
      opp: {
        efg: acc.opp.efg + game.opp.efg,
        tov: acc.opp.tov + game.opp.tov,
        orb: acc.opp.orb + game.opp.orb,
        ftr: acc.opp.ftr + game.opp.ftr,
      },
    }),
    {
      own: { efg: 0, tov: 0, orb: 0, ftr: 0 },
      opp: { efg: 0, tov: 0, orb: 0, ftr: 0 },
    }
  );

  const count = games.length;
  return {
    own: {
      efg: sum.own.efg / count,
      tov: sum.own.tov / count,
      orb: sum.own.orb / count,
      ftr: sum.own.ftr / count,
    },
    opp: {
      efg: sum.opp.efg / count,
      tov: sum.opp.tov / count,
      orb: sum.opp.orb / count,
      ftr: sum.opp.ftr / count,
    },
  };
}
