/**
 * FantasyNerds API Client — TINEZ Fantasy Football
 *
 * Provides expert-curated IDP projections, draft rankings, and
 * weekly stat projections from FantasyNerds.com.
 *
 * API Docs: https://api.fantasynerds.com/docs/nfl
 * Pricing: Free tier available, $74.95/yr for full access
 *
 * IMPORTANT: FantasyNerds does NOT support CORS.
 * All calls must go through the Netlify serverless function proxy.
 */

import { monitor } from "../lib/monitor";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface FnIdpDraftRanking {
  playerId: string;
  name: string;
  team: string;
  position: string;
  rank: number;
  rankPosition: number;
}

export interface FnIdpWeeklyProjection {
  playerId: string;
  name: string;
  team: string;
  position: string;
  tackles: number;
  assists: number;
  interceptions: number;
  tacklesLoss: number;
  sacks: number;
  passesDefended: number;
  fumblesForced: number;
  interceptionTouchdowns: number;
  fumbleReturnTouchdowns: number;
  projPts: number;
}

export interface FnIdpResponse<T> {
  season: number;
  week?: number;
  players: T[];
}

export interface FnLeadersEntry {
  playerId: string;
  name: string;
  team: string;
  position: string;
  points: number;
  rank: number;
}

export interface FnInjuryEntry {
  playerId: string;
  name: string;
  team: string;
  position: string;
  injury: string;
  status: string;
  date: string;
}

export interface FnAddDropEntry {
  playerId: string;
  name: string;
  team: string;
  position: string;
  addCount: number;
  dropCount: number;
  netAdds: number;
}

export interface FnDefenseRanking {
  team: string;
  rank: number;
  vsQb: number;
  vsRb: number;
  vsWr: number;
  vsTe: number;
  vsK: number;
}

// ─── API Client ────────────────────────────────────────────────────────────

const BASE_URL = "https://api.fantasynerds.com/v1/nfl";

function getApiKey(): string | undefined {
  // In Astro SSR, env vars are available via import.meta.env
  // In Netlify functions, they're process.env
  if (typeof process !== "undefined" && process.env?.FANTASYNERDS_API_KEY) {
    return process.env.FANTASYNERDS_API_KEY;
  }
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.FANTASYNERDS_API_KEY) {
    return (import.meta as any).env.FANTASYNERDS_API_KEY;
  }
  return undefined;
}

async function fnFetch<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null; // No API key configured — skip

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("apikey", apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const startTime = Date.now();
  try {
    const res = await fetch(url.toString(), {
      headers: { "Accept": "application/json" },
    });

    const duration = Date.now() - startTime;

    if (!res.ok) {
      monitor.record("fantasynerds", "error", { endpoint, status: res.status, duration });
      console.error(`[FantasyNerds] ${endpoint} failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    monitor.record("fantasynerds", "success", { endpoint, duration });
    return data as T;
  } catch (err) {
    const duration = Date.now() - startTime;
    monitor.record("fantasynerds", "error", { endpoint, error: String(err), duration });
    console.error(`[FantasyNerds] ${endpoint} error:`, err);
    return null;
  }
}

// ─── IDP Endpoints ─────────────────────────────────────────────────────────

/**
 * Get IDP draft rankings for the current season
 */
export async function getIdpDraftRankings(): Promise<FnIdpDraftRanking[] | null> {
  const data = await fnFetch<FnIdpResponse<FnIdpDraftRanking>>("idp-draft");
  return data?.players ?? null;
}

/**
 * Get IDP weekly projections for a specific week
 * (week 0 = current week, 1-18 = specific week)
 */
export async function getIdpWeeklyProjections(
  week: number = 0
): Promise<FnIdpWeeklyProjection[] | null> {
  const data = await fnFetch<FnIdpResponse<FnIdpWeeklyProjection>>("idp-weekly", {
    week: String(week),
  });
  return data?.players ?? null;
}

/**
 * Get rest of season projections (includes IDP)
 */
export async function getRestOfSeasonProjections(): Promise<any[] | null> {
  const data = await fnFetch<any>("ros");
  return data?.players ?? null;
}

/**
 * Get fantasy scoring leaders by position
 * position: "ALL" | "QB" | "RB" | "WR" | "TE" | "FLEX" | "K" | "IDP"
 * week: 0 = season, 1-18 = specific week
 */
export async function getFantasyLeaders(
  position: string = "ALL",
  week: number = 0,
  format: string = "ppr"
): Promise<FnLeadersEntry[] | null> {
  const data = await fnFetch<{
    season: number;
    format: string;
    week: number;
    position: string;
    players: FnLeadersEntry[];
  }>("leaders", {
    position,
    week: String(week),
    format,
  });
  return data?.players ?? null;
}

/**
 * Get injury reports
 */
export async function getInjuries(): Promise<FnInjuryEntry[] | null> {
  const data = await fnFetch<FnIdpResponse<FnInjuryEntry>>("injuries");
  return data?.players ?? null;
}

/**
 * Get most added/dropped players
 */
export async function getAddsDrops(): Promise<FnAddDropEntry[] | null> {
  const data = await fnFetch<FnIdpResponse<FnAddDropEntry>>("add-drops");
  return data?.players ?? null;
}

/**
 * Get defensive rankings (team vs position)
 */
export async function getDefenseRankings(): Promise<FnDefenseRanking[] | null> {
  const data = await fnFetch<{ season: number; teams: FnDefenseRanking[] }>(
    "defense-rankings"
  );
  return data?.teams ?? null;
}

// ─── Merged IDP Projections ────────────────────────────────────────────────

/**
 * Merge FantasyNerds weekly projections into our internal IDP projections.
 * Returns a map of playerId -> FnIdpWeeklyProjection for quick lookup.
 */
export async function getFnProjectionMap(): Promise<
  Map<string, FnIdpWeeklyProjection>
> {
  const weekly = await getIdpWeeklyProjections(0);
  const map = new Map<string, FnIdpWeeklyProjection>();
  if (!weekly) return map;

  for (const p of weekly) {
    map.set(p.playerId, p);
  }
  return map;
}

/**
 * Get FantasyNerds IDP draft rankings as a map for quick lookup
 */
export async function getFnDraftRankingMap(): Promise<
  Map<string, FnIdpDraftRanking>
> {
  const rankings = await getIdpDraftRankings();
  const map = new Map<string, FnIdpDraftRanking>();
  if (!rankings) return map;

  for (const r of rankings) {
    map.set(r.playerId, r);
  }
  return map;
}

/**
 * Check if FantasyNerds API is available (has key + responds)
 */
export async function checkFnAvailability(): Promise<{
  available: boolean;
  keyConfigured: boolean;
  season?: number;
  error?: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { available: false, keyConfigured: false };
  }

  try {
    const data = await fnFetch<FnIdpResponse<FnIdpDraftRanking>>("idp-draft");
    if (!data) {
      return { available: false, keyConfigured: true, error: "API returned no data" };
    }
    return {
      available: true,
      keyConfigured: true,
      season: data.season,
    };
  } catch (err) {
    return {
      available: false,
      keyConfigured: true,
      error: String(err),
    };
  }
}
