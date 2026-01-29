import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Gender, FOUR_FACTORS_META, GameTeamStats } from '@/lib/types';
import { getGameById } from '@/lib/data';
import { FourFactorsChart } from '@/components';

interface GamePageProps {
  params: Promise<{
    gender: string;
    gameId: string;
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

function TeamHeader({ team, won, gender }: { team: GameTeamStats; won: boolean; gender: Gender }) {
  return (
    <Link
      href={`/team/${gender}/${team.teamId}`}
      className={`flex flex-col items-center gap-3 p-6 rounded-xl transition-all hover:scale-105 ${
        won ? 'bg-[var(--accent-success)]/5 ring-2 ring-[var(--accent-success)]/30' : ''
      }`}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: team.teamColor + '20' }}
      >
        {team.teamLogo ? (
          <Image
            src={team.teamLogo}
            alt={team.teamName}
            width={56}
            height={56}
            className="object-contain"
          />
        ) : (
          <span
            className="text-2xl font-bold"
            style={{ color: team.teamColor }}
          >
            {team.teamAbbreviation}
          </span>
        )}
      </div>
      <div className="text-center">
        <p className="font-medium">{team.teamName}</p>
        <p className="text-xs text-[var(--foreground-muted)]">
          {team.isHome ? 'Home' : 'Away'}
        </p>
      </div>
      <p
        className={`text-5xl font-bold stat-number ${won ? 'text-[var(--accent-success)]' : 'text-[var(--foreground-muted)]'}`}
      >
        {team.score}
      </p>
      {won && (
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-success)]">
          Winner
        </span>
      )}
    </Link>
  );
}

function BoxScoreDetail({ label, home, away, higherBetter = true }: {
  label: string;
  home: string | number;
  away: string | number;
  higherBetter?: boolean;
}) {
  const homeNum = typeof home === 'number' ? home : parseFloat(home);
  const awayNum = typeof away === 'number' ? away : parseFloat(away);
  const homeBetter = higherBetter ? homeNum > awayNum : homeNum < awayNum;
  const awayBetter = higherBetter ? awayNum > homeNum : awayNum < homeNum;

  return (
    <div className="flex items-center py-2 border-b border-[var(--border)] last:border-0">
      <span className={`w-16 text-right stat-number ${homeBetter ? 'text-[var(--accent-success)] font-semibold' : 'text-[var(--foreground-muted)]'}`}>
        {home}
      </span>
      <span className="flex-1 text-center text-sm text-[var(--foreground-muted)]">{label}</span>
      <span className={`w-16 text-left stat-number ${awayBetter ? 'text-[var(--accent-success)] font-semibold' : 'text-[var(--foreground-muted)]'}`}>
        {away}
      </span>
    </div>
  );
}

