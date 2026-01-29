# NCAA Four Factors - Project Documentation

## Project Overview
A Next.js 14 web app that analyzes college basketball games using Dean Oliver's Four Factors methodology:
- **eFG%** (Effective Field Goal %) - Shooting efficiency adjusted for 3-pointers
- **TOV%** (Turnover Rate) - Turnovers per possession (lower is better)
- **ORB%** (Offensive Rebound %) - Percentage of available offensive rebounds
- **FTR** (Free Throw Rate) - Free throws made per field goal attempt

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Deployment:** Vercel
- **Data Updates:** GitHub Actions (daily cron)

## ESPN API Reference (Unofficial)

### Base URL
```
https://site.api.espn.com/apis/site/v2/sports/basketball/{league}
```

Where `{league}` is:
- `mens-college-basketball`
- `womens-college-basketball`

### Endpoints

#### Get Teams by Conference
```
GET /teams?groups={conferenceId}
```
- Conference USA: `groups=11`
- Returns team metadata including id, name, abbreviation, logos, colors

#### Get Team Schedule
```
GET /teams/{teamId}/schedule
```
- Returns all games for the current season
- Includes game IDs needed for box score fetching

#### Get Game Box Score
```
GET /summary?event={gameId}
```
- Returns full game details including box score statistics

### Box Score Statistics Structure
The `boxscore.teams` array contains team objects with:
```typescript
{
  team: { id, name, abbreviation, logo, color },
  statistics: Array<{
    label: string,       // Human-readable name like "Field Goals"
    displayValue: string // Value like "28-53" or "13"
  }>,
  homeAway: "home" | "away"
}
```

### Available Statistics Labels
| Label | Format | Example |
|-------|--------|---------|
| Field Goals | "made-attempted" | "28-53" |
| 3-Pointers | "made-attempted" | "4-12" |
| Free Throws | "made-attempted" | "26-32" |
| Rebounds | single number | "39" |
| Offensive Rebounds | single number | "11" |
| Defensive Rebounds | single number | "28" |
| Turnovers | single number | "13" |
| Assists | single number | "16" |
| Steals | single number | "7" |
| Blocks | single number | "6" |

### Important Notes
1. **Rate Limiting:** Add delays between requests (50-100ms recommended)
2. **No Official Documentation:** These are unofficial endpoints that may change
3. **Rebound Split:** Not all games have O/D rebound breakdown; estimate ~28% offensive if only total is available
4. **Conference Groups:** Group IDs may change; verify by checking team responses

## Four Factors Calculations

```typescript
// Effective Field Goal %
efg = ((FGM + 0.5 * 3PM) / FGA) * 100

// Turnover Rate
tov = (TOV / (FGA + 0.44 * FTA + TOV)) * 100

// Offensive Rebound %
orb = (OREB / (OREB + OPP_DREB)) * 100

// Free Throw Rate
ftr = (FTM / FGA) * 100
```

## Project Structure
```
ncaa-four-factors/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Home page
│   │   ├── leaderboard/        # Leaderboard page
│   │   ├── team/[gender]/[teamId]/
│   │   └── game/[gender]/[gameId]/
│   ├── components/             # React components
│   │   ├── GenderToggle.tsx    # Men's/Women's toggle
│   │   ├── TeamSearch.tsx      # Autocomplete search
│   │   ├── FourFactorsChart.tsx # Bar chart visualization
│   │   ├── GameCard.tsx        # Game summary card
│   │   ├── LeaderboardTable.tsx # Sortable standings
│   │   └── Navigation.tsx      # Site header
│   ├── lib/
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── calculations.ts     # Four factors math
│   │   ├── data.ts             # Data loading utilities
│   │   └── espn.ts             # ESPN API client
│   └── data/                   # Static JSON data files
│       ├── mens/
│       │   ├── teams.json
│       │   ├── games.json
│       │   └── standings.json
│       └── womens/
├── scripts/
│   └── fetch-data.ts           # Data fetching script
├── .github/
│   └── workflows/
│       └── update-data.yml     # Daily data update action
└── package.json
```

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Fetch fresh data
npx tsx scripts/fetch-data.ts
```

## Data Update Schedule
- GitHub Action runs daily at 6 AM UTC
- Manual trigger available via workflow_dispatch
- Commits changes only if data has changed

## Known Limitations
1. ESPN API is unofficial and may break without notice
2. Some historical games may lack detailed box score stats
3. Offensive/Defensive rebound split not always available
4. Rate limiting on ESPN endpoints (add delays between requests)

## Future Improvements
- Add more conferences beyond CUSA
- Include historical seasons (2023-24, 2022-23)
- Add team comparison feature
- Live game updates during season
