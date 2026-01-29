'use client';

import { useMemo, useState } from 'react';
import { FOUR_FACTORS_META, GameTeamStats, calculatePointsImpact, FourFactors } from '@/lib/types';

interface WaterfallChartProps {
  homeTeam: GameTeamStats;
  awayTeam: GameTeamStats;
  possessions: number;
}

interface WaterfallBar {
  key: keyof FourFactors;
  label: string;
  value: number; // Points impact from winning team's perspective
  runningTotal: number;
  previousTotal: number;
  winningTeamAdvantage: boolean; // true if winning team had the advantage in this factor
  advantageTeamColor: string;
  advantageTeamAbbr: string;
  homeValue: number; // actual percentage for home team
  awayValue: number; // actual percentage for away team
}

export function WaterfallChart({ homeTeam, awayTeam, possessions }: WaterfallChartProps) {
  const [hoveredBar, setHoveredBar] = useState<keyof FourFactors | null>(null);

  const data = useMemo(() => {
    // Determine winning team (by Four Factors total, not actual score)
    const homeTotal = FOUR_FACTORS_META.reduce((sum, meta) => {
      const homeDiff = homeTeam[meta.key] - awayTeam[meta.key];
      return sum + calculatePointsImpact(meta.key, homeDiff, possessions);
    }, 0);

    const homeIsWinner = homeTotal >= 0;
    const winningTeam = homeIsWinner ? homeTeam : awayTeam;
    const losingTeam = homeIsWinner ? awayTeam : homeTeam;

    // Calculate each factor's contribution from winning team's perspective
    let runningTotal = 0;
    const bars: WaterfallBar[] = FOUR_FACTORS_META.map(meta => {
      // Calculate from winning team's perspective
      const winnerValue = winningTeam[meta.key];
      const loserValue = losingTeam[meta.key];
      const diff = winnerValue - loserValue;
      const pointsImpact = calculatePointsImpact(meta.key, diff, possessions);

      const previousTotal = runningTotal;
      runningTotal += pointsImpact;

      // Determine which team had the advantage in this factor
      const winningTeamAdvantage = pointsImpact >= 0;
      const advantageTeam = winningTeamAdvantage ? winningTeam : losingTeam;

      return {
        key: meta.key,
        label: meta.shortLabel,
        value: pointsImpact,
        runningTotal,
        previousTotal,
        winningTeamAdvantage,
        advantageTeamColor: advantageTeam.teamColor,
        advantageTeamAbbr: advantageTeam.teamAbbreviation,
        homeValue: homeTeam[meta.key],
        awayValue: awayTeam[meta.key],
      };
    });

    return {
      bars,
      total: runningTotal,
      winningTeam,
      losingTeam,
    };
  }, [homeTeam, awayTeam, possessions]);

  // Calculate scale: find the max absolute value we need to display
  // This includes intermediate running totals and individual bar values
  const maxAbsValue = useMemo(() => {
    let max = Math.abs(data.total);
    data.bars.forEach(bar => {
      max = Math.max(max, Math.abs(bar.runningTotal), Math.abs(bar.previousTotal));
    });
    // Add some padding
    return Math.ceil(max * 1.2);
  }, [data]);

  // Convert value to percentage position (0 = center, positive = right, negative = left)
  const valueToPercent = (value: number) => {
    return 50 + (value / maxAbsValue) * 50;
  };

  return (
    <div className="space-y-2">
      {/* Header showing team perspectives */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: data.losingTeam.teamColor + '20' }}
          >
            {data.losingTeam.teamLogo && (
              <img
                src={data.losingTeam.teamLogo}
                alt={data.losingTeam.teamName}
                width={16}
                height={16}
                className="object-contain"
              />
            )}
          </div>
          <span className="text-sm text-[var(--foreground-muted)]">
            {data.losingTeam.teamAbbreviation} advantage
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--foreground-muted)]">
            {data.winningTeam.teamAbbreviation} advantage
          </span>
          <div
            className="w-6 h-6 rounded flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: data.winningTeam.teamColor + '20' }}
          >
            {data.winningTeam.teamLogo && (
              <img
                src={data.winningTeam.teamLogo}
                alt={data.winningTeam.teamName}
                width={16}
                height={16}
                className="object-contain"
              />
            )}
          </div>
        </div>
      </div>

      {/* Center line background */}
      <div className="relative">
        {/* Vertical center line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-[var(--foreground-muted)] opacity-30"
          style={{ left: '50%' }}
        />

        {/* Waterfall bars */}
        <div className="space-y-3">
          {data.bars.map((bar, index) => {
            const startPercent = valueToPercent(bar.previousTotal);
            const endPercent = valueToPercent(bar.runningTotal);
            const left = Math.min(startPercent, endPercent);
            const width = Math.abs(endPercent - startPercent);
            const isHovered = hoveredBar === bar.key;

            return (
              <div
                key={bar.key}
                className="relative cursor-pointer"
                onMouseEnter={() => setHoveredBar(bar.key)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Factor label with hover percentages */}
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
                    {bar.label}
                  </span>
                  {isHovered && (
                    <div className="flex items-center gap-3 text-xs animate-in fade-in duration-150">
                      <span style={{ color: awayTeam.teamColor }} className="font-semibold">
                        {awayTeam.teamAbbreviation}: {bar.awayValue.toFixed(1)}%
                      </span>
                      <span className="text-[var(--foreground-muted)]">vs</span>
                      <span style={{ color: homeTeam.teamColor }} className="font-semibold">
                        {homeTeam.teamAbbreviation}: {bar.homeValue.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Bar container */}
                <div className={`relative h-10 bg-[var(--background-tertiary)] rounded-lg overflow-hidden transition-all duration-150 ${isHovered ? 'ring-2 ring-[var(--foreground-muted)]/30' : ''}`}>
                  {/* Center line */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-[var(--border)] z-10"
                    style={{ left: '50%' }}
                  />

                  {/* Connector line from previous bar (except first) */}
                  {index > 0 && (
                    <div
                      className="absolute top-0 h-full w-px bg-[var(--foreground-muted)] opacity-20"
                      style={{ left: `${startPercent}%` }}
                    />
                  )}

                  {/* The bar itself */}
                  <div
                    className="absolute top-1 bottom-1 rounded transition-all duration-500 flex items-center justify-center"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 0.5)}%`,
                      backgroundColor: bar.advantageTeamColor,
                    }}
                  >
                    {/* Value label centered on bar */}
                    <span className="text-sm font-bold text-white drop-shadow-md">
                      {Math.abs(bar.value).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final total */}
      <div className="mt-8 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-center gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: data.winningTeam.teamColor + '20' }}
          >
            {data.winningTeam.teamLogo && (
              <img
                src={data.winningTeam.teamLogo}
                alt={data.winningTeam.teamName}
                width={28}
                height={28}
                className="object-contain"
              />
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide">
              Four Factors Edge
            </p>
            <p
              className="stat-number text-3xl font-bold"
              style={{ color: data.winningTeam.teamColor }}
            >
              +{Math.abs(data.total).toFixed(1)} pts
            </p>
          </div>
          <div className="text-sm text-[var(--foreground-muted)]">
            {data.winningTeam.teamAbbreviation}
          </div>
        </div>
      </div>
    </div>
  );
}
