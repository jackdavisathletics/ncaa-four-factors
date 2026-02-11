'use client';

import { useMemo, useState } from 'react';
import { GameTeamStats, calculatePointsImpact, calculatePossessions, FourFactors } from '@/lib/types';

interface WaterfallChartProps {
  homeTeam: GameTeamStats;
  awayTeam: GameTeamStats;
}

// Factor keys matching the Four Factors
type FactorKey = keyof FourFactors;

interface FactorDisplay {
  key: FactorKey;
  label: string;
  shortLabel: string;
}

const FACTOR_DISPLAY: FactorDisplay[] = [
  { key: 'efg', label: 'Shooting', shortLabel: 'eFG%' },
  { key: 'tov', label: 'Turnovers', shortLabel: 'TOV%' },
  { key: 'orb', label: 'Rebounding', shortLabel: 'ORB%' },
  { key: 'ftr', label: 'Free Throws', shortLabel: 'FTR' },
];

// Parse hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

// Calculate color distance using weighted Euclidean distance (accounts for human perception)
function getColorDistance(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return 1000; // Max distance if parsing fails

  // Weighted distance (human eyes are more sensitive to green)
  const rMean = (rgb1.r + rgb2.r) / 2;
  const dR = rgb1.r - rgb2.r;
  const dG = rgb1.g - rgb2.g;
  const dB = rgb1.b - rgb2.b;

  // Formula from: https://www.compuphase.com/cmetric.htm
  return Math.sqrt(
    (2 + rMean / 256) * dR * dR +
    4 * dG * dG +
    (2 + (255 - rMean) / 256) * dB * dB
  );
}

// Threshold for considering colors too similar (lower = more strict)
const COLOR_SIMILARITY_THRESHOLD = 120;

// Calculate relative luminance (0 = black, 1 = white)
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 1;

  const toLinear = (c: number) => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

// Check if a color is too light to be visible on a light background
function isColorTooLight(hex: string): boolean {
  return getLuminance(hex) > 0.7; // Colors with luminance > 0.7 are too light
}

// Fallback color for teams with light colors
const FALLBACK_DARK_COLOR = '#374151'; // A neutral dark gray

interface WaterfallBar {
  key: FactorKey;
  label: string;
  value: number; // Points impact from home team's perspective (positive = home advantage)
  runningTotal: number;
  previousTotal: number;
  homeAdvantage: boolean; // true if home team had the advantage in this factor
  advantageTeamColor: string;
  advantageTeamLogo: string;
  advantageTeamAbbr: string;
  homeValue: number; // actual percentage for home team
  awayValue: number; // actual percentage for away team
}

