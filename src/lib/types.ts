// Gender type for routing and data selection
export type Gender = 'mens' | 'womens';

// Team metadata
export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  color: string;
  alternateColor: string;
  conference: string;
  conferenceId: string;
}

// Four Factors base interface
export interface FourFactors {
  efg: number;  // Effective FG% (0-100)
  tov: number;  // Turnover Rate (0-100)
  orb: number;  // Offensive Rebound % (0-100)
  ftr: number;  // Free Throw Rate (0-100)
}

// Raw box score stats needed to calculate four factors
export interface BoxScoreStats {
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  turnovers: number;  // Raw turnover count (not to be confused with tov% in FourFactors)
}

// Team stats for a single game
export interface GameTeamStats extends FourFactors, BoxScoreStats {
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  teamLogo: string;
  teamColor: string;
  score: number;
  isHome: boolean;
}

// Complete game record
export interface Game {
  id: string;
  date: string;
  venue: string;
  homeTeam: GameTeamStats;
  awayTeam: GameTeamStats;
  isComplete: boolean;
  isConferenceGame: boolean;
}

// Team season standings with aggregated four factors
export interface TeamStandings {
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  teamLogo: string;
  teamColor: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  // Own four factors (season averages)
  efg: number;
  tov: number;
  orb: number;
  ftr: number;
  // Opponent four factors (what they allow)
  oppEfg: number;
  oppTov: number;
  oppOrb: number;
  oppFtr: number;
  // Points
  ppg: number;
  oppPpg: number;
}

// Sort configuration for leaderboard
export type SortField =
  | 'wins'
  | 'efg' | 'tov' | 'orb' | 'ftr'
  | 'oppEfg' | 'oppTov' | 'oppOrb' | 'oppFtr';

export type SortDirection = 'asc' | 'desc';

// Factor metadata for display
export interface FactorMeta {
  key: keyof FourFactors;
  label: string;
  shortLabel: string;
  description: string;
  higherIsBetter: boolean;
  format: (value: number) => string;
  // Points per 100 possessions impact per 1% change
  // From: "Dean Oliver's Four Factors Revisited" (2023)
  pointsImpact: number;
}

// Average possessions per team per game in college basketball (~67)
export const AVG_POSSESSIONS_PER_GAME = 67;

/**
 * Calculate possessions from box score stats
 * Formula: Possessions ≈ FGA - OREB + TOV + 0.44 × FTA
 */
export function calculatePossessions(stats: BoxScoreStats): number {
  return stats.fga - stats.oreb + stats.turnovers + 0.44 * stats.fta;
}

export const FOUR_FACTORS_META: FactorMeta[] = [
  {
    key: 'efg',
    label: 'Effective FG%',
    shortLabel: 'eFG%',
    description: 'Adjusts field goal percentage to account for three-pointers being worth more',
    higherIsBetter: true,
    format: (v) => `${v.toFixed(1)}%`,
    pointsImpact: 1.77, // +1.77 pts/100 poss per 1% increase
  },
  {
    key: 'tov',
    label: 'Turnover Rate',
    shortLabel: 'TOV%',
    description: 'Percentage of possessions ending in a turnover',
    higherIsBetter: false,
    format: (v) => `${v.toFixed(1)}%`,
    pointsImpact: -1.34, // -1.34 pts/100 poss per 1% increase (negative because higher TOV% is bad)
  },
  {
    key: 'orb',
    label: 'Offensive Reb%',
    shortLabel: 'ORB%',
    description: 'Percentage of available offensive rebounds grabbed',
    higherIsBetter: true,
    format: (v) => `${v.toFixed(1)}%`,
    pointsImpact: 0.623, // +0.623 pts/100 poss per 1% increase
  },
  {
    key: 'ftr',
    label: 'Free Throw Rate',
    shortLabel: 'FTR',
    description: 'Measures ability to get to the free throw line and convert',
    higherIsBetter: true,
    format: (v) => `${v.toFixed(1)}%`,
    pointsImpact: 0.253, // +0.253 pts/100 poss per 1% increase
  },
];

/**
 * Calculate points impact from a factor differential
 * @param factorKey - The factor key (efg, tov, orb, ftr)
 * @param differential - The percentage point difference (team1 - team2)
 * @param possessions - Actual possessions in the game (uses average if not provided)
 * @returns Points gained/lost from this factor
 */
export function calculatePointsImpact(
  factorKey: keyof FourFactors,
  differential: number,
  possessions: number = AVG_POSSESSIONS_PER_GAME
): number {
  const factor = FOUR_FACTORS_META.find(f => f.key === factorKey);
  if (!factor) return 0;

  // For TOV%, the impact is already negative in the coefficient
  // A positive differential means team1 has higher TOV% (bad for team1)
  // So we multiply by the negative coefficient to get negative points
  const pointsPer100 = differential * factor.pointsImpact;

  return pointsPer100 * (possessions / 100);
}

/**
 * Format points impact for display
 * @param points - Points value
 * @returns Formatted string like "+2.3" or "-1.5"
 */
export function formatPointsImpact(points: number): string {
  const sign = points >= 0 ? '+' : '';
  return `${sign}${points.toFixed(1)}`;
}
