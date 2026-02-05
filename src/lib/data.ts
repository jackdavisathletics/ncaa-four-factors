import { Team, Game, TeamStandings, Gender, Season, DEFAULT_SEASON } from './types';

// Import JSON data statically for build-time optimization
// 2025-26 Season (Current)
import mensTeams202526 from '@/data/mens/2025-26/teams.json';
import mensGames202526 from '@/data/mens/2025-26/games.json';
import mensStandings202526 from '@/data/mens/2025-26/standings.json';
import womensTeams202526 from '@/data/womens/2025-26/teams.json';
import womensGames202526 from '@/data/womens/2025-26/games.json';
import womensStandings202526 from '@/data/womens/2025-26/standings.json';

// 2024-25 Season (Last Season)
import mensTeams202425 from '@/data/mens/2024-25/teams.json';
import mensGames202425 from '@/data/mens/2024-25/games.json';
import mensStandings202425 from '@/data/mens/2024-25/standings.json';
import womensTeams202425 from '@/data/womens/2024-25/teams.json';
import womensGames202425 from '@/data/womens/2024-25/games.json';
import womensStandings202425 from '@/data/womens/2024-25/standings.json';

// 2023-24 Season
import mensTeams202324 from '@/data/mens/2023-24/teams.json';
import mensGames202324 from '@/data/mens/2023-24/games.json';
import mensStandings202324 from '@/data/mens/2023-24/standings.json';
import womensTeams202324 from '@/data/womens/2023-24/teams.json';
import womensGames202324 from '@/data/womens/2023-24/games.json';
import womensStandings202324 from '@/data/womens/2023-24/standings.json';

// 2022-23 Season
import mensTeams202223 from '@/data/mens/2022-23/teams.json';
import mensGames202223 from '@/data/mens/2022-23/games.json';
import mensStandings202223 from '@/data/mens/2022-23/standings.json';
import womensTeams202223 from '@/data/womens/2022-23/teams.json';
import womensGames202223 from '@/data/womens/2022-23/games.json';
import womensStandings202223 from '@/data/womens/2022-23/standings.json';

// 2021-22 Season
import mensTeams202122 from '@/data/mens/2021-22/teams.json';
import mensGames202122 from '@/data/mens/2021-22/games.json';
import mensStandings202122 from '@/data/mens/2021-22/standings.json';
import womensTeams202122 from '@/data/womens/2021-22/teams.json';
import womensGames202122 from '@/data/womens/2021-22/games.json';
import womensStandings202122 from '@/data/womens/2021-22/standings.json';

// Data cache organized by season and gender
const dataCache: Record<Season, Record<Gender, {
  teams: Team[];
  games: Game[];
  standings: TeamStandings[];
}>> = {
  '2025-26': {
    mens: {
      teams: mensTeams202526 as Team[],
      games: mensGames202526 as Game[],
      standings: mensStandings202526 as TeamStandings[],
    },
    womens: {
      teams: womensTeams202526 as Team[],
      games: womensGames202526 as Game[],
      standings: womensStandings202526 as TeamStandings[],
    },
  },
  '2024-25': {
    mens: {
      teams: mensTeams202425 as Team[],
      games: mensGames202425 as Game[],
      standings: mensStandings202425 as TeamStandings[],
    },
    womens: {
      teams: womensTeams202425 as Team[],
      games: womensGames202425 as Game[],
      standings: womensStandings202425 as TeamStandings[],
    },
  },
  '2023-24': {
    mens: {
      teams: mensTeams202324 as Team[],
      games: mensGames202324 as Game[],
      standings: mensStandings202324 as TeamStandings[],
    },
    womens: {
      teams: womensTeams202324 as Team[],
      games: womensGames202324 as Game[],
      standings: womensStandings202324 as TeamStandings[],
    },
  },
  '2022-23': {
    mens: {
      teams: mensTeams202223 as Team[],
      games: mensGames202223 as Game[],
      standings: mensStandings202223 as TeamStandings[],
    },
    womens: {
      teams: womensTeams202223 as Team[],
      games: womensGames202223 as Game[],
      standings: womensStandings202223 as TeamStandings[],
    },
  },
  '2021-22': {
    mens: {
      teams: mensTeams202122 as Team[],
      games: mensGames202122 as Game[],
      standings: mensStandings202122 as TeamStandings[],
    },
    womens: {
      teams: womensTeams202122 as Team[],
      games: womensGames202122 as Game[],
      standings: womensStandings202122 as TeamStandings[],
    },
  },
};

