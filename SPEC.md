# Home Run Probability Estimator — SPEC.md

## 1. Concept & Vision

A clean, stathead-friendly web app that estimates home run probability for any MLB hitter vs. pitcher matchup using real Statcast data. The vibe is "baseball nerd's dashboard" — data-dense but readable, with transparent methodology so users understand exactly how the probability is computed. Not a black box; every number is traceable to its source.

## 2. Design Language

- **Aesthetic:** Dark-mode baseball analytics dashboard — think Baseball Savant meets a modern fintech app
- **Colors:**
  - Background: `#0f172a` (slate-900)
  - Card BG: `#1e293b` (slate-800)
  - Primary accent: `#ef4444` (red-500) — HRs are red
  - Secondary: `#3b82f6` (blue-500)
  - Text: `#f1f5f9` (slate-100)
  - Muted: `#64748b` (slate-500)
- **Typography:** Inter for UI, JetBrains Mono for numbers/stats
- **Motion:** Subtle — fade-in cards, smooth chart transitions, loading skeleton pulses
- **Icons:** Lucide React

## 3. Layout & Structure

```
┌─────────────────────────────────────────────────────┐
│  Header: "HR Probability Calculator" + tagline       │
├──────────────────┬──────────────────────────────────┤
│  Matchup Panel   │   Results Panel                   │
│  - Pitcher input │   - HR Prob big number            │
│  - Hitter input  │   - Pitcher Arsenal Table         │
│  - Platoon       │   - Breakdown table               │
│  - Calculate btn │   - Pie chart (arsenal)           │
│                  │   - Bar chart (HR rate by pitch)  │
│                  │   - Simulate 100 PAs button       │
│                  │   - Methodology explainer          │
└──────────────────┴──────────────────────────────────┘
```

- Single-page app, mobile-responsive (stack on small screens)
- No routing needed — all state in React

## 4. Features & Interactions

### Player Selection
- Two autocomplete search boxes: Pitcher + Hitter
- Uses `player_lookup` from statcast-mcp
- Debounced 300ms, shows name + team + position
- Validates both players selected before enabling Calculate

### Optional Inputs
- **Platoon:** Toggle for platoon advantage (+5% for RHB vs LHP or LHB vs RHP)

### Calculate Button
- Disabled until both players selected
- Shows loading skeleton during calculation
- On error: toast with retry option

### Results Display
1. **Hero number:** "Home Run Probability: X.X%" — large, red if >5%, orange if 2-5%, gray if <2%
2. **Breakdown table:**

| Pitch Type | Pitcher % | Hitter HR% vs Pitch | Weighted Contribution |
|------------|-----------|---------------------|----------------------|
| FF (4-seam) | 52% | 8.2% | 4.26% |
| SL | 28% | 3.1% | 0.87% |
| CH | 14% | 1.2% | 0.17% |
| CB | 6% | 0.5% | 0.03% |
| **TOTAL** | 100% | — | **5.33%** |

3. **Charts:**
   - Pie chart: Pitcher's arsenal (% of each pitch type)
   - Bar chart: Hitter's HR rate vs each pitch type
4. **"Simulate 100 PAs" button:** Monte Carlo using the weighted probabilities, shows distribution (e.g., "Expected 5-6 HRs in 100 PAs")
5. **Methodology panel:** Collapsible section explaining the formula

### Error States
- Player not found: "No player found for [name]. Try MLB ID or full name."
- No statcast data: "No recent statcast data for [player]. They may not have thrown/batted enough in the current data window."
- API failure: "Couldn't reach statcast data. Try again in a moment."

### Empty State
Before any calculation: "Select a pitcher and hitter to see HR probability"

## 5. Component Inventory

### `<PlayerSearch>` — autocomplete input
- States: empty, typing, loading, results, selected, error
- Shows: player name, team, position as user types
- Clear button when selected

### `<MatchupForm>` — left panel
- Contains: pitcher search, hitter search, platoon toggle, Calculate button
- Calculate button: default, disabled, loading states

### `<ResultsPanel>` — right panel
- States: empty (before first calc), loading, success, error
- Contains: hero stat, breakdown table, charts, simulate button, methodology

### `<BreakdownTable>` — stat table
- Sortable by pitch % or contribution
- Highlights dominant contribution row

