// Gender type for routing and data selection
export type Gender = 'mens' | 'womens';

// Season type (format: YYYY-YY)
export type Season = '2025-26' | '2024-25';

// Available seasons (most recent first)
export const AVAILABLE_SEASONS: Season[] = ['2025-26', '2024-25'];

// Default season (current)
export const DEFAULT_SEASON: Season = '2025-26';

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
  | 'record' | 'confRecord'
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

// Four Factors averages structure (used for points impact calculations)
export interface FourFactorsAverages {
  efg: number;
  tov: number;
  orb: number;
  ftr: number;
  oppEfg: number;
  oppTov: number;
  oppOrb: number;
  oppFtr: number;
}

// Percentile thresholds for a single metric
export interface PercentileThresholds {
  p25: number;
  p75: number;
}

// Percentile thresholds for all Four Factors metrics
export interface FourFactorsPercentiles {
  efg: PercentileThresholds;
  tov: PercentileThresholds;
  orb: PercentileThresholds;
  ftr: PercentileThresholds;
  oppEfg: PercentileThresholds;
  oppTov: PercentileThresholds;
  oppOrb: PercentileThresholds;
  oppFtr: PercentileThresholds;
}

/**
 * Calculate averages from standings data
 * This computes the mean of each Four Factor across all teams
 */
export function calculateAveragesFromStandings(standings: TeamStandings[]): FourFactorsAverages {
  if (standings.length === 0) {
    // Fallback defaults if no data
    return {
      efg: 50, tov: 18, orb: 28, ftr: 28,
      oppEfg: 50, oppTov: 18, oppOrb: 28, oppFtr: 28,
    };
  }

  const sum = standings.reduce(
    (acc, team) => ({
      efg: acc.efg + team.efg,
      tov: acc.tov + team.tov,
      orb: acc.orb + team.orb,
      ftr: acc.ftr + team.ftr,
      oppEfg: acc.oppEfg + team.oppEfg,
      oppTov: acc.oppTov + team.oppTov,
      oppOrb: acc.oppOrb + team.oppOrb,
      oppFtr: acc.oppFtr + team.oppFtr,
    }),
    { efg: 0, tov: 0, orb: 0, ftr: 0, oppEfg: 0, oppTov: 0, oppOrb: 0, oppFtr: 0 }
  );

  const count = standings.length;
  return {
    efg: sum.efg / count,
    tov: sum.tov / count,
    orb: sum.orb / count,
    ftr: sum.ftr / count,
    oppEfg: sum.oppEfg / count,
    oppTov: sum.oppTov / count,
    oppOrb: sum.oppOrb / count,
    oppFtr: sum.oppFtr / count,
  };
}

/**
 * Calculate a specific percentile from an array of numbers
 * Uses linear interpolation for values between data points
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/**
 * Calculate 25th and 75th percentile thresholds from standings data
 * This computes percentiles for each Four Factor across all provided teams
 */
export function calculatePercentilesFromStandings(standings: TeamStandings[]): FourFactorsPercentiles {
  if (standings.length === 0) {
    // Fallback defaults if no data
    const defaultThreshold = { p25: 0, p75: 100 };
    return {
      efg: defaultThreshold, tov: defaultThreshold, orb: defaultThreshold, ftr: defaultThreshold,
      oppEfg: defaultThreshold, oppTov: defaultThreshold, oppOrb: defaultThreshold, oppFtr: defaultThreshold,
    };
  }

  const efgValues = standings.map(t => t.efg);
  const tovValues = standings.map(t => t.tov);
  const orbValues = standings.map(t => t.orb);
  const ftrValues = standings.map(t => t.ftr);
  const oppEfgValues = standings.map(t => t.oppEfg);
  const oppTovValues = standings.map(t => t.oppTov);
  const oppOrbValues = standings.map(t => t.oppOrb);
  const oppFtrValues = standings.map(t => t.oppFtr);

  return {
    efg: { p25: calculatePercentile(efgValues, 25), p75: calculatePercentile(efgValues, 75) },
    tov: { p25: calculatePercentile(tovValues, 25), p75: calculatePercentile(tovValues, 75) },
    orb: { p25: calculatePercentile(orbValues, 25), p75: calculatePercentile(orbValues, 75) },
    ftr: { p25: calculatePercentile(ftrValues, 25), p75: calculatePercentile(ftrValues, 75) },
    oppEfg: { p25: calculatePercentile(oppEfgValues, 25), p75: calculatePercentile(oppEfgValues, 75) },
    oppTov: { p25: calculatePercentile(oppTovValues, 25), p75: calculatePercentile(oppTovValues, 75) },
    oppOrb: { p25: calculatePercentile(oppOrbValues, 25), p75: calculatePercentile(oppOrbValues, 75) },
    oppFtr: { p25: calculatePercentile(oppFtrValues, 25), p75: calculatePercentile(oppFtrValues, 75) },
  };
}