export function getTeams(gender: Gender, season: Season = DEFAULT_SEASON): Team[] {
  return dataCache[season]?.[gender]?.teams || [];
}

export function getGames(gender: Gender, season: Season = DEFAULT_SEASON): Game[] {
  return dataCache[season]?.[gender]?.games || [];
}

export function getStandings(gender: Gender, season: Season = DEFAULT_SEASON): TeamStandings[] {
  return dataCache[season]?.[gender]?.standings || [];
}

export function getTeamById(gender: Gender, teamId: string, season: Season = DEFAULT_SEASON): Team | undefined {
  return dataCache[season]?.[gender]?.teams.find(t => t.id === teamId);
}

export function getTeamStandings(gender: Gender, teamId: string, season: Season = DEFAULT_SEASON): TeamStandings | undefined {
  return dataCache[season]?.[gender]?.standings.find(s => s.teamId === teamId);
}

export function getTeamGames(gender: Gender, teamId: string, season: Season = DEFAULT_SEASON): Game[] {
  return (dataCache[season]?.[gender]?.games || []).filter(
    g => g.homeTeam.teamId === teamId || g.awayTeam.teamId === teamId
  );
}

export function getGameById(gender: Gender, gameId: string, season: Season = DEFAULT_SEASON): Game | undefined {
  return dataCache[season]?.[gender]?.games.find(g => g.id === gameId);
}

export function getRecentGames(gender: Gender, limit: number = 10, season: Season = DEFAULT_SEASON): Game[] {
  return (dataCache[season]?.[gender]?.games || [])
    .filter(g => g.isComplete)
    .slice(0, limit);
}

export function searchTeams(gender: Gender, query: string, season: Season = DEFAULT_SEASON): Team[] {
  const lowerQuery = query.toLowerCase();
  return (dataCache[season]?.[gender]?.teams || []).filter(
    t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.displayName.toLowerCase().includes(lowerQuery) ||
      t.abbreviation.toLowerCase().includes(lowerQuery)
  );
}

export interface Conference {
  id: string;
  name: string;
}

