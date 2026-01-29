import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Gender, FOUR_FACTORS_META } from '@/lib/types';
import { getTeamById, getTeamStandings, getTeamGames } from '@/lib/data';
import { GameCard } from '@/components';

interface TeamPageProps {
  params: Promise<{
    gender: string;
    teamId: string;
  }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { gender: genderParam, teamId } = await params;
  const gender = genderParam as Gender;

  if (gender !== 'mens' && gender !== 'womens') {
    notFound();
  }

  const team = getTeamById(gender, teamId);
  const standings = getTeamStandings(gender, teamId);
  const games = getTeamGames(gender, teamId);

  if (!team) {
    notFound();
  }

  const factorColors = [
    'var(--factor-efg)',
    'var(--factor-tov)',
    'var(--factor-orb)',
    'var(--factor-ftr)',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Team Header */}
      <div className="card p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Team Logo */}
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
            style={{ backgroundColor: team.color + '20' }}
          >
            {team.logo ? (
              <img
                src={team.logo}
                alt={team.name}
                width={64}
                height={64}
                className="object-contain"
              />
            ) : (
              <span
                className="text-3xl font-bold"
                style={{ color: team.color }}
              >
                {team.abbreviation}
              </span>
            )}
          </div>

          {/* Team Info */}
          <div className="flex-1">
            <p className="text-sm text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
              {gender === 'mens' ? "Men's" : "Women's"} Basketball
            </p>
            <h1 className="text-4xl mb-2" style={{ color: team.color }}>
              {team.displayName}
            </h1>
            <p className="text-[var(--foreground-muted)]">{team.conference}</p>
          </div>

          {/* Record */}
          {standings && (
            <div className="text-center md:text-right">
              <p className="text-4xl font-bold stat-number">
                {standings.wins}-{standings.losses}
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                {standings.confWins}-{standings.confLosses} Conf
              </p>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                {standings.ppg.toFixed(1)} PPG / {standings.oppPpg.toFixed(1)} Opp
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Four Factors Summary */}
      {standings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Offensive Factors */}
          <div className="card p-6">
            <h2 className="text-xl mb-4" style={{ color: 'var(--accent-primary)' }}>
              Offensive Factors
            </h2>
            <div className="space-y-4">
              {FOUR_FACTORS_META.map((factor, index) => {
                const value = standings[factor.key];
                return (
                  <div key={factor.key}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {factor.label}
                      </span>
                      <span
                        className="stat-number text-lg font-bold"
                        style={{ color: factorColors[index] }}
                      >
                        {factor.format(value)}
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(value, 100)}%`,
                          backgroundColor: factorColors[index],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Defensive Factors */}
          <div className="card p-6">
            <h2 className="text-xl mb-4" style={{ color: 'var(--accent-secondary)' }}>
              Defensive Factors (Allowed)
            </h2>
            <div className="space-y-4">
              {[
                { key: 'oppEfg', label: 'Opp eFG%', higherIsBetter: false },
                { key: 'oppTov', label: 'Opp TOV%', higherIsBetter: true },
                { key: 'oppOrb', label: 'Opp ORB%', higherIsBetter: false },
                { key: 'oppFtr', label: 'Opp FTR', higherIsBetter: false },
              ].map((factor, index) => {
                const value = standings[factor.key as keyof typeof standings] as number;
                return (
                  <div key={factor.key}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {factor.label}
                        <span className="text-xs ml-2">
                          ({factor.higherIsBetter ? '↑ higher is better' : '↓ lower is better'})
                        </span>
                      </span>
                      <span
                        className="stat-number text-lg font-bold"
                        style={{ color: factorColors[index] }}
                      >
                        {value.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(value, 100)}%`,
                          backgroundColor: factorColors[index],
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Games List */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl">Games ({games.length})</h2>
          <Link
            href={`/leaderboard`}
            className="text-sm text-[var(--accent-primary)] hover:underline"
          >
            View Leaderboard →
          </Link>
        </div>

        {games.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map(game => (
              <GameCard key={game.id} game={game} gender={gender} showFactors />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-[var(--foreground-muted)]">No games found for this team.</p>
          </div>
        )}
      </section>
    </div>
  );
}
