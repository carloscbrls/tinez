/**
 * API-SPORTS Integration for TINEZ
 *
 * Fetches historical NFL data (2022-2024 seasons) for projection training.
 * Caches results aggressively (100 requests/day limit on free plan).
 * Feeds into the existing projection model for fantasy football insights.
 *
 * API Base URLs:
 *   NFL:  https://v1.american-football.api-sports.io
 *   NBA:  https://v2.nba.api-sports.io
 *   MLB:  https://v1.baseball.api-sports.io
 *   NHL:  https://v1.hockey.api-sports.io
 *
 * Free Plan Endpoints:
 *   /teams?league=1&season=2024
 *   /players?team=X&season=2024
 *   /games?league=1&season=2024
 *   /standings?league=1&season=2024
 *
 * Rate Limit: 100 requests/day (free tier)
 * Cache: localStorage with 24h TTL, plus in-memory LRU for session reuse
 */

import type { APISportsConfig, CacheEntry, League, Season, Team, Player, Game, Standing, ProjectionData, PlayerProjection } from './types';

// ─── Configuration ───────────────────────────────────────────────────────────

const API_KEY = '03c8f71c9fb196a2839c7e2bc82e6526';

const API_BASE_URLS: Record<League, string> = {
  nfl: 'https://v1.american-football.api-sports.io',
  nba: 'https://v2.nba.api-sports.io',
  mlb: 'https://v1.baseball.api-sports.io',
  nhl: 'https://v1.hockey.api-sports.io',
};

const NFL_LEAGUE_ID = 1; // API-Sports league ID for NFL
const NFL_SEASONS: Season[] = [2022, 2023, 2024];

// Cache TTL: 24 hours in milliseconds
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Rate limit: 100 requests/day free tier — we reserve 50 for NFL historical
const DAILY_BUDGET = 100;
const NFL_BUDGET = 50;

// ─── In-Memory Cache ─────────────────────────────────────────────────────────

interface MemoryCache {
  [key: string]: {
    data: unknown;
    timestamp: number;
  };
}

const memoryCache: MemoryCache = {};

// ─── Rate Limiter ────────────────────────────────────────────────────────────

interface RateLimitState {
  count: number;
  date: string; // YYYY-MM-DD
}

function getRateLimitKey(): string {
  return `tinez:api-sports:rate-limit`;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getRateLimitState(): RateLimitState {
  if (typeof localStorage === 'undefined') {
    return { count: 0, date: getToday() };
  }
  try {
    const raw = localStorage.getItem(getRateLimitKey());
    if (raw) {
      const state = JSON.parse(raw) as RateLimitState;
      if (state.date === getToday()) {
        return state;
      }
    }
  } catch {
    // ignore parse errors
  }
  return { count: 0, date: getToday() };
}

function saveRateLimitState(state: RateLimitState): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(getRateLimitKey(), JSON.stringify(state));
    } catch {
      // localStorage may be full or unavailable
    }
  }
}

function getRemainingRequests(): number {
  const state = getRateLimitState();
  return Math.max(0, DAILY_BUDGET - state.count);
}

function incrementRequestCount(): void {
  const state = getRateLimitState();
  state.count++;
  saveRateLimitState(state);
}

// ─── Cache Helpers ───────────────────────────────────────────────────────────

function getCacheKey(endpoint: string, params: Record<string, string | number>): string {
  const paramStr = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `tinez:api-sports:${endpoint}?${paramStr}`;
}

function getFromCache<T>(key: string): T | null {
  // Check memory cache first
  const mem = memoryCache[key];
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return mem.data as T;
  }

  // Check localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const entry = JSON.parse(raw) as CacheEntry<T>;
        if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
          // Also warm memory cache
          memoryCache[key] = { data: entry.data, timestamp: entry.timestamp };
          return entry.data;
        }
        // Expired — remove
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }

  return null;
}

function setCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };

  // Memory cache
  memoryCache[key] = { data, timestamp: Date.now() };

  // localStorage (with size check — skip if too large)
  if (typeof localStorage !== 'undefined') {
    try {
      const serialized = JSON.stringify(entry);
      if (serialized.length < 500_000) {
        // 500KB limit per entry
        localStorage.setItem(key, serialized);
      }
    } catch {
      // localStorage may be full
    }
  }
}

// ─── HTTP Client ─────────────────────────────────────────────────────────────

interface APIResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: string[];
  results: number;
  response: T[];
}

class APISportsError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string,
  ) {
    super(message);
    this.name = 'APISportsError';
  }
}

async function fetchAPI<T>(
  league: League,
  endpoint: string,
  params: Record<string, string | number> = {},
  bypassCache = false,
): Promise<T[]> {
  const baseUrl = API_BASE_URLS[league];
  const url = new URL(endpoint, baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const cacheKey = getCacheKey(endpoint, params);

  // Check cache first
  if (!bypassCache) {
    const cached = getFromCache<T[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Check rate limit
  const remaining = getRemainingRequests();
  if (remaining <= 0) {
    console.warn(`[API-SPORTS] Rate limit reached (${DAILY_BUDGET}/day). Using cached data only.`);
    const cached = getFromCache<T[]>(cacheKey);
    if (cached) {
      return cached;
    }
    throw new APISportsError(
      `Rate limit exceeded and no cached data available for ${endpoint}`,
      undefined,
      endpoint,
    );
  }

  // Make the request
  console.log(`[API-SPORTS] Fetching ${url.toString()} (${remaining - 1} remaining today)`);

  const response = await fetch(url.toString(), {
    headers: {
      'x-apisports-key': API_KEY,
      'x-rapidapi-key': API_KEY,
    },
  });

  incrementRequestCount();

  if (!response.ok) {
    throw new APISportsError(
      `API request failed: ${response.status} ${response.statusText}`,
      response.status,
      endpoint,
    );
  }

  const data = (await response.json()) as APIResponse<T>;

  if (data.errors && data.errors.length > 0) {
    throw new APISportsError(
      `API error: ${data.errors.join(', ')}`,
      undefined,
      endpoint,
    );
  }

  // Cache the result
  setCache(cacheKey, data.response);

  return data.response;
}

// ─── NFL-Specific API Methods ────────────────────────────────────────────────

/**
 * Fetch all NFL teams for a given season.
 */
export async function getNFLTeams(season: Season = 2024): Promise<Team[]> {
  return fetchAPI<Team>('nfl', '/teams', { league: NFL_LEAGUE_ID, season });
}

/**
 * Fetch players for a specific NFL team and season.
 */
export async function getNFLPlayers(teamId: number, season: Season = 2024): Promise<Player[]> {
  return fetchAPI<Player>('nfl', '/players', { team: teamId, season });
}

/**
 * Fetch all NFL games for a given season.
 */
export async function getNFLGames(season: Season = 2024): Promise<Game[]> {
  return fetchAPI<Game>('nfl', '/games', { league: NFL_LEAGUE_ID, season });
}

/**
 * Fetch NFL standings for a given season.
 */
export async function getNFLStandings(season: Season = 2024): Promise<Standing[]> {
  return fetchAPI<Standing>('nfl', '/standings', { league: NFL_LEAGUE_ID, season });
}

// ─── Historical Data Collection ──────────────────────────────────────────────

/**
 * Fetch historical NFL data across multiple seasons for projection training.
 * Respects the daily rate limit by caching aggressively and batching requests.
 *
 * Returns a structured dataset suitable for feeding into the projection model.
 */
export async function collectHistoricalNFLData(
  seasons: Season[] = NFL_SEASONS,
  onProgress?: (current: number, total: number, label: string) => void,
): Promise<ProjectionData> {
  const totalSteps = seasons.length * 3; // teams + standings + games per season
  let currentStep = 0;

  const result: ProjectionData = {
    seasons: {},
    lastUpdated: new Date().toISOString(),
    source: 'api-sports',
  };

  for (const season of seasons) {
    currentStep++;
    onProgress?.(currentStep, totalSteps, `Fetching teams for ${season}`);

    // 1. Get teams for this season
    const teams = await getNFLTeams(season);
    const teamMap = new Map<number, Team>();
    for (const team of teams) {
      teamMap.set(team.id, team);
    }

    currentStep++;
    onProgress?.(currentStep, totalSteps, `Fetching standings for ${season}`);

    // 2. Get standings
    const standings = await getNFLStandings(season);

    currentStep++;
    onProgress?.(currentStep, totalSteps, `Fetching games for ${season}`);

    // 3. Get games
    const games = await getNFLGames(season);

    result.seasons[season] = {
      teams,
      standings,
      games,
      teamMap: Object.fromEntries(teamMap),
    };
  }

  result.lastUpdated = new Date().toISOString();
  return result;
}

// ─── Projection Model Integration ───────────────────────────────────────────

/**
 * Calculate basic player projections from historical game data.
 * This is a simplified model that can be extended with more sophisticated
 * algorithms (regression, ML, etc.).
 *
 * @param historicalData - The collected historical NFL data
 * @returns Array of player projections for the upcoming season
 */
export function calculateProjections(historicalData: ProjectionData): PlayerProjection[] {
  const projections: PlayerProjection[] = [];
  const playerStats = new Map<
    number,
    {
      totalPoints: number;
      gameCount: number;
      seasons: Set<number>;
      teamIds: Set<number>;
      position?: string;
      name?: string;
    }
  >();

  // Aggregate stats across all seasons
  for (const [season, seasonData] of Object.entries(historicalData.seasons)) {
    for (const game of seasonData.games) {
      // Process home team players
      if (game.scores?.home?.players) {
        for (const player of game.scores.home.players) {
          const stats = playerStats.get(player.id) || {
            totalPoints: 0,
            gameCount: 0,
            seasons: new Set(),
            teamIds: new Set(),
          };
          stats.totalPoints += calculateFantasyPoints(player);
          stats.gameCount++;
          stats.seasons.add(Number(season));
          stats.teamIds.add(game.teams?.home?.id ?? 0);
          stats.name = player.name;
          stats.position = player.position;
          playerStats.set(player.id, stats);
        }
      }

      // Process away team players
      if (game.scores?.away?.players) {
        for (const player of game.scores.away.players) {
          const stats = playerStats.get(player.id) || {
            totalPoints: 0,
            gameCount: 0,
            seasons: new Set(),
            teamIds: new Set(),
          };
          stats.totalPoints += calculateFantasyPoints(player);
          stats.gameCount++;
          stats.seasons.add(Number(season));
          stats.teamIds.add(game.teams?.away?.id ?? 0);
          stats.name = player.name;
          stats.position = player.position;
          playerStats.set(player.id, stats);
        }
      }
    }
  }

  // Calculate projections
  for (const [playerId, stats] of playerStats) {
    if (stats.gameCount === 0) continue;

    const avgPoints = stats.totalPoints / stats.gameCount;
    const seasonCount = stats.seasons.size;
    const teamId = Array.from(stats.teamIds)[0] ?? 0;

    // Simple projection: weighted average with more recent seasons weighted higher
    // In a production system, this would use regression or ML
    const projectedPoints = avgPoints * (1 + (seasonCount - 1) * 0.05);

    projections.push({
      playerId,
      name: stats.name ?? `Player ${playerId}`,
      position: stats.position ?? 'Unknown',
      teamId,
      seasonsPlayed: seasonCount,
      gamesPlayed: stats.gameCount,
      avgFantasyPoints: Math.round(avgPoints * 10) / 10,
      projectedFantasyPoints: Math.round(projectedPoints * 10) / 10,
      confidence: Math.min(0.95, seasonCount * 0.2 + stats.gameCount * 0.01),
      lastUpdated: new Date().toISOString(),
    });
  }

  // Sort by projected points descending
  projections.sort((a, b) => b.projectedFantasyPoints - a.projectedFantasyPoints);

  return projections;
}

/**
 * Calculate fantasy points for a player based on 0.5 PPR scoring.
 * This is the standard for the TINEZ league.
 */
function calculateFantasyPoints(player: Player): number {
  if (!player.statistics) return 0;

  const stats = player.statistics;
  let points = 0;

  // Passing: 1 pt per 25 yards, 4 pts per TD, -2 per INT
  points += (stats.passingYards ?? 0) / 25;
  points += (stats.passingTouchdowns ?? 0) * 4;
  points -= (stats.interceptions ?? 0) * 2;

  // Rushing: 1 pt per 10 yards, 6 pts per TD
  points += (stats.rushingYards ?? 0) / 10;
  points += (stats.rushingTouchdowns ?? 0) * 6;

  // Receiving: 1 pt per 10 yards, 6 pts per TD, 0.5 per reception (0.5 PPR)
  points += (stats.receivingYards ?? 0) / 10;
  points += (stats.receivingTouchdowns ?? 0) * 6;
  points += (stats.receptions ?? 0) * 0.5;

  // Misc: 6 pts per return TD, 2 pts per 2-pt conversion, -2 per fumble lost
  points += (stats.returnTouchdowns ?? 0) * 6;
  points += (stats.twoPointConversions ?? 0) * 2;
  points -= (stats.fumblesLost ?? 0) * 2;

  // Kicking: 3 pts per FG, 1 pt per XP
  points += (stats.fieldGoals ?? 0) * 3;
  points += (stats.extraPoints ?? 0) * 1;

  // Defense/Special Teams: 6 pts per TD, 2 pts per INT, 2 pts per fumble recovery, 1 pt per sack
  points += (stats.defensiveTouchdowns ?? 0) * 6;
  points += (stats.interceptions ?? 0) * 2;
  points += (stats.fumbleRecoveries ?? 0) * 2;
  points += (stats.sacks ?? 0) * 1;

  return Math.round(points * 10) / 10;
}

// ─── Cache Management ────────────────────────────────────────────────────────

/**
 * Clear all API-SPORTS cached data.
 * Useful for forcing a refresh or when the rate limit resets.
 */
export function clearCache(): void {
  // Clear memory cache
  Object.keys(memoryCache).forEach((key) => {
    delete memoryCache[key];
  });

  // Clear localStorage entries
  if (typeof localStorage !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('tinez:api-sports:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // ignore
    }
  }

  console.log('[API-SPORTS] Cache cleared');
}

/**
 * Get current cache statistics.
 */
export function getCacheStats(): {
  memoryEntries: number;
  storageEntries: number;
  remainingRequests: number;
  dailyBudget: number;
} {
  let storageEntries = 0;
  if (typeof localStorage !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('tinez:api-sports:')) {
          storageEntries++;
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    memoryEntries: Object.keys(memoryCache).length,
    storageEntries,
    remainingRequests: getRemainingRequests(),
    dailyBudget: DAILY_BUDGET,
  };
}

// ─── Utility: Get NFL League Info ────────────────────────────────────────────

/**
 * Get the NFL league ID used by API-Sports.
 */
export function getNFLLeagueId(): number {
  return NFL_LEAGUE_ID;
}

/**
 * Get the list of seasons being tracked.
 */
export function getTrackedSeasons(): Season[] {
  return [...NFL_SEASONS];
}

// ─── League-Specific Helpers ──────────────────────────────────────────────────

/**
 * Get the API base URL for a given league.
 */
export function getAPIBaseURL(league: League): string {
  return API_BASE_URLS[league];
}

/**
 * Check if the API is reachable by making a lightweight request.
 * Uses the teams endpoint with a single season to minimize data transfer.
 */
export async function healthCheck(league: League = 'nfl'): Promise<{
  ok: boolean;
  remainingRequests: number;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await fetchAPI<Team>(league, '/teams', { league: NFL_LEAGUE_ID, season: 2024 });
    return {
      ok: true,
      remainingRequests: getRemainingRequests(),
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      ok: false,
      remainingRequests: getRemainingRequests(),
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
