'use client';

import { useState } from 'react';
import { FOUR_FACTORS_META } from '@/lib/types';

const factorColors = [
  'var(--factor-efg)',
  'var(--factor-tov)',
  'var(--factor-orb)',
  'var(--factor-ftr)',
];

export function FourFactorsAccordion() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <>
      {/* Desktop: Grid Layout */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {FOUR_FACTORS_META.map((factor, index) => (
          <div
            key={factor.key}
            className="card p-6 text-center group hover:border-opacity-50"
            style={{ '--hover-color': factorColors[index] } as React.CSSProperties}
          >
            <div
              className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-3"
              style={{
                backgroundColor: factorColors[index] + '20',
                color: factorColors[index],
              }}
            >
              {factor.shortLabel}
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-sans)' }}>
              {factor.label}
            </h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              {factor.description}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile: Accordion Layout */}
      <div className="sm:hidden space-y-2">
        {FOUR_FACTORS_META.map((factor, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <div
              key={factor.key}
              className="card overflow-hidden"
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: factorColors[index] + '20',
                      color: factorColors[index],
                    }}
                  >
                    {factor.shortLabel}
                  </div>
                  <span className="font-semibold">{factor.label}</span>
                </div>
                <svg
                  className={`w-5 h-5 text-[var(--foreground-muted)] transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isExpanded ? 'max-h-32' : 'max-h-0'
                }`}
              >
                <p className="px-4 pb-4 text-sm text-[var(--foreground-muted)]">
                  {factor.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
