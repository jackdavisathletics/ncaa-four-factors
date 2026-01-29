import { Team, Game, GameTeamStats, BoxScoreStats, Gender } from './types';
import { calculateFourFactors } from './calculations';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball';

// Conference USA group ID
const CUSA_GROUP_ID = '11';

function getLeaguePath(gender: Gender): string {
  return gender === 'mens' ? 'mens-college-basketball' : 'womens-college-basketball';
}

/**
 * Fetch all CUSA teams
 */
export async function fetchCusaTeams(gender: Gender): Promise<Team[]> {
  const league = getLeaguePath(gender);
  const url = `${ESPN_BASE}/${league}/teams?groups=${CUSA_GROUP_ID}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch teams: ${response.statusText}`);
  }

  const data = await response.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.sports[0].leagues[0].teams.map((t: any) => {
    const team = t.team;
    return {
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      displayName: team.displayName,
      shortDisplayName: team.shortDisplayName,
      logo: team.logos?.[0]?.href || '',
      color: team.color ? `#${team.color}` : '#666666',
      alternateColor: team.alternateColor ? `#${team.alternateColor}` : '#333333',
      conference: 'Conference USA',
      conferenceId: CUSA_GROUP_ID,
    };
  });
}

/**
 * Fetch team schedule for current season
 */
export async function fetchTeamSchedule(
  gender: Gender,
  teamId: string
): Promise<{ gameId: string; date: string; isComplete: boolean }[]> {
  const league = getLeaguePath(gender);
  const url = `${ESPN_BASE}/${league}/teams/${teamId}/schedule`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch schedule for team ${teamId}: ${response.statusText}`);
  }

  const data = await response.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.events || []).map((event: any) => ({
    gameId: event.id,
    date: event.date,
    isComplete: event.competitions?.[0]?.status?.type?.completed || false,
  }));
}

/**
 * Fetch game boxscore and calculate four factors
 */
export async function fetchGameDetails(
  gender: Gender,
  gameId: string,
  teamLookup: Map<string, Team>
): Promise<Game | null> {
  const league = getLeaguePath(gender);
  const url = `${ESPN_BASE}/${league}/summary?event=${gameId}`;

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch game ${gameId}: ${response.statusText}`);
    return null;
  }

  const data = await response.json();

  const boxscore = data.boxscore;
  if (!boxscore || !boxscore.teams || boxscore.teams.length < 2) {
    return null;
  }

  const competition = data.header?.competitions?.[0];
  if (!competition) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseTeamStats = (teamBox: any, isHome: boolean): GameTeamStats | null => {
    const teamInfo = teamBox.team;
    const stats = teamBox.statistics;

    if (!stats || stats.length === 0) return null;

    // Build stats map
    const statsMap = new Map<string, string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats.forEach((stat: any) => {
      statsMap.set(stat.name, stat.displayValue);
    });

    // Parse individual stats
    const parseStat = (name: string): number => {
      const val = statsMap.get(name);
      if (!val) return 0;
      // Handle "X-Y" format (e.g., "25-50" for FGM-FGA)
      if (val.includes('-')) {
        return parseInt(val.split('-')[0]) || 0;
      }
      return parseFloat(val) || 0;
    };

    const parseSecondStat = (name: string): number => {
      const val = statsMap.get(name);
      if (!val) return 0;
      if (val.includes('-')) {
        return parseInt(val.split('-')[1]) || 0;
      }
      return parseFloat(val) || 0;
    };

    const boxStats: BoxScoreStats = {
      fgm: parseStat('fieldGoalsMade') || parseStat('fieldGoals'),
      fga: parseSecondStat('fieldGoals') || parseStat('fieldGoalsAttempted'),
      fg3m: parseStat('threePointFieldGoalsMade') || parseStat('threePointFieldGoals'),
      fg3a: parseSecondStat('threePointFieldGoals') || parseStat('threePointFieldGoalsAttempted'),
      ftm: parseStat('freeThrowsMade') || parseStat('freeThrows'),
      fta: parseSecondStat('freeThrows') || parseStat('freeThrowsAttempted'),
      oreb: parseStat('offensiveRebounds'),
      dreb: parseStat('defensiveRebounds'),
      turnovers: parseStat('turnovers'),
    };

    // If FGA is 0, try alternative parsing from FG percentage context
    if (boxStats.fga === 0) {
      // Look for total rebounds and estimate
      const totalReb = parseStat('rebounds');
      if (totalReb > 0 && boxStats.oreb === 0) {
        // Estimate offensive rebounds as ~30% of total
        boxStats.oreb = Math.round(totalReb * 0.3);
        boxStats.dreb = totalReb - boxStats.oreb;
      }
    }

    // Find team score from competition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const competitor = competition.competitors?.find((c: any) =>
      c.id === teamInfo.id || c.team?.id === teamInfo.id
    );
    const score = parseInt(competitor?.score || '0');

    const teamData = teamLookup.get(teamInfo.id);

    return {
      teamId: teamInfo.id,
      teamName: teamData?.displayName || teamInfo.displayName || teamInfo.name,
      teamAbbreviation: teamData?.abbreviation || teamInfo.abbreviation,
      teamLogo: teamData?.logo || teamInfo.logo || '',
      teamColor: teamData?.color || (teamInfo.color ? `#${teamInfo.color}` : '#666666'),
      score,
      isHome,
      ...boxStats,
      efg: 0, // Will be calculated
      tov: 0,
      orb: 0,
      ftr: 0,
    };
  };

  // ESPN returns teams in order [away, home] or [home, away] depending on endpoint
  // Check the homeAway field to determine
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const team0HomeAway = competition.competitors?.find((c: any) =>
    c.id === boxscore.teams[0].team.id || c.team?.id === boxscore.teams[0].team.id
  )?.homeAway;

  const team0IsHome = team0HomeAway === 'home';

  const team0Stats = parseTeamStats(boxscore.teams[0], team0IsHome);
  const team1Stats = parseTeamStats(boxscore.teams[1], !team0IsHome);

  if (!team0Stats || !team1Stats) return null;

  // Calculate four factors (need opponent's defensive rebounds for ORB%)
  const team0Factors = calculateFourFactors(team0Stats, team1Stats.dreb);
  const team1Factors = calculateFourFactors(team1Stats, team0Stats.dreb);

  Object.assign(team0Stats, team0Factors);
  Object.assign(team1Stats, team1Factors);

  const homeTeam = team0IsHome ? team0Stats : team1Stats;
  const awayTeam = team0IsHome ? team1Stats : team0Stats;

  // Check if this is a conference game
  const homeInCusa = teamLookup.has(homeTeam.teamId);
  const awayInCusa = teamLookup.has(awayTeam.teamId);

  return {
    id: gameId,
    date: competition.date || data.header?.gameDate || '',
    venue: competition.venue?.fullName || '',
    homeTeam,
    awayTeam,
    isComplete: competition.status?.type?.completed || false,
    isConferenceGame: homeInCusa && awayInCusa,
  };
}

/**
 * Delay utility for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
