import { Team, Game, TeamStandings, Gender } from './types';

// Import JSON data statically for build-time optimization
import mensTeams from '@/data/mens/teams.json';
import mensGames from '@/data/mens/games.json';
import mensStandings from '@/data/mens/standings.json';
import womensTeams from '@/data/womens/teams.json';
import womensGames from '@/data/womens/games.json';
import womensStandings from '@/data/womens/standings.json';

const dataCache = {
  mens: {
    teams: mensTeams as Team[],
    games: mensGames as Game[],
    standings: mensStandings as TeamStandings[],
  },
  womens: {
    teams: womensTeams as Team[],
    games: womensGames as Game[],
    standings: womensStandings as TeamStandings[],
  },
};

export function getTeams(gender: Gender): Team[] {
  return dataCache[gender].teams;
}

export function getGames(gender: Gender): Game[] {
  return dataCache[gender].games;
}

export function getStandings(gender: Gender): TeamStandings[] {
  return dataCache[gender].standings;
}

export function getTeamById(gender: Gender, teamId: string): Team | undefined {
  return dataCache[gender].teams.find(t => t.id === teamId);
}

export function getTeamStandings(gender: Gender, teamId: string): TeamStandings | undefined {
  return dataCache[gender].standings.find(s => s.teamId === teamId);
}

export function getTeamGames(gender: Gender, teamId: string): Game[] {
  return dataCache[gender].games.filter(
    g => g.homeTeam.teamId === teamId || g.awayTeam.teamId === teamId
  );
}

export function getGameById(gender: Gender, gameId: string): Game | undefined {
  return dataCache[gender].games.find(g => g.id === gameId);
}

export function getRecentGames(gender: Gender, limit: number = 10): Game[] {
  return dataCache[gender].games
    .filter(g => g.isComplete)
    .slice(0, limit);
}

export function searchTeams(gender: Gender, query: string): Team[] {
  const lowerQuery = query.toLowerCase();
  return dataCache[gender].teams.filter(
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

export function getConferences(gender: Gender): Conference[] {
  const teams = dataCache[gender].teams;
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

export function getTeamConference(gender: Gender, teamId: string): Conference | undefined {
  const team = dataCache[gender].teams.find(t => t.id === teamId);
  if (!team) return undefined;
  return { id: team.conferenceId, name: team.conference };
}

/**
 * Get standings for all teams in a specific conference
 * Filters by gender and conference ID
 */
export function getConferenceStandings(gender: Gender, conferenceId: string): TeamStandings[] {
  const teams = dataCache[gender].teams;
  const standings = dataCache[gender].standings;

  // Get team IDs in this conference
  const conferenceTeamIds = new Set(
    teams.filter(t => t.conferenceId === conferenceId).map(t => t.id)
  );

  // Filter standings to only include teams in this conference
  return standings.filter(s => conferenceTeamIds.has(s.teamId));
}
