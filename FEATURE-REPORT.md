# Tinez League — Feature Report

**Generated:** June 27, 2026 (Pre-Season)
**League:** TINEZ LEAGUE — Yahoo League #103379 — 14 teams, 0.5 PPR, IDP

---

## 1. Existing Features & Status

### 1.1 Homepage (`/` — index.astro)
- **What it does:** League dashboard with hero section, league overview stats (14 teams, 2 divisions, 8 playoff teams, 0.5 PPR), power rankings table, trending adds widget, full standings table, Week 1 matchups preview, quick navigation links, and 2025 season recap.
- **Data source:** Hardcoded team data from `data/teams.ts` + live trending from `data/sleeper.ts` (Sleeper API).
- **Sleeper import:** Yes — `fetchTrendingWithDetails` from `data/sleeper`.
- **Status:** ⚠️ **Pre-season placeholder.** Power rankings are all set to baseline 50 (hardcoded). Trending adds gracefully shows "Trending data will appear once the season starts." Standings use hardcoded 2025 data. Week 1 matchups are hardcoded. Ready for season but needs live Yahoo data to be dynamic.

### 1.2 Matchups (`/matchups`)
- **What it does:** Shows NFL Week 1 schedule with scores, weather data, and stadium info. Also shows hardcoded TINEZ league matchups.
- **Data source:** Live NFL data from `data/nfl-api.ts` (ESPN API) for NFL schedule + weather. TINEZ matchups are hardcoded.
- **Sleeper import:** No.
- **Status:** ⚠️ **Pre-season.** NFL schedule works live. TINEZ matchups are hardcoded. Needs Yahoo OAuth to show live league matchups.

### 1.3 Keepers (`/keepers`)
- **What it does:** Keeper tracker showing 2025 season results, keeper rules, and per-team keeper-eligible players with cost calculations.
- **Data source:** Hardcoded from `data/keepers.ts` (teamRosters, getKeeperEligible, getKeeperCost).
- **Sleeper import:** No.
- **Status:** ✅ **Ready for pre-season.** All data is hardcoded but functional for pre-draft planning. Needs manual updates for 2026 keeper declarations.

### 1.4 Draft Board (`/draft/`)
- **What it does:** Historical draft results with year selector, keeper declaration section, latest draft results table, and draft stats.
- **Data source:** Hardcoded from `data/draft.ts` (draftHistory).
- **Sleeper import:** No.
- **Status:** ✅ **Ready for pre-season.** Historical data is static. 2026 keepers show "TBD." Needs manual updates for 2026 draft.

### 1.5 Team Comparison (`/compare`)
- **What it does:** Pre-season placeholder showing "no stats to compare yet" and listing all 14 teams.
- **Data source:** Hardcoded from `data/teams.ts`.
- **Sleeper import:** No.
- **Status:** ⚠️ **Pre-season placeholder.** Will need live Yahoo data to show actual stats during the season.

### 1.6 Mini Games (`/mini-games`)
- **What it does:** Describes 5 side games: Survivor Pool, Weekly Pick'em, League Trivia, Hot Potato, The Hammer. Also lists season-long challenges.
- **Data source:** Fully hardcoded content — no live data.
- **Sleeper import:** No.
- **Status:** ⚠️ **Informational only.** No interactive functionality. All games are described but not implemented. Needs development to become interactive.

### 1.7 IDP (`/idp`)
- **What it does:** IDP player database with position grouping, scoring summary, strategy guides, and player tables.
- **Data source:** Live from `data/sleeper.ts` (fetchPlayers) — Sleeper API.
- **Sleeper import:** Yes — `fetchPlayers` from `data/sleeper`.
- **Status:** ⚠️ **Pre-season.** Shows player database but no live stats. Shows "Pre-Season — IDP data will update once the season starts." Needs Yahoo OAuth for live IDP scoring.

### 1.8 IDP Leaders (`/idp-leaders`)
- **What it does:** Top IDP players ranked by age-based value score, position-by-position breakdown, draft strategy guide.
- **Data source:** Live from `data/sleeper.ts` (fetchPlayers) — Sleeper API.
- **Sleeper import:** Yes — `fetchPlayers` from `data/sleeper`.
- **Status:** ⚠️ **Pre-season.** Same as IDP page — shows player database but no live stats. Value scoring is age-based proxy, not actual performance.

