import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Gender, Season, DEFAULT_SEASON, FOUR_FACTORS_META, calculateCombinedPointsImpact, formatPointsImpact, calculateAveragesFromStandings, calculatePercentilesFromStandings } from '@/lib/types';
import { getTeamById, getTeamStandings, getTeamGames, getStandings, getTeamConference, getConferenceStandings } from '@/lib/data';
import { GameCard, FactorBar, TeamGenderToggle } from '@/components';
import { TeamSeasonSelector } from './TeamSeasonSelector';

const AVERAGE_PACE = 70;

interface TeamPageProps {
  params: Promise<{
    gender: string;
    teamId: string;
  }>;
  searchParams: Promise<{
    season?: string;
  }>;
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { gender: genderParam, teamId } = await params;
  const { season: seasonParam } = await searchParams;
  const gender = genderParam as Gender;
  const season = (seasonParam === '2024-25' ? '2024-25' : DEFAULT_SEASON) as Season;

  if (gender !== 'mens' && gender !== 'womens') {
    notFound();
  }

  const team = getTeamById(gender, teamId, season);
  const standings = getTeamStandings(gender, teamId, season);
  const games = getTeamGames(gender, teamId, season);

  if (!team) {
    notFound();
  }

  // Get the team's conference and conference-specific standings
  const teamConference = getTeamConference(gender, teamId, season);
  const conferenceStandings = teamConference
    ? getConferenceStandings(gender, teamConference.id, season)
    : [];

  // Calculate averages and percentiles from conference standings (gender-specific)
  const conferenceAverages = calculateAveragesFromStandings(conferenceStandings);
  const conferencePercentiles = calculatePercentilesFromStandings(conferenceStandings);

  // Waterfall chart still uses overall averages for broader context
  const allStandings = getStandings(gender, season);
  const datasetAverages = calculateAveragesFromStandings(allStandings);

