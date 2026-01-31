import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Gender, Season, DEFAULT_SEASON, GameTeamStats } from '@/lib/types';
import { getGameById } from '@/lib/data';
import { FourFactorsSection } from '@/components';

interface GamePageProps {
  params: Promise<{
    gender: string;
    gameId: string;
  }>;
  searchParams: Promise<{
    season?: string;
  }>;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function TeamHeader({ team, won, gender, season, compact = false }: { team: GameTeamStats; won: boolean; gender: Gender; season: Season; compact?: boolean }) {
  const seasonParam = season !== DEFAULT_SEASON ? `?season=${season}` : '';
  return (
    <Link
      href={`/team/${gender}/${team.teamId}${seasonParam}`}
      className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 rounded-xl transition-all hover:scale-105 ${
        won ? 'bg-[var(--accent-success)]/5 ring-2 ring-[var(--accent-success)]/30' : ''
      }`}
    >
      <div
        className={`${compact ? 'w-12 h-12 sm:w-20 sm:h-20' : 'w-16 h-16 sm:w-20 sm:h-20'} rounded-2xl flex items-center justify-center overflow-hidden`}
        style={{ backgroundColor: team.teamColor + '20' }}
      >
        {team.teamLogo ? (
          <img
            src={team.teamLogo}
            alt={team.teamName}
            width={56}
            height={56}
            className={`object-contain ${compact ? 'w-8 h-8 sm:w-14 sm:h-14' : 'w-10 h-10 sm:w-14 sm:h-14'}`}
          />
        ) : (
          <span
            className={`${compact ? 'text-lg sm:text-2xl' : 'text-xl sm:text-2xl'} font-bold`}
            style={{ color: team.teamColor }}
          >
            {team.teamAbbreviation}
          </span>
        )}
      </div>
      <div className="text-center">
        <p className={`font-medium ${compact ? 'text-xs sm:text-base' : 'text-sm sm:text-base'} truncate max-w-[80px] sm:max-w-none`}>
          {compact ? team.teamAbbreviation : team.teamName}
        </p>
        <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
          {team.isHome ? 'Home' : 'Away'}
        </p>
      </div>
      <p
        className={`${compact ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-5xl'} font-bold stat-number ${won ? 'text-[var(--accent-success)]' : 'text-[var(--foreground-muted)]'}`}
      >
        {team.score}
      </p>
      {won && (
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-[var(--accent-success)]">
          Winner
        </span>
      )}
    </Link>
  );
}

// Calculate relative luminance of a hex color for contrast checking
function getLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Get contrasting text color based on background luminance
function getContrastColor(hexColor: string): string {
  const luminance = getLuminance(hexColor);
  // Use dark text for light backgrounds, light text for dark backgrounds
  return luminance > 0.4 ? '#1a1a1a' : '#ffffff';
}

function BoxScoreDetail({ label, home, away, higherBetter = true, isKeyMetric = false }: {
  label: string;
  home: string | number;
  away: string | number;
  higherBetter?: boolean;
  isKeyMetric?: boolean;
}) {
  const homeNum = typeof home === 'number' ? home : parseFloat(home);
  const awayNum = typeof away === 'number' ? away : parseFloat(away);
  const homeBetter = higherBetter ? homeNum > awayNum : homeNum < awayNum;
  const awayBetter = higherBetter ? awayNum > homeNum : awayNum < homeNum;

  return (
    <div className={`flex items-center py-2 ${isKeyMetric ? 'border-y border-[var(--foreground)]' : 'border-b border-[var(--border)] last:border-0'}`}>
      <span className={`w-12 sm:w-16 text-right stat-number text-sm sm:text-base ${homeBetter ? 'text-[var(--accent-success)] font-semibold' : 'text-[var(--foreground-muted)]'} ${isKeyMetric ? 'font-bold' : ''}`}>
        {home}
      </span>
      <span className={`flex-1 text-center text-xs sm:text-sm ${isKeyMetric ? 'text-[var(--foreground)] font-bold' : 'text-[var(--foreground-muted)]'}`}>{label}</span>
      <span className={`w-12 sm:w-16 text-left stat-number text-sm sm:text-base ${awayBetter ? 'text-[var(--accent-success)] font-semibold' : 'text-[var(--foreground-muted)]'} ${isKeyMetric ? 'font-bold' : ''}`}>
        {away}
      </span>
    </div>
  );
}

export default async function GamePage({ params, searchParams }: GamePageProps) {
  const { gender: genderParam, gameId } = await params;
  const { season: seasonParam } = await searchParams;
  const gender = genderParam as Gender;
  const season = (seasonParam === '2024-25' ? '2024-25' : DEFAULT_SEASON) as Season;

  if (gender !== 'mens' && gender !== 'womens') {
    notFound();
  }

  const game = getGameById(gender, gameId, season);

  if (!game) {
    notFound();
  }

  const homeWon = game.homeTeam.score > game.awayTeam.score;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Game Header - Mobile optimized */}
      <div className="card p-4 sm:p-8 mb-6 sm:mb-8">
        {/* Date and venue */}
        <div className="text-center mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
            {gender === 'mens' ? "Men's" : "Women's"} Basketball &bull; {season}
          </p>
          <p className="text-base sm:text-lg hidden sm:block" suppressHydrationWarning>{formatDate(game.date)}</p>
          <p className="text-base sm:hidden" suppressHydrationWarning>{formatDateShort(game.date)}</p>
          {game.venue && (
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] truncate">{game.venue}</p>
          )}
          {game.isConferenceGame && (
            <span className="inline-block mt-2 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
              Conference Game
            </span>
          )}
        </div>