export function WaterfallChart({ homeTeam, awayTeam }: WaterfallChartProps) {
  const [hoveredBar, setHoveredBar] = useState<FactorKey | null>(null);

  // Determine display colors, avoiding colors that are too similar or too light
  const { awayDisplayColor, homeDisplayColor } = useMemo(() => {
    // Helper to get a usable color (not too light)
    const getUsableColor = (primary: string, alternate: string): string => {
      if (!isColorTooLight(primary)) return primary;
      if (!isColorTooLight(alternate)) return alternate;
      return FALLBACK_DARK_COLOR;
    };

    let awayColor = getUsableColor(awayTeam.teamColor, awayTeam.teamAlternateColor);
    let homeColor = getUsableColor(homeTeam.teamColor, homeTeam.teamAlternateColor);

    // Check if the chosen colors are too similar to each other
    const colorDistance = getColorDistance(awayColor, homeColor);

    if (colorDistance < COLOR_SIMILARITY_THRESHOLD) {
      // Try alternate combinations to find better contrast
      const awayCandidates = [awayTeam.teamColor, awayTeam.teamAlternateColor].filter(c => !isColorTooLight(c));
      const homeCandidates = [homeTeam.teamColor, homeTeam.teamAlternateColor].filter(c => !isColorTooLight(c));

      let bestDistance = colorDistance;
      for (const ac of awayCandidates.length ? awayCandidates : [FALLBACK_DARK_COLOR]) {
        for (const hc of homeCandidates.length ? homeCandidates : [FALLBACK_DARK_COLOR]) {
          const dist = getColorDistance(ac, hc);
          if (dist > bestDistance) {
            bestDistance = dist;
            awayColor = ac;
            homeColor = hc;
          }
        }
      }
    }

    return { awayDisplayColor: awayColor, homeDisplayColor: homeColor };
  }, [awayTeam.teamColor, awayTeam.teamAlternateColor, homeTeam.teamColor, homeTeam.teamAlternateColor]);

  const data = useMemo(() => {
    // Calculate actual possessions from box scores (average of both teams)
    const homePoss = calculatePossessions(homeTeam);
    const awayPoss = calculatePossessions(awayTeam);
    const avgPossessions = (homePoss + awayPoss) / 2;

    // Build bars for each factor using simple linear coefficients
    // Positive values = home advantage (goes right)
    // Negative values = away advantage (goes left)
    let runningTotal = 0;
    const bars: WaterfallBar[] = FACTOR_DISPLAY.map(factor => {
      // Differential from home team's perspective
      const differential = homeTeam[factor.key] - awayTeam[factor.key];

      // Calculate points impact using simple linear coefficient
      const pointsImpact = calculatePointsImpact(factor.key, differential, avgPossessions);

      const previousTotal = runningTotal;
      runningTotal += pointsImpact;

      // Determine which team had the advantage in this factor
      const homeAdvantage = pointsImpact >= 0;
      const advantageTeam = homeAdvantage ? homeTeam : awayTeam;
      const advantageColor = homeAdvantage ? homeDisplayColor : awayDisplayColor;

      return {
        key: factor.key,
        label: factor.shortLabel,
        value: pointsImpact,
        runningTotal,
        previousTotal,
        homeAdvantage,
        advantageTeamColor: advantageColor,
        advantageTeamLogo: advantageTeam.teamLogo,
        advantageTeamAbbr: advantageTeam.teamAbbreviation,
        homeValue: homeTeam[factor.key],
        awayValue: awayTeam[factor.key],
      };
    });

    // Determine which team has the Four Factors edge
    const edgeTeam = runningTotal >= 0 ? homeTeam : awayTeam;
    const edgeColor = runningTotal >= 0 ? homeDisplayColor : awayDisplayColor;

    return {
      bars,
      total: runningTotal,
      edgeTeam,
      edgeColor,
      // Always keep positions consistent: away on left, home on right
      leftTeam: awayTeam,
      rightTeam: homeTeam,
      leftColor: awayDisplayColor,
      rightColor: homeDisplayColor,
    };
  }, [homeTeam, awayTeam, awayDisplayColor, homeDisplayColor]);

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
      {/* Header showing team perspectives - away on left, home on right to match game header */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: data.leftColor + '20' }}
          >
            {data.leftTeam.teamLogo && (
              <img
                src={data.leftTeam.teamLogo}
                alt={data.leftTeam.teamName}
                width={16}
                height={16}
                className="object-contain" referrerPolicy="no-referrer"
              />
            )}
          </div>
          <span className="text-sm text-[var(--foreground-muted)]">
            {data.leftTeam.teamAbbreviation} advantage
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--foreground-muted)]">
            {data.rightTeam.teamAbbreviation} advantage
          </span>
          <div
            className="w-6 h-6 rounded flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: data.rightColor + '20' }}
          >
            {data.rightTeam.teamLogo && (
              <img
                src={data.rightTeam.teamLogo}
                alt={data.rightTeam.teamName}
                width={16}
                height={16}
                className="object-contain" referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>
      </div>

      {/* Zero marker at top center */}
      <div className="flex justify-center mb-1">
        <span className="text-xs text-[var(--foreground-muted)]">0</span>
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
            // Logo position: left of bar if away team won (bar goes left), right of bar if home team won (bar goes right)
            const logoOnRight = bar.homeAdvantage;

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
                      <span style={{ color: awayDisplayColor }} className="font-semibold">
                        {awayTeam.teamAbbreviation}: {bar.awayValue.toFixed(1)}%
                      </span>
                      <span className="text-[var(--foreground-muted)]">vs</span>
                      <span style={{ color: homeDisplayColor }} className="font-semibold">
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

                  {/* Team logo just outside the bar */}
                  {bar.advantageTeamLogo && (
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center z-20 ${
                        logoOnRight ? '' : '-translate-x-full'
                      }`}
                      style={{
                        left: logoOnRight ? `calc(${left + width}% + 4px)` : `calc(${left}% - 4px)`,
                        backgroundColor: bar.advantageTeamColor + '30',
                      }}
                    >
                      <img
                        src={bar.advantageTeamLogo}
                        alt={bar.advantageTeamAbbr}
                        width={18}
                        height={18}
                        className="object-contain" referrerPolicy="no-referrer"
                      />
                    </div>
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

      {/* Connector line from final bar to total */}
      {(() => {
        const finalPercent = valueToPercent(data.total);
        const centerPercent = 50;
        const goesRight = finalPercent > centerPercent;

        return (
          <div className="relative mt-4">
            {/* Vertical line down from final bar position */}
            <div
              className="absolute w-px h-4 bg-[var(--foreground-muted)] opacity-40"
              style={{ left: `${finalPercent}%`, top: 0 }}
            />
            {/* Horizontal line to center */}
            <div
              className="absolute h-px bg-[var(--foreground-muted)] opacity-40"
              style={{
                left: goesRight ? `${centerPercent}%` : `${finalPercent}%`,
                width: `${Math.abs(finalPercent - centerPercent)}%`,
                top: '16px',
              }}
            />
            {/* Vertical line down to total */}
            <div
              className="absolute w-px h-4 bg-[var(--foreground-muted)] opacity-40"
              style={{ left: '50%', top: '16px' }}
            />
          </div>
        );
      })()}

      {/* Final total */}
      <div className="mt-12 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-center gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: data.edgeColor + '20' }}
          >
            {data.edgeTeam.teamLogo && (
              <img
                src={data.edgeTeam.teamLogo}
                alt={data.edgeTeam.teamName}
                width={28}
                height={28}
                className="object-contain" referrerPolicy="no-referrer"
              />
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide">
              Four Factors Edge
            </p>
            <p
              className="stat-number text-3xl font-bold"
              style={{ color: data.edgeColor }}
            >
              +{Math.abs(data.total).toFixed(1)} pts
            </p>
          </div>
          <div className="text-sm text-[var(--foreground-muted)]">
            {data.edgeTeam.teamAbbreviation}
          </div>
        </div>
      </div>
    </div>
  );
}
