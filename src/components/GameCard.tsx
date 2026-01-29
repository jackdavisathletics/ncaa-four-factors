'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Game, Gender } from '@/lib/types';

interface GameCardProps {
  game: Game;
  gender: Gender;
  showFactors?: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function GameCard({ game, gender, showFactors = false }: GameCardProps) {
  const homeWon = game.homeTeam.score > game.awayTeam.score;
  const awayWon = game.awayTeam.score > game.homeTeam.score;

  return (
    <Link
      href={`/game/${gender}/${game.id}`}
      className="card block p-4 hover:translate-y-[-2px] transition-transform duration-200"
    >
      {/* Date header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide">
          {formatDate(game.date)}
        </span>
        {game.isConferenceGame && (
          <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
            CONF
          </span>
        )}
      </div>

      {/* Away team */}
      <div className={`flex items-center gap-3 py-2 ${awayWon ? '' : 'opacity-60'}`}>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: game.awayTeam.teamColor + '20' }}
        >
          {game.awayTeam.teamLogo ? (
            <Image
              src={game.awayTeam.teamLogo}
              alt={game.awayTeam.teamName}
              width={28}
              height={28}
              className="object-contain"
            />
          ) : (
            <span
              className="text-sm font-bold"
              style={{ color: game.awayTeam.teamColor }}
            >
              {game.awayTeam.teamAbbreviation.slice(0, 2)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{game.awayTeam.teamName}</p>
        </div>
        <span className={`stat-number text-xl font-bold ${awayWon ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}`}>
          {game.awayTeam.score}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--border)] my-1" />

      {/* Home team */}
      <div className={`flex items-center gap-3 py-2 ${homeWon ? '' : 'opacity-60'}`}>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: game.homeTeam.teamColor + '20' }}
        >
          {game.homeTeam.teamLogo ? (
            <Image
              src={game.homeTeam.teamLogo}
              alt={game.homeTeam.teamName}
              width={28}
              height={28}
              className="object-contain"
            />
          ) : (
            <span
              className="text-sm font-bold"
              style={{ color: game.homeTeam.teamColor }}
            >
              {game.homeTeam.teamAbbreviation.slice(0, 2)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{game.homeTeam.teamName}</p>
        </div>
        <span className={`stat-number text-xl font-bold ${homeWon ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}`}>
          {game.homeTeam.score}
        </span>
      </div>

      {/* Four factors preview */}
      {showFactors && (
        <div className="mt-4 pt-3 border-t border-[var(--border)]">
          {/* Header row with factor labels */}
          <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-2 mb-2">
            <div /> {/* Empty space for logo column */}
            <p className="text-xs text-[var(--foreground-muted)] text-center">eFG%</p>
            <p className="text-xs text-[var(--foreground-muted)] text-center">TOV%</p>
            <p className="text-xs text-[var(--foreground-muted)] text-center">ORB%</p>
            <p className="text-xs text-[var(--foreground-muted)] text-center">FTR</p>
          </div>

          {/* Away team stats row */}
          <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-2 items-center mb-1">
            <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden mx-auto"
              style={{ backgroundColor: game.awayTeam.teamColor + '20' }}
            >
              {game.awayTeam.teamLogo ? (
                <Image
                  src={game.awayTeam.teamLogo}
                  alt={game.awayTeam.teamAbbreviation}
                  width={18}
                  height={18}
                  className="object-contain"
                />
              ) : (
                <span className="text-[10px] font-bold" style={{ color: game.awayTeam.teamColor }}>
                  {game.awayTeam.teamAbbreviation.slice(0, 2)}
                </span>
              )}
            </div>
            {[
              { key: 'efg', color: 'var(--factor-efg)', lowerBetter: false },
              { key: 'tov', color: 'var(--factor-tov)', lowerBetter: true },
              { key: 'orb', color: 'var(--factor-orb)', lowerBetter: false },
              { key: 'ftr', color: 'var(--factor-ftr)', lowerBetter: false },
            ].map(factor => {
              const awayVal = game.awayTeam[factor.key as keyof typeof game.awayTeam] as number;
              const homeVal = game.homeTeam[factor.key as keyof typeof game.homeTeam] as number;
              const awayBetter = factor.lowerBetter
                ? awayVal < homeVal
                : awayVal > homeVal;

              return (
                <span
                  key={factor.key}
                  className={`stat-number text-xs text-center ${awayBetter ? 'font-semibold' : 'opacity-50'}`}
                  style={{ color: awayBetter ? factor.color : undefined }}
                >
                  {awayVal.toFixed(1)}
                </span>
              );
            })}
          </div>

          {/* Home team stats row */}
          <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-2 items-center">
            <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden mx-auto"
              style={{ backgroundColor: game.homeTeam.teamColor + '20' }}
            >
              {game.homeTeam.teamLogo ? (
                <Image
                  src={game.homeTeam.teamLogo}
                  alt={game.homeTeam.teamAbbreviation}
                  width={18}
                  height={18}
                  className="object-contain"
                />
              ) : (
                <span className="text-[10px] font-bold" style={{ color: game.homeTeam.teamColor }}>
                  {game.homeTeam.teamAbbreviation.slice(0, 2)}
                </span>
              )}
            </div>
            {[
              { key: 'efg', color: 'var(--factor-efg)', lowerBetter: false },
              { key: 'tov', color: 'var(--factor-tov)', lowerBetter: true },
              { key: 'orb', color: 'var(--factor-orb)', lowerBetter: false },
              { key: 'ftr', color: 'var(--factor-ftr)', lowerBetter: false },
            ].map(factor => {
              const homeVal = game.homeTeam[factor.key as keyof typeof game.homeTeam] as number;
              const awayVal = game.awayTeam[factor.key as keyof typeof game.awayTeam] as number;
              const homeBetter = factor.lowerBetter
                ? homeVal < awayVal
                : homeVal > awayVal;

              return (
                <span
                  key={factor.key}
                  className={`stat-number text-xs text-center ${homeBetter ? 'font-semibold' : 'opacity-50'}`}
                  style={{ color: homeBetter ? factor.color : undefined }}
                >
                  {homeVal.toFixed(1)}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </Link>
  );
}
