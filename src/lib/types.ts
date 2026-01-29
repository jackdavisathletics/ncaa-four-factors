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
}

export const FOUR_FACTORS_META: FactorMeta[] = [
  {
    key: 'efg',
    label: 'Effective FG%',
    shortLabel: 'eFG%',
    description: 'Adjusts field goal percentage to account for three-pointers being worth more',
    higherIsBetter: true,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: 'tov',
    label: 'Turnover Rate',
    shortLabel: 'TOV%',
    description: 'Turnovers committed per 100 possessions',
    higherIsBetter: false,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: 'orb',
    label: 'Offensive Reb%',
    shortLabel: 'ORB%',
    description: 'Percentage of available offensive rebounds grabbed',
    higherIsBetter: true,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: 'ftr',
    label: 'Free Throw Rate',
    shortLabel: 'FTR',
    description: 'Free throws made per field goal attempt',
    higherIsBetter: true,
    format: (v) => `${v.toFixed(1)}%`,
  },
];
