'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { TeamStandings, Gender, SortField, SortDirection, FOUR_FACTORS_META, calculateAveragesFromStandings, FourFactorsAverages } from '@/lib/types';

type ViewMode = 'percentages' | 'points-impact';

interface LeaderboardTableProps {
  standings: TeamStandings[];
  gender: Gender;
  viewMode: ViewMode;
  selectedConference?: string;
}

interface ColumnDef {
  key: SortField | 'team' | 'record' | 'confRecord';
  label: string;
  shortLabel: string;
  category: 'info' | 'offensive' | 'defensive';
  higherIsBetter?: boolean;
  format?: (val: number) => string;
  factorKey?: 'efg' | 'tov' | 'orb' | 'ftr';
}

const columns: ColumnDef[] = [
  { key: 'team', label: 'Team', shortLabel: 'Team', category: 'info' },
  { key: 'record', label: 'Record', shortLabel: 'W-L', category: 'info', higherIsBetter: true },
  { key: 'confRecord', label: 'Conference', shortLabel: 'Conf', category: 'info', higherIsBetter: true },
  { key: 'efg', label: 'eFG%', shortLabel: 'eFG%', category: 'offensive', higherIsBetter: true, format: v => v.toFixed(1), factorKey: 'efg' },
  { key: 'tov', label: 'TOV%', shortLabel: 'TOV%', category: 'offensive', higherIsBetter: false, format: v => v.toFixed(1), factorKey: 'tov' },
  { key: 'orb', label: 'ORB%', shortLabel: 'ORB%', category: 'offensive', higherIsBetter: true, format: v => v.toFixed(1), factorKey: 'orb' },
  { key: 'ftr', label: 'FTR', shortLabel: 'FTR', category: 'offensive', higherIsBetter: true, format: v => v.toFixed(1), factorKey: 'ftr' },
  { key: 'oppEfg', label: 'Opp eFG%', shortLabel: 'eFG%', category: 'defensive', higherIsBetter: false, format: v => v.toFixed(1), factorKey: 'efg' },
  { key: 'oppTov', label: 'Opp TOV%', shortLabel: 'TOV%', category: 'defensive', higherIsBetter: true, format: v => v.toFixed(1), factorKey: 'tov' },
  { key: 'oppOrb', label: 'Opp ORB%', shortLabel: 'ORB%', category: 'defensive', higherIsBetter: false, format: v => v.toFixed(1), factorKey: 'orb' },
  { key: 'oppFtr', label: 'Opp FTR', shortLabel: 'FTR', category: 'defensive', higherIsBetter: false, format: v => v.toFixed(1), factorKey: 'ftr' },
];

