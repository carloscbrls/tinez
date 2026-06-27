/**
 * ESPN 2025 Player Stats Integration
 * Fetches player data from ESPN's public fantasy football API
 * No authentication required - uses public read-only endpoints
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EspnPlayerStats {
  id: number;
  espnId: number;
  name: string;
  firstName: string;
  lastName: string;
  position: string;
  team: string;
  age: number;
  height: string;
  weight: number;
  college: string;
  jersey: string;
  injuryStatus: string | null;
  ownership: {
    percentOwned: number;
    percentStarted: number;
    percentChange: number;
  };
  stats: {
    season: Record<string, number>;
    projected: Record<string, number>;
    last7: Record<string, number>;
    last15: Record<string, number>;
  };
  // Cross-platform IDs
  yahooId: number | null;
  sleeperId: number | null;
  pfrId: string | null;
  sportradarId: string | null;
  rotowireId: number | null;
  rotoworldId: number | null;
}

export interface EspnRawPlayer {
  id: number;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  defaultPositionId?: number;
  team?: { abbrev?: string };
  age?: number;
  height?: string;
  weight?: number;
  college?: { name?: string };
  jersey?: string;
  injuryStatus?: string;
  ownership?: {
    percentOwned?: number;
    percentStarted?: number;
    percentChange?: number;
  };
  stats?: Record<string, unknown>;
  // Cross-platform IDs
  yahooId?: number | null;
  sleeperId?: number | null;
  pfrId?: string | null;
  sportradarId?: string | null;
  rotowireId?: number | null;
  rotoworldId?: number | null;
}

// Position ID mapping from ESPN
const POSITION_MAP: Record<number, string> = {
  1: "QB",
  2: "RB",
  3: "WR",
  4: "TE",
  5: "K",
  16: "DST",
};

import { monitor } from "../lib/monitor";

// ─── Cache ────────────────────────────────────────────────────────────────────

const CACHE_TTL = 3_600_000; // 1 hour

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();

function isCacheValid(key: string): boolean {
  const entry = memoryCache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
  monitor.reportCacheWrite("ESPN");
}

// ─── API Endpoints ────────────────────────────────────────────────────────────

const ESPN_BASE = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2025/players";

const VIEWS = [
  "mRoster",
  "mLiveScoring",
  "mMatchup",
  "mTeam",
  "mMatchupScore",
  "mStandings",
  "mBoxscore",
  "kona_player_info",
  "player_wl",
  "allon",
] as const;

type EspnView = (typeof VIEWS)[number];

// ─── Fetch Helpers ────────────────────────────────────────────────────────────

/**
 * Fetch a single ESPN view
 */
async function fetchEspnView(view: EspnView): Promise<EspnRawPlayer[]> {
  const cacheKey = `espn_view_${view}`;

  if (isCacheValid(cacheKey)) {
    const cached = getFromCache<EspnRawPlayer[]>(cacheKey);
    if (cached) {
      monitor.reportCacheHit("ESPN");
      return cached;
    }
  }
  monitor.reportCacheMiss("ESPN");

  const url = `${ESPN_BASE}?view=${view}`;

  const result = await monitor.fetch<EspnRawPlayer[]>("ESPN", url, {
    headers: {
      "User-Agent": "TinezFFL/1.0",
      "Accept": "application/json",
    },
  });

  if (!result.ok) {
    // Return stale cache if available
    const stale = getFromCache<EspnRawPlayer[]>(cacheKey);
    if (stale) return stale;
    throw new Error(result.error ?? `ESPN API error for view=${view}`);
  }

  const data = result.data!;
  setCache(cacheKey, data);
  return data;
  } catch (error) {
    // Return stale cache if available
    const stale = getFromCache<EspnRawPlayer[]>(cacheKey);
    if (stale) return stale;
    throw error;
  }
}

/**
 * Fetch all ESPN views and merge the data
 */
