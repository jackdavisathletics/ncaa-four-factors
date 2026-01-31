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