export function LeaderboardTable({ standings, gender, viewMode, selectedConference = 'all' }: LeaderboardTableProps) {
  const [sortField, setSortField] = useState<SortField>(selectedConference !== 'all' ? 'confRecord' : 'record');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Update sort field when conference filter changes
  useEffect(() => {
    setSortField(selectedConference !== 'all' ? 'confRecord' : 'record');
    setSortDirection('desc');
  }, [selectedConference]);

  // Helper to calculate win percentage
  const getWinPct = (wins: number, losses: number): number => {
    const total = wins + losses;
    return total > 0 ? wins / total : 0;
  };

  const sortedStandings = useMemo(() => {
    const col = columns.find(c => c.key === sortField);

    return [...standings].sort((a, b) => {
      let aVal: number, bVal: number;

      if (sortField === 'wins' || sortField === 'record') {
        // Sort by overall win percentage
        aVal = getWinPct(a.wins, a.losses);
        bVal = getWinPct(b.wins, b.losses);
      } else if (sortField === 'confRecord') {
        // Sort by conference win percentage
        aVal = getWinPct(a.confWins, a.confLosses);
        bVal = getWinPct(b.confWins, b.confLosses);
      } else {
        aVal = a[sortField] as number;
        bVal = b[sortField] as number;
      }

      // Adjust for direction preference based on stat type
      const preferHigher = col?.higherIsBetter ?? true;
      const effectiveDirection = preferHigher
        ? sortDirection
        : (sortDirection === 'asc' ? 'desc' : 'asc');

      return effectiveDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [standings, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      const col = columns.find(c => c.key === field);
      // Default to desc for "higher is better" stats, asc for "lower is better"
      setSortDirection(col?.higherIsBetter !== false ? 'desc' : 'asc');
    }
  };

  // Calculate dynamic averages from the standings data
  // This ensures men's and women's teams are compared to their own baselines
  const datasetAverages = useMemo(() => {
    return calculateAveragesFromStandings(standings);
  }, [standings]);

  // Calculate points impact for a given value vs dataset averages
  // Uses 70 possessions per game as standard pace
  const PACE = 70;
  const calculatePointsImpact = (col: ColumnDef, value: number, averages: FourFactorsAverages): number => {
    if (!col.factorKey) return 0;

    const avgKey = col.key as keyof FourFactorsAverages;
    const datasetAvg = averages[avgKey];
    const differential = value - datasetAvg;

    const factor = FOUR_FACTORS_META.find(f => f.key === col.factorKey);
    if (!factor) return 0;

    // For defensive stats, the impact is inverted
    // e.g., lower oppEfg is good, so we negate the differential
    const isDefensive = col.category === 'defensive';
    const adjustedDiff = isDefensive ? -differential : differential;

    // Scale by possessions (pointsImpact is per 100 possessions)
    const pointsPer100 = adjustedDiff * factor.pointsImpact;
    return pointsPer100 * (PACE / 100);
  };

  // Format points impact for display
  const formatPointsImpact = (points: number): string => {
    const sign = points >= 0 ? '+' : '';
    return `${sign}${points.toFixed(1)}`;
  };

  // Get color for points impact value
  const getPointsImpactColor = (points: number): string => {
    if (points > 0.1) return '#22c55e'; // green
    if (points < -0.1) return '#ef4444'; // red
    return 'var(--foreground-muted)';
  };

  // Calculate min/max for each stat column for color scaling (percentages view)
  const statRanges = useMemo(() => {
    const ranges: Record<string, { min: number; max: number }> = {};

    columns.forEach(col => {
      if (col.category !== 'info') {
        const values = standings.map(s => s[col.key as keyof TeamStandings] as number);
        ranges[col.key] = {
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    });

    return ranges;
  }, [standings]);

  const getStatColor = (col: ColumnDef, value: number) => {
    const range = statRanges[col.key];
    if (!range || range.max === range.min) return undefined;

    const normalized = (value - range.min) / (range.max - range.min);
    const isGood = col.higherIsBetter ? normalized > 0.7 : normalized < 0.3;
    const isBad = col.higherIsBetter ? normalized < 0.3 : normalized > 0.7;

    if (isGood) return 'var(--accent-success)';
    if (isBad) return 'var(--accent-secondary)';
    return undefined;
  };

  // Get offensive and defensive column counts for header grouping
  const offensiveColumns = columns.filter(c => c.category === 'offensive');
  const defensiveColumns = columns.filter(c => c.category === 'defensive');

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          {/* Label row */}
          <tr>
            <th className="bg-[var(--background-secondary)] sticky left-0 z-10" />
            <th className="bg-[var(--background-secondary)] sticky left-8 z-10" />
            <th className="bg-[var(--background-secondary)]" />
            <th className="bg-[var(--background-secondary)]" />
            <th colSpan={offensiveColumns.length} className="bg-[var(--background-secondary)]" />
            <th
              colSpan={defensiveColumns.length}
              className="bg-[var(--background-secondary)] text-[var(--foreground)] text-xs font-bold py-1 px-2 text-center pl-6 relative"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--foreground)] -translate-x-1/2" />
              ALLOWED
            </th>
          </tr>
          {/* Column headers */}
          <tr>
            <th className="text-left py-3 px-3 bg-[var(--background-secondary)] sticky left-0 z-10 text-[var(--foreground)]">
              #
            </th>
            {columns.map((col) => {
              const isFirstDefensive = col.key === 'oppEfg';
              const isLastOffensive = col.key === 'ftr';
              return (
                <th
                  key={col.key}
                  className={`
                    py-3 px-3 bg-[var(--background-secondary)] relative
                    ${col.key === 'team' ? 'text-left sticky left-8 z-10' : 'text-right'}
                    ${col.key !== 'team' ? 'cursor-pointer hover:text-[var(--accent-primary)]' : ''}
                    ${isLastOffensive ? 'pr-6' : ''}
                    ${isFirstDefensive ? 'pl-6' : ''}
                  `}
                  onClick={() => col.key !== 'team' && handleSort(col.key as SortField)}
                >
                  {isFirstDefensive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--foreground)] -translate-x-1/2" />
                  )}
                  <div className={`flex items-center gap-1 ${col.key === 'team' ? 'justify-start' : 'justify-end'}`}>
                    <span className="text-xs text-[var(--foreground)]">
                      {col.shortLabel}
                    </span>
                    {sortField === col.key && (
                      <span className="text-[var(--accent-primary)]">
                        {sortDirection === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedStandings.map((team, index) => (
            <tr
              key={team.teamId}
              className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <td className="py-3 px-3 text-[var(--foreground-muted)] text-sm bg-[var(--background)] sticky left-0">
                {index + 1}
              </td>

              {/* Team */}
              <td className="py-3 px-3 bg-[var(--background)] sticky left-8">
                <Link
                  href={`/team/${gender}/${team.teamId}`}
                  className="flex items-center gap-2 hover:text-[var(--accent-primary)] transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center overflow-hidden shrink-0"
                    style={{ backgroundColor: team.teamColor + '20' }}
                  >
                    {team.teamLogo ? (
                      <img
                        src={team.teamLogo}
                        alt={team.teamName}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    ) : (
                      <span
                        className="text-xs font-bold"
                        style={{ color: team.teamColor }}
                      >
                        {team.teamAbbreviation.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <span className="font-medium whitespace-nowrap">{team.teamAbbreviation}</span>
                </Link>
              </td>

              {/* Record */}
              <td className="py-3 px-3 text-right">
                <span className="stat-number text-sm">
                  {team.wins}-{team.losses}
                </span>
              </td>

              {/* Conference Record */}
              <td className="py-3 px-3 text-right">
                <span className="stat-number text-sm text-[var(--foreground-muted)]">
                  {team.confWins}-{team.confLosses}
                </span>
              </td>

              {/* Stats */}
              {columns.slice(3).map(col => {
                const value = team[col.key as keyof TeamStandings] as number;
                const isFirstDefensive = col.key === 'oppEfg';
                const isLastOffensive = col.key === 'ftr';

                if (viewMode === 'points-impact' && col.factorKey) {
                  const pointsImpact = calculatePointsImpact(col, value, datasetAverages);
                  const color = getPointsImpactColor(pointsImpact);

                  return (
                    <td
                      key={col.key}
                      className={`py-3 px-3 text-right relative ${isLastOffensive ? 'pr-6' : ''} ${isFirstDefensive ? 'pl-6' : ''}`}
                    >
                      {isFirstDefensive && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--foreground)] -translate-x-1/2" />
                      )}
                      <span
                        className="stat-number text-sm"
                        style={{ color }}
                        title={`${col.format ? col.format(value) : value}%`}
                      >
                        {formatPointsImpact(pointsImpact)}
                      </span>
                    </td>
                  );
                }

                const color = getStatColor(col, value);
                return (
                  <td
                    key={col.key}
                    className={`py-3 px-3 text-right relative ${isLastOffensive ? 'pr-6' : ''} ${isFirstDefensive ? 'pl-6' : ''}`}
                  >
                    {isFirstDefensive && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--foreground)] -translate-x-1/2" />
                    )}
                    <span
                      className="stat-number text-sm"
                      style={{ color }}
                    >
                      {col.format ? col.format(value) : value}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
