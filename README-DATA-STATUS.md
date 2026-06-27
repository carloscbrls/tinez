# Tinez League — Data Integration Status Report

> Generated: 2026-06-27 04:45 PDT
> Engineer: Tinez League Infrastructure Engineer

---

## 1. Data Source Overview

| File | Source | Auth Required | Status |
|------|--------|---------------|--------|
| `nfl-api.ts` | ESPN API + Open-Meteo + RSS | None | ✅ **LIVE** |
| `espn-stats.ts` | ESPN Fantasy API (lm-api-reads) | None | ✅ **LIVE** |
| `schedule.ts` | ESPN API (scoreboard) | None | ✅ **LIVE** |
| `depth-charts.ts` | ESPN API (teams + depthcharts) | None | ✅ **LIVE** |
| `players.ts` | Hardcoded static data | N/A | ⚠️ **HARDCODED** |
| `teams.ts` | Hardcoded static data | N/A | ⚠️ **HARDCODED** |
| `keepers.ts` | Hardcoded static data | N/A | ⚠️ **HARDCODED** |
| `leaguelogs.ts` | LeagueLogs API (developer.leaguelogs.com) | None | ⚠️ **LIVE but Sleeper-centric** |

---

## 2. File-by-File Analysis

### ✅ `nfl-api.ts` — LIVE (ESPN + Open-Meteo + RSS)
- **Source:** `site.api.espn.com/apis/site/v2/sports/football/nfl`
- **Auth:** None required
- **Data provided:**
  - NFL scoreboard by week (`fetchScoreboard`)
  - Stadium coordinates for all 32 teams
  - Weather via Open-Meteo (free, no key)
  - RSS news from ESPN, NFL.com, Rotoworld
  - Current week detection
- **Imports from sleeper-api.ts?** ❌ No
- **Hardcoded data?** Only stadium coordinates (stable reference data — acceptable)
- **Verdict:** ✅ Good to go. No migration needed.

### ✅ `espn-stats.ts` — LIVE (ESPN Fantasy API)
- **Source:** `lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2025/players`
- **Auth:** None required (public read-only endpoints)
- **Data provided:**
  - All NFL players with 2025 stats (season, projected, last 7, last 15)
  - Ownership percentages, injury status, cross-platform IDs
  - In-memory cache with 1-hour TTL
- **Imports from sleeper-api.ts?** ❌ No
- **Hardcoded data?** None
- **Verdict:** ✅ Good to go. Note: uses 2025 season hardcoded — will need to update to 2026 when the season starts.

