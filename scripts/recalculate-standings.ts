/**
 * Recalculate standings from existing games data
 * Filters to D1 vs D1 games only and regenerates standings.json and filtered games.json
 *
 * Run with: npx tsx scripts/recalculate-standings.ts [--season YYYY-YY]
 */

import * as fs from 'fs';
import * as path from 'path';

type Gender = 'mens' | 'womens';

interface GameTeamStats {
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  teamLogo: string;
  teamColor: string;
  score: number;
  isHome: boolean;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  turnovers: number;
  efg: number;
  tov: number;
  orb: number;
  ftr: number;
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

    // Only include D1 vs D1 games
    const homeIsD1 = standingsMap.has(game.homeTeam.teamId);
    const awayIsD1 = standingsMap.has(game.awayTeam.teamId);
    if (!homeIsD1 || !awayIsD1) continue;

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

    // Process both teams
    processTeam(game.homeTeam, game.awayTeam);
    processTeam(game.awayTeam, game.homeTeam);
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
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.confWins - a.confWins;
  });
}

function processGender(gender: Gender, season: string) {
  const dataDir = path.join(process.cwd(), 'src', 'data', gender, season);

  if (!fs.existsSync(dataDir)) {
    console.log(`No data found for ${gender} ${season}`);
    return;
  }

  console.log(`\nProcessing ${gender} ${season}...`);

  const teams: Team[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'teams.json'), 'utf-8'));
  const games: Game[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'games.json'), 'utf-8'));

  console.log(`  Loaded ${teams.length} teams and ${games.length} games`);

  // Filter to D1 vs D1 games
  const d1TeamIds = new Set(teams.map(t => t.id));
  const d1Games = games.filter(g => d1TeamIds.has(g.homeTeam.teamId) && d1TeamIds.has(g.awayTeam.teamId));
  const nonD1Count = games.length - d1Games.length;

  if (nonD1Count > 0) {
    console.log(`  Filtered out ${nonD1Count} non-D1 games (keeping ${d1Games.length} D1 vs D1 games)`);
  }

  // Calculate standings
  const standings = calculateStandings(teams, d1Games);

  // Verify averages
  const avgEfg = standings.reduce((sum, s) => sum + s.efg, 0) / standings.length;
  const avgOppEfg = standings.reduce((sum, s) => sum + s.oppEfg, 0) / standings.length;
  console.log(`  Average eFG%: ${avgEfg.toFixed(3)}`);
  console.log(`  Average oppEfg%: ${avgOppEfg.toFixed(3)}`);
  console.log(`  Difference: ${Math.abs(avgEfg - avgOppEfg).toFixed(4)} (should be ~0)`);

  // Save filtered games and new standings
  fs.writeFileSync(path.join(dataDir, 'games.json'), JSON.stringify(d1Games, null, 2));
  fs.writeFileSync(path.join(dataDir, 'standings.json'), JSON.stringify(standings, null, 2));

  console.log(`  Saved updated games.json and standings.json`);
}

function main() {
  const args = process.argv.slice(2);
  let season = '2025-26';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--season' && args[i + 1]) {
      season = args[i + 1];
      i++;
    }
  }

  console.log(`🏀 Recalculating standings (D1 vs D1 only)`);
  console.log(`📅 Season: ${season}`);

  processGender('mens', season);
  processGender('womens', season);

  console.log('\n✅ Done!');
}

main();