        {/* Score - Responsive grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
          <TeamHeader team={game.awayTeam} won={!homeWon} gender={gender} season={season} compact />

          <div className="text-center">
            <span className="text-xl sm:text-2xl font-bold text-[var(--foreground-muted)]">@</span>
          </div>

          <TeamHeader team={game.homeTeam} won={homeWon} gender={gender} season={season} compact />
        </div>
      </div>

      {/* Estimated Point Impact */}
      <div className="card p-4 sm:p-8 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl text-center mb-4 sm:mb-6">Estimated Point Impact</h2>

        <FourFactorsSection homeTeam={game.homeTeam} awayTeam={game.awayTeam} />
      </div>

      {/* Box Score Details */}
      <div className="card p-4 sm:p-8">
        <h2 className="text-xl sm:text-2xl text-center mb-4 sm:mb-6">Box Score Details</h2>

        {/* Team labels for box score */}
        <div className="flex justify-between mb-4 px-2 sm:px-4">
          <span
            className="font-medium text-xs sm:text-sm px-2 py-1 rounded"
            style={{
              backgroundColor: game.homeTeam.teamColor,
              color: getContrastColor(game.homeTeam.teamColor)
            }}
          >
            {game.homeTeam.teamAbbreviation}
          </span>
          <span
            className="font-medium text-xs sm:text-sm px-2 py-1 rounded"
            style={{
              backgroundColor: game.awayTeam.teamColor,
              color: getContrastColor(game.awayTeam.teamColor)
            }}
          >
            {game.awayTeam.teamAbbreviation}
          </span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {/* 2P% */}
          <BoxScoreDetail
            label="2P%"
            home={(() => {
              const fg2a = game.homeTeam.fga - game.homeTeam.fg3a;
              const fg2m = game.homeTeam.fgm - game.homeTeam.fg3m;
              return fg2a > 0 ? ((fg2m / fg2a) * 100).toFixed(1) : '0.0';
            })()}
            away={(() => {
              const fg2a = game.awayTeam.fga - game.awayTeam.fg3a;
              const fg2m = game.awayTeam.fgm - game.awayTeam.fg3m;
              return fg2a > 0 ? ((fg2m / fg2a) * 100).toFixed(1) : '0.0';
            })()}
          />
          {/* 3P% */}
          <BoxScoreDetail
            label="3P%"
            home={game.homeTeam.fg3a > 0 ? ((game.homeTeam.fg3m / game.homeTeam.fg3a) * 100).toFixed(1) : '0.0'}
            away={game.awayTeam.fg3a > 0 ? ((game.awayTeam.fg3m / game.awayTeam.fg3a) * 100).toFixed(1) : '0.0'}
          />
          {/* 3PR (3-Point Rate) */}
          <BoxScoreDetail
            label="3PR"
            home={game.homeTeam.fga > 0 ? ((game.homeTeam.fg3a / game.homeTeam.fga) * 100).toFixed(1) : '0.0'}
            away={game.awayTeam.fga > 0 ? ((game.awayTeam.fg3a / game.awayTeam.fga) * 100).toFixed(1) : '0.0'}
          />
          {/* EFG% (key metric) */}
          <BoxScoreDetail
            label="eFG%"
            home={game.homeTeam.efg.toFixed(1)}
            away={game.awayTeam.efg.toFixed(1)}
            isKeyMetric
          />
          {/* TOV% (lower is better) */}
          <BoxScoreDetail
            label="TOV%"
            home={game.homeTeam.tov.toFixed(1)}
            away={game.awayTeam.tov.toFixed(1)}
            higherBetter={false}
          />
          {/* ORB% */}
          <BoxScoreDetail
            label="ORB%"
            home={game.homeTeam.orb.toFixed(1)}
            away={game.awayTeam.orb.toFixed(1)}
          />
          {/* Total Possessions Gained (key metric) */}
          <BoxScoreDetail
            label="Poss. Gained"
            home={game.homeTeam.oreb - game.homeTeam.turnovers - game.awayTeam.oreb + game.awayTeam.turnovers}
            away={game.awayTeam.oreb - game.awayTeam.turnovers - game.homeTeam.oreb + game.homeTeam.turnovers}
            isKeyMetric
          />
          {/* FTR */}
          <BoxScoreDetail
            label="FTR"
            home={game.homeTeam.ftr.toFixed(1)}
            away={game.awayTeam.ftr.toFixed(1)}
          />
          {/* FT% */}
          <BoxScoreDetail
            label="FT%"
            home={game.homeTeam.fta > 0 ? ((game.homeTeam.ftm / game.homeTeam.fta) * 100).toFixed(1) : '0.0'}
            away={game.awayTeam.fta > 0 ? ((game.awayTeam.ftm / game.awayTeam.fta) * 100).toFixed(1) : '0.0'}
          />
          {/* FTM (key metric) */}
          <BoxScoreDetail
            label="FTM"
            home={game.homeTeam.ftm}
            away={game.awayTeam.ftm}
            isKeyMetric
          />
        </div>
      </div>

      {/* Back link */}
      <div className="mt-6 sm:mt-8 text-center">
        <Link
          href={season !== DEFAULT_SEASON ? `/?season=${season}` : '/'}
          className="text-sm text-[var(--accent-primary)] hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
