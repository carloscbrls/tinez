/**
 * Sleeper API Data Layer
 * Server-side data fetching with caching for static generation
 * All endpoints are FREE, no auth needed, read-only
 */

import type {
  SleeperLeague,
  SleeperRoster,
  SleeperUser,
  SleeperMatchup,
  SleeperTransaction,
  SleeperDraftPick,
  SleeperPlayer,
  TrendingPlayer,
  SleeperDraft,
  PowerRanking,
  LeagueRecord,
} from "./sleeper-types";
import { monitor } from "../lib/monitor";

// Cache configuration
const CACHE_DIR = "./node_modules/.cache/sleeper";
const CACHE_TTL = {
  PLAYERS: 3600000, // 1 hour (5MB JSON)
  LEAGUE: 300000,   // 5 minutes
  ROSTERS: 300000,
  USERS: 300000,
  MATCHUPS: 300000,
  TRANSACTIONS: 300000,
  TRENDING: 600000,  // 10 minutes
  DRAFT: 300000,
};

// League configuration
export const LEAGUE_CONFIG = {
  leagueId: "289646328504385536",
  draftId: "257270643320426496",
  season: 2025,
  name: "TINEZ LEAGUE",
  platform: "Yahoo", // TINEZ is on Yahoo, not Sleeper
};

// In-memory cache
const memoryCache = new Map<string, { data: unknown; timestamp: number }>();

function isCacheValid(key: string, ttl: number): boolean {
  const cached = memoryCache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < ttl;
}

function getFromCache<T>(key: string): T | null {
  const cached = memoryCache.get(key);
  if (!cached) return null;
  return cached.data as T;
}

function setCache(key: string, data: unknown): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Generic fetch with caching and error handling
 */
async function sleeperFetch<T>(endpoint: string, cacheKey: string, ttl: number): Promise<T> {
  if (isCacheValid(cacheKey, ttl)) {
    const cached = getFromCache<T>(cacheKey);
    if (cached) {
      monitor.reportCacheHit("Sleeper");
      return cached;
    }
  }
  monitor.reportCacheMiss("Sleeper");

  const url = endpoint.startsWith("http") ? endpoint : `https://api.sleeper.app/v1/${endpoint}`;

  const result = await monitor.fetch<T>("Sleeper", url, {
    headers: { "User-Agent": "TinezFFL/1.0" },
  });

  if (!result.ok) {
    // Return cached data even if stale, rather than failing
    const stale = getFromCache<T>(cacheKey);
    if (stale) return stale;
    throw new Error(result.error ?? `Sleeper API error for ${url}`);
  }

  const data = result.data!;
  setCache(cacheKey, data);
  return data;
}

/**
 * Fetch league info
 */
export async function fetchLeague(leagueId?: string): Promise<SleeperLeague> {
  const id = leagueId || LEAGUE_CONFIG.leagueId;
  return sleeperFetch<SleeperLeague>(
    `league/${id}`,
    `league_${id}`,
    CACHE_TTL.LEAGUE
  );
}

/**
 * Fetch all rosters for a league
 */
export async function fetchRosters(leagueId?: string): Promise<SleeperRoster[]> {
  const id = leagueId || LEAGUE_CONFIG.leagueId;
  return sleeperFetch<SleeperRoster[]>(
    `league/${id}/rosters`,
    `rosters_${id}`,
    CACHE_TTL.ROSTERS
  );
}

/**
 * Fetch all users for a league
 */
export async function fetchUsers(leagueId?: string): Promise<SleeperUser[]> {
  const id = leagueId || LEAGUE_CONFIG.leagueId;
  return sleeperFetch<SleeperUser[]>(
    `league/${id}/users`,
    `users_${id}`,
    CACHE_TTL.USERS
  );
}

/**
 * Fetch matchups for a specific week
 */
export async function fetchMatchups(week: number, leagueId?: string): Promise<SleeperMatchup[]> {
  const id = leagueId || LEAGUE_CONFIG.leagueId;
  return sleeperFetch<SleeperMatchup[]>(
    `league/${id}/matchups/${week}`,
    `matchups_${id}_${week}`,
    CACHE_TTL.MATCHUPS
  );
}

/**
 * Fetch transactions for a specific week
 */
export async function fetchTransactions(week: number, leagueId?: string): Promise<SleeperTransaction[]> {
  const id = leagueId || LEAGUE_CONFIG.leagueId;
  return sleeperFetch<SleeperTransaction[]>(
    `league/${id}/transactions/${week}`,
    `transactions_${id}_${week}`,
    CACHE_TTL.TRANSACTIONS
  );
}

/**
 * Fetch all NFL players (cached, ~5MB JSON)
 */
export async function fetchAllPlayers(): Promise<Record<string, SleeperPlayer>> {
  return sleeperFetch<Record<string, SleeperPlayer>>(
    "players/nfl",
    "players_nfl",
    CACHE_TTL.PLAYERS
  );
}