### ✅ `schedule.ts` — LIVE (ESPN API)
- **Source:** `site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
- **Auth:** None required
- **Data provided:**
  - NFL schedule by week (home/away teams, date, time, venue, scores)
  - Formatting helpers for game time/date
- **Imports from sleeper-api.ts?** ❌ No
- **Hardcoded data?** None
- **Verdict:** ✅ Good to go.

### ✅ `depth-charts.ts` — LIVE (ESPN API)
- **Source:** `site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{id}/depthcharts`
- **Auth:** None required
- **Data provided:**
  - All 32 NFL teams
  - Depth charts per team (formations, positions, athletes)
  - Starters, position depth, team summaries
  - In-memory cache with 1-hour TTL
- **Imports from sleeper-api.ts?** ❌ No
- **Hardcoded data?** None
- **Verdict:** ✅ Good to go.

### ⚠️ `players.ts` — HARDCODED
- **Source:** Static array of 123 players
- **Auth:** N/A
- **Data provided:**
  - Player names, positions, teams, ESPN IDs, bye weeks, ADP, tiers
  - Helper functions for headshot URLs, position colors, team logos
- **Imports from sleeper-api.ts?** ❌ No
- **Hardcoded data?** ✅ YES — entire player list is hardcoded
  - **What needs replacing:** The entire `players` array should be replaced with live data from `espn-stats.ts` (which already fetches all players from ESPN)
  - **Note:** The `getPlayerHeadshotUrl` function references `espn_id` and `yahoo_id` — the `espnId` field in the Player interface is correct for ESPN CDN headshots
- **Verdict:** ⚠️ Needs migration to use `fetchEspnPlayers()` from `espn-stats.ts`

### ⚠️ `teams.ts` — HARDCODED
- **Source:** Static array of 14 league teams
- **Auth:** N/A
- **Data provided:**
  - Team names, owners, colors, win/loss records (all zeros), standings sorting
- **Imports from sleeper-api.ts?** ❌ No
- **Hardcoded data?** ✅ YES
  - **What needs replacing:** `wins`, `losses`, `ties`, `pointsFor`, `pointsAgainst`, `streak` are all zero — these need live data from Yahoo OAuth
  - Team names and owners are stable (from league constitution)
- **Verdict:** ⚠️ Team metadata is fine, but standings/stats need Yahoo OAuth integration

### ⚠️ `keepers.ts` — HARDCODED
- **Source:** Static array of 14 team rosters (2025 draft data)
- **Auth:** N/A
- **Data provided:**
  - Full 2025 draft rosters for all 14 teams
  - Keeper eligibility rules and calculations
  - Keeper designations (2 per team)
- **Imports from sleeper-api.ts?** ❌ No
- **Hardcoded data?** ✅ YES
  - **What needs replacing:** This is 2025 data — needs to be updated for 2026 season
  - Keeper rules and helper functions (`getKeeperEligible`, `getKeeperCost`, `getKeeperSummary`) are reusable
  - The roster data itself needs to come from Yahoo OAuth (league-specific)
- **Verdict:** ⚠️ Needs 2026 update via Yahoo OAuth

### ⚠️ `leaguelogs.ts` — LIVE but Sleeper-centric
- **Source:** `developer.leaguelogs.com/v1`
- **Auth:** None required
- **Data provided:**
  - Player market values (0.5 PPR, 1QB, 12-team profile)
  - Player metadata (name, position, team, age, ESPN ID)
  - Trade value comparisons
  - In-memory cache with 6-hour TTL
- **Imports from sleeper-api.ts?** ❌ No
- **Hardcoded data?** None
- **Issues:**
  - **Sleeper-centric:** All player IDs are `sleeperPlayerId` — the API keys on `sleeperPlayerId`, not ESPN IDs
  - The metadata does include `espnId` as a cross-reference, so it can be bridged
  - The TINEZ profile key is `redraft-1qb-12t-ppr0_5` — this is correct for the league
- **Verdict:** ⚠️ Works but requires Sleeper ID bridge. The `getPlayerByEspnId()` function exists and can be used to cross-reference.

---

## 3. Data Source Classification

### 🔵 LIVE (ESPN API — No Auth Needed)
These are fully operational and need no changes:

| File | What It Provides |
|------|-----------------|
| `nfl-api.ts` | Scoreboard, weather, news |
| `espn-stats.ts` | Player stats, ownership, injury status |
| `schedule.ts` | NFL schedule |
| `depth-charts.ts` | NFL teams, depth charts, starters |

### 🟡 LIVE but Needs Bridging
| File | Issue |
|------|-------|
| `leaguelogs.ts` | Uses Sleeper IDs as primary key; has `espnId` cross-reference but needs mapping layer |

### 🔴 Needs Yahoo OAuth (League-Specific Data)
These require Yahoo Fantasy Sports OAuth to get live league data:

| File | What's Needed |
|------|---------------|
| `teams.ts` | Live standings (wins, losses, points for/against, streak) |
| `keepers.ts` | 2026 rosters, keeper declarations |
| *(new)* | Live league scoring, matchups, transactions |

### 🟠 Hardcoded Data That Needs Replacement
| File | What to Replace | Replacement Source |
|------|-----------------|-------------------|
| `players.ts` | Entire `players` array (123 players) | `espn-stats.ts` → `fetchEspnPlayers()` |
| `teams.ts` | `wins`, `losses`, `ties`, `pointsFor`, `pointsAgainst`, `streak` | Yahoo OAuth |
| `keepers.ts` | All 14 team rosters (2025 data) | Yahoo OAuth |

---

## 4. Priority Order for Wiring Up

### P0 — Immediate (No Auth, Already Working)
1. **`players.ts` → `espn-stats.ts` migration** — Replace hardcoded player array with `fetchEspnPlayers()`. This is the highest-impact change because it unlocks live player data across the entire site.
2. **`leaguelogs.ts` Sleeper→ESPN bridge** — Add a mapping layer so player values can be looked up by ESPN ID instead of requiring Sleeper IDs.

### P1 — High (Yahoo OAuth Required)
3. **Yahoo OAuth integration** — Create a `yahoo-api.ts` module that handles OAuth flow and fetches league-specific data:
   - League standings (replaces hardcoded `teams.ts` stats)
   - Live rosters (replaces hardcoded `keepers.ts`)
   - Weekly matchups and scores
   - Transactions and waivers

### P2 — Medium (Enhancements)
4. **`teams.ts` live standings** — Wire up Yahoo OAuth data to populate wins/losses/points
5. **`keepers.ts` 2026 update** — Pull live rosters from Yahoo and compute keeper eligibility

### P3 — Low (Nice-to-Have)
6. **Season year parameterization** — `espn-stats.ts` hardcodes `seasons/2025` — should accept a configurable season year
7. **Cross-platform ID normalization** — Ensure all player lookups work across ESPN, Yahoo, and Sleeper IDs

---

## 5. Summary

| Category | Count | Files |
|----------|-------|-------|
| ✅ Live (ESPN, no auth) | 4 | `nfl-api.ts`, `espn-stats.ts`, `schedule.ts`, `depth-charts.ts` |
| ⚠️ Live but Sleeper-centric | 1 | `leaguelogs.ts` |
| ⚠️ Hardcoded (needs replacement) | 3 | `players.ts`, `teams.ts`, `keepers.ts` |
| 🔴 Needs Yahoo OAuth | 2 | `teams.ts` (stats), `keepers.ts` (rosters) |

**Immediate next step:** Migrate `players.ts` to use `fetchEspnPlayers()` from `espn-stats.ts` — this is the quickest win and unlocks live player data site-wide with zero auth required.
