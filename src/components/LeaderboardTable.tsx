'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TeamStandings, Gender, SortField, SortDirection, FOUR_FACTORS_META } from '@/lib/types';

type ViewMode = 'percentages' | 'points-impact';

interface LeaderboardTableProps {
  standings: TeamStandings[];
  gender: Gender;
  viewMode: ViewMode;
}

interface ColumnDef {
  key: SortField | 'team' | 'record';
  label: string;
  shortLabel: string;
  category: 'info' | 'offensive' | 'defensive';
  higherIsBetter?: boolean;
  format?: (val: number) => string;
  factorKey?: 'efg' | 'tov' | 'orb' | 'ftr';
}

const columns: ColumnDef[] = [
  { key: 'team', label: 'Team', shortLabel: 'Team', category: 'info' },
  { key: 'record', label: 'Record', shortLabel: 'W-L', category: 'info' },
  { key: 'efg', label: 'eFG%', shortLabel: 'eFG%', category: 'offensive', higherIsBetter: true, format: v => v.toFixed(1), factorKey: 'efg' },
  { key: 'tov', label: 'TOV%', shortLabel: 'TOV%', category: 'offensive', higherIsBetter: false, format: v => v.toFixed(1), factorKey: 'tov' },
  { key: 'orb', label: 'ORB%', shortLabel: 'ORB%', category: 'offensive', higherIsBetter: true, format: v => v.toFixed(1), factorKey: 'orb' },
  { key: 'ftr', label: 'FTR', shortLabel: 'FTR', category: 'offensive', higherIsBetter: true, format: v => v.toFixed(1), factorKey: 'ftr' },
  { key: 'oppEfg', label: 'Opp eFG%', shortLabel: 'eFG%', category: 'defensive', higherIsBetter: false, format: v => v.toFixed(1), factorKey: 'efg' },
  { key: 'oppTov', label: 'Opp TOV%', shortLabel: 'TOV%', category: 'defensive', higherIsBetter: true, format: v => v.toFixed(1), factorKey: 'tov' },
  { key: 'oppOrb', label: 'Opp ORB%', shortLabel: 'ORB%', category: 'defensive', higherIsBetter: false, format: v => v.toFixed(1), factorKey: 'orb' },
  { key: 'oppFtr', label: 'Opp FTR', shortLabel: 'FTR', category: 'defensive', higherIsBetter: false, format: v => v.toFixed(1), factorKey: 'ftr' },
];

export function LeaderboardTable({ standings, gender, viewMode }: LeaderboardTableProps) {
  const [sortField, setSortField] = useState<SortField>('wins');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedStandings = useMemo(() => {
    const col = columns.find(c => c.key === sortField);

    return [...standings].sort((a, b) => {
      let aVal: number, bVal: number;

      if (sortField === 'wins') {
        aVal = a.wins;
        bVal = b.wins;
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

  // Calculate league averages for points impact calculation
  const leagueAverages = useMemo(() => {
    if (standings.length === 0) return null;

    const sum = standings.reduce((acc, team) => ({
      efg: acc.efg + team.efg,
      tov: acc.tov + team.tov,
      orb: acc.orb + team.orb,
      ftr: acc.ftr + team.ftr,
      oppEfg: acc.oppEfg + team.oppEfg,
      oppTov: acc.oppTov + team.oppTov,
      oppOrb: acc.oppOrb + team.oppOrb,
      oppFtr: acc.oppFtr + team.oppFtr,
    }), { efg: 0, tov: 0, orb: 0, ftr: 0, oppEfg: 0, oppTov: 0, oppOrb: 0, oppFtr: 0 });

    const count = standings.length;
    return {
      efg: sum.efg / count,
      tov: sum.tov / count,
      orb: sum.orb / count,
      ftr: sum.ftr / count,
      oppEfg: sum.oppEfg / count,
      oppTov: sum.oppTov / count,
      oppOrb: sum.oppOrb / count,
      oppFtr: sum.oppFtr / count,
    };
  }, [standings]);

  // Calculate points impact for a given value
  const calculatePointsImpact = (col: ColumnDef, value: number): number => {
    if (!leagueAverages || !col.factorKey) return 0;

    const avgKey = col.key as keyof typeof leagueAverages;
    const leagueAvg = leagueAverages[avgKey];
    const differential = value - leagueAvg;

    const factor = FOUR_FACTORS_META.find(f => f.key === col.factorKey);
    if (!factor) return 0;

    // For defensive stats, the impact is inverted
    // e.g., lower oppEfg is good, so we negate the differential
    const isDefensive = col.category === 'defensive';
    const adjustedDiff = isDefensive ? -differential : differential;

    // For TOV%, the pointsImpact is already negative
    // For offensive TOV%: higher is bad, so diff * negative = negative points (correct)
    // For defensive TOV% (oppTov): we already negated, so -diff * negative = positive when we force more TOV (correct)
    return adjustedDiff * factor.pointsImpact;
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
            <th colSpan={offensiveColumns.length} className="bg-[var(--background-secondary)]" />
            <th
              colSpan={defensiveColumns.length}
              className="bg-[var(--background-secondary)] text-[var(--foreground)] text-xs font-bold py-1 px-2 text-center border-l-2 border-[var(--foreground)] pl-5"
            >
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
                    py-3 px-3 bg-[var(--background-secondary)]
                    ${col.key === 'team' ? 'text-left sticky left-8 z-10' : 'text-right'}
                    ${col.key !== 'team' && col.key !== 'record' ? 'cursor-pointer hover:text-[var(--accent-primary)]' : ''}
                    ${isLastOffensive ? 'pr-5' : ''}
                    ${isFirstDefensive ? 'border-l-2 border-[var(--foreground)] pl-5' : ''}
                  `}
                  onClick={() => col.key !== 'team' && col.key !== 'record' && handleSort(col.key as SortField)}
                >
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

              {/* Stats */}
              {columns.slice(2).map(col => {
                const value = team[col.key as keyof TeamStandings] as number;
                const isFirstDefensive = col.key === 'oppEfg';
                const isLastOffensive = col.key === 'ftr';

                if (viewMode === 'points-impact' && col.factorKey) {
                  const pointsImpact = calculatePointsImpact(col, value);
                  const color = getPointsImpactColor(pointsImpact);

                  return (
                    <td
                      key={col.key}
                      className={`py-3 px-3 text-right ${isLastOffensive ? 'pr-5' : ''} ${isFirstDefensive ? 'border-l-2 border-[var(--foreground)] pl-5' : ''}`}
                    >
                      <span
                        className="stat-number text-sm font-semibold"
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
                    className={`py-3 px-3 text-right ${isLastOffensive ? 'pr-5' : ''} ${isFirstDefensive ? 'border-l-2 border-[var(--foreground)] pl-5' : ''}`}
                  >
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