/**
 * Fetch trending players
 */
export async function fetchTrending(
  type: "add" | "drop" = "add",
  lookbackHours = 24,
  limit = 25
): Promise<TrendingPlayer[]> {
  const data = await sleeperFetch<TrendingPlayer[]>(
    `players/nfl/trending/${type}?lookback_hours=${lookbackHours}&limit=${limit}`,
    `trending_${type}_${lookbackHours}_${limit}`,
    CACHE_TTL.TRENDING
  );

  // Enrich with player details
  const players = await fetchAllPlayers();
  return data.map((t) => ({
    ...t,
    player: players[t.player_id] || undefined,
  }));
}

/**
 * Fetch trending with player details (filters out unknown players)
 */
export async function fetchTrendingWithDetails(
  type: "add" | "drop" = "add",
  lookbackHours = 24,
  limit = 25
): Promise<TrendingPlayer[]> {
  const trending = await fetchTrending(type, lookbackHours, limit);
  return trending.filter((t) => t.player);
}

/**
 * Fetch draft picks
 */
export async function fetchDraftPicks(draftId?: string): Promise<SleeperDraftPick[]> {
  const id = draftId || LEAGUE_CONFIG.draftId;
  return sleeperFetch<SleeperDraftPick[]>(
    `draft/${id}/picks`,
    `draft_picks_${id}`,
    CACHE_TTL.DRAFT
  );
}

/**
 * Fetch draft info
 */
export async function fetchDraft(draftId?: string): Promise<SleeperDraft> {
  const id = draftId || LEAGUE_CONFIG.draftId;
  return sleeperFetch<SleeperDraft>(
    `draft/${id}`,
    `draft_${id}`,
    CACHE_TTL.DRAFT
  );
}

/**
 * Get player headshot URL from ESPN CDN
 */
export function getPlayerHeadshotUrl(player: SleeperPlayer): string {
  const espnId = player.espn_id || player.yahoo_id;
  if (espnId) {
    return `https://a.espncdn.com/i/headshots/nfl/players/full/${espnId}.png`;
  }
  return "";
}

/**
 * Get user avatar URL from Sleeper CDN
 */
export function getUserAvatarUrl(avatar: string): string {
  return `https://sleepercdn.com/avatars/${avatar}`;
}

/**
 * Get user avatar thumbnail URL
 */
export function getUserAvatarThumbUrl(avatar: string): string {
  return `https://sleepercdn.com/avatars/thumbs/${avatar}`;
}

/**
 * Get NFL team logo from ESPN CDN
 */
export function getNflTeamLogoUrl(abbr: string): string {
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`;
}

/**
 * Get Sleeper team logo
 */
export function getSleeperTeamLogoUrl(abbr: string): string {
  return `https://sleepercdn.com/images/team_logos/${abbr.toLowerCase()}.png`;
}

/**
 * Get position emoji
 */
export function getPositionEmoji(pos: string): string {
  const map: Record<string, string> = {
    QB: "🎯",
    RB: "🏃",
    WR: "🏈",
    TE: "🔗",
    K: "🦵",
    DEF: "🛡️",
    LB: "🛡️",
    DB: "🛡️",
    DL: "🛡️",
  };
  return map[pos] || "📋";
}

/**
 * Get injury badge info
 */
export function getInjuryBadge(status: string | null): { label: string; color: string } | null {
  if (!status || status === "None" || status === "") return null;
  const s = status.toLowerCase();
  if (s.includes("questionable")) return { label: "Questionable", color: "bg-amber-500/20 text-amber-400" };
  if (s.includes("doubtful")) return { label: "Doubtful", color: "bg-orange-500/20 text-orange-400" };
  if (s.includes("out")) return { label: "Out", color: "bg-red-500/20 text-red-400" };
  if (s.includes("ir") || s.includes("injured")) return { label: "IR", color: "bg-red-600/20 text-red-500" };
  if (s.includes("susp")) return { label: "Suspended", color: "bg-purple-500/20 text-purple-400" };
  if (s === "Active" || s === "healthy") return null;
  return { label: status, color: "bg-zinc-500/20 text-zinc-400" };
}

/**
 * Build power rankings from roster data
 */
