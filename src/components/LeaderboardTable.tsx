'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TeamStandings, Gender, SortField, SortDirection } from '@/lib/types';

interface LeaderboardTableProps {
  standings: TeamStandings[];
  gender: Gender;
}

interface ColumnDef {
  key: SortField | 'team' | 'record';
  label: string;
  shortLabel: string;
  category: 'info' | 'offensive' | 'defensive';
  higherIsBetter?: boolean;
  format?: (val: number) => string;
}

const columns: ColumnDef[] = [
  { key: 'team', label: 'Team', shortLabel: 'Team', category: 'info' },
  { key: 'record', label: 'Record', shortLabel: 'W-L', category: 'info' },
  { key: 'efg', label: 'eFG%', shortLabel: 'eFG%', category: 'offensive', higherIsBetter: true, format: v => v.toFixed(1) },
  { key: 'tov', label: 'TOV%', shortLabel: 'TOV%', category: 'offensive', higherIsBetter: false, format: v => v.toFixed(1) },
  { key: 'orb', label: 'ORB%', shortLabel: 'ORB%', category: 'offensive', higherIsBetter: true, format: v => v.toFixed(1) },
  { key: 'ftr', label: 'FTR', shortLabel: 'FTR', category: 'offensive', higherIsBetter: true, format: v => v.toFixed(1) },
  { key: 'oppEfg', label: 'Opp eFG%', shortLabel: 'oeFG%', category: 'defensive', higherIsBetter: false, format: v => v.toFixed(1) },
  { key: 'oppTov', label: 'Opp TOV%', shortLabel: 'oTOV%', category: 'defensive', higherIsBetter: true, format: v => v.toFixed(1) },
  { key: 'oppOrb', label: 'Opp ORB%', shortLabel: 'oORB%', category: 'defensive', higherIsBetter: false, format: v => v.toFixed(1) },
  { key: 'oppFtr', label: 'Opp FTR', shortLabel: 'oFTR', category: 'defensive', higherIsBetter: false, format: v => v.toFixed(1) },
];

export function LeaderboardTable({ standings, gender }: LeaderboardTableProps) {
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'offensive': return 'var(--accent-primary)';
      case 'defensive': return 'var(--accent-secondary)';
      default: return 'var(--foreground-muted)';
    }
  };

  // Calculate min/max for each stat column for color scaling
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left py-3 px-3 bg-[var(--background-secondary)] sticky left-0 z-10">
              #
            </th>
            {columns.map(col => (
              <th
                key={col.key}
                className={`
                  py-3 px-3 bg-[var(--background-secondary)]
                  ${col.key === 'team' ? 'text-left sticky left-8 z-10' : 'text-right'}
                  ${col.key !== 'team' && col.key !== 'record' ? 'cursor-pointer hover:text-[var(--foreground)]' : ''}
                `}
                onClick={() => col.key !== 'team' && col.key !== 'record' && handleSort(col.key as SortField)}
              >
                <div className="flex items-center gap-1 justify-end">
                  <span
                    className="text-xs"
                    style={{ color: getCategoryColor(col.category) }}
                  >
                    {col.shortLabel}
                  </span>
                  {sortField === col.key && (
                    <span className="text-[var(--accent-primary)]">
                      {sortDirection === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
              </th>
            ))}
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
                      <Image
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
                const color = getStatColor(col, value);

                return (
                  <td key={col.key} className="py-3 px-3 text-right">
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