// League constants for Dean Oliver's point contribution formulas
// LgEffic: Points per possession (college basketball ~1.02)
export const LEAGUE_EFFICIENCY = 1.02;
// LgOR%: League average offensive rebound percentage (~28%)
export const LEAGUE_OREB_PCT = 0.28;

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
    description: "Measures a team's ability to get to the free throw line",
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

/**
 * Calculate points impact vs baseline average for a single stat
 * @param factorKey - The factor key (efg, tov, orb, ftr)
 * @param value - The team's stat value
 * @param averages - The baseline averages to compare against
 * @param isDefensive - Whether this is a defensive stat (oppEfg, oppTov, etc.)
 * @param possessions - Possessions per game (default 70)
 * @returns Points gained/lost relative to average
 */
export function calculatePointsImpactVsAvg(
  factorKey: keyof FourFactors,
  value: number,
  averages: FourFactorsAverages,
  isDefensive: boolean = false,
  possessions: number = 70
): number {
  const factor = FOUR_FACTORS_META.find(f => f.key === factorKey);
  if (!factor) return 0;

  const avgKey = isDefensive
    ? `opp${factorKey.charAt(0).toUpperCase()}${factorKey.slice(1)}` as keyof FourFactorsAverages
    : factorKey as keyof FourFactorsAverages;
  const baselineAvg = averages[avgKey];

  const differential = value - baselineAvg;
  // For defensive stats, being BELOW average is good (you're allowing less)
  // So we negate the differential for defensive stats
  const adjustedDiff = isDefensive ? -differential : differential;

  const pointsPer100 = adjustedDiff * factor.pointsImpact;
  return pointsPer100 * (possessions / 100);
}

/**
 * Calculate total points impact for a factor (combining offensive and defensive)
 * @param factorKey - The factor key (efg, tov, orb, ftr)
 * @param offValue - Team's offensive stat
 * @param defValue - Team's defensive stat (what they allow)
 * @param averages - The baseline averages to compare against
 * @param possessions - Possessions per game (default 70)
 * @returns Combined points impact (offensive advantage + defensive advantage)
 */
export function calculateCombinedPointsImpact(
  factorKey: keyof FourFactors,
  offValue: number,
  defValue: number,
  averages: FourFactorsAverages,
  possessions: number = 70
): number {
  const offImpact = calculatePointsImpactVsAvg(factorKey, offValue, averages, false, possessions);
  const defImpact = calculatePointsImpactVsAvg(factorKey, defValue, averages, true, possessions);
  return offImpact + defImpact;
}

// ============================================================================
// Dean Oliver's Original Point Contribution Formulas
// These calculate how each factor contributed to a team's point total
// Sum of all four factors ≈ actual scoring margin
// ============================================================================

export interface PointContributions {
  shooting: number;  // Points from shooting efficiency
  turnovers: number; // Points lost/gained from turnovers
  rebounding: number; // Points from offensive rebounding
  freeThrows: number; // Points from free throw generation
  total: number;     // Sum of all contributions
}

/**
 * Calculate points from field goals
 * FG Pts = 2*(FGM - FG3M) + 3*FG3M = 2*FGM + FG3M
 */
