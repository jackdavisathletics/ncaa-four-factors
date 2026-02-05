'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { GenderToggle, ScopeToggle, type StatsScope } from '@/components';
import { getTeams, getStandings, getTeamConference, getConferenceStandings, getTeamConferenceGames, calculateStatsFromGames, getConferenceOnlyAverages } from '@/lib/data';
import {
  Gender,
  Season,
  AVAILABLE_SEASONS,
  TeamStandings,
  FOUR_FACTORS_META,
  calculatePointsImpactVsAvg,
  calculateAveragesFromStandings,
  FourFactors,
} from '@/lib/types';

type ViewMode = 'cumulative' | 'split';
type ValueMode = 'percentages' | 'points-impact';

// Seasons in chronological order for the chart
const CHRONOLOGICAL_SEASONS: Season[] = [...AVAILABLE_SEASONS].reverse();

interface TeamSeasonData {
  pointsImpact: number | null;
  offensiveImpact: number | null;
  allowedImpact: number | null;
  offensive: number | null;
  allowed: number | null;
  confAvg: number | null;
  confName: string | null;
}

interface TrendDataPoint {
  season: string;
  seasonRaw: Season;
  team1Value: number | null;
  team2Value: number | null;
  team1Offensive: number | null;
  team1Allowed: number | null;
  team2Offensive: number | null;
  team2Allowed: number | null;
  team1Name: string;
  team2Name: string;
  team1Data: TeamSeasonData;
  team2Data: TeamSeasonData;
}

interface FactorTrendData {
  key: keyof FourFactors;
  label: string;
  shortLabel: string;
  data: TrendDataPoint[];
  color: string;
}

function TrendlinePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [gender, setGender] = useState<Gender>(() => {
    const g = searchParams.get('gender');
    return g === 'womens' ? 'womens' : 'mens';
  });

  const [team1Id, setTeam1Id] = useState<string>(() => {
    return searchParams.get('team1') || '';
  });

  const [team2Id, setTeam2Id] = useState<string>(() => {
    return searchParams.get('team2') || '';
  });

  const [scope, setScope] = useState<StatsScope>(() => {
    const s = searchParams.get('scope');
    return s === 'conference' ? 'conference' : 'di';
  });

  const [viewMode, setViewMode] = useState<ViewMode>('cumulative');

  // Get teams list from the most recent season that has data
  const teams = useMemo(() => {
    // Try to get teams from most recent season first
    for (const season of AVAILABLE_SEASONS) {
      const seasonTeams = getTeams(gender, season);
      if (seasonTeams.length > 0) {
        return seasonTeams.sort((a, b) => a.displayName.localeCompare(b.displayName));
      }
    }
    return [];
  }, [gender]);

  // Calculate trend data for each factor
  const factorTrends = useMemo((): FactorTrendData[] => {
    const factorColors = [
      'var(--factor-efg)',
      'var(--factor-tov)',
      'var(--factor-orb)',
      'var(--factor-ftr)',
    ];

    return FOUR_FACTORS_META.map((meta, index) => {
      const data: TrendDataPoint[] = CHRONOLOGICAL_SEASONS.map((season) => {
        const standings = getStandings(gender, season);
        const diAverages = calculateAveragesFromStandings(standings);

        const offKey = meta.key as keyof TeamStandings;
        const defKey = `opp${meta.key.charAt(0).toUpperCase()}${meta.key.slice(1)}` as keyof TeamStandings;

        const getTeamSeasonData = (teamId: string | null): TeamSeasonData => {
          if (!teamId) {
            return { pointsImpact: null, offensiveImpact: null, allowedImpact: null, offensive: null, allowed: null, confAvg: null, confName: null };
          }

          // Get team's conference info
          const teamConf = getTeamConference(gender, teamId, season);
          let confName: string | null = teamConf?.name || null;

          let offensive: number | null = null;
          let allowed: number | null = null;
          let averages = diAverages;
          let confAvg: number | null = null;

          if (scope === 'conference' && teamConf) {
            // Conference mode: use conference-only stats and averages
            const confGames = getTeamConferenceGames(gender, teamId, season);
            if (confGames.length > 0) {
              const confStats = calculateStatsFromGames(confGames, teamId);
              offensive = confStats[meta.key as keyof typeof confStats] as number;
              allowed = confStats[defKey.replace('opp', '').toLowerCase().replace(/^(.)/, (m) => 'opp' + m.charAt(0).toUpperCase() + m.slice(1)) as keyof typeof confStats] as number;
              // Fix: get oppXxx from confStats correctly
              const oppKey = `opp${meta.key.charAt(0).toUpperCase()}${meta.key.slice(1)}` as keyof typeof confStats;
              allowed = confStats[oppKey] as number;

              // Use conference-only averages
              const confOnlyAvg = getConferenceOnlyAverages(gender, teamConf.id, season);
              averages = { ...diAverages, ...confOnlyAvg };

              // Conference average for display
              confAvg = confOnlyAvg[meta.key as keyof typeof confOnlyAvg] as number;
            }
          } else {
            // DI mode: use all-games stats
            const team = standings.find((s) => s.teamId === teamId);
            if (team) {
              offensive = team[offKey] as number;
              allowed = team[defKey] as number;

              // Conference average for tooltip display
              if (teamConf) {
                const confStandings = getConferenceStandings(gender, teamConf.id, season);
                if (confStandings.length > 0) {
                  const confSum = confStandings.reduce((sum, t) => sum + (t[offKey] as number), 0);
                  confAvg = confSum / confStandings.length;
                }
              }
            }
          }

          if (offensive === null || allowed === null) {
            return { pointsImpact: null, offensiveImpact: null, allowedImpact: null, offensive: null, allowed: null, confAvg, confName };
          }

          const offensiveImpact = calculatePointsImpactVsAvg(meta.key, offensive, averages, false);
          const allowedImpact = calculatePointsImpactVsAvg(meta.key, allowed, averages, true);
          const pointsImpact = offensiveImpact + allowedImpact;
          return { pointsImpact, offensiveImpact, allowedImpact, offensive, allowed, confAvg, confName };
        };

        const team1Info = team1Id ? teams.find((t) => t.id === team1Id) : null;
        const team2Info = team2Id ? teams.find((t) => t.id === team2Id) : null;

        const team1Data = getTeamSeasonData(team1Id);
        const team2Data = getTeamSeasonData(team2Id);

        return {
          season: season.replace('-', '\u2011'), // Non-breaking hyphen
          seasonRaw: season,
          team1Value: team1Data.pointsImpact,
          team2Value: team2Data.pointsImpact,
          team1Offensive: team1Data.offensiveImpact,
          team1Allowed: team1Data.allowedImpact,
          team2Offensive: team2Data.offensiveImpact,
          team2Allowed: team2Data.allowedImpact,
          team1Name: team1Info?.abbreviation || 'Team 1',
          team2Name: team2Info?.abbreviation || 'Team 2',
          team1Data,
          team2Data,
        };
      });

      return {
        key: meta.key,
        label: meta.label,
        shortLabel: meta.shortLabel,
        data,
        color: factorColors[index],
      };
    });
  }, [gender, team1Id, team2Id, teams, scope]);

  // Get selected team info for colors
  const team1Info = teams.find((t) => t.id === team1Id);
  const team2Info = teams.find((t) => t.id === team2Id);

  const team1Color = team1Info?.color || '#00d4ff';
  const team2Color = team2Info?.color || '#ff3366';

  // Custom tooltip component factory - creates tooltip for specific factor
  const createCustomTooltip = (factorKey: keyof FourFactors, factorLabel: string) => {
    const meta = FOUR_FACTORS_META.find(m => m.key === factorKey);
    const formatValue = meta?.format || ((v: number) => v.toFixed(1));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function CustomTooltip(props: any) {
      const { active, payload, label } = props;
      if (active && payload && payload.length > 0) {
        const dataPoint = payload[0].payload as TrendDataPoint;

        const renderTeamStats = (
          teamData: TeamSeasonData,
          teamName: string,
          teamColor: string,
          isVisible: boolean
        ) => {
          if (!isVisible || teamData.pointsImpact === null) return null;

          return (
            <div className="mb-3 last:mb-0">
              <p className="text-sm font-semibold mb-1" style={{ color: teamColor }}>
                {teamName}
              </p>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--foreground-muted)]">Points Impact (vs {scope === 'di' ? 'DI' : 'conf'}):</span>
                  <span className="stat-number font-semibold" style={{ color: teamData.pointsImpact >= 0 ? 'var(--chart-positive)' : 'var(--chart-negative)' }}>
                    {teamData.pointsImpact >= 0 ? '+' : ''}{teamData.pointsImpact.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--foreground-muted)]">Offensive:</span>
                  <span className="stat-number">{formatValue(teamData.offensive!)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--foreground-muted)]">Allowed:</span>
                  <span className="stat-number">{formatValue(teamData.allowed!)}</span>
                </div>
                {teamData.confAvg !== null && (
                  <div className="flex justify-between gap-4 pt-1 border-t border-[var(--border)]">
                    <span className="text-[var(--foreground-muted)]">{teamData.confName} Avg:</span>
                    <span className="stat-number text-[var(--foreground-muted)]">{formatValue(teamData.confAvg)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        };

        return (
          <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-3 shadow-lg min-w-[180px]">
            <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-2 uppercase tracking-wide">
              {label} &middot; {factorLabel}
            </p>
            {renderTeamStats(dataPoint.team1Data, dataPoint.team1Name, team1Color, !!team1Id)}
            {team1Id && team2Id && <div className="border-t border-[var(--border)] my-2" />}
            {renderTeamStats(dataPoint.team2Data, dataPoint.team2Name, team2Color, !!team2Id)}
          </div>
        );
      }
      return null;
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl mb-1 sm:mb-2">Trendline</h1>
            <p className="text-sm sm:text-base text-[var(--foreground-muted)]">
              Compare Four Factors performance across seasons
              <span className="text-xs ml-2">({scope === 'di' ? 'all DI games' : 'conference games only'})</span>
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <GenderToggle
              value={gender}
              onChange={(g) => {
                setGender(g);
                setTeam1Id('');
                setTeam2Id('');
              }}
            />
            <ScopeToggle value={scope} onChange={setScope} conferenceName="Conf" />
            {/* Cumulative/Split Toggle */}
            <div className="inline-flex rounded-lg p-1 bg-[var(--background-tertiary)] border border-[var(--border)]">
              <button
                onClick={() => setViewMode(viewMode === 'cumulative' ? 'split' : 'cumulative')}
                className={`
                  relative px-4 py-1.5 rounded-md text-sm font-semibold tracking-wide
                  transition-all duration-200
                  ${viewMode === 'cumulative'
                    ? 'bg-[var(--accent-primary)] text-[var(--background)] shadow-lg'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }
                `}
              >
                <span className="relative z-10">Cumulative</span>
                {viewMode === 'cumulative' && (
                  <div className="absolute inset-0 rounded-md bg-[var(--accent-primary)] opacity-20 blur-md" />
                )}
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'split' ? 'cumulative' : 'split')}
                className={`
                  relative px-4 py-1.5 rounded-md text-sm font-semibold tracking-wide
                  transition-all duration-200
                  ${viewMode === 'split'
                    ? 'bg-[var(--accent-primary)] text-[var(--background)] shadow-lg'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }
                `}
                title="Show offensive and allowed stats as separate lines"
              >
                <span className="relative z-10">Split</span>
                {viewMode === 'split' && (
                  <div className="absolute inset-0 rounded-md bg-[var(--accent-primary)] opacity-20 blur-md" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Team Selection */}
      <div className="card p-4 sm:p-6 mb-8">
        <h2 className="text-lg sm:text-xl mb-4">Select Teams to Compare</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Team 1 Selector */}
          <div>
            <label className="block text-xs text-[var(--foreground-muted)] mb-2 uppercase tracking-wide">
              Team 1
            </label>
            <div className="relative">
              <select
                value={team1Id}
                onChange={(e) => setTeam1Id(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer appearance-none"
                style={{
                  borderColor: team1Id ? team1Color : undefined,
                  borderWidth: team1Id ? '2px' : undefined,
                }}
              >
                <option value="">Select a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.displayName}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-[var(--foreground-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {team1Info && (
              <div className="mt-2 flex items-center gap-2">
                {team1Info.logo && (
                  <img src={team1Info.logo} alt={team1Info.displayName} className="w-6 h-6 object-contain" />
                )}
                <span className="text-sm" style={{ color: team1Color }}>
                  {team1Info.abbreviation}
                </span>
              </div>
            )}
          </div>

          {/* Team 2 Selector */}
          <div>
            <label className="block text-xs text-[var(--foreground-muted)] mb-2 uppercase tracking-wide">
              Team 2
            </label>
            <div className="relative">
              <select
                value={team2Id}
                onChange={(e) => setTeam2Id(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-secondary)] cursor-pointer appearance-none"
                style={{
                  borderColor: team2Id ? team2Color : undefined,
                  borderWidth: team2Id ? '2px' : undefined,
                }}
              >
                <option value="">Select a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.displayName}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-[var(--foreground-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {team2Info && (
              <div className="mt-2 flex items-center gap-2">
                {team2Info.logo && (
                  <img src={team2Info.logo} alt={team2Info.displayName} className="w-6 h-6 object-contain" />
                )}
                <span className="text-sm" style={{ color: team2Color }}>
                  {team2Info.abbreviation}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        {(team1Id || team2Id) && (
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap gap-4">
            {viewMode === 'cumulative' ? (
              <>
                {team1Id && team1Info && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-1 rounded"
                      style={{ backgroundColor: team1Color }}
                    />
                    <span className="text-sm text-[var(--foreground-muted)]">
                      {team1Info.displayName}
                    </span>
                  </div>
                )}
                {team2Id && team2Info && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-1 rounded"
                      style={{ backgroundColor: team2Color }}
                    />
                    <span className="text-sm text-[var(--foreground-muted)]">
                      {team2Info.displayName}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                {team1Id && team1Info && (
                  <>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-1 rounded"
                        style={{ backgroundColor: team1Color }}
                      />
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {team1Info.abbreviation} Offensive
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-0 border-t-2 border-dashed"
                        style={{ borderColor: team1Color }}
                      />
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {team1Info.abbreviation} Allowed
                      </span>
                    </div>
                  </>
                )}
                {team2Id && team2Info && (
                  <>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-1 rounded"
                        style={{ backgroundColor: team2Color }}
                      />
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {team2Info.abbreviation} Offensive
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-0 border-t-2 border-dashed"
                        style={{ borderColor: team2Color }}
                      />
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {team2Info.abbreviation} Allowed
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Charts */}
      {(team1Id || team2Id) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {factorTrends.map((factor) => (
            <div key={factor.key} className="card p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: factor.color }}
                />
                <h3 className="text-lg font-semibold" style={{ color: factor.color }}>
                  {factor.shortLabel}
                </h3>
                <span className="text-sm text-[var(--foreground-muted)]">
                  Points Impact
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={factor.data}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="season"
                      tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                      tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={{ stroke: 'var(--border)' }}
                      tickFormatter={(value) => (value >= 0 ? '+' : '') + value.toFixed(1)}
                      domain={['auto', 'auto']}
                    />
                    <ReferenceLine
                      y={0}
                      stroke="var(--foreground-muted)"
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                    />
                    <Tooltip content={createCustomTooltip(factor.key, factor.shortLabel)} />
                    {/* Cumulative mode: single line per team */}
                    {viewMode === 'cumulative' && team1Id && (
                      <Line
                        type="monotone"
                        dataKey="team1Value"
                        stroke={team1Color}
                        strokeWidth={3}
                        dot={{ fill: team1Color, strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: team1Color }}
                        connectNulls={false}
                        name={team1Info?.abbreviation || 'Team 1'}
                      />
                    )}
                    {viewMode === 'cumulative' && team2Id && (
                      <Line
                        type="monotone"
                        dataKey="team2Value"
                        stroke={team2Color}
                        strokeWidth={3}
                        dot={{ fill: team2Color, strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: team2Color }}
                        connectNulls={false}
                        name={team2Info?.abbreviation || 'Team 2'}
                      />
                    )}
                    {/* Split mode: separate offensive and allowed lines per team */}
                    {viewMode === 'split' && team1Id && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="team1Offensive"
                          stroke={team1Color}
                          strokeWidth={3}
                          dot={{ fill: team1Color, strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 6, fill: team1Color }}
                          connectNulls={false}
                          name={`${team1Info?.abbreviation || 'Team 1'} Off`}
                        />
                        <Line
                          type="monotone"
                          dataKey="team1Allowed"
                          stroke={team1Color}
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={{ fill: team1Color, strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 6, fill: team1Color }}
                          connectNulls={false}
                          name={`${team1Info?.abbreviation || 'Team 1'} Def`}
                        />
                      </>
                    )}
                    {viewMode === 'split' && team2Id && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="team2Offensive"
                          stroke={team2Color}
                          strokeWidth={3}
                          dot={{ fill: team2Color, strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 6, fill: team2Color }}
                          connectNulls={false}
                          name={`${team2Info?.abbreviation || 'Team 2'} Off`}
                        />
                        <Line
                          type="monotone"
                          dataKey="team2Allowed"
                          stroke={team2Color}
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={{ fill: team2Color, strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 6, fill: team2Color }}
                          connectNulls={false}
                          name={`${team2Info?.abbreviation || 'Team 2'} Def`}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-[var(--foreground-muted)] mt-3">
                {viewMode === 'cumulative' ? (
                  <>
                    {factor.key === 'efg' && 'Shooting efficiency impact (offense + defense combined)'}
                    {factor.key === 'tov' && 'Ball security impact (offense + defense combined)'}
                    {factor.key === 'orb' && 'Rebounding impact (offense + defense combined)'}
                    {factor.key === 'ftr' && 'Free throw generation impact (offense + defense combined)'}
                  </>
                ) : (
                  <>
                    {factor.key === 'efg' && 'Shooting efficiency: solid = offensive, dashed = allowed'}
                    {factor.key === 'tov' && 'Ball security: solid = offensive, dashed = allowed'}
                    {factor.key === 'orb' && 'Rebounding: solid = offensive, dashed = allowed'}
                    {factor.key === 'ftr' && 'Free throws: solid = offensive, dashed = allowed'}
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="max-w-md mx-auto">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-[var(--foreground-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
            <h3 className="text-xl mb-2">Select Teams to Compare</h3>
            <p className="text-[var(--foreground-muted)]">
              Choose one or two teams above to see their Four Factors performance trends across the last five seasons.
            </p>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 card p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-3">Understanding Points Impact</h3>
        <p className="text-sm text-[var(--foreground-muted)] mb-4">
          Points Impact measures how much better or worse a team performs in each Four Factor compared to the league average,
          converted to estimated points per game. A positive value means the team gains an advantage in that factor.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {FOUR_FACTORS_META.map((factor, index) => (
            <div key={factor.key} className="text-center">
              <div
                className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center"
                style={{
                  backgroundColor: `var(--factor-${factor.key})`,
                  opacity: 0.2,
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: `var(--factor-${factor.key})` }}
                >
                  {factor.shortLabel.slice(0, 2)}
                </span>
              </div>
              <p className="text-xs font-medium" style={{ color: `var(--factor-${factor.key})` }}>
                {factor.shortLabel}
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                {factor.key === 'efg' && 'Shooting'}
                {factor.key === 'tov' && 'Ball Security'}
                {factor.key === 'orb' && 'Rebounding'}
                {factor.key === 'ftr' && 'Free Throws'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TrendlinePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">Loading...</div>}>
      <TrendlinePageContent />
    </Suspense>
  );
}