export default async function GamePage({ params }: GamePageProps) {
  const { gender: genderParam, gameId } = await params;
  const gender = genderParam as Gender;

  if (gender !== 'mens' && gender !== 'womens') {
    notFound();
  }

  const game = getGameById(gender, gameId);

  if (!game) {
    notFound();
  }

  const homeWon = game.homeTeam.score > game.awayTeam.score;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Game Header */}
      <div className="card p-8 mb-8">
        {/* Date and venue */}
        <div className="text-center mb-6">
          <p className="text-sm text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
            {gender === 'mens' ? "Men's" : "Women's"} Basketball
          </p>
          <p className="text-lg">{formatDate(game.date)}</p>
          {game.venue && (
            <p className="text-sm text-[var(--foreground-muted)]">{game.venue}</p>
          )}
          {game.isConferenceGame && (
            <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
              Conference Game
            </span>
          )}
        </div>

        {/* Score */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <TeamHeader team={game.awayTeam} won={!homeWon} gender={gender} />

          <div className="text-center">
            <span className="text-2xl font-bold text-[var(--foreground-muted)]">@</span>
          </div>

          <TeamHeader team={game.homeTeam} won={homeWon} gender={gender} />
        </div>
      </div>

      {/* Four Factors Analysis */}
      <div className="card p-8 mb-8">
        <h2 className="text-2xl text-center mb-6">Four Factors Analysis</h2>

        {/* Team labels */}
        <div className="flex justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: game.awayTeam.teamColor + '20' }}
            >
              {game.awayTeam.teamLogo ? (
                <Image
                  src={game.awayTeam.teamLogo}
                  alt={game.awayTeam.teamName}
                  width={16}
                  height={16}
                  className="object-contain"
                />
              ) : null}
            </div>
            <span className="font-medium">{game.awayTeam.teamAbbreviation}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{game.homeTeam.teamAbbreviation}</span>
            <div
              className="w-6 h-6 rounded flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: game.homeTeam.teamColor + '20' }}
            >
              {game.homeTeam.teamLogo ? (
                <Image
                  src={game.homeTeam.teamLogo}
                  alt={game.homeTeam.teamName}
                  width={16}
                  height={16}
                  className="object-contain"
                />
              ) : null}
            </div>
          </div>
        </div>

        <FourFactorsChart homeTeam={game.homeTeam} awayTeam={game.awayTeam} />

        {/* Winner explanation */}
        <div className="mt-8 p-4 rounded-lg bg-[var(--background-tertiary)]">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)] mb-3">
            Key Takeaways
          </h3>
          <div className="space-y-2 text-sm">
            {FOUR_FACTORS_META.map(factor => {
              const homeVal = game.homeTeam[factor.key];
              const awayVal = game.awayTeam[factor.key];
              const diff = Math.abs(homeVal - awayVal);

              if (diff < 1) return null;

              const homeBetter = factor.higherIsBetter
                ? homeVal > awayVal
                : homeVal < awayVal;
              const winner = homeBetter ? game.homeTeam : game.awayTeam;

              return (
                <p key={factor.key} className="text-[var(--foreground-muted)]">
                  <span className="font-medium text-[var(--foreground)]">{winner.teamAbbreviation}</span>
                  {' '}had the edge in{' '}
                  <span className="font-medium text-[var(--foreground)]">{factor.label}</span>
                  {' '}({factor.format(homeBetter ? homeVal : awayVal)} vs {factor.format(homeBetter ? awayVal : homeVal)})
                </p>
              );
            })}
          </div>
        </div>
      </div>

      {/* Box Score Details */}
      <div className="card p-8">
        <h2 className="text-2xl text-center mb-6">Box Score Details</h2>

        {/* Team labels for box score */}
        <div className="flex justify-between mb-4 px-4">
          <span className="font-medium text-sm" style={{ color: game.homeTeam.teamColor }}>
            {game.homeTeam.teamAbbreviation}
          </span>
          <span className="font-medium text-sm" style={{ color: game.awayTeam.teamColor }}>
            {game.awayTeam.teamAbbreviation}
          </span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          <BoxScoreDetail
            label="Field Goals"
            home={`${game.homeTeam.fgm}-${game.homeTeam.fga}`}
            away={`${game.awayTeam.fgm}-${game.awayTeam.fga}`}
          />
          <BoxScoreDetail
            label="FG%"
            home={game.homeTeam.fga > 0 ? ((game.homeTeam.fgm / game.homeTeam.fga) * 100).toFixed(1) : '0.0'}
            away={game.awayTeam.fga > 0 ? ((game.awayTeam.fgm / game.awayTeam.fga) * 100).toFixed(1) : '0.0'}
          />
          <BoxScoreDetail
            label="3-Pointers"
            home={`${game.homeTeam.fg3m}-${game.homeTeam.fg3a}`}
            away={`${game.awayTeam.fg3m}-${game.awayTeam.fg3a}`}
          />
          <BoxScoreDetail
            label="Free Throws"
            home={`${game.homeTeam.ftm}-${game.homeTeam.fta}`}
            away={`${game.awayTeam.ftm}-${game.awayTeam.fta}`}
          />
          <BoxScoreDetail
            label="Offensive Rebounds"
            home={game.homeTeam.oreb}
            away={game.awayTeam.oreb}
          />
          <BoxScoreDetail
            label="Defensive Rebounds"
            home={game.homeTeam.dreb}
            away={game.awayTeam.dreb}
          />
          <BoxScoreDetail
            label="Turnovers"
            home={game.homeTeam.turnovers}
            away={game.awayTeam.turnovers}
            higherBetter={false}
          />
        </div>
      </div>

      {/* Back link */}
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-sm text-[var(--accent-primary)] hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