function calculateFgPoints(stats: BoxScoreStats): number {
  return 2 * stats.fgm + stats.fg3m;
}

/**
 * Calculate Dean Oliver's Shooting contribution
 * Formula: FG Pts - FGM*LgEffic - (1-LgOR%)*FGX*LgEffic
 *
 * Breakdown:
 * - FG Pts: Actual points scored from field goals
 * - FGM*LgEffic: Expected value if every make was worth average possession
 * - (1-LgOR%)*FGX*LgEffic: Value lost from misses that weren't rebounded
 */
export function calculateShootingContribution(stats: BoxScoreStats): number {
  const fgPts = calculateFgPoints(stats);
  const fgx = stats.fga - stats.fgm; // Missed field goals

  return fgPts - stats.fgm * LEAGUE_EFFICIENCY - (1 - LEAGUE_OREB_PCT) * fgx * LEAGUE_EFFICIENCY;
}

/**
 * Calculate Dean Oliver's Turnover contribution
 * Formula: -LgEffic * TOV
 *
 * Each turnover costs you one possession worth of expected points
 */
export function calculateTurnoverContribution(stats: BoxScoreStats): number {
  return -LEAGUE_EFFICIENCY * stats.turnovers;
}

/**
 * Calculate Dean Oliver's Offensive Rebounding contribution
 * Formula: [(1-LgOR%)*OREB - LgOR%*OppDREB] * LgEffic
 *
 * Breakdown:
 * - (1-LgOR%)*OREB: Your offensive rebounds above league expectation
 * - LgOR%*OppDREB: Opponent's defensive rebounds above their expectation
 */
export function calculateReboundingContribution(
  stats: BoxScoreStats,
  oppDreb: number
): number {
  return ((1 - LEAGUE_OREB_PCT) * stats.oreb - LEAGUE_OREB_PCT * oppDreb) * LEAGUE_EFFICIENCY;
}

/**
 * Calculate Dean Oliver's Free Throw contribution
 * Formula: FTM - 0.4*FTA*LgEffic + 0.06*(FTA-FTM)*LgEffic
 *
 * Breakdown:
 * - FTM: Actual points from free throws
 * - 0.4*FTA*LgEffic: Opportunity cost (each FT attempt uses ~0.4 possessions)
 * - 0.06*(FTA-FTM)*LgEffic: Small credit for potential OREB on missed FTs
 */
export function calculateFreeThrowContribution(stats: BoxScoreStats): number {
  const ftMissed = stats.fta - stats.ftm;
  return stats.ftm - 0.4 * stats.fta * LEAGUE_EFFICIENCY + 0.06 * ftMissed * LEAGUE_EFFICIENCY;
}

/**
 * Calculate all four point contributions for a team
 * These represent how each factor contributed to the team's scoring
 */
export function calculateAllContributions(
  stats: BoxScoreStats,
  oppDreb: number
): PointContributions {
  const shooting = calculateShootingContribution(stats);
  const turnovers = calculateTurnoverContribution(stats);
  const rebounding = calculateReboundingContribution(stats, oppDreb);
  const freeThrows = calculateFreeThrowContribution(stats);

  return {
    shooting,
    turnovers,
    rebounding,
    freeThrows,
    total: shooting + turnovers + rebounding + freeThrows,
  };
}

/**
 * Calculate the point differential for each factor between two teams
 * Positive values mean team1 had the advantage
 */
export function calculateContributionDifferentials(
  team1Stats: BoxScoreStats,
  team2Stats: BoxScoreStats
): PointContributions {
  const team1 = calculateAllContributions(team1Stats, team2Stats.dreb);
  const team2 = calculateAllContributions(team2Stats, team1Stats.dreb);

  return {
    shooting: team1.shooting - team2.shooting,
    turnovers: team1.turnovers - team2.turnovers,
    rebounding: team1.rebounding - team2.rebounding,
    freeThrows: team1.freeThrows - team2.freeThrows,
    total: team1.total - team2.total,
  };
}
