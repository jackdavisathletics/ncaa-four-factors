/**
 * Data fetching script for NCAA Four Factors
 * Run with: npx tsx scripts/fetch-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Types (inline to avoid module resolution issues)
type Gender = 'mens' | 'womens';

interface Team {
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

interface BoxScoreStats {
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  turnovers: number;
}

interface FourFactors {
  efg: number;
  tov: number;
  orb: number;
  ftr: number;
}

interface GameTeamStats extends FourFactors, BoxScoreStats {
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  teamLogo: string;
  teamColor: string;
  score: number;
  isHome: boolean;
}

interface Game {
  id: string;
  date: string;
  venue: string;
  homeTeam: GameTeamStats;
  awayTeam: GameTeamStats;
  isComplete: boolean;
  isConferenceGame: boolean;
}

interface TeamStandings {
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
  efg: number;
  tov: number;
  orb: number;
  ftr: number;
  oppEfg: number;
  oppTov: number;
  oppOrb: number;
  oppFtr: number;
  ppg: number;
  oppPpg: number;
}

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball';
const CUSA_GROUP_ID = '11';

function getLeaguePath(gender: Gender): string {
  return gender === 'mens' ? 'mens-college-basketball' : 'womens-college-basketball';
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateFourFactors(stats: BoxScoreStats, opponentDreb: number): FourFactors {
  const efg = stats.fga === 0 ? 0 : ((stats.fgm + 0.5 * stats.fg3m) / stats.fga) * 100;
  const possessions = stats.fga + 0.44 * stats.fta + stats.turnovers;
  const tov = possessions === 0 ? 0 : (stats.turnovers / possessions) * 100;
  const orbTotal = stats.oreb + opponentDreb;
  const orb = orbTotal === 0 ? 0 : (stats.oreb / orbTotal) * 100;
  const ftr = stats.fga === 0 ? 0 : (stats.ftm / stats.fga) * 100;

  return { efg, tov, orb, ftr };
}

async function fetchCusaTeams(gender: Gender): Promise<Team[]> {
  const league = getLeaguePath(gender);
  const url = `${ESPN_BASE}/${league}/teams?groups=${CUSA_GROUP_ID}`;

  console.log(`Fetching ${gender} teams from: ${url}`);

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

async function fetchTeamSchedule(
  gender: Gender,
  teamId: string
): Promise<{ gameId: string; date: string; isComplete: boolean }[]> {
  const league = getLeaguePath(gender);
  const url = `${ESPN_BASE}/${league}/teams/${teamId}/schedule`;

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch schedule for team ${teamId}: ${response.statusText}`);
    return [];
  }

  const data = await response.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.events || []).map((event: any) => ({
    gameId: event.id,
    date: event.date,
    isComplete: event.competitions?.[0]?.status?.type?.completed || false,
  }));
}

async function fetchGameDetails(
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
  const parseTeamStats = (teamBox: any): GameTeamStats | null => {
    const teamInfo = teamBox.team;
    const stats = teamBox.statistics;
    const isHome = teamBox.homeAway === 'home';

    if (!stats || stats.length === 0) return null;

    // Build stats map by BOTH label and name (ESPN uses short labels like "FG", "3PT")
    const statsMap = new Map<string, string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats.forEach((stat: any) => {
      // Store by both label and name for flexible lookup
      const label = (stat.label || '').toLowerCase();
      const name = (stat.name || '').toLowerCase();
      const value = stat.displayValue || '0';
      if (label) statsMap.set(label, value);
      if (name) statsMap.set(name, value);
    });

    // Parse "X-Y" format stats (e.g., "28-53" for FGM-FGA)
    const parseMadeAttempted = (...keys: string[]): { made: number; attempted: number } => {
      for (const key of keys) {
        const val = statsMap.get(key.toLowerCase());
        if (val && val.includes('-')) {
          const [made, attempted] = val.split('-').map(v => parseInt(v) || 0);
          return { made, attempted };
        }
      }
      return { made: 0, attempted: 0 };
    };

    // Parse single number stats
    const parseSingle = (...keys: string[]): number => {
      for (const key of keys) {
        const val = statsMap.get(key.toLowerCase());
        if (val) {
          return parseInt(val) || 0;
        }
      }
      return 0;
    };

    // Parse field goals - ESPN uses "FG" label and "fieldGoalsMade-fieldGoalsAttempted" name
    const fg = parseMadeAttempted('fg', 'fieldgoalsmade-fieldgoalsattempted', 'field goals');
    // Parse 3-pointers - ESPN uses "3PT" label
    const fg3 = parseMadeAttempted('3pt', 'threepointfieldgoalsmade-threepointfieldgoalsattempted', '3-pointers');
    // Parse free throws - ESPN uses "FT" label
    const ft = parseMadeAttempted('ft', 'freethrowsmade-freethrowsattempted', 'free throws');

    // Parse rebounds
    let oreb = parseSingle('offensive rebounds', 'offensiverebounds');
    let dreb = parseSingle('defensive rebounds', 'defensiverebounds');
    const totalReb = parseSingle('rebounds', 'totalrebounds');

    // If we only have total rebounds, estimate the split
    if (totalReb > 0 && oreb === 0 && dreb === 0) {
      // NCAA average is roughly 28% offensive rebounds
      oreb = Math.round(totalReb * 0.28);
      dreb = totalReb - oreb;
    }

    // Parse turnovers
    const turnovers = parseSingle('turnovers', 'totalturnovers', 'to');

    const boxStats: BoxScoreStats = {
      fgm: fg.made,
      fga: fg.attempted,
      fg3m: fg3.made,
      fg3a: fg3.attempted,
      ftm: ft.made,
      fta: ft.attempted,
      oreb,
      dreb,
      turnovers,
    };

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
      teamLogo: teamData?.logo || teamInfo.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${teamInfo.id}.png`,
      teamColor: teamData?.color || (teamInfo.color ? `#${teamInfo.color}` : '#666666'),
      score,
      isHome,
      ...boxStats,
      efg: 0,
      tov: 0,  // TOV% - will be calculated and merged via Object.assign
      orb: 0,
      ftr: 0,
    };
  };

  const team0Stats = parseTeamStats(boxscore.teams[0]);
  const team1Stats = parseTeamStats(boxscore.teams[1]);

  if (!team0Stats || !team1Stats) return null;

  // Calculate four factors (need opponent's defensive rebounds for ORB%)
  const team0Factors = calculateFourFactors(team0Stats, team1Stats.dreb);
  const team1Factors = calculateFourFactors(team1Stats, team0Stats.dreb);

  Object.assign(team0Stats, team0Factors);
  Object.assign(team1Stats, team1Factors);

  // Determine home/away
  const homeTeam = team0Stats.isHome ? team0Stats : team1Stats;
  const awayTeam = team0Stats.isHome ? team1Stats : team0Stats;

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

function calculateStandings(teams: Team[], games: Game[]): TeamStandings[] {
  const standingsMap = new Map<string, TeamStandings>();

  // Initialize standings for each team
  for (const team of teams) {
    standingsMap.set(team.id, {
      teamId: team.id,
      teamName: team.displayName,
      teamAbbreviation: team.abbreviation,
      teamLogo: team.logo,
      teamColor: team.color,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      confWins: 0,
      confLosses: 0,
      efg: 0,
      tov: 0,
      orb: 0,
      ftr: 0,
      oppEfg: 0,
      oppTov: 0,
      oppOrb: 0,
      oppFtr: 0,
      ppg: 0,
      oppPpg: 0,
    });
  }

  // Aggregate stats from games
  const teamStats = new Map<string, {
    games: number;
    wins: number;
    losses: number;
    confWins: number;
    confLosses: number;
    efgSum: number;
    tovSum: number;
    orbSum: number;
    ftrSum: number;
    oppEfgSum: number;
    oppTovSum: number;
    oppOrbSum: number;
    oppFtrSum: number;
    pointsSum: number;
    oppPointsSum: number;
  }>();

  for (const team of teams) {
    teamStats.set(team.id, {
      games: 0,
      wins: 0,
      losses: 0,
      confWins: 0,
      confLosses: 0,
      efgSum: 0,
      tovSum: 0,
      orbSum: 0,
      ftrSum: 0,
      oppEfgSum: 0,
      oppTovSum: 0,
      oppOrbSum: 0,
      oppFtrSum: 0,
      pointsSum: 0,
      oppPointsSum: 0,
    });
  }

  for (const game of games) {
    if (!game.isComplete) continue;

    const processTeam = (ownStats: GameTeamStats, oppStats: GameTeamStats) => {
      const stats = teamStats.get(ownStats.teamId);
      if (!stats) return;

      stats.games++;
      const won = ownStats.score > oppStats.score;
      if (won) {
        stats.wins++;
        if (game.isConferenceGame) stats.confWins++;
      } else {
        stats.losses++;
        if (game.isConferenceGame) stats.confLosses++;
      }

      stats.efgSum += ownStats.efg;
      stats.tovSum += ownStats.tov;
      stats.orbSum += ownStats.orb;
      stats.ftrSum += ownStats.ftr;
      stats.oppEfgSum += oppStats.efg;
      stats.oppTovSum += oppStats.tov;
      stats.oppOrbSum += oppStats.orb;
      stats.oppFtrSum += oppStats.ftr;
      stats.pointsSum += ownStats.score;
      stats.oppPointsSum += oppStats.score;
    };

    // Process home team if it's a CUSA team
    if (standingsMap.has(game.homeTeam.teamId)) {
      processTeam(game.homeTeam, game.awayTeam);
    }

    // Process away team if it's a CUSA team
    if (standingsMap.has(game.awayTeam.teamId)) {
      processTeam(game.awayTeam, game.homeTeam);
    }
  }

  // Calculate averages
  for (const [teamId, stats] of teamStats.entries()) {
    const standing = standingsMap.get(teamId);
    if (!standing || stats.games === 0) continue;

    standing.gamesPlayed = stats.games;
    standing.wins = stats.wins;
    standing.losses = stats.losses;
    standing.confWins = stats.confWins;
    standing.confLosses = stats.confLosses;
    standing.efg = stats.efgSum / stats.games;
    standing.tov = stats.tovSum / stats.games;
    standing.orb = stats.orbSum / stats.games;
    standing.ftr = stats.ftrSum / stats.games;
    standing.oppEfg = stats.oppEfgSum / stats.games;
    standing.oppTov = stats.oppTovSum / stats.games;
    standing.oppOrb = stats.oppOrbSum / stats.games;
    standing.oppFtr = stats.oppFtrSum / stats.games;
    standing.ppg = stats.pointsSum / stats.games;
    standing.oppPpg = stats.oppPointsSum / stats.games;
  }

  return Array.from(standingsMap.values()).sort((a, b) => {
    // Sort by wins, then conference wins
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.confWins - a.confWins;
  });
}

async function fetchGenderData(gender: Gender) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Fetching ${gender.toUpperCase()} basketball data...`);
  console.log('='.repeat(50));

  // Fetch teams
  const teams = await fetchCusaTeams(gender);
  console.log(`Found ${teams.length} teams`);

  const teamLookup = new Map(teams.map(t => [t.id, t]));

  // Collect all game IDs from team schedules
  const gameIds = new Set<string>();
  for (const team of teams) {
    console.log(`Fetching schedule for ${team.displayName}...`);
    const schedule = await fetchTeamSchedule(gender, team.id);

    for (const game of schedule) {
      if (game.isComplete) {
        gameIds.add(game.gameId);
      }
    }

    await delay(100); // Rate limiting
  }

  console.log(`Found ${gameIds.size} unique completed games`);

  // Fetch game details
  const games: Game[] = [];
  let count = 0;
  for (const gameId of gameIds) {
    count++;
    if (count % 10 === 0) {
      console.log(`Fetching game ${count}/${gameIds.size}...`);
    }

    const game = await fetchGameDetails(gender, gameId, teamLookup);
    if (game) {
      games.push(game);
    }

    await delay(50); // Rate limiting
  }

  console.log(`Successfully fetched ${games.length} games with box scores`);

  // Sort games by date (most recent first)
  games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate standings
  const standings = calculateStandings(teams, games);

  return { teams, games, standings };
}

async function main() {
  const dataDir = path.join(process.cwd(), 'src', 'data');

  // Create data directories
  const mensDir = path.join(dataDir, 'mens');
  const womensDir = path.join(dataDir, 'womens');

  fs.mkdirSync(mensDir, { recursive: true });
  fs.mkdirSync(womensDir, { recursive: true });

  // Fetch men's data
  const mensData = await fetchGenderData('mens');
  fs.writeFileSync(
    path.join(mensDir, 'teams.json'),
    JSON.stringify(mensData.teams, null, 2)
  );
  fs.writeFileSync(
    path.join(mensDir, 'games.json'),
    JSON.stringify(mensData.games, null, 2)
  );
  fs.writeFileSync(
    path.join(mensDir, 'standings.json'),
    JSON.stringify(mensData.standings, null, 2)
  );
  console.log(`\nMen's data saved to ${mensDir}`);

  // Fetch women's data
  const womensData = await fetchGenderData('womens');
  fs.writeFileSync(
    path.join(womensDir, 'teams.json'),
    JSON.stringify(womensData.teams, null, 2)
  );
  fs.writeFileSync(
    path.join(womensDir, 'games.json'),
    JSON.stringify(womensData.games, null, 2)
  );
  fs.writeFileSync(
    path.join(womensDir, 'standings.json'),
    JSON.stringify(womensData.standings, null, 2)
  );
  console.log(`\nWomen's data saved to ${womensDir}`);

  console.log('\n✅ Data fetch complete!');
}

main().catch(console.error);