### `<ArsenalPieChart>` — Recharts pie
- Colors per pitch type (FF=red, SL=blue, CH=green, CB=purple, etc.)
- Tooltip shows % and pitch name

### `<HRRateBarChart>` — Recharts bar
- Horizontal bars, sorted by HR rate
- Bar color intensity = HR rate
- Tooltip with exact %

### `<SimulationModal>` — Monte Carlo results
- Histogram of HR distribution over 100 PAs
- Mean, median, P10/P90 range

### `<MethodologyPanel>` — collapsible explainer
- Shows formula: `HR_prob = Σ(pitcher_arsenal_pct[p] × hitter_ISO_vs_p[p])`
- Explains platoon adjustment
- Links to statcast data sources

## 6. Technical Approach

### Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **State:** React useState/useReducer (no external state lib needed)
- **MCP Integration:** Server-side API routes call `mcporter` CLI to reach statcast-mcp

### Project Structure
```
hr-probability/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main single-page app
│   ├── globals.css         # Tailwind + custom styles
│   └── api/
│       ├── lookup/route.ts   # POST {name} → player data
│       ├── pitcher/route.ts  # POST {playerId} → arsenal + stats
│       └── batter/route.ts    # POST {playerId} → HR rates by pitch
├── components/
│   ├── PlayerSearch.tsx
│   ├── MatchupForm.tsx
│   ├── ResultsPanel.tsx
│   ├── BreakdownTable.tsx
│   ├── ArsenalPieChart.tsx
│   ├── HRRateBarChart.tsx
│   ├── SimulationModal.tsx
│   └── MethodologyPanel.tsx
├── lib/
│   ├── mcp.ts              # mcporter CLI wrapper
│   ├── probability.ts       # HR probability calculation
│   └── simulation.ts       # Monte Carlo simulator
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

### API Routes (server-side)

**POST /api/lookup**
- Input: `{ name: string }`
- Calls: `mcporter call statcast player_lookup --args '{"player_name": name}'`
- Returns: array of matching players (name, team, id, position)

**POST /api/pitcher**
- Input: `{ playerName: string }`
- Fetches recent game stats (last 30 days) + full 2024 season arsenal breakdown
- Calls: `statcast_pitcher_arsenal_stats` + `pitching_stats_date_range`
- Returns: `{ recent: {era, k_pct, bb_pct, whip, ip, games}, arsenal: [{pitch, pct}], arsenal_full: [{pitch_type, pitch_name, pct, pa, ba, slg, woba, whiff_pct, k_pct, est_ba, est_slg, est_woba, hard_hit_pct}], season_stats: {...} }`

**POST /api/batter**
- Input: `{ playerName: string }`
- Calls: `statcast_batter_pitch_arsenal` for 2024 season
- Returns: `{ HR_rates: [{pitch, hr_pct, barrel_pct, avg_exit_velo}], expected_stats: {...} }`

### Probability Formula

```typescript
function computeHRProbability(
  pitcherArsenal: { pitch: string; pct: number }[],
  batterHRRates: { pitch: string; hr_pct: number }[],
  options: { platoonBonus: number }
): number {
  let hrProb = 0;
  for (const { pitch, pct } of pitcherArsenal) {
    const batterStat = batterHRRates.find(h => h.pitch === pitch);
    const hrRate = batterStat?.hr_pct ?? 0.5; // fallback to 0.5% for unseen pitches
    hrProb += (pct / 100) * (hrRate / 100);
  }
  
  // Adjustments
  hrProb *= options.platoonBonus; // 1.05 for platoon advantage
  
  return Math.min(hrProb * 100, 50); // cap at 50%
}
```

### Caching
- Player lookups: `localStorage` cache with 24h TTL
- Arsenal/stats: `localStorage` cache with 1h TTL
- Key by player ID + year

### MCP Server
- statcast-mcp is already installed and accessible via `mcporter call statcast ...`
- API routes invoke mcporter as a subprocess
- Note: statcast-mcp runs locally via Python, so the Next.js server must have mcporter in PATH

## 7. Sample Matchups to Test

1. Aaron Judge vs. Gerrit Cole — high-prob HR game
2. Shohei Ohtani vs. any — elite vs. elite
3. Rookie batter vs. veteran pitcher — low prob

## 8. Out of Scope (v1)

- Login/auth
- Historical matchup data (only current/recent season)
- In-game real-time updates
- Export/share results
- User accounts