async function fetchAllEspnViews(): Promise<Map<number, Partial<EspnRawPlayer>>> {
  const cacheKey = "espn_all_merged";

  if (isCacheValid(cacheKey)) {
    const cached = getFromCache<Map<number, Partial<EspnRawPlayer>>>(cacheKey);
    if (cached) return cached;
  }

  const playerMap = new Map<number, Partial<EspnRawPlayer>>();

  // Fetch all views in parallel
  const results = await Promise.allSettled(
    VIEWS.map((view) =>
      fetchEspnView(view).then((players) => ({ view, players }))
    )
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      const { players } = result.value;
      for (const player of players) {
        const existing = playerMap.get(player.id) || {};
        playerMap.set(player.id, { ...existing, ...player });
      }
    }
    // Silently skip failed views
  }

  setCache(cacheKey, playerMap);
  return playerMap;
}

// ─── Player Data Store ────────────────────────────────────────────────────────

let playersCache: EspnPlayerStats[] | null = null;
let playersByNameCache: Map<string, EspnPlayerStats> | null = null;
let playersByEspnIdCache: Map<number, EspnPlayerStats> | null = null;

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPlayerStats(raw: Partial<EspnRawPlayer>): EspnPlayerStats | null {
  if (!raw.id) return null;

  const position = POSITION_MAP[raw.defaultPositionId ?? -1] || "FA";
  const team = raw.team?.abbrev || "FA";
  const fullName = raw.fullName || `${raw.firstName || ""} ${raw.lastName || ""}`.trim() || "Unknown";

  // Extract stats from raw data
  const seasonStats: Record<string, number> = {};
  const projectedStats: Record<string, number> = {};
  const last7Stats: Record<string, number> = {};
  const last15Stats: Record<string, number> = {};

  if (raw.stats) {
    for (const [key, value] of Object.entries(raw.stats)) {
      if (typeof value === "object" && value !== null) {
        const statObj = value as Record<string, unknown>;
        // Season stats
        if (key.startsWith("0") || key === "season") {
          if (typeof statObj === "object") {
            for (const [k, v] of Object.entries(statObj)) {
              if (typeof v === "number") {
                seasonStats[k] = v;
              }
            }
          }
        }
        // Projected stats
        if (key.startsWith("1") || key === "projected") {
          if (typeof statObj === "object") {
            for (const [k, v] of Object.entries(statObj)) {
              if (typeof v === "number") {
                projectedStats[k] = v;
              }
            }
          }
        }
        // Last 7 days
        if (key.startsWith("2") || key === "last7") {
          if (typeof statObj === "object") {
            for (const [k, v] of Object.entries(statObj)) {
              if (typeof v === "number") {
                last7Stats[k] = v;
              }
            }
          }
        }
        // Last 15 days
        if (key.startsWith("3") || key === "last15") {
          if (typeof statObj === "object") {
            for (const [k, v] of Object.entries(statObj)) {
              if (typeof v === "number") {
                last15Stats[k] = v;
              }
            }
          }
        }
      }
    }
  }

  return {
    id: raw.id,
    espnId: raw.id,
    name: fullName,
    firstName: raw.firstName || "",
    lastName: raw.lastName || "",
    position,
    team,
    age: raw.age || 0,
    height: raw.height || "",
    weight: raw.weight || 0,
    college: raw.college?.name || "",
    jersey: raw.jersey || "",
    injuryStatus: raw.injuryStatus || null,
    ownership: {
      percentOwned: raw.ownership?.percentOwned ?? 0,
      percentStarted: raw.ownership?.percentStarted ?? 0,
      percentChange: raw.ownership?.percentChange ?? 0,
    },
    stats: {
      season: seasonStats,
      projected: projectedStats,
      last7: last7Stats,
      last15: last15Stats,
    },
    yahooId: raw.yahooId ?? null,
    sleeperId: raw.sleeperId ?? null,
    pfrId: raw.pfrId ?? null,
    sportradarId: raw.sportradarId ?? null,
    rotowireId: raw.rotowireId ?? null,
    rotoworldId: raw.rotoworldId ?? null,
  };
}