  // Colors for the waterfall chart (per factor type)
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
        <div className="flex justify-end gap-4 mb-4">
          <TeamSeasonSelector currentSeason={season} />
          <TeamGenderToggle currentGender={gender} teamId={teamId} />
        </div>
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
              {gender === 'mens' ? "Men's" : "Women's"} Basketball &bull; {season}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Offensive Factors */}
          <div className="card p-6">
            <h2 className="text-xl mb-4" style={{ color: 'var(--accent-primary)' }}>
              Offensive Factors
            </h2>
            <div className="space-y-4">
              {FOUR_FACTORS_META.map((factor) => {
                const value = standings[factor.key];
                const average = conferenceAverages[factor.key];
                const percentiles = conferencePercentiles[factor.key];
                return (
                  <FactorBar
                    key={factor.key}
                    label={factor.label}
                    value={value}
                    average={average}
                    percentiles={percentiles}
                    higherIsBetter={factor.higherIsBetter}
                    teamAbbreviation={team.abbreviation}
                  />
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
                { key: 'oppEfg' as const, label: 'Opp eFG%', higherIsBetter: false },
                { key: 'oppTov' as const, label: 'Opp TOV%', higherIsBetter: true },
                { key: 'oppOrb' as const, label: 'Opp ORB%', higherIsBetter: false },
                { key: 'oppFtr' as const, label: 'Opp FTR', higherIsBetter: false },
              ].map((factor) => {
                const value = standings[factor.key] as number;
                const average = conferenceAverages[factor.key];
                const percentiles = conferencePercentiles[factor.key];
                return (
                  <FactorBar
                    key={factor.key}
                    label={factor.label}
                    value={value}
                    average={average}
                    percentiles={percentiles}
                    higherIsBetter={factor.higherIsBetter}
                    teamAbbreviation={team.abbreviation}
                  />
                );
              })}
            </div>
          </div>

          {/* Points Impact - Waterfall Chart */}
          <div className="card p-6">
            <h2 className="text-xl mb-4" style={{ color: 'var(--accent-success)' }}>
              Points Impact
            </h2>
            <div className="space-y-3">
              {(() => {
                // Build waterfall data with running totals
                // Compare each stat to NCAA D1 averages
                let runningTotal = 0;
                const waterfallData = FOUR_FACTORS_META.map((factor, index) => {
                  const offValue = standings[factor.key];
                  const defKey = `opp${factor.key.charAt(0).toUpperCase()}${factor.key.slice(1)}` as keyof typeof standings;
                  const defValue = standings[defKey] as number;

                  // Calculate combined points impact vs dataset averages
                  const pointsImpact = calculateCombinedPointsImpact(factor.key, offValue, defValue, datasetAverages, AVERAGE_PACE);

                  const previousTotal = runningTotal;
                  runningTotal += pointsImpact;

                  return {
                    label: factor.shortLabel,
                    pointsImpact,
                    previousTotal,
                    runningTotal,
                    color: factorColors[index],
                  };
                });

                const totalImpact = runningTotal;

                // Calculate scale - need to fit all running totals
                let maxAbsValue = Math.abs(totalImpact);
                waterfallData.forEach(bar => {
                  maxAbsValue = Math.max(maxAbsValue, Math.abs(bar.runningTotal), Math.abs(bar.previousTotal));
                });
                maxAbsValue = Math.max(maxAbsValue * 1.2, 5); // Add padding, minimum of 5

                // Convert value to percentage (0 = 50%, positive = right, negative = left)
                const valueToPercent = (value: number) => 50 + (value / maxAbsValue) * 50;

                return (
                  <>
                    {waterfallData.map((data, index) => {
                      const startPercent = valueToPercent(data.previousTotal);
                      const endPercent = valueToPercent(data.runningTotal);
                      const left = Math.min(startPercent, endPercent);
                      const width = Math.abs(endPercent - startPercent);
                      const isPositive = data.pointsImpact >= 0;

                      return (
                        <div key={data.label}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-[var(--foreground-muted)]">
                              {data.label}
                            </span>
                            <span
                              className="stat-number text-sm font-bold"
                              style={{ color: isPositive ? 'var(--accent-success)' : 'var(--accent-secondary)' }}
                            >
                              {formatPointsImpact(data.pointsImpact)}
                            </span>
                          </div>
                          <div className="h-6 bg-[var(--background-tertiary)] rounded overflow-hidden relative">
                            {/* Center line (0 point) */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border)] z-10" />

                            {/* Connector line from previous bar */}
                            {index > 0 && (
                              <div
                                className="absolute top-0 bottom-0 w-px bg-[var(--foreground-muted)] opacity-30"
                                style={{ left: `${startPercent}%` }}
                              />
                            )}

                            {/* Waterfall bar */}
                            <div
                              className="absolute top-1 bottom-1 rounded transition-all duration-500 flex items-center justify-center"
                              style={{
                                left: `${left}%`,
                                width: `${Math.max(width, 1)}%`,
                                backgroundColor: isPositive ? 'var(--accent-success)' : 'var(--accent-secondary)',
                              }}
                            >
                              {width > 8 && (
                                <span className="text-xs font-bold text-white drop-shadow-sm">
                                  {Math.abs(data.pointsImpact).toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Total */}
                    <div className="pt-3 mt-1 border-t border-[var(--border)]">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Impact</span>
                        <span
                          className="stat-number text-xl font-bold"
                          style={{ color: totalImpact >= 0 ? 'var(--accent-success)' : 'var(--accent-secondary)' }}
                        >
                          {formatPointsImpact(totalImpact)} pts
                        </span>
                      </div>
                      <p className="text-xs text-[var(--foreground-muted)] mt-1">
                        Avg. per game @ {AVERAGE_PACE} pace
                      </p>
                    </div>
                  </>
                );
              })()}
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
              <GameCard key={game.id} game={game} gender={gender} season={season} showFactors />
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
