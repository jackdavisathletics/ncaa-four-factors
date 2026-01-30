'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
          >
            <div className="w-20 h-20 rounded-full bg-gray-800 p-1.5">
              <img
                src="/four-factors-logo.png"
                alt="Four Factors Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg tracking-wider">Four Factors</h1>
              <p className="text-xs text-[var(--foreground-muted)] -mt-1">NCAA Basketball Analytics</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-wide
                    transition-all duration-200
                    ${isActive
                      ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                    }
                  `}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="ml-2 pl-2 border-l border-[var(--border)]">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