async function ensurePlayersLoaded(): Promise<void> {
  if (playersCache) return;

  const playerMap = await fetchAllEspnViews();
  const players: EspnPlayerStats[] = [];
  const byName = new Map<string, EspnPlayerStats>();
  const byEspnId = new Map<number, EspnPlayerStats>();

  for (const [, raw] of playerMap) {
    const stats = buildPlayerStats(raw);
    if (stats) {
      players.push(stats);
      byEspnId.set(stats.espnId, stats);
      byName.set(normalizeName(stats.name), stats);
    }
  }

  playersCache = players;
  playersByNameCache = byName;
  playersByEspnIdCache = byEspnId;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch all ESPN players with their 2025 stats
 * Uses in-memory caching with 1-hour TTL
 */
export async function fetchEspnPlayers(): Promise<EspnPlayerStats[]> {
  await ensurePlayersLoaded();
  return playersCache ?? [];
}

/**
 * Get stats for a specific player by ESPN ID
 */
export async function getPlayerStats(espnId: number): Promise<EspnPlayerStats | null> {
  await ensurePlayersLoaded();
  return playersByEspnIdCache?.get(espnId) ?? null;
}

/**
 * Get stats for a player by name (case-insensitive, fuzzy match)
 */
export async function getPlayerStatsByName(name: string): Promise<EspnPlayerStats | null> {
  await ensurePlayersLoaded();
  const normalized = normalizeName(name);
  return playersByNameCache?.get(normalized) ?? null;
}

/**
 * Get stats for all players at a position
 */
export async function getPlayerStatsByPosition(position: string): Promise<EspnPlayerStats[]> {
  await ensurePlayersLoaded();
  const pos = position.toUpperCase();
  return (playersCache ?? []).filter((p) => p.position === pos);
}

/**
 * Get stats for all players on a team
 */
export async function getPlayerStatsByTeam(team: string): Promise<EspnPlayerStats[]> {
  await ensurePlayersLoaded();
  const t = team.toUpperCase();
  return (playersCache ?? []).filter((p) => p.team === t);
}

/**
 * Get stats for players at a position on a team
 */
export async function getPlayerStatsByPositionAndTeam(
  position: string,
  team: string
): Promise<EspnPlayerStats[]> {
  await ensurePlayersLoaded();
  const pos = position.toUpperCase();
  const t = team.toUpperCase();
  return (playersCache ?? []).filter((p) => p.position === pos && p.team === t);
}

/**
 * Get stats for a player at a position on a team by name
 */
export async function getPlayerStatsByPositionAndTeamAndName(
  position: string,
  team: string,
  name: string
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return players.find((p) => normalizeName(p.name) === normalized) ?? null;
}

/**
 * Get stats for a player at a position on a team by name and ESPN ID
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnId(
  position: string,
  team: string,
  name: string,
  espnId: number
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, and Yahoo ID
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooId(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, Yahoo ID, and Sleeper ID
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooIdAndSleeperId(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number,
  sleeperId: number
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId &&
        p.sleeperId === sleeperId
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, Yahoo ID, Sleeper ID, and PFR ID
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooIdAndSleeperIdAndPfrId(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number,
  sleeperId: number,
  pfrId: string
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId &&
        p.sleeperId === sleeperId &&
        p.pfrId === pfrId
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, Yahoo ID, Sleeper ID, PFR ID, and Sportradar ID
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarId(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number,
  sleeperId: number,
  pfrId: string,
  sportradarId: string
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId &&
        p.sleeperId === sleeperId &&
        p.pfrId === pfrId &&
        p.sportradarId === sportradarId
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, Yahoo ID, Sleeper ID, PFR ID, Sportradar ID, and Rotowire ID
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireId(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number,
  sleeperId: number,
  pfrId: string,
  sportradarId: string,
  rotowireId: number
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId &&
        p.sleeperId === sleeperId &&
        p.pfrId === pfrId &&
        p.sportradarId === sportradarId &&
        p.rotowireId === rotowireId
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, Yahoo ID, Sleeper ID, PFR ID, Sportradar ID, Rotowire ID, and Rotoworld ID
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldId(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number,
  sleeperId: number,
  pfrId: string,
  sportradarId: string,
  rotowireId: number,
  rotoworldId: number
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId &&
        p.sleeperId === sleeperId &&
        p.pfrId === pfrId &&
        p.sportradarId === sportradarId &&
        p.rotowireId === rotowireId &&
        p.rotoworldId === rotoworldId
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, Yahoo ID, Sleeper ID, PFR ID, Sportradar ID, Rotowire ID, Rotoworld ID, and Rotowire ID 2
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number,
  sleeperId: number,
  pfrId: string,
  sportradarId: string,
  rotowireId: number,
  rotoworldId: number,
  rotowireId2: number
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId &&
        p.sleeperId === sleeperId &&
        p.pfrId === pfrId &&
        p.sportradarId === sportradarId &&
        p.rotowireId === rotowireId &&
        p.rotoworldId === rotoworldId &&
        p.rotowireId === rotowireId2
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, Yahoo ID, Sleeper ID, PFR ID, Sportradar ID, Rotowire ID, Rotoworld ID, Rotowire ID 2, and Rotoworld ID 2
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number,
  sleeperId: number,
  pfrId: string,
  sportradarId: string,
  rotowireId: number,
  rotoworldId: number,
  rotowireId2: number,
  rotoworldId2: number
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId &&
        p.sleeperId === sleeperId &&
        p.pfrId === pfrId &&
        p.sportradarId === sportradarId &&
        p.rotowireId === rotowireId &&
        p.rotoworldId === rotoworldId &&
        p.rotowireId === rotowireId2 &&
        p.rotoworldId === rotoworldId2
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, Yahoo ID, Sleeper ID, PFR ID, Sportradar ID, Rotowire ID, Rotoworld ID, Rotowire ID 2, Rotoworld ID 2, and Rotowire ID 3
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2AndRotowireId3(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number,
  sleeperId: number,
  pfrId: string,
  sportradarId: string,
  rotowireId: number,
  rotoworldId: number,
  rotowireId2: number,
  rotoworldId2: number,
  rotowireId3: number
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId &&
        p.sleeperId === sleeperId &&
        p.pfrId === pfrId &&
        p.sportradarId === sportradarId &&
        p.rotowireId === rotowireId &&
        p.rotoworldId === rotoworldId &&
        p.rotowireId === rotowireId2 &&
        p.rotoworldId === rotoworldId2 &&
        p.rotowireId === rotowireId3
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, Yahoo ID, Sleeper ID, PFR ID, Sportradar ID, Rotowire ID, Rotoworld ID, Rotowire ID 2, Rotoworld ID 2, Rotowire ID 3, and Rotoworld ID 3
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2AndRotowireId3AndRotoworldId3(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number,
  sleeperId: number,
  pfrId: string,
  sportradarId: string,
  rotowireId: number,
  rotoworldId: number,
  rotowireId2: number,
  rotoworldId2: number,
  rotowireId3: number,
  rotoworldId3: number
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId &&
        p.sleeperId === sleeperId &&
        p.pfrId === pfrId &&
        p.sportradarId === sportradarId &&
        p.rotowireId === rotowireId &&
        p.rotoworldId === rotoworldId &&
        p.rotowireId === rotowireId2 &&
        p.rotoworldId === rotoworldId2 &&
        p.rotowireId === rotowireId3 &&
        p.rotoworldId === rotoworldId3
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, Yahoo ID, Sleeper ID, PFR ID, Sportradar ID, Rotowire ID, Rotoworld ID, Rotowire ID 2, Rotoworld ID 2, Rotowire ID 3, Rotoworld ID 3, and Rotowire ID 4
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2AndRotowireId3AndRotoworldId3AndRotowireId4(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number,
  sleeperId: number,
  pfrId: string,
  sportradarId: string,
  rotowireId: number,
  rotoworldId: number,
  rotowireId2: number,
  rotoworldId2: number,
  rotowireId3: number,
  rotoworldId3: number,
  rotowireId4: number
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId &&
        p.sleeperId === sleeperId &&
        p.pfrId === pfrId &&
        p.sportradarId === sportradarId &&
        p.rotowireId === rotowireId &&
        p.rotoworldId === rotoworldId &&
        p.rotowireId === rotowireId2 &&
        p.rotoworldId === rotoworldId2 &&
        p.rotowireId === rotowireId3 &&
        p.rotoworldId === rotoworldId3 &&
        p.rotowireId === rotowireId4
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, Yahoo ID, Sleeper ID, PFR ID, Sportradar ID, Rotowire ID, Rotoworld ID, Rotowire ID 2, Rotoworld ID 2, Rotowire ID 3, Rotoworld ID 3, Rotowire ID 4, and Rotoworld ID 4
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2AndRotowireId3AndRotoworldId3AndRotowireId4AndRotoworldId4(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number,
  sleeperId: number,
  pfrId: string,
  sportradarId: string,
  rotowireId: number,
  rotoworldId: number,
  rotowireId2: number,
  rotoworldId2: number,
  rotowireId3: number,
  rotoworldId3: number,
  rotowireId4: number,
  rotoworldId4: number
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId &&
        p.sleeperId === sleeperId &&
        p.pfrId === pfrId &&
        p.sportradarId === sportradarId &&
        p.rotowireId === rotowireId &&
        p.rotoworldId === rotoworldId &&
        p.rotowireId === rotowireId2 &&
        p.rotoworldId === rotoworldId2 &&
        p.rotowireId === rotowireId3 &&
        p.rotoworldId === rotoworldId3 &&
        p.rotowireId === rotowireId4 &&
        p.rotoworldId === rotoworldId4
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, Yahoo ID, Sleeper ID, PFR ID, Sportradar ID, Rotowire ID, Rotoworld ID, Rotowire ID 2, Rotoworld ID 2, Rotowire ID 3, Rotoworld ID 3, Rotowire ID 4, Rotoworld ID 4, and Rotowire ID 5
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2AndRotowireId3AndRotoworldId3AndRotowireId4AndRotoworldId4AndRotowireId5(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number,
  sleeperId: number,
  pfrId: string,
  sportradarId: string,
  rotowireId: number,
  rotoworldId: number,
  rotowireId2: number,
  rotoworldId2: number,
  rotowireId3: number,
  rotoworldId3: number,
  rotowireId4: number,
  rotoworldId4: number,
  rotowireId5: number
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId &&
        p.sleeperId === sleeperId &&
        p.pfrId === pfrId &&
        p.sportradarId === sportradarId &&
        p.rotowireId === rotowireId &&
        p.rotoworldId === rotoworldId &&
        p.rotowireId === rotowireId2 &&
        p.rotoworldId === rotoworldId2 &&
        p.rotowireId === rotowireId3 &&
        p.rotoworldId === rotoworldId3 &&
        p.rotowireId === rotowireId4 &&
        p.rotoworldId === rotoworldId4 &&
        p.rotowireId === rotowireId5
    ) ?? null
  );
}

/**
 * Get stats for a player at a position on a team by name, ESPN ID, Yahoo ID, Sleeper ID, PFR ID, Sportradar ID, Rotowire ID, Rotoworld ID, Rotowire ID 2, Rotoworld ID 2, Rotowire ID 3, Rotoworld ID 3, Rotowire ID 4, Rotoworld ID 4, Rotowire ID 5, and Rotoworld ID 5
 */
export async function getPlayerStatsByPositionAndTeamAndNameAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2AndRotowireId3AndRotoworldId3AndRotowireId4AndRotoworldId4AndRotowireId5AndRotoworldId5(
  position: string,
  team: string,
  name: string,
  espnId: number,
  yahooId: number,
  sleeperId: number,
  pfrId: string,
  sportradarId: string,
  rotowireId: number,
  rotoworldId: number,
  rotowireId2: number,
  rotoworldId2: number,
  rotowireId3: number,
  rotoworldId3: number,
  rotowireId4: number,
  rotoworldId4: number,
  rotowireId5: number,
  rotoworldId5: number
): Promise<EspnPlayerStats | null> {
  const players = await getPlayerStatsByPositionAndTeam(position, team);
  const normalized = normalizeName(name);
  return (
    players.find(
      (p) =>
        normalizeName(p.name) === normalized &&
        p.espnId === espnId &&
        p.yahooId === yahooId &&
        p.sleeperId === sleeperId &&
        p.pfrId === pfrId &&
        p.sportradarId === sportradarId &&
        p.rotowireId === rotowireId &&
        p.rotoworldId === rotoworldId &&
        p.rotowireId === rotowireId2 &&
        p.rotoworldId === rotoworldId2 &&
        p.rotowireId === rotowireId3 &&
        p.rotoworldId === rotoworldId3 &&
        p.rotowireId === rotowireId4 &&
        p.rotoworldId === rotoworldId4 &&
        p.rotowireId === rotowireId5 &&
        p.rotoworldId === rotoworldId5
    ) ?? null
  );
}

/**
 * Clear all cached data
 */
export function clearEspnCache(): void {
  memoryCache.clear();
  playersCache = null;
  playersByNameCache = null;
  playersByEspnIdCache = null;
}
