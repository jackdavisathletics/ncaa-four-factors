'use client';

import { useRef, useState, useEffect } from 'react';
import { Game, Gender, Season } from '@/lib/types';
import { GameCard } from './GameCard';

interface GamesCarouselProps {
  games: Game[];
  gender: Gender;
  season: Season;
  showFactors?: boolean;
}

export function GamesCarousel({ games, gender, season, showFactors = false }: GamesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [games]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (games.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-[var(--foreground-muted)]">No games found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop: Grid Layout */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {games.map(game => (
          <GameCard key={game.id} game={game} gender={gender} season={season} showFactors={showFactors} />
        ))}
      </div>

      {/* Mobile: Horizontal Carousel */}
      <div className="md:hidden relative">
        {/* Scroll buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] shadow-lg flex items-center justify-center"
            aria-label="Scroll left"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] shadow-lg flex items-center justify-center"
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {games.map(game => (
            <div
              key={game.id}
              className="flex-shrink-0 w-[85vw] max-w-[320px] snap-start"
            >
              <GameCard game={game} gender={gender} season={season} showFactors={showFactors} />
            </div>
          ))}
        </div>

        {/* Scroll indicator dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {games.slice(0, Math.min(games.length, 8)).map((game, index) => (
            <div
              key={game.id}
              className="w-1.5 h-1.5 rounded-full bg-[var(--border)]"
            />
          ))}
          {games.length > 8 && (
            <span className="text-xs text-[var(--foreground-muted)]">+{games.length - 8}</span>
          )}
        </div>
      </div>
    </>
  );
}
