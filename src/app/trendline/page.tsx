'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Customized,
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
  teamValue: number | null;
  teamOffensive: number | null;
  teamAllowed: number | null;
  teamOffPct: number | null;
  teamAllowedPct: number | null;
  teamName: string;
  teamData: TeamSeasonData;
  // For area fills - computed based on which is "good"
  goodTop: number | null;
  goodBottom: number | null;
  badTop: number | null;
  badBottom: number | null;
}

interface FactorTrendData {
  key: keyof FourFactors;
  label: string;
  shortLabel: string;
  data: TrendDataPoint[];
  color: string;
  higherOffensiveIsBetter: boolean;
}

function TrendlinePageContent() {
  const searchParams = useSearchParams();

  const [gender, setGender] = useState<Gender>(() => {
    const g = searchParams.get('gender');
    return g === 'womens' ? 'womens' : 'mens';
  });

  const [teamId, setTeamId] = useState<string>(() => {
    return searchParams.get('team') || searchParams.get('team1') || '';
  });

  const [scope, setScope] = useState<StatsScope>(() => {
    const s = searchParams.get('scope');
    return s === 'conference' ? 'conference' : 'di';
  });

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [valueMode, setValueMode] = useState<ValueMode>('percentages');

  // Effective view mode - always 'split' when in percentage mode
  const effectiveViewMode = valueMode === 'percentages' ? 'split' : viewMode;

  // Get teams list from the most recent season that has data
  const teams = useMemo(() => {
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
      // For TOV%, lower offensive is better (fewer turnovers)
      // For all others, higher offensive is better
      const higherOffensiveIsBetter = meta.key !== 'tov';

      const data: TrendDataPoint[] = CHRONOLOGICAL_SEASONS.map((season) => {
        const standings = getStandings(gender, season);
        const diAverages = calculateAveragesFromStandings(standings);

        const offKey = meta.key as keyof TeamStandings;
        const defKey = `opp${meta.key.charAt(0).toUpperCase()}${meta.key.slice(1)}` as keyof TeamStandings;

        const getTeamSeasonData = (tid: string | null): TeamSeasonData => {
          if (!tid) {
            return { pointsImpact: null, offensiveImpact: null, allowedImpact: null, offensive: null, allowed: null, confAvg: null, confName: null };
          }

          const teamConf = getTeamConference(gender, tid, season);
          const confName: string | null = teamConf?.name || null;

          let offensive: number | null = null;
          let allowed: number | null = null;
          let averages = diAverages;
          let confAvg: number | null = null;

          if (scope === 'conference' && teamConf) {
            const confGames = getTeamConferenceGames(gender, tid, season);
            if (confGames.length > 0) {
              const confStats = calculateStatsFromGames(confGames, tid);
              offensive = confStats[meta.key as keyof typeof confStats] as number;
              const oppKey = `opp${meta.key.charAt(0).toUpperCase()}${meta.key.slice(1)}` as keyof typeof confStats;
              allowed = confStats[oppKey] as number;

              const confOnlyAvg = getConferenceOnlyAverages(gender, teamConf.id, season);
              averages = { ...diAverages, ...confOnlyAvg };
              confAvg = confOnlyAvg[meta.key as keyof typeof confOnlyAvg] as number;
            }
          } else {
            const team = standings.find((s) => s.teamId === tid);
            if (team) {
              offensive = team[offKey] as number;
              allowed = team[defKey] as number;

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

        const teamInfo = teamId ? teams.find((t) => t.id === teamId) : null;
        const teamData = getTeamSeasonData(teamId);

        // Calculate fill regions based on which value represents "good" performance
        let goodTop: number | null = null;
        let goodBottom: number | null = null;
        let badTop: number | null = null;
        let badBottom: number | null = null;

        if (teamData.offensive !== null && teamData.allowed !== null) {
          const off = teamData.offensive;
          const allowed = teamData.allowed;

          // Determine if this is a "good" situation
          // For most factors: higher offensive than allowed is good
          // For TOV%: lower offensive than allowed is good (we turn the ball over less than we force turnovers)
          const isGood = higherOffensiveIsBetter ? off >= allowed : off <= allowed;

          if (isGood) {
            goodTop = Math.max(off, allowed);
            goodBottom = Math.min(off, allowed);
            badTop = null;
            badBottom = null;
          } else {
            badTop = Math.max(off, allowed);
            badBottom = Math.min(off, allowed);
            goodTop = null;
            goodBottom = null;
          }
        }

        return {
          season: season.replace('-', '\u2011'),
          seasonRaw: season,
          teamValue: teamData.pointsImpact,
          teamOffensive: teamData.offensiveImpact,
          teamAllowed: teamData.allowedImpact,
          teamOffPct: teamData.offensive,
          teamAllowedPct: teamData.allowed,
          teamName: teamInfo?.abbreviation || 'Team',
          teamData,
          goodTop,
          goodBottom,
          badTop,
          badBottom,
        };
      });

      return {
        key: meta.key,
        label: meta.label,
        shortLabel: meta.shortLabel,
        data,
        color: factorColors[index],
        higherOffensiveIsBetter,
      };
    });
  }, [gender, teamId, teams, scope]);

  const teamInfo = teams.find((t) => t.id === teamId);
  const teamColor = teamInfo?.color || '#00d4ff';

  // Custom tooltip
  const createCustomTooltip = (factorKey: keyof FourFactors, factorLabel: string) => {
    const meta = FOUR_FACTORS_META.find(m => m.key === factorKey);
    const formatValue = meta?.format || ((v: number) => v.toFixed(1));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function CustomTooltip(props: any) {
      const { active, payload, label } = props;
      if (active && payload && payload.length > 0) {
        const dataPoint = payload[0].payload as TrendDataPoint;
        const teamData = dataPoint.teamData;

        if (!teamData || teamData.pointsImpact === null) return null;

        return (
          <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-3 shadow-lg min-w-[180px]">
            <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-2 uppercase tracking-wide">
              {label} &middot; {factorLabel}
            </p>
            <div className="mb-3">
              <p className="text-sm font-semibold mb-1" style={{ color: teamColor }}>
                {dataPoint.teamName}
              </p>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--foreground-muted)]">Net Points Impact:</span>
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
              Four Factors performance across seasons
              <span className="text-xs ml-2">({scope === 'di' ? 'all DI games' : 'conference games only'})</span>
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <GenderToggle
              value={gender}
              onChange={(g) => {
                setGender(g);
                setTeamId('');
              }}
            />
            <ScopeToggle value={scope} onChange={setScope} conferenceName="Conf" />
            {/* % / Points Impact Toggle */}
            <div className="inline-flex rounded-lg p-1 bg-[var(--background-tertiary)] border border-[var(--border)]">
              <button
                onClick={() => setValueMode('percentages')}
                className={`
                  relative px-4 py-1.5 rounded-md text-sm font-semibold tracking-wide
                  transition-all duration-200
                  ${valueMode === 'percentages'
                    ? 'bg-[var(--accent-primary)] text-[var(--background)] shadow-lg'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }
                `}
              >
                <span className="relative z-10">%</span>
                {valueMode === 'percentages' && (
                  <div className="absolute inset-0 rounded-md bg-[var(--accent-primary)] opacity-20 blur-md" />
                )}
              </button>
              <button
                onClick={() => setValueMode('points-impact')}
                className={`
                  relative px-4 py-1.5 rounded-md text-sm font-semibold tracking-wide
                  transition-all duration-200
                  ${valueMode === 'points-impact'
                    ? 'bg-[var(--accent-primary)] text-[var(--background)] shadow-lg'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }
                `}
                title="Points Impact"
              >
                <span className="relative z-10">Pts</span>
                {valueMode === 'points-impact' && (
                  <div className="absolute inset-0 rounded-md bg-[var(--accent-primary)] opacity-20 blur-md" />
                )}
              </button>
            </div>
            {/* Cumulative/Split Toggle - only shown for Points Impact mode */}
            {valueMode === 'points-impact' && (
              <div className="inline-flex rounded-lg p-1 bg-[var(--background-tertiary)] border border-[var(--border)]">
                <button
                  onClick={() => setViewMode('split')}
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
                <button
                  onClick={() => setViewMode('cumulative')}
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Selection */}
      <div className="card p-4 sm:p-6 mb-8">
        <h2 className="text-lg sm:text-xl mb-4">Select Team</h2>
        <div className="max-w-md">
          <div className="relative">
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer appearance-none"
              style={{
                borderColor: teamId ? teamColor : undefined,
                borderWidth: teamId ? '2px' : undefined,
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
          {teamInfo && (
            <div className="mt-2 flex items-center gap-2">
              {teamInfo.logo && (
                <img src={teamInfo.logo} alt={teamInfo.displayName} className="w-6 h-6 object-contain" />
              )}
              <span className="text-sm" style={{ color: teamColor }}>
                {teamInfo.displayName}
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        {teamId && effectiveViewMode === 'split' && (
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-1 rounded"
                style={{ backgroundColor: teamColor }}
              />
              <span className="text-sm text-[var(--foreground-muted)]">
                Offensive
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-0 border-t-2 border-dashed"
                style={{ borderColor: teamColor }}
              />
              <span className="text-sm text-[var(--foreground-muted)]">
                Allowed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.3)' }} />
              <span className="text-sm text-[var(--foreground-muted)]">Good</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)' }} />
              <span className="text-sm text-[var(--foreground-muted)]">Bad</span>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      {teamId ? (
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
                {valueMode === 'points-impact' && (
                  <span className="text-sm text-[var(--foreground-muted)]">
                    Points Impact
                  </span>
                )}
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
                      tickFormatter={(value) => valueMode === 'points-impact'
                        ? (value >= 0 ? '+' : '') + value.toFixed(1)
                        : value.toFixed(1) + '%'
                      }
                      domain={['auto', 'auto']}
                    />
                    {valueMode === 'points-impact' && (
                      <ReferenceLine
                        y={0}
                        stroke="var(--foreground-muted)"
                        strokeDasharray="3 3"
                        strokeOpacity={0.5}
                      />
                    )}
                    <Tooltip content={createCustomTooltip(factor.key, factor.shortLabel)} />

                    {/* Cumulative mode: single line */}
                    {effectiveViewMode === 'cumulative' && (
                      <Line
                        type="monotone"
                        dataKey={valueMode === 'points-impact' ? 'teamValue' : 'teamOffPct'}
                        stroke={teamColor}
                        strokeWidth={3}
                        dot={{ fill: teamColor, strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: teamColor }}
                        connectNulls={false}
                        name={teamInfo?.abbreviation || 'Team'}
                      />
                    )}

                    {/* Split mode: area fills and lines */}
                    {effectiveViewMode === 'split' && (
                      <>
                        {/* Custom fill between lines */}
                        <Customized
                          component={(props: { xAxisMap?: Record<string, { scale: (v: string) => number; bandwidth?: () => number }>; yAxisMap?: Record<string, { scale: (v: number) => number }> }) => {
                            const { xAxisMap, yAxisMap } = props;
                            if (!xAxisMap || !yAxisMap) return null;

                            const xAxis = Object.values(xAxisMap)[0];
                            const yAxis = Object.values(yAxisMap)[0];
                            if (!xAxis || !yAxis) return null;

                            const offKey = valueMode === 'points-impact' ? 'teamOffensive' : 'teamOffPct';
                            const allowedKey = valueMode === 'points-impact' ? 'teamAllowed' : 'teamAllowedPct';

                            // Build path segments for good and bad regions
                            const goodPaths: string[] = [];
                            const badPaths: string[] = [];

                            for (let i = 0; i < factor.data.length - 1; i++) {
                              const curr = factor.data[i];
                              const next = factor.data[i + 1];

                              const currOff = curr[offKey as keyof TrendDataPoint] as number | null;
                              const currAllowed = curr[allowedKey as keyof TrendDataPoint] as number | null;
                              const nextOff = next[offKey as keyof TrendDataPoint] as number | null;
                              const nextAllowed = next[allowedKey as keyof TrendDataPoint] as number | null;

                              if (currOff === null || currAllowed === null || nextOff === null || nextAllowed === null) continue;

                              const bandwidth = xAxis.bandwidth?.() || 0;
                              const x1 = xAxis.scale(curr.season) + bandwidth / 2;
                              const x2 = xAxis.scale(next.season) + bandwidth / 2;
                              const y1Off = yAxis.scale(currOff);
                              const y1Allowed = yAxis.scale(currAllowed);
                              const y2Off = yAxis.scale(nextOff);
                              const y2Allowed = yAxis.scale(nextAllowed);

                              // Determine if this segment is good or bad based on the factor
                              const currIsGood = factor.higherOffensiveIsBetter ? currOff >= currAllowed : currOff <= currAllowed;
                              const nextIsGood = factor.higherOffensiveIsBetter ? nextOff >= nextAllowed : nextOff <= nextAllowed;

                              // Create polygon for this segment
                              const path = `M${x1},${y1Off} L${x2},${y2Off} L${x2},${y2Allowed} L${x1},${y1Allowed} Z`;

                              // If both points have same "goodness", use that color
                              // If they differ, we'd need interpolation - for simplicity, use the start point's status
                              if (currIsGood && nextIsGood) {
                                goodPaths.push(path);
                              } else if (!currIsGood && !nextIsGood) {
                                badPaths.push(path);
                              } else {
                                // Mixed - split at intersection (simplified: use dominant)
                                if (currIsGood) goodPaths.push(path);
                                else badPaths.push(path);
                              }
                            }

                            return (
                              <g>
                                {goodPaths.map((d, i) => (
                                  <path key={`good-${i}`} d={d} fill="rgba(34, 197, 94, 0.25)" stroke="none" />
                                ))}
                                {badPaths.map((d, i) => (
                                  <path key={`bad-${i}`} d={d} fill="rgba(239, 68, 68, 0.25)" stroke="none" />
                                ))}
                              </g>
                            );
                          }}
                        />

                        {/* Offensive line (solid) */}
                        <Line
                          type="monotone"
                          dataKey={valueMode === 'points-impact' ? 'teamOffensive' : 'teamOffPct'}
                          stroke={teamColor}
                          strokeWidth={3}
                          dot={{ fill: teamColor, strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 6, fill: teamColor }}
                          connectNulls={false}
                          name="Offensive"
                        />

                        {/* Allowed line (dashed) */}
                        <Line
                          type="monotone"
                          dataKey={valueMode === 'points-impact' ? 'teamAllowed' : 'teamAllowedPct'}
                          stroke={teamColor}
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={{ fill: teamColor, strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 6, fill: teamColor }}
                          connectNulls={false}
                          name="Allowed"
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-[var(--foreground-muted)] mt-3">
                {effectiveViewMode === 'cumulative' ? (
                  valueMode === 'points-impact' ? (
                    <>
                      {factor.key === 'efg' && 'Shooting efficiency impact (offense + defense combined)'}
                      {factor.key === 'tov' && 'Ball security impact (offense + defense combined)'}
                      {factor.key === 'orb' && 'Rebounding impact (offense + defense combined)'}
                      {factor.key === 'ftr' && 'Free throw generation impact (offense + defense combined)'}
                    </>
                  ) : (
                    <>
                      {factor.key === 'efg' && 'Offensive shooting efficiency (eFG%)'}
                      {factor.key === 'tov' && 'Offensive turnover rate (TOV%)'}
                      {factor.key === 'orb' && 'Offensive rebounding rate (ORB%)'}
                      {factor.key === 'ftr' && 'Offensive free throw rate (FTR)'}
                    </>
                  )
                ) : (
                  <>
                    {factor.key === 'efg' && 'Green: shooting better than allowing | Red: allowing better shots'}
                    {factor.key === 'tov' && 'Green: forcing more turnovers than committing | Red: turning it over more'}
                    {factor.key === 'orb' && 'Green: getting more offensive boards | Red: giving up more'}
                    {factor.key === 'ftr' && 'Green: getting to the line more | Red: fouling more'}
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
            <h3 className="text-xl mb-2">Select a Team</h3>
            <p className="text-[var(--foreground-muted)]">
              Choose a team above to see their Four Factors performance trends across the last five seasons.
            </p>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 card p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-3">Understanding the Charts</h3>
        <p className="text-sm text-[var(--foreground-muted)] mb-4">
          In split view, green areas show where the team has an advantage (outperforming opponents),
          while red areas show disadvantages. The solid line is offensive performance, dashed is what they allow.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {FOUR_FACTORS_META.map((factor) => (
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
