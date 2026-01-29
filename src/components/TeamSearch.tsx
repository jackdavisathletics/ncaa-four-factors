'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Team, Gender } from '@/lib/types';
import { searchTeams } from '@/lib/data';

interface TeamSearchProps {
  gender: Gender;
  placeholder?: string;
}

export function TeamSearch({ gender, placeholder = 'Search teams...' }: TeamSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Team[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Search for teams
  useEffect(() => {
    if (query.length >= 2) {
      const matches = searchTeams(gender, query).slice(0, 8);
      setResults(matches);
      setIsOpen(matches.length > 0);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, gender]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectTeam = useCallback((team: Team) => {
    router.push(`/team/${gender}/${team.id}`);
    setIsOpen(false);
    setQuery('');
  }, [gender, router]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          selectTeam(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="
            w-full px-4 py-3 pl-12
            bg-[var(--background-secondary)] border border-[var(--border)]
            rounded-lg text-[var(--foreground)]
            placeholder:text-[var(--foreground-muted)]
            focus:outline-none focus:border-[var(--accent-primary)]
            focus:ring-2 focus:ring-[var(--accent-primary)]/20
            transition-all duration-200
          "
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {isOpen && results.length > 0 && (
        <div className="
          absolute z-50 w-full mt-2
          bg-[var(--background-secondary)] border border-[var(--border)]
          rounded-lg shadow-xl overflow-hidden
          animate-fade-in
        ">
          {results.map((team, index) => (
            <button
              key={team.id}
              onClick={() => selectTeam(team)}
              className={`
                w-full flex items-center gap-3 px-4 py-3
                text-left transition-colors duration-100
                ${index === selectedIndex
                  ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                  : 'hover:bg-[var(--surface-hover)]'
                }
                ${index !== results.length - 1 ? 'border-b border-[var(--border)]' : ''}
              `}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: team.color + '20' }}
              >
                {team.logo ? (
                  <img
                    src={team.logo}
                    alt={team.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                ) : (
                  <span
                    className="text-xs font-bold"
                    style={{ color: team.color }}
                  >
                    {team.abbreviation.slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{team.displayName}</p>
                <p className="text-xs text-[var(--foreground-muted)]">{team.conference}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
