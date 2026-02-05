'use client';

import Link from 'next/link';

const factors = [
  {
    key: 'efg',
    name: 'Effective Field Goal %',
    shortName: 'eFG%',
    weight: 40,
    formula: '(FGM + 0.5 × 3PM) / FGA × 100',
    pointsImpact: '+1.77',
    description: 'Shooting efficiency adjusted for three-pointers being worth 50% more than two-pointers.',
    higherBetter: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: 'tov',
    name: 'Turnover Rate',
    shortName: 'TOV%',
    weight: 25,
    formula: 'TOV / (FGA + 0.44 × FTA + TOV) × 100',
    pointsImpact: '-1.34',
    description: 'Percentage of possessions ending in a turnover. The 0.44 coefficient estimates possessions used by free throw attempts. Lower is better—every turnover is a wasted scoring opportunity.',
    higherBetter: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  {
    key: 'orb',
    name: 'Offensive Rebound %',
    shortName: 'ORB%',
    weight: 20,
    formula: 'OREB / (OREB + Opp DREB) × 100',
    pointsImpact: '+0.623',
    description: 'Percentage of available offensive rebounds your team grabs. Each offensive rebound creates a second-chance scoring opportunity, essentially giving you an extra possession.',
    higherBetter: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path d="M4 15l4-4 4 4 8-8" />
        <path d="M14 7h6v6" />
      </svg>
    ),
  },
  {
    key: 'ftr',
    name: 'Free Throw Rate',
    shortName: 'FTR',
    weight: 15,
    formula: 'FTM / FGA × 100',
    pointsImpact: '+0.253',
    description: 'Free throws made per field goal attempt. Getting to the foul line creates high-percentage scoring opportunities and can put opponents in foul trouble.',
    higherBetter: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <rect x="6" y="3" width="12" height="18" rx="1" />
        <line x1="6" y1="9" x2="18" y2="9" />
        <circle cx="12" cy="14" r="2" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
          <div className="stagger-children">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent-primary)] mb-4 font-medium">
              The Methodology
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6 glow-text" style={{ color: 'var(--accent-primary)' }}>
              Four Factors
            </h1>
            <p className="text-lg sm:text-xl text-[var(--foreground-muted)] max-w-2xl leading-relaxed">
              Dean Oliver&apos;s revolutionary framework that explains approximately 90% of winning in basketball,
              distilled into four measurable factors.
            </p>
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid lg:grid-cols-[1fr,2fr] gap-8 lg:gap-16">
          <div>
            <h2 className="text-2xl sm:text-3xl mb-4">The Origin</h2>
            <div className="w-16 h-1 bg-[var(--accent-primary)] mb-6" />
          </div>
          <div className="space-y-6 text-[var(--foreground-muted)] leading-relaxed">
            <p>
              Dean Oliver&apos;s 2004 book <em className="text-[var(--foreground)]">&ldquo;Basketball on Paper&rdquo;</em> identified
              four pace-independent factors that explain ~90% of winning. They work for both offense and defense:
              maximize your own efficiency, minimize your opponent&apos;s.
            </p>
          </div>
        </div>
      </section>

      {/* Factor Weights Visualization */}
      <section className="bg-[var(--background-secondary)] border-y border-[var(--border)] py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl mb-4">Weighted by Importance</h2>
            <p className="text-[var(--foreground-muted)] max-w-2xl mx-auto">
              Not all factors are created equal. Oliver&apos;s research determined the relative importance of each factor in determining wins.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2">
            {factors.map((factor, index) => (
              <div
                key={factor.key}
                className="relative group"
                style={{
                  width: `${factor.weight * 2 + 40}px`,
                  height: `${factor.weight * 2 + 40}px`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{ backgroundColor: `var(--factor-${factor.key})` }}
                />
                <div
                  className="absolute inset-2 rounded-full border-2 flex flex-col items-center justify-center transition-transform group-hover:scale-105"
                  style={{ borderColor: `var(--factor-${factor.key})` }}
                >
                  <span
                    className="text-2xl sm:text-3xl font-bold stat-number"
                    style={{ color: `var(--factor-${factor.key})` }}
                  >
                    {factor.weight}%
                  </span>
                  <span
                    className="text-xs uppercase tracking-wider font-medium"
                    style={{ color: `var(--factor-${factor.key})` }}
                  >
                    {factor.shortName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Individual Factor Deep Dives */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl mb-12 text-center">The Four Factors Explained</h2>

        <div className="space-y-8">
          {factors.map((factor, index) => (
            <div
              key={factor.key}
              className="card p-6 sm:p-8 relative overflow-hidden group"
            >
              {/* Decorative gradient */}
              <div
                className="absolute top-0 right-0 w-64 h-64 opacity-5 group-hover:opacity-10 transition-opacity rounded-full blur-3xl"
                style={{ backgroundColor: `var(--factor-${factor.key})` }}
              />

              <div className="relative grid sm:grid-cols-[auto,1fr] gap-6">
                {/* Icon and Number */}
                <div className="flex sm:flex-col items-center sm:items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: `var(--factor-${factor.key})`,
                      color: 'var(--background)',
                    }}
                  >
                    {factor.icon}
                  </div>
                  <div className="sm:mt-2">
                    <span
                      className="text-4xl sm:text-5xl font-bold stat-number"
                      style={{ color: `var(--factor-${factor.key})` }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <div>
                    <h3
                      className="text-xl sm:text-2xl mb-1"
                      style={{ color: `var(--factor-${factor.key})` }}
                    >
                      {factor.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                      <span className="uppercase tracking-wider">{factor.shortName}</span>
                      <span className="text-[var(--border)]">•</span>
                      <span>{factor.weight}% weight</span>
                      <span className="text-[var(--border)]">•</span>
                      <span className={factor.higherBetter ? 'text-[var(--chart-positive)]' : 'text-[var(--chart-negative)]'}>
                        {factor.higherBetter ? 'Higher is better' : 'Lower is better'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[var(--foreground-muted)] leading-relaxed">
                    {factor.description}
                  </p>

                  {/* Formula Card */}
                  <div className="bg-[var(--background-tertiary)] rounded-lg p-4 border border-[var(--border)]">
                    <p className="text-xs uppercase tracking-wider text-[var(--foreground-muted)] mb-2">Formula</p>
                    <code className="text-base sm:text-lg stat-number" style={{ color: `var(--factor-${factor.key})` }}>
                      {factor.formula}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Points Impact Section */}
      <section className="bg-[var(--background-secondary)] border-y border-[var(--border)] py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr,2fr] gap-8 lg:gap-16 mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl mb-4">Points Impact</h2>
              <div className="w-16 h-1 bg-[var(--accent-primary)] mb-6" />
            </div>
            <div className="space-y-6 text-[var(--foreground-muted)] leading-relaxed">
              <p>
                Research has quantified exactly how much each factor contributes to scoring.
                Points Impact measures how a 1% change in each factor affects points scored per 100 possessions.
              </p>
              <p>
                For a typical college basketball game with approximately <span className="text-[var(--foreground)] font-medium">70 possessions per team</span>,
                we scale these values accordingly to show real-game impact.
              </p>
            </div>
          </div>

          {/* Impact Table */}
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-4 px-6 bg-[var(--background-tertiary)]">Factor</th>
                  <th className="text-right py-4 px-6 bg-[var(--background-tertiary)]">Points per 100 Poss.</th>
                  <th className="text-right py-4 px-6 bg-[var(--background-tertiary)] hidden sm:table-cell">Per 1% Change</th>
                </tr>
              </thead>
              <tbody>
                {factors.map((factor) => (
                  <tr key={factor.key} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: `var(--factor-${factor.key})` }}
                        />
                        <span className="font-medium">{factor.shortName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span
                        className="stat-number text-lg font-semibold"
                        style={{ color: `var(--factor-${factor.key})` }}
                      >
                        {factor.pointsImpact}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-[var(--foreground-muted)] hidden sm:table-cell">
                      per 1% {factor.higherBetter ? 'increase' : 'increase (negative = bad)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Explanation */}
          <div className="mt-8 p-6 bg-[var(--background-tertiary)] rounded-lg border border-[var(--border)]">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--accent-primary)' }}>
              How We Calculate Combined Impact
            </h3>
            <div className="space-y-4 text-sm text-[var(--foreground-muted)]">
              <p>
                <span className="text-[var(--foreground)] font-medium">1. Offensive Impact:</span> Compare the team&apos;s
                offensive stats to the league average. Better than average = positive points.
              </p>
              <p>
                <span className="text-[var(--foreground)] font-medium">2. Defensive Impact:</span> Compare what the team
                <em> allows</em> to the league average. Allowing less than average = positive points.
              </p>
              <p>
                <span className="text-[var(--foreground)] font-medium">3. Combined Impact:</span> Sum offensive and defensive
                advantages to get total points impact for each factor.
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <code className="text-xs stat-number block">
                  Combined Impact = (Team Stat - Avg) × Points Impact × (Possessions / 100)
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl mb-4">Why These Factors Matter</h2>
          <p className="text-[var(--foreground-muted)] max-w-2xl mx-auto">
            The Four Factors provide a universal language for evaluating basketball performance.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)] bg-opacity-10 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" className="w-6 h-6">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Pace-Independent</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              These metrics normalize for tempo, allowing fair comparisons between up-tempo and slow-paced teams.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)] bg-opacity-10 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" className="w-6 h-6">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Efficiency-Focused</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Rather than raw totals, these factors measure how well a team uses each possession—the true measure of quality.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)] bg-opacity-10 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" className="w-6 h-6">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Predictive Power</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Teams that excel in these factors consistently win more games—they explain ~90% of the variance in winning.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--background-secondary)] border-t border-[var(--border)] py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl mb-4">Ready to Explore?</h2>
          <p className="text-[var(--foreground-muted)] mb-8 max-w-xl mx-auto">
            See the Four Factors in action. Compare teams, analyze trends, and discover what makes winners win.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/leaderboard"
              className="px-8 py-3 rounded-lg bg-[var(--accent-primary)] text-[var(--background)] font-semibold uppercase tracking-wider text-sm hover:opacity-90 transition-opacity"
            >
              View Leaderboard
            </Link>
            <Link
              href="/trendline"
              className="px-8 py-3 rounded-lg border border-[var(--border)] text-[var(--foreground)] font-semibold uppercase tracking-wider text-sm hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              Compare Teams
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
