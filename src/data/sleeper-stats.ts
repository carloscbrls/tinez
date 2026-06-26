/**
 * Sleeper API Data Layer
 * Free, no auth required. Provides NFL player data, trending, projections, and state.
 *
 * @see https://docs.sleeper.com/
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SleeperTrendingPlayer {
  player_id: string;
  count: number;
}

export interface SleeperPlayer {
  player_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  position: string;
  team: string;
  age: number;
  number: number;
  years_exp: number;
  height: string;
  weight: string;
  college: string;
  injury_status: string | null;
  injury_notes: string | null;
  fantasy_positions: string[];
  search_full_name: string;
  search_rank: number;
  status: string;
  active: boolean;
  espn_id: number | null;
  yahoo_id: number | null;
  sportradar_id: string | null;
  rotowire_id: number | null;
  rotoworld_id: number | null;
  pfr_id: string | null;
  hashtag: string;
  depth_chart_position: number | null;
  depth_chart_order: number | null;
}

export interface SleeperProjection {
  player_id: string;
  [key: string]: any;
}

export interface SleeperNflState {
  week: number;
  season: string;
  season_type: string;
  season_start_date: string;
  previous_season: string;
  leg: number;
  league_season: string;
  league_create_season: string;
  display_week: number;
}

export interface TrendingPlayerWithMeta {
  player_id: string;
  name: string;
  position: string;
  team: string;
  trend_count: number;
  espn_id: number | null;
  value: number | null;
  overall_rank: number | null;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const cache = new Map<string, { data: any; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data as T;
  if (entry) cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

// ---------------------------------------------------------------------------
// Core fetcher
// ---------------------------------------------------------------------------

async function fetchSleeper<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "TINEZ/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.warn(`[Sleeper] HTTP ${res.status} fetching ${url}`);
      return fallback;
    }
    return await res.json();
  } catch (error) {
    console.error(`[Sleeper] Error fetching ${url}:`, error);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// NFL State
// ---------------------------------------------------------------------------

export async function getNflState(): Promise<SleeperNflState | null> {
  const cached = getCached<SleeperNflState>("nfl_state");
  if (cached) return cached;

  const data = await fetchSleeper<SleeperNflState | null>(
    "https://api.sleeper.app/v1/state/nfl",
    null
  );
  if (data) setCache("nfl_state", data, 60 * 60 * 1000); // 1 hour
  return data;
}

// ---------------------------------------------------------------------------
// All NFL Players (12,200+)
// ---------------------------------------------------------------------------

let allPlayersCache: Record<string, SleeperPlayer> | null = null;

export async function getAllPlayers(): Promise<Record<string, SleeperPlayer>> {
  if (allPlayersCache) return allPlayersCache;

  const cached = getCached<Record<string, SleeperPlayer>>("all_players");
  if (cached) {
    allPlayersCache = cached;
    return cached;
  }

  const data = await fetchSleeper<Record<string, SleeperPlayer>>(
    "https://api.sleeper.app/v1/players/nfl",
    {}
  );
  if (Object.keys(data).length > 0) {
    setCache("all_players", data, 6 * 60 * 60 * 1000); // 6 hours
    allPlayersCache = data;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Trending Players (most added/dropped)
// ---------------------------------------------------------------------------

export async function getTrendingAdds(limit: number = 25): Promise<SleeperTrendingPlayer[]> {
  const cached = getCached<SleeperTrendingPlayer[]>("trending_adds");
  if (cached) return cached;

  const data = await fetchSleeper<SleeperTrendingPlayer[]>(
    `https://api.sleeper.app/v1/players/nfl/trending/add?limit=${limit}`,
    []
  );
  if (data.length > 0) setCache("trending_adds", data, 30 * 60 * 1000); // 30 min
  return data;
}

export async function getTrendingDrops(limit: number = 25): Promise<SleeperTrendingPlayer[]> {
  const cached = getCached<SleeperTrendingPlayer[]>("trending_drops");
  if (cached) return cached;

  const data = await fetchSleeper<SleeperTrendingPlayer[]>(
    `https://api.sleeper.app/v1/players/nfl/trending/drop?limit=${limit}`,
    []
  );
  if (data.length > 0) setCache("trending_drops", data, 30 * 60 * 1000);
  return data;
}

// ---------------------------------------------------------------------------
// Projections
// ---------------------------------------------------------------------------

export async function getProjections(season: string, week: number): Promise<Record<string, SleeperProjection>> {
  const cacheKey = `projections_${season}_${week}`;
  const cached = getCached<Record<string, SleeperProjection>>(cacheKey);
  if (cached) return cached;

  const data = await fetchSleeper<Record<string, SleeperProjection>>(
    `https://api.sleeper.app/v1/projections/nfl/${season}/${week}`,
    {}
  );
  if (Object.keys(data).length > 0) setCache(cacheKey, data, 60 * 60 * 1000); // 1 hour
  return data;
}

// ---------------------------------------------------------------------------
// Joined data: trending + player metadata
// ---------------------------------------------------------------------------

export async function getTrendingWithMeta(limit: number = 25): Promise<TrendingPlayerWithMeta[]> {
  const [trending, players] = await Promise.all([getTrendingAdds(limit), getAllPlayers()]);

  return trending.map(t => {
    const p = players[t.player_id];
    return {
      player_id: t.player_id,
      name: p?.full_name || p?.first_name + ' ' + p?.last_name || `Player ${t.player_id}`,
      position: p?.position || '?',
      team: p?.team || 'FA',
      trend_count: t.count,
      espn_id: p?.espn_id || null,
      value: null,
      overall_rank: null,
    };
  });
}

export async function getTrendingDropsWithMeta(limit: number = 25): Promise<TrendingPlayerWithMeta[]> {
  const [trending, players] = await Promise.all([getTrendingDrops(limit), getAllPlayers()]);

  return trending.map(t => {
    const p = players[t.player_id];
    return {
      player_id: t.player_id,
      name: p?.full_name || p?.first_name + ' ' + p?.last_name || `Player ${t.player_id}`,
      position: p?.position || '?',
      team: p?.team || 'FA',
      trend_count: t.count,
      espn_id: p?.espn_id || null,
      value: null,
      overall_rank: null,
    };
  });
}

// ---------------------------------------------------------------------------
// Search across all 12,200+ players
// ---------------------------------------------------------------------------

export async function searchAllPlayers(query: string): Promise<SleeperPlayer[]> {
  const players = await getAllPlayers();
  const q = query.toLowerCase();
  return Object.values(players)
    .filter(p => p.active && p.full_name?.toLowerCase().includes(q))
    .slice(0, 20);
}

export async function getPlayersByPositionFull(position: string): Promise<SleeperPlayer[]> {
  const players = await getAllPlayers();
  return Object.values(players).filter(p => p.active && p.position === position.toUpperCase());
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getEspnHeadshotUrl(espnId: number | null): string | null {
  if (!espnId) return null;
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${espnId}.png&w=350&h=254`;
}

export function getNflTeamLogo(team: string): string {
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${team.toLowerCase()}.png`;
}