### 1.9 Player Values (`/player-values/`)
- **What it does:** Full player ranking with value scores (0-100), search/filter, sortable columns, elite showcase, position sections, hover tooltips.
- **Data source:** Live from `data/leaguelogs.ts` (fetchAllPlayersWithValues) — LeagueLogs API.
- **Sleeper import:** No (uses LeagueLogs).
- **Status:** ✅ **Ready for season.** Fully functional with live data from LeagueLogs. Has search, filter by position/tier, sortable columns, and responsive design. Updates every 6 hours.

### 1.10 Trending Players (`/trending/`)
- **What it does:** Most added and most dropped players with tabbed interface, player headshots, team logos, and add/drop counts.
- **Data source:** Live from `data/sleeper-stats.ts` (getTrendingWithMeta, getTrendingDropsWithMeta) — Sleeper API.
- **Sleeper import:** Yes — via `data/sleeper-stats.ts`.
- **Status:** ✅ **Ready for season.** Fully functional with live Sleeper data. Updates every 30 minutes.

### 1.11 Depth Charts (`/depth-charts/`)
- **What it does:** NFL team depth charts by conference, with position slots showing "TBD" for all teams.
- **Data source:** Hardcoded NFL teams list + hardcoded "TBD" for all positions.
- **Sleeper import:** No.
- **Status:** ⚠️ **Pre-season placeholder.** All depth chart slots show "TBD." Needs ESPN API integration for live depth chart data.

### 1.12 News Hub (`/news/`)
- **What it does:** Trending adds/drops, NFL headlines, injury report link, waiver wire watch.
- **Data source:** Live from `data/sleeper.ts` (fetchTrendingWithDetails) + `data/nfl-api.ts` (fetchNflNews).
- **Sleeper import:** Yes — `fetchTrendingWithDetails` from `data/sleeper`.
- **Status:** ✅ **Ready for season.** Trending data and NFL headlines work live. Injury report links to a sub-page.

### 1.13 Teams (`/teams/`)
- **What it does:** Lists all 14 teams with team colors, owner info, W-L-T record, points for, and NFL team affiliation.
- **Data source:** Hardcoded from `data/teams.ts`.
- **Sleeper import:** No.
- **Status:** ⚠️ **Pre-season.** Shows hardcoded 2025 data. Links to individual team pages (`/teams/:id`). Needs Yahoo OAuth for live rosters and stats.

### 1.14 Players (`/players/`)
- **What it does:** Player database with headshots, position filters, search, ADP data, and trending indicators.
- **Data source:** Hardcoded from `data/players.ts` + live trending from `data/sleeper.ts`.
- **Sleeper import:** Yes — `fetchTrendingWithDetails` from `data/sleeper`.
- **Status:** ⚠️ **Pre-season.** Player list is hardcoded. Trending indicators work live. Links to individual player pages (`/players/:id`). Needs Yahoo OAuth for live ownership and stats.

### 1.15 Constitution (`/constitution`)
- **What it does:** Full league rules and bylaws with 8 sections: Overview, Scoring, Rosters, Draft, Keepers, Playoffs, Finances, Conduct.
- **Data source:** Fully hardcoded content.
- **Sleeper import:** No.
- **Status:** ✅ **Ready.** Static content — no live data needed.

### 1.16 Countdown (`/countdown`)
- **What it does:** Season countdown timer, key dates timeline, defending champion info.
- **Data source:** Hardcoded dates + server-side date calculation.
- **Sleeper import:** No.
- **Status:** ✅ **Ready for pre-season.** Dynamic countdown works. Dates are hardcoded for 2026.

### 1.17 Finances (`/finances`)
- **What it does:** League financial overview with payout breakdown, team dues status, payment info.
- **Data source:** Hardcoded from `data/teams.ts` + static payout data.
- **Sleeper import:** No.
- **Status:** ⚠️ **Pre-season placeholder.** Shows "Pre-Season — Financial data will appear after the season starts." All dues show "Pending." Needs manual tracking or Yahoo integration.

### 1.18 Gallery (`/gallery`)
- **What it does:** Season photos and memories with year selector, champion banner, photo grid with lightbox.
- **Data source:** Hardcoded from `data/season-images.ts`.
- **Sleeper import:** No.
- **Status:** ✅ **Ready.** Static content with lightbox functionality. Needs manual photo uploads.

### 1.19 History (`/history`)
- **What it does:** 12-season history (2014-2025) with all-time leaderboard, Carlitos stats, season-by-season breakdown.
- **Data source:** Hardcoded from `data/champions.ts`.
- **Sleeper import:** No.
- **Status:** ✅ **Ready.** Static historical data. Links to Yahoo season pages.

