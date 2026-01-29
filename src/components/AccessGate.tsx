'use client';

import { useState, useEffect, useRef } from 'react';

const ACCESS_CODE = 'GOHENS';
const STORAGE_KEY = 'ncaa-four-factors-access';

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    setIsAuthenticated(stored === 'true');
  }, []);

  useEffect(() => {
    if (isAuthenticated === false && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (code.toUpperCase() === ACCESS_CODE) {
      setSuccess(true);
      setError(false);
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setTimeout(() => {
        setIsAuthenticated(true);
      }, 800);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setCode('');
      inputRef.current?.focus();
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 bg-[var(--background)] flex items-center justify-center">
        <div className="access-loader" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-[var(--background)] overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 access-grid-bg" />

      {/* Gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="access-orb access-orb-1" />
        <div className="access-orb access-orb-2" />
        <div className="access-orb access-orb-3" />
      </div>

      {/* Scanline overlay */}
      <div className="absolute inset-0 access-scanlines pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo/Icon */}
        <div className={`mb-8 transition-all duration-500 ${success ? 'scale-110' : ''}`}>
          <div className={`
            w-24 h-24 rounded-2xl border-2 flex items-center justify-center
            transition-all duration-300
            ${success
              ? 'border-[var(--accent-success)] bg-[var(--accent-success)]/10 shadow-[0_0_40px_rgba(0,255,136,0.4)]'
              : error
                ? 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10'
                : 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-[0_0_30px_rgba(0,212,255,0.2)]'
            }
          `}>
            <svg
              className={`w-12 h-12 transition-all duration-300 ${success ? 'text-[var(--accent-success)]' : error ? 'text-[var(--accent-secondary)]' : 'text-[var(--accent-primary)]'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {success ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" className="access-check-animation" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              )}
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1
          className={`
            text-5xl sm:text-6xl lg:text-7xl mb-2 text-center tracking-wider
            transition-all duration-500
            ${success ? 'text-[var(--accent-success)]' : 'text-[var(--accent-primary)]'}
          `}
          style={{
            fontFamily: 'var(--font-display)',
            textShadow: success
              ? '0 0 30px rgba(0,255,136,0.5)'
              : '0 0 30px rgba(0,212,255,0.5)'
          }}
        >
          {success ? 'ACCESS GRANTED' : 'ACCESS CODE'}
        </h1>

        <p className="text-[var(--foreground-muted)] mb-8 text-center max-w-md">
          {success
            ? 'Welcome to Four Factors Analytics'
            : 'Enter the access code to continue'
          }
        </p>

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <div className={`relative ${shake ? 'access-shake' : ''}`}>
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(false);
                }}
                placeholder="ENTER CODE"
                className={`
                  w-full px-6 py-4 text-center text-2xl tracking-[0.3em] uppercase
                  bg-[var(--background-secondary)] border-2 rounded-lg
                  font-mono outline-none transition-all duration-200
                  placeholder:text-[var(--foreground-muted)]/40 placeholder:tracking-[0.2em]
                  ${error
                    ? 'border-[var(--accent-secondary)] shadow-[0_0_20px_rgba(255,51,102,0.3)]'
                    : 'border-[var(--border)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_20px_rgba(0,212,255,0.3)]'
                  }
                `}
                style={{ fontFamily: 'var(--font-mono)' }}
                autoComplete="off"
                spellCheck={false}
              />

              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[var(--accent-primary)] -translate-x-1 -translate-y-1" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[var(--accent-primary)] translate-x-1 -translate-y-1" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[var(--accent-primary)] -translate-x-1 translate-y-1" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[var(--accent-primary)] translate-x-1 translate-y-1" />
            </div>

            {error && (
              <p className="mt-4 text-center text-[var(--accent-secondary)] text-sm animate-fade-in">
                Invalid access code. Please try again.
              </p>
            )}

            <button
              type="submit"
              className="
                w-full mt-6 px-6 py-4 text-lg font-semibold uppercase tracking-wider
                bg-[var(--accent-primary)]/10 border-2 border-[var(--accent-primary)] rounded-lg
                text-[var(--accent-primary)] transition-all duration-200
                hover:bg-[var(--accent-primary)]/20 hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]
                active:scale-[0.98]
              "
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Submit
            </button>
          </form>
        )}

        {/* Bottom branding */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-xs text-[var(--foreground-muted)]/50 uppercase tracking-widest">
            Four Factors Analytics
          </p>
        </div>
      </div>
    </div>
  );
}
