'use client';

import { useState } from 'react';
import { PercentileThresholds } from '@/lib/types';

// Percentile-based colors
const COLORS = {
  good: '#22c55e',    // Green - above 75th percentile (good)
  average: '#eab308', // Yellow - 25th to 75th percentile
  bad: '#ef4444',     // Red - below 25th percentile (bad)
};

interface FactorBarProps {
  label: string;
  value: number;
  average: number;
  percentiles: PercentileThresholds;
  higherIsBetter: boolean;
  teamAbbreviation: string;
}

/**
 * Determine the bar color based on percentile ranking
 * @param value - The metric value
 * @param percentiles - The 25th and 75th percentile thresholds
 * @param higherIsBetter - Whether higher values are better for this metric
 * @returns The color to use for the bar
 */
function getPercentileColor(value: number, percentiles: PercentileThresholds, higherIsBetter: boolean): string {
  const { p25, p75 } = percentiles;

  if (higherIsBetter) {
    // For metrics where higher is better (eFG%, ORB%, FTR)
    // >= 75th percentile = good (green)
    // <= 25th percentile = bad (red)
    if (value >= p75) return COLORS.good;
    if (value <= p25) return COLORS.bad;
    return COLORS.average;
  } else {
    // For metrics where lower is better (TOV%)
    // <= 25th percentile = good (green) - low turnovers
    // >= 75th percentile = bad (red) - high turnovers
    if (value <= p25) return COLORS.good;
    if (value >= p75) return COLORS.bad;
    return COLORS.average;
  }
}

export function FactorBar({
  label,
  value,
  average,
  percentiles,
  higherIsBetter,
  teamAbbreviation,
}: FactorBarProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine the bar color based on percentile ranking
  const color = getPercentileColor(value, percentiles, higherIsBetter);

  // Determine if team is above or below average (accounting for direction)
  const diff = value - average;
  const isGood = higherIsBetter ? diff > 0 : diff < 0;

  // Calculate bar widths for comparison chart
  const maxValue = Math.max(value, average) * 1.1; // 10% padding
  const teamWidth = (value / maxValue) * 100;
  const avgWidth = (average / maxValue) * 100;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main display */}
      <div className="cursor-pointer">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[var(--foreground-muted)]">
            {label}
          </span>
          <span
            className="stat-number text-lg font-bold"
            style={{ color }}
          >
            {value.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(value, 100)}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>

      {/* Hover comparison popup */}
      {isHovered && (
        <div className="absolute left-0 right-0 top-full mt-2 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg p-3">
            <div className="text-xs text-[var(--foreground-muted)] mb-2 font-medium">
              vs Conference Average
            </div>

            {/* Clustered bar chart */}
            <div className="space-y-2">
              {/* Team bar */}
              <div className="flex items-center gap-2">
                <span className="text-xs w-12 text-right font-medium" style={{ color }}>
                  {teamAbbreviation}
                </span>
                <div className="flex-1 h-5 bg-[var(--background-tertiary)] rounded overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-300"
                    style={{
                      width: `${teamWidth}%`,
                      backgroundColor: color,
                    }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white drop-shadow-sm">
                    {value.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Average bar */}
              <div className="flex items-center gap-2">
                <span className="text-xs w-12 text-right text-[var(--foreground-muted)]">
                  Avg
                </span>
                <div className="flex-1 h-5 bg-[var(--background-tertiary)] rounded overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-300 bg-[var(--foreground-muted)] opacity-50"
                    style={{ width: `${avgWidth}%` }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--foreground)]">
                    {average.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Difference indicator */}
            <div className="mt-2 pt-2 border-t border-[var(--border)] flex justify-between items-center">
              <span className="text-xs text-[var(--foreground-muted)]">
                {higherIsBetter ? 'Higher is better' : 'Lower is better'}
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: isGood ? 'var(--accent-success)' : 'var(--accent-secondary)' }}
              >
                {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