### 1.20 Payouts (`/payouts`)
- **What it does:** Prize pool overview, weekly winners, career earnings, all-time payout history.
- **Data source:** Hardcoded from `data/payouts.ts` + `data/champions.ts`.
- **Sleeper import:** No.
- **Status:** ✅ **Ready.** Static historical data. Weekly winners show "TBD — Season starts."

### 1.21 Connect Yahoo (`/connect-yahoo`)
- **What it does:** Yahoo OAuth connection page with "Connect Yahoo Account" and "Check Connection Status" buttons.
- **Data source:** Links to `/api/yahoo/login` and `/api/yahoo/status`.
- **Sleeper import:** No.
- **Status:** ⚠️ **Needs backend implementation.** The UI exists but the API endpoints (`/api/yahoo/login`, `/api/yahoo/status`) need to be implemented for it to work.

---

## 2. Data Source Summary

| Data Source | Used By | Status |
|-------------|---------|--------|
| **`data/teams.ts`** (hardcoded) | Homepage, Matchups, Compare, Teams, Finances, Countdown | Static 2025 data |
| **`data/sleeper.ts`** (Sleeper API) | Homepage, IDP, IDP Leaders, News, Players | Live — but Sleeper, not Yahoo |
| **`data/sleeper-stats.ts`** (Sleeper API) | Trending | Live — Sleeper-wide trending |
| **`data/leaguelogs.ts`** (LeagueLogs API) | Player Values | Live — player rankings |
| **`data/nfl-api.ts`** (ESPN API) | Matchups, News | Live — NFL schedule/weather/news |
| **`data/keepers.ts`** (hardcoded) | Keepers | Static |
| **`data/draft.ts`** (hardcoded) | Draft Board | Static |
| **`data/champions.ts`** (hardcoded) | History, Payouts | Static |
| **`data/payouts.ts`** (hardcoded) | Payouts | Static |
| **`data/season-images.ts`** (hardcoded) | Gallery | Static |
| **`data/players.ts`** (hardcoded) | Players | Static player list |
| **`data/scoring.ts`** (hardcoded) | IDP | Static scoring rules |
| **Yahoo OAuth** (not implemented) | Connect Yahoo | ❌ **Not implemented** |

---

## 3. Features Ready for the Season

These features work with current data sources and don't need Yahoo OAuth:

1. ✅ **Player Values** — Live from LeagueLogs, fully functional
2. ✅ **Trending Players** — Live from Sleeper, fully functional
3. ✅ **News Hub** — Live from Sleeper + ESPN, fully functional
4. ✅ **Constitution** — Static, always ready
5. ✅ **Countdown** — Dynamic date calculation, ready
6. ✅ **History** — Static, always ready
7. ✅ **Payouts** — Static, always ready
8. ✅ **Gallery** — Static, always ready
9. ✅ **Keepers** — Static, ready for pre-season planning
10. ✅ **Draft Board** — Static, ready for pre-season reference

---

## 4. Features That Need Yahoo OAuth

These features are currently using hardcoded data or Sleeper API and need Yahoo OAuth to show live league-specific data:

1. ❌ **Homepage** — Standings, power rankings, matchups all hardcoded
2. ❌ **Matchups** — TINEZ matchups are hardcoded
3. ❌ **Team Comparison** — No live stats
4. ❌ **Teams** — No live rosters or stats
5. ❌ **Players** — No live ownership or Yahoo-specific data
6. ❌ **IDP / IDP Leaders** — No live scoring
7. ❌ **Finances** — No live dues tracking
8. ❌ **Depth Charts** — No live depth chart data
9. ❌ **Connect Yahoo** — Backend not implemented

---

## 5. Sleeper API Migration Status

Pages importing from `data/sleeper.ts` or `data/sleeper-api.ts`:

| Page | Import | Notes |
|------|--------|-------|
| `index.astro` | `fetchTrendingWithDetails` | Sleeper-wide trending, not league-specific |
| `idp.astro` | `fetchPlayers` | Player database, not league-specific |
| `idp-leaders.astro` | `fetchPlayers` | Player database, not league-specific |
| `news/index.astro` | `fetchTrendingWithDetails` | Sleeper-wide trending |
| `players/index.astro` | `fetchTrendingWithDetails` | Trending indicators |
| `trending/index.astro` | Via `sleeper-stats.ts` | Sleeper-wide trending |