export function getConferences(gender: Gender, season: Season = DEFAULT_SEASON): Conference[] {
  const teams = dataCache[season]?.[gender]?.teams || [];
  const conferenceMap = new Map<string, string>();

  teams.forEach(team => {
    if (!conferenceMap.has(team.conferenceId)) {
      conferenceMap.set(team.conferenceId, team.conference);
    }
  });

  return Array.from(conferenceMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getTeamConference(gender: Gender, teamId: string, season: Season = DEFAULT_SEASON): Conference | undefined {
  const team = dataCache[season]?.[gender]?.teams.find(t => t.id === teamId);
  if (!team) return undefined;
  return { id: team.conferenceId, name: team.conference };
}

/**
 * Get standings for all teams in a specific conference
 * Filters by gender, season, and conference ID
 */
export function getConferenceStandings(gender: Gender, conferenceId: string, season: Season = DEFAULT_SEASON): TeamStandings[] {
  const teams = dataCache[season]?.[gender]?.teams || [];
  const standings = dataCache[season]?.[gender]?.standings || [];

  // Get team IDs in this conference
  const conferenceTeamIds = new Set(
    teams.filter(t => t.conferenceId === conferenceId).map(t => t.id)
  );

  // Filter standings to only include teams in this conference
  return standings.filter(s => conferenceTeamIds.has(s.teamId));
}

/**
 * Get conference-only games for a team (games where opponent is in same conference)
 */
export function getTeamConferenceGames(gender: Gender, teamId: string, season: Season = DEFAULT_SEASON): Game[] {
  const games = dataCache[season]?.[gender]?.games || [];
  const teams = dataCache[season]?.[gender]?.teams || [];

  // Find the team's conference
  const team = teams.find(t => t.id === teamId);
  if (!team) return [];

  // Get all team IDs in this conference
  const conferenceTeamIds = new Set(
    teams.filter(t => t.conferenceId === team.conferenceId).map(t => t.id)
  );

  // Filter to games where both teams are in the conference
  return games.filter(g => {
    const isTeamInGame = g.homeTeam.teamId === teamId || g.awayTeam.teamId === teamId;
    const opponentId = g.homeTeam.teamId === teamId ? g.awayTeam.teamId : g.homeTeam.teamId;
    const isConferenceGame = conferenceTeamIds.has(opponentId);
    return isTeamInGame && isConferenceGame && g.isComplete;
  });
}

/**
 * Calculate Four Factors stats for a team from a set of games
 */
export interface CalculatedStats {
  gamesPlayed: number;
  efg: number;
  tov: number;
  orb: number;
  ftr: number;
  oppEfg: number;
  oppTov: number;
  oppOrb: number;
  oppFtr: number;
}

export function calculateStatsFromGames(games: Game[], teamId: string): CalculatedStats {
  if (games.length === 0) {
    return {
      gamesPlayed: 0,
      efg: 0, tov: 0, orb: 0, ftr: 0,
      oppEfg: 0, oppTov: 0, oppOrb: 0, oppFtr: 0,
    };
  }

  let efgSum = 0, tovSum = 0, orbSum = 0, ftrSum = 0;
  let oppEfgSum = 0, oppTovSum = 0, oppOrbSum = 0, oppFtrSum = 0;

  for (const game of games) {
    const isHome = game.homeTeam.teamId === teamId;
    const teamStats = isHome ? game.homeTeam : game.awayTeam;
    const oppStats = isHome ? game.awayTeam : game.homeTeam;

    efgSum += teamStats.efg;
    tovSum += teamStats.tov;
    orbSum += teamStats.orb;
    ftrSum += teamStats.ftr;

    oppEfgSum += oppStats.efg;
    oppTovSum += oppStats.tov;
    oppOrbSum += oppStats.orb;
    oppFtrSum += oppStats.ftr;
  }

  const n = games.length;
  return {
    gamesPlayed: n,
    efg: efgSum / n,
    tov: tovSum / n,
    orb: orbSum / n,
    ftr: ftrSum / n,
    oppEfg: oppEfgSum / n,
    oppTov: oppTovSum / n,
    oppOrb: oppOrbSum / n,
    oppFtr: oppFtrSum / n,
  };
}

/**
 * Calculate conference averages from conference-only games
 * Returns averages for all teams in the conference based on their conference games only
 */
export function getConferenceOnlyAverages(gender: Gender, conferenceId: string, season: Season = DEFAULT_SEASON): {
  efg: number;
  tov: number;
  orb: number;
  ftr: number;
  oppEfg: number;
  oppTov: number;
  oppOrb: number;
  oppFtr: number;
} {
  const teams = dataCache[season]?.[gender]?.teams || [];
  const games = dataCache[season]?.[gender]?.games || [];

  // Get all team IDs in this conference
  const conferenceTeamIds = new Set(
    teams.filter(t => t.conferenceId === conferenceId).map(t => t.id)
  );

  // Get all conference games (both teams in conference)
  const conferenceGames = games.filter(g =>
    g.isComplete &&
    conferenceTeamIds.has(g.homeTeam.teamId) &&
    conferenceTeamIds.has(g.awayTeam.teamId)
  );

  if (conferenceGames.length === 0) {
    return {
      efg: 50, tov: 18, orb: 28, ftr: 28,
      oppEfg: 50, oppTov: 18, oppOrb: 28, oppFtr: 28,
    };
  }

  // Calculate stats for each team from their conference games
  const teamStats: CalculatedStats[] = [];
  for (const teamId of conferenceTeamIds) {
    const teamGames = conferenceGames.filter(g =>
      g.homeTeam.teamId === teamId || g.awayTeam.teamId === teamId
    );
    if (teamGames.length > 0) {
      teamStats.push(calculateStatsFromGames(teamGames, teamId));
    }
  }

  if (teamStats.length === 0) {
    return {
      efg: 50, tov: 18, orb: 28, ftr: 28,
      oppEfg: 50, oppTov: 18, oppOrb: 28, oppFtr: 28,
    };
  }

  // Average across all teams
  const n = teamStats.length;
  return {
    efg: teamStats.reduce((s, t) => s + t.efg, 0) / n,
    tov: teamStats.reduce((s, t) => s + t.tov, 0) / n,
    orb: teamStats.reduce((s, t) => s + t.orb, 0) / n,
    ftr: teamStats.reduce((s, t) => s + t.ftr, 0) / n,
    oppEfg: teamStats.reduce((s, t) => s + t.oppEfg, 0) / n,
    oppTov: teamStats.reduce((s, t) => s + t.oppTov, 0) / n,
    oppOrb: teamStats.reduce((s, t) => s + t.oppOrb, 0) / n,
    oppFtr: teamStats.reduce((s, t) => s + t.oppFtr, 0) / n,
  };
}

/**
 * Helper to calculate a percentile from an array of numbers
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
 * Calculate percentiles from conference-only games for all teams in the conference
 */
export function getConferenceOnlyPercentiles(gender: Gender, conferenceId: string, season: Season = DEFAULT_SEASON): {
  efg: { p25: number; p75: number };
  tov: { p25: number; p75: number };
  orb: { p25: number; p75: number };
  ftr: { p25: number; p75: number };
  oppEfg: { p25: number; p75: number };
  oppTov: { p25: number; p75: number };
  oppOrb: { p25: number; p75: number };
  oppFtr: { p25: number; p75: number };
} {
  const teams = dataCache[season]?.[gender]?.teams || [];
  const games = dataCache[season]?.[gender]?.games || [];

  // Get all team IDs in this conference
  const conferenceTeamIds = new Set(
    teams.filter(t => t.conferenceId === conferenceId).map(t => t.id)
  );

  // Get all conference games (both teams in conference)
  const conferenceGames = games.filter(g =>
    g.isComplete &&
    conferenceTeamIds.has(g.homeTeam.teamId) &&
    conferenceTeamIds.has(g.awayTeam.teamId)
  );

  // Calculate stats for each team from their conference games
  const teamStatsList: CalculatedStats[] = [];
  for (const teamId of conferenceTeamIds) {
    const teamGames = conferenceGames.filter(g =>
      g.homeTeam.teamId === teamId || g.awayTeam.teamId === teamId
    );
    if (teamGames.length > 0) {
      teamStatsList.push(calculateStatsFromGames(teamGames, teamId));
    }
  }

  if (teamStatsList.length === 0) {
    const defaultThreshold = { p25: 0, p75: 100 };
    return {
      efg: defaultThreshold, tov: defaultThreshold, orb: defaultThreshold, ftr: defaultThreshold,
      oppEfg: defaultThreshold, oppTov: defaultThreshold, oppOrb: defaultThreshold, oppFtr: defaultThreshold,
    };
  }

  const efgValues = teamStatsList.map(t => t.efg);
  const tovValues = teamStatsList.map(t => t.tov);
  const orbValues = teamStatsList.map(t => t.orb);
  const ftrValues = teamStatsList.map(t => t.ftr);
  const oppEfgValues = teamStatsList.map(t => t.oppEfg);
  const oppTovValues = teamStatsList.map(t => t.oppTov);
  const oppOrbValues = teamStatsList.map(t => t.oppOrb);
  const oppFtrValues = teamStatsList.map(t => t.oppFtr);

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
