'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Season, DEFAULT_SEASON } from '@/lib/types';
import { SeasonSelector } from '@/components';

interface TeamSeasonSelectorProps {
  currentSeason: Season;
}

export function TeamSeasonSelector({ currentSeason }: TeamSeasonSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSeasonChange = (season: Season) => {
    const seasonParam = season !== DEFAULT_SEASON ? `?season=${season}` : '';
    router.push(`${pathname}${seasonParam}`);
  };

  return (
    <SeasonSelector value={currentSeason} onChange={handleSeasonChange} />
  );
}