**Migration needed:** These pages use Sleeper API for player data and trending. For league-specific data (rosters, scores, standings), they need Yahoo OAuth integration. The Sleeper API is fine for general NFL player data and cross-league trending.

---

## 6. Suggested New Features

### High Priority (Season-Critical)

1. **Live Standings from Yahoo**
   - Replace hardcoded standings with real Yahoo API data
   - Show current W-L-T, PF, PA, streak, division standings

2. **Live Rosters**
   - Show each team's actual roster from Yahoo
   - Include player positions, bye weeks, injury status
   - Show roster gaps and strengths

3. **Live Matchups with Scores**
   - Show real-time fantasy scores during game weeks
   - Projected scores vs actual scores
   - Player-level scoring breakdown

4. **Live Power Rankings**
   - Algorithm-based rankings using actual performance data
   - Weekly updates based on points scored, margin of victory, etc.

5. **Trade Analyzer**
   - Evaluate trade fairness using player values
   - Show impact on each team's projected points
   - Trade history and approval tracking

### Medium Priority

6. **Waiver Wire Assistant**
   - FAAB recommendations based on roster needs
   - Bid suggestions using player value data
   - Waiver claim tracking

7. **Playoff Machine**
   - "What if" scenarios for playoff qualification
   - Remaining schedule strength analysis
   - Clinching scenarios

8. **Live Draft Board**
   - Real-time draft tracker for 2026 draft
   - Pick timer, auto-draft status, position tracking
   - Integration with Yahoo's live draft

9. **Injury Report Page**
   - Full injury list with status (Out, Doubtful, Questionable, IR)
   - Impact analysis for each team
   - Waiver wire replacement suggestions

10. **Schedule Strength Analyzer**
    - SOS (Strength of Schedule) for each team
    - Remaining schedule difficulty
    - Playoff schedule analysis

### Low Priority / Nice-to-Have

11. **Interactive Mini Games**
    - Turn Survivor, Pick'em, Trivia into interactive features
    - User submissions, leaderboards, automated scoring
    - Hot Potato and Hammer tracking

12. **League Chat / Trash Talk Board**
    - Integrated chat or message board
    - Trash talk of the week highlights
    - GIF/image support

13. **Season-Long Challenge Tracking**
    - Live tracking of longest win streak, biggest blowout, etc.
    - Leaderboards for each challenge
    - Historical records

14. **Mobile App / PWA**
    - Progressive Web App support
    - Push notifications for scores, waiver results
    - Touch-optimized UI

15. **Player Comparison Tool**
    - Side-by-side player stats comparison
    - Season projections vs actual performance
    - Historical performance trends

16. **League Records Page**
    - All-time records (most points in a season, biggest win, etc.)
    - Single-game records
    - Career leaderboards

17. **FAAB Tracker**
    - Show each team's remaining FAAB budget
    - Historical waiver claims with amounts
    - Successful bid percentage

18. **Dark Mode Toggle** (already dark-themed, but a light mode option could be nice)

19. **Export / Share Features**
    - Export standings, rosters, or draft results as CSV/PDF
    - Shareable team pages
    - Social media integration

20. **AI-Powered Insights**
    - Weekly matchup predictions
    - Trade recommendations using player value data
    - Start/sit suggestions based on matchup analysis

---

## 7. Summary

| Category | Count | Details |
|----------|-------|---------|
| **Total Pages** | 21 | Main pages explored |
| **Ready for Season** | 10 | Static or live from non-Yahoo sources |
| **Need Yahoo OAuth** | 9 | Require live league data |
| **Informational Only** | 2 | Mini Games (no interactivity), Connect Yahoo (no backend) |
| **Uses Sleeper API** | 6 | For player data and trending (not league-specific) |
| **Uses LeagueLogs** | 2 | Player Values, Trending |
| **Uses ESPN API** | 2 | Matchups (NFL schedule), News (headlines) |
| **Fully Hardcoded** | 8 | Keepers, Draft, Constitution, Countdown, History, Payouts, Gallery, Finances |

**Key takeaway:** The site has a solid foundation with beautiful UI and several live data sources (Sleeper, LeagueLogs, ESPN). The biggest gap is Yahoo OAuth integration — without it, league-specific features (standings, rosters, matchups, scores) remain hardcoded or pre-season placeholders. Implementing the Yahoo OAuth backend would unlock 9+ features and make the site truly dynamic for the 2026 season.