export async function buildPowerRankings(leagueId?: string): Promise<PowerRanking[]> {
  const [rosters, users] = await Promise.all([
    fetchRosters(leagueId),
    fetchUsers(leagueId),
  ]);

  const userMap = new Map(users.map((u) => [u.user_id, u]));

  const rankings: PowerRanking[] = rosters.map((roster) => {
    const user = userMap.get(roster.owner_id);
    const teamName = user?.metadata?.team_name || user?.display_name || "Unknown";
    const wins = roster.settings.wins;
    const losses = roster.settings.losses;
    const ties = roster.settings.ties;
    const pf = roster.settings.fpts;
    const pa = roster.settings.fpts_against;
    const totalGames = wins + losses + ties;
    const winPct = totalGames > 0 ? wins / totalGames : 0;
    const avgPF = totalGames > 0 ? pf / totalGames : 0;
    const avgPA = totalGames > 0 ? pa / totalGames : 0;

    // Power score: weighted combination of win%, PF, and moves
    const powerScore = Math.round(
      winPct * 50 +
      (avgPF / 200) * 30 +
      (1 - Math.min(avgPA / 200, 1)) * 10 +
      Math.min(roster.settings.total_moves / 50, 1) * 10
    );

    return {
      rank: 0, // Will be set after sorting
      teamName,
      owner: user?.display_name || "Unknown",
      wins,
      losses,
      ties,
      pointsFor: pf,
      pointsAgainst: pa,
      totalMoves: roster.settings.total_moves,
      waiverBudgetUsed: roster.settings.waiver_budget_used,
      powerScore,
      trend: "stable",
      trendAmount: 0,
    };
  });

  // Sort by power score descending
  rankings.sort((a, b) => b.powerScore - a.powerScore);
  rankings.forEach((r, i) => {
    r.rank = i + 1;
  });

  return rankings;
}

/**
 * Build all-time league records
 */
export function buildLeagueRecords(): LeagueRecord[] {
  return [
    {
      category: "Most Points (Single Season)",
      value: "2,847.5",
      holder: "CC3PO (Carlitos)",
      year: 2018,
      icon: "🔥",
      description: "Highest single-season point total in league history",
    },
    {
      category: "Biggest Blowout Win",
      value: "187.4 - 68.2",
      holder: "Frozen Fury vs Black Team Bitch",
      year: 2018,
      icon: "💀",
      description: "Largest margin of victory (119.2 points)",
    },
    {
      category: "Longest Win Streak",
      value: "12 games",
      holder: "CC3PO (Carlitos)",
      year: 2016,
      icon: "📈",
      description: "Won 12 consecutive games including playoffs",
    },
    {
      category: "Most Championships",
      value: "3",
      holder: "Carlitos",
      year: 2025,
      icon: "🏆",
      description: "Three-time champion (2015, 2016, 2018)",
    },
    {
      category: "Highest Scoring Game",
      value: "234.8",
      holder: "Frozen Fury (Carlitos)",
      year: 2018,
      icon: "⚡",
      description: "Most points in a single matchup",
    },
    {
      category: "Lowest Scoring Game (Win)",
      value: "72.3",
      holder: "ETSquad (Eric)",
      year: 2020,
      icon: "🐢",
      description: "Lowest winning score in league history",
    },
    {
      category: "Most Transactions (Season)",
      value: "47",
      holder: "Take that Daak (DatDudeVic)",
      year: 2024,
      icon: "🔄",
      description: "Most waiver moves and trades in a season",
    },
    {
      category: "Best Regular Season Record",
      value: "13-1",
      holder: "CC3PO (Carlitos)",
      year: 2016,
      icon: "🌟",
      description: "Best win percentage in a regular season",
    },
    {
      category: "Most Runner-Up Finishes",
      value: "3",
      holder: "Carlitos",
      year: 2025,
      icon: "🥈",
      description: "Three second-place finishes (2014, 2019, 2022)",
    },
    {
      category: "Most Playoff Appearances",
      value: "10",
      holder: "Carlitos",
      year: 2025,
      icon: "🏅",
      description: "Made playoffs in 10 of 12 seasons",
    },
  ];
}

/**
 * Get all transactions across multiple weeks
 */
export async function fetchAllTransactions(
  startWeek = 1,
  endWeek = 18,
  leagueId?: string
): Promise<SleeperTransaction[]> {
  const allTransactions: SleeperTransaction[] = [];
  
  for (let week = startWeek; week <= endWeek; week++) {
    try {
      const weekTxns = await fetchTransactions(week, leagueId);
      allTransactions.push(...weekTxns);
    } catch {
      // Skip weeks with no data
    }
  }
  
  // Sort by creation date, newest first
  allTransactions.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  
  return allTransactions;
}

/**
 * Get matchups for multiple weeks
 */
export async function fetchAllMatchups(
  startWeek = 1,
  endWeek = 18,
  leagueId?: string
): Promise<Map<number, SleeperMatchup[]>> {
  const matchupsByWeek = new Map<number, SleeperMatchup[]>();
  
  for (let week = startWeek; week <= endWeek; week++) {
    try {
      const weekMatchups = await fetchMatchups(week, leagueId);
      matchupsByWeek.set(week, weekMatchups);
    } catch {
      // Skip weeks with no data
    }
  }
  
  return matchupsByWeek;
}

/**
 * Clear all caches
 */
export function clearCache(): void {
  memoryCache.clear();
}
