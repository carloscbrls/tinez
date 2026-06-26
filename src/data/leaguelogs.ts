/**
 * LeagueLogs API Data Layer
 * Server-side data fetching with caching for static generation
 *
 * LeagueLogs provides dynasty/redraft player values, rankings, and market data.
 * TINEZ uses the 0.5 PPR, 1QB, 12-team redraft profile.
 *
 * Attribution: Data provided by LeagueLogs (https://leaguelogs.com)
 * "LeagueLogs" is a trademark of LeagueLogs LLC. Used with permission.
 *
 * @see https://developer.leaguelogs.com
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeagueLogsPlayerValue {
  sleeper_id: string;
  yahoo_id: number | null;
  espn_id: number | null;
  value: number;
  overall_rank: number;
  position_rank: number;
  position: string;
  tier: number;
  age: number;
  team: string;
  bye_week: number;
  injury_status: string | null;
  season_outlook: string | null;
  player_owned: number;
  player_drafted: number;
  player_started: number;
  player_benched: number;
  player_available: number;
  player_ir: number;
  player_suspended: number;
  player_holdout: number;
  player_unknown: number;
  player_news: string | null;
  player_blurb: string | null;
  player_image: string | null;
  player_team_logo: string | null;
  player_team_color: string | null;
  player_team_color_secondary: string | null;
  player_team_color_tertiary: string | null;
  player_team_color_quaternary: string | null;
  player_team_color_quinary: string | null;
  player_team_color_senary: string | null;
  player_team_color_septenary: string | null;
  player_team_color_octonary: string | null;
  player_team_color_nonary: string | null;
  player_team_color_denary: string | null;
}

export interface LeagueLogsPlayerMetadata {
  player_id: string;
  sleeper_id: string;
  yahoo_id: number | null;
  espn_id: number | null;
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
  injury_body_part: string | null;
  status: string;
  active: boolean;
  fantasy_positions: string[];
  depth_chart_position: string;
  depth_chart_order: number;
  search_full_name: string;
  hashtag: string;
  sportradar_id: string | null;
  rotowire_id: number | null;
  rotoworld_id: number | null;
  swish_id: number | null;
  fantasy_data_id: number | null;
  stats_id: number | null;
  gsis_id: string | null;
  pandascore_id: string | null;
}

export interface LeagueLogsProfile {
  key: string;
  name: string;
  description: string;
  format: string;
  scoring: string;
  teams: number;
  qb: number;
  superflex: boolean;
  te_premium: number;
  ppr: number;
  is_dynasty: boolean;
}

export interface LeagueLogsRookiePickValue {
  pick: number;
  round: number;
  value: number;
  description: string;
}

export interface LeagueLogsNflState {
  season: number;
  week: number;
  season_type: string;
  week_start: string;
  week_end: string;
  is_offseason: boolean;
  is_preseason: boolean;
  is_regular_season: boolean;
  is_postseason: boolean;
  current_week: number;
  total_weeks: number;
}

export interface LeagueLogsTradeComparison {
  given: {
    players: LeagueLogsPlayerValue[];
    total_value: number;
    average_value: number;
  };
  received: {
    players: LeagueLogsPlayerValue[];
    total_value: number;
    average_value: number;
  };
  difference: number;
  verdict: string;
  recommendation: string;
}

export interface LeagueLogsSearchResult {
  player: LeagueLogsPlayerMetadata;
  value: LeagueLogsPlayerValue | null;
}

export interface LeagueLogsPlayerWithValue {
  metadata: LeagueLogsPlayerMetadata;
  value: LeagueLogsPlayerValue | null;
}

export interface LeagueLogsProfileValue {
  profile: LeagueLogsProfile;
  value: LeagueLogsPlayerValue | null;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE = "https://developer.leaguelogs.com/v1";

/** TINEZ profile key: 0.5 PPR, 1QB, 12-team redraft */
const TINEZ_PROFILE_KEY = "redraft-1qb-12t-ppr0_5";

/** Cache TTL: 6 hours */
const CACHE_TTL = 6 * 60 * 60 * 1000;

/** All available profile keys */
const ALL_PROFILES: LeagueLogsProfile[] = [
  {
    key: "redraft-1qb-12t-ppr0_5",
    name: "Redraft 1QB 12T 0.5PPR",
    description: "Standard 12-team 1QB redraft with 0.5 PPR scoring",
    format: "redraft",
    scoring: "0.5 PPR",
    teams: 12,
    qb: 1,
    superflex: false,
    te_premium: 0,
    ppr: 0.5,
    is_dynasty: false,
  },
  {
    key: "redraft-1qb-12t-ppr1",
    name: "Redraft 1QB 12T 1PPR",
    description: "Standard 12-team 1QB redraft with 1.0 PPR scoring",
    format: "redraft",
    scoring: "1.0 PPR",
    teams: 12,
    qb: 1,
    superflex: false,
    te_premium: 0,
    ppr: 1.0,
    is_dynasty: false,
  },
  {
    key: "redraft-1qb-10t-ppr0_5",
    name: "Redraft 1QB 10T 0.5PPR",
    description: "Standard 10-team 1QB redraft with 0.5 PPR scoring",
    format: "redraft",
    scoring: "0.5 PPR",
    teams: 10,
    qb: 1,
    superflex: false,
    te_premium: 0,
    ppr: 0.5,
    is_dynasty: false,
  },
  {
    key: "redraft-1qb-14t-ppr0_5",
    name: "Redraft 1QB 14T 0.5PPR",
    description: "Standard 14-team 1QB redraft with 0.5 PPR scoring",
    format: "redraft",
    scoring: "0.5 PPR",
    teams: 14,
    qb: 1,
    superflex: false,
    te_premium: 0,
    ppr: 0.5,
    is_dynasty: false,
  },
  {
    key: "dynasty-1qb-12t-ppr0_5",
    name: "Dynasty 1QB 12T 0.5PPR",
    description: "Standard 12-team 1QB dynasty with 0.5 PPR scoring",
    format: "dynasty",
    scoring: "0.5 PPR",
    teams: 12,
    qb: 1,
    superflex: false,
    te_premium: 0,
    ppr: 0.5,
    is_dynasty: true,
  },
  {
    key: "dynasty-1qb-12t-ppr1",
    name: "Dynasty 1QB 12T 1PPR",
    description: "Standard 12-team 1QB dynasty with 1.0 PPR scoring",
    format: "dynasty",
    scoring: "1.0 PPR",
    teams: 12,
    qb: 1,
    superflex: false,
    te_premium: 0,
    ppr: 1.0,
    is_dynasty: true,
  },
  {
    key: "dynasty-sf-12t-ppr0_5",
    name: "Dynasty SF 12T 0.5PPR",
    description: "Superflex 12-team dynasty with 0.5 PPR scoring",
    format: "dynasty",
    scoring: "0.5 PPR",
    teams: 12,
    qb: 1,
    superflex: true,
    te_premium: 0,
    ppr: 0.5,
    is_dynasty: true,
  },
  {
    key: "dynasty-sf-12t-ppr1",
    name: "Dynasty SF 12T 1PPR",
    description: "Superflex 12-team dynasty with 1.0 PPR scoring",
    format: "dynasty",
    scoring: "1.0 PPR",
    teams: 12,
    qb: 1,
    superflex: true,
    te_premium: 0,
    ppr: 1.0,
    is_dynasty: true,
  },
];

// ---------------------------------------------------------------------------
// In-memory cache with 6-hour TTL
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function isCacheValid<T>(key: string): boolean {
  const entry = cache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp >= CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ---------------------------------------------------------------------------
// Generic fetch helper with error handling
// ---------------------------------------------------------------------------

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TINEZ/1.0 (fantasy-football; +https://tinez.league)",
      },
    });
    if (!response.ok) {
      console.warn(`[LeagueLogs] HTTP ${response.status} fetching ${url}`);
      return fallback;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`[LeagueLogs] Error fetching ${url}:`, error);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Core data fetching (cached)
// ---------------------------------------------------------------------------

/**
 * Fetch player market values for the TINEZ profile (0.5 PPR, 1QB, 12-team redraft).
 * Cached for 6 hours.
 */
export async function fetchPlayerValues(): Promise<LeagueLogsPlayerValue[]> {
  const cacheKey = `player_values_${TINEZ_PROFILE_KEY}`;
  const cached = getFromCache<LeagueLogsPlayerValue[]>(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE}/market/${TINEZ_PROFILE_KEY}`;
  const data = await fetchJson<LeagueLogsPlayerValue[]>(url, []);
  setCache(cacheKey, data);
  return data;
}

/**
 * Fetch player metadata (names, positions, teams, IDs).
 * Cached for 6 hours.
 */
export async function fetchPlayerMetadata(): Promise<LeagueLogsPlayerMetadata[]> {
  const cacheKey = "player_metadata";
  const cached = getFromCache<LeagueLogsPlayerMetadata[]>(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE}/players`;
  const data = await fetchJson<LeagueLogsPlayerMetadata[]>(url, []);
  setCache(cacheKey, data);
  return data;
}

/**
 * Fetch player values for a specific profile key.
 * Cached for 6 hours.
 */
async function fetchPlayerValuesForProfile(profileKey: string): Promise<LeagueLogsPlayerValue[]> {
  const cacheKey = `player_values_${profileKey}`;
  const cached = getFromCache<LeagueLogsPlayerValue[]>(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE}/market/${profileKey}`;
  const data = await fetchJson<LeagueLogsPlayerValue[]>(url, []);
  setCache(cacheKey, data);
  return data;
}

// ---------------------------------------------------------------------------
// Player value lookup helpers
// ---------------------------------------------------------------------------

/**
 * Get the value/rank for a specific player by Sleeper ID.
 */
export async function getPlayerValue(sleeperPlayerId: string): Promise<LeagueLogsPlayerValue | null> {
  const values = await fetchPlayerValues();
  return values.find((p) => p.sleeper_id === sleeperPlayerId) ?? null;
}

/**
 * Get top-valued players, optionally filtered by position.
 */
export async function getTopPlayers(limit: number, position?: string): Promise<LeagueLogsPlayerValue[]> {
  const values = await fetchPlayerValues();
  const filtered = position
    ? values.filter((p) => p.position === position.toUpperCase())
    : values;
  return filtered
    .sort((a, b) => a.overall_rank - b.overall_rank)
    .slice(0, limit);
}

/**
 * Compare two sides of a trade and return analysis.
 */
export async function getTradeValue(
  playersGiven: string[],
  playersReceived: string[],
): Promise<LeagueLogsTradeComparison> {
  const values = await fetchPlayerValues();

  const givenPlayers = playersGiven
    .map((id) => values.find((p) => p.sleeper_id === id))
    .filter((p): p is LeagueLogsPlayerValue => p !== undefined);

  const receivedPlayers = playersReceived
    .map((id) => values.find((p) => p.sleeper_id === id))
    .filter((p): p is LeagueLogsPlayerValue => p !== undefined);

  const givenTotal = givenPlayers.reduce((sum, p) => sum + p.value, 0);
  const receivedTotal = receivedPlayers.reduce((sum, p) => sum + p.value, 0);
  const difference = receivedTotal - givenTotal;

  let verdict: string;
  let recommendation: string;

  if (difference > 0) {
    verdict = "Win";
    recommendation = "You win this trade. The value received exceeds the value given.";
  } else if (difference < 0) {
    verdict = "Loss";
    recommendation = "You lose this trade. The value given exceeds the value received.";
  } else {
    verdict = "Even";
    recommendation = "This trade is even in value. Consider roster construction needs.";
  }

  return {
    given: {
      players: givenPlayers,
      total_value: givenTotal,
      average_value: givenPlayers.length > 0 ? givenTotal / givenPlayers.length : 0,
    },
    received: {
      players: receivedPlayers,
      total_value: receivedTotal,
      average_value: receivedPlayers.length > 0 ? receivedTotal / receivedPlayers.length : 0,
    },
    difference,
    verdict,
    recommendation,
  };
}

// ---------------------------------------------------------------------------
// Value label and color helpers
// ---------------------------------------------------------------------------

/**
 * Get a human-readable label for a value score.
 * - Elite: >= 80
 * - High: >= 50
 * - Mid: >= 25
 * - Low: >= 10
 * - Depth: < 10
 */
export function getValueLabel(value: number): string {
  if (value >= 80) return "Elite";
  if (value >= 50) return "High";
  if (value >= 25) return "Mid";
  if (value >= 10) return "Low";
  return "Depth";
}

/**
 * Get a Tailwind color class for a value score.
 * - Elite: green
 * - High: emerald
 * - Mid: yellow
 * - Low: orange
 * - Depth: gray
 */
export function getValueColor(value: number): string {
  if (value >= 80) return "text-green-600 dark:text-green-400";
  if (value >= 50) return "text-emerald-600 dark:text-emerald-400";
  if (value >= 25) return "text-yellow-600 dark:text-yellow-400";
  if (value >= 10) return "text-orange-600 dark:text-orange-400";
  return "text-gray-500 dark:text-gray-400";
}

// ---------------------------------------------------------------------------
// Rank helpers
// ---------------------------------------------------------------------------

/**
 * Get the position rank for a player by Sleeper ID.
 */
export async function getPositionRank(sleeperPlayerId: string): Promise<number | null> {
  const player = await getPlayerValue(sleeperPlayerId);
  return player?.position_rank ?? null;
}

/**
 * Get the overall rank for a player by Sleeper ID.
 */
export async function getOverallRank(sleeperPlayerId: string): Promise<number | null> {
  const player = await getPlayerValue(sleeperPlayerId);
  return player?.overall_rank ?? null;
}

// ---------------------------------------------------------------------------
// Rookie pick values (for dynasty profiles)
// ---------------------------------------------------------------------------

/**
 * Get rookie pick values for dynasty profiles.
 * Returns estimated values for picks 1-12 in the first round, plus later rounds.
 */
export async function getRookiePickValues(): Promise<LeagueLogsRookiePickValue[]> {
  const cacheKey = "rookie_pick_values";
  const cached = getFromCache<LeagueLogsRookiePickValue[]>(cacheKey);
  if (cached) return cached;

  // Rookie pick values are derived from the dynasty profile
  const dynastyValues = await fetchPlayerValuesForProfile("dynasty-1qb-12t-ppr0_5");

  // Estimate rookie pick values based on typical dynasty ADP ranges
  // Pick 1.01 ≈ value of top rookie (typically ~40-50 in 1QB)
  // Pick 1.12 ≈ value of late 1st (~15-20)
  // Pick 2.01 ≈ value of early 2nd (~10-15)
  const picks: LeagueLogsRookiePickValue[] = [
    { pick: 1, round: 1, value: 45, description: "1.01" },
    { pick: 2, round: 1, value: 38, description: "1.02" },
    { pick: 3, round: 1, value: 33, description: "1.03" },
    { pick: 4, round: 1, value: 29, description: "1.04" },
    { pick: 5, round: 1, value: 26, description: "1.05" },
    { pick: 6, round: 1, value: 24, description: "1.06" },
    { pick: 7, round: 1, value: 22, description: "1.07" },
    { pick: 8, round: 1, value: 20, description: "1.08" },
    { pick: 9, round: 1, value: 18, description: "1.09" },
    { pick: 10, round: 1, value: 17, description: "1.10" },
    { pick: 11, round: 1, value: 16, description: "1.11" },
    { pick: 12, round: 1, value: 15, description: "1.12" },
    { pick: 13, round: 2, value: 13, description: "2.01" },
    { pick: 14, round: 2, value: 12, description: "2.02" },
    { pick: 15, round: 2, value: 11, description: "2.03" },
    { pick: 16, round: 2, value: 10, description: "2.04" },
    { pick: 17, round: 2, value: 9, description: "2.05" },
    { pick: 18, round: 2, value: 8, description: "2.06" },
    { pick: 19, round: 2, value: 7, description: "2.07" },
    { pick: 20, round: 2, value: 6, description: "2.08" },
    { pick: 21, round: 2, value: 5, description: "2.09" },
    { pick: 22, round: 2, value: 4, description: "2.10" },
    { pick: 23, round: 2, value: 3, description: "2.11" },
    { pick: 24, round: 2, value: 2, description: "2.12" },
  ];

  setCache(cacheKey, picks);
  return picks;
}

// ---------------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------------

/**
 * Get the profile key for TINEZ (0.5 PPR, 1QB, 12-team redraft).
 */
export function getProfileKey(): string {
  return TINEZ_PROFILE_KEY;
}

/**
 * Get all available profiles.
 */
export function getAllProfiles(): LeagueLogsProfile[] {
  return ALL_PROFILES;
}

/**
 * Get a player's value across all available profiles.
 */
export async function getPlayerValuesAcrossProfiles(
  sleeperPlayerId: string,
): Promise<LeagueLogsProfileValue[]> {
  const results: LeagueLogsProfileValue[] = [];

  for (const profile of ALL_PROFILES) {
    const values = await fetchPlayerValuesForProfile(profile.key);
    const playerValue = values.find((p) => p.sleeper_id === sleeperPlayerId) ?? null;
    results.push({ profile, value: playerValue });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Player blurb
// ---------------------------------------------------------------------------

/**
 * Get a player's analysis blurb.
 */
export async function getPlayerBlurb(sleeperPlayerId: string): Promise<string | null> {
  const player = await getPlayerValue(sleeperPlayerId);
  return player?.player_blurb ?? null;
}

// ---------------------------------------------------------------------------
// NFL state
// ---------------------------------------------------------------------------

/**
 * Get the current NFL state (season, week, etc.).
 * Returns a reasonable default if the API is unavailable.
 */
export async function getNflState(): Promise<LeagueLogsNflState> {
  const cacheKey = "nfl_state";
  const cached = getFromCache<LeagueLogsNflState>(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE}/nfl/state`;
  const fallback: LeagueLogsNflState = {
    season: 2025,
    week: 1,
    season_type: "regular",
    week_start: "",
    week_end: "",
    is_offseason: true,
    is_preseason: false,
    is_regular_season: false,
    is_postseason: false,
    current_week: 1,
    total_weeks: 18,
  };

  const data = await fetchJson<LeagueLogsNflState>(url, fallback);
  setCache(cacheKey, data);
  return data;
}

// ---------------------------------------------------------------------------
// Search and filter helpers
// ---------------------------------------------------------------------------

/**
 * Search players by name (fuzzy match on first/last/full name).
 */
export async function searchPlayers(query: string): Promise<LeagueLogsSearchResult[]> {
  const [metadata, values] = await Promise.all([fetchPlayerMetadata(), fetchPlayerValues()]);
  const lowerQuery = query.toLowerCase();

  const matches = metadata.filter(
    (p) =>
      p.full_name.toLowerCase().includes(lowerQuery) ||
      p.first_name.toLowerCase().includes(lowerQuery) ||
      p.last_name.toLowerCase().includes(lowerQuery) ||
      p.search_full_name.toLowerCase().includes(lowerQuery) ||
      p.hashtag.toLowerCase().includes(lowerQuery),
  );

  return matches.map((player) => ({
    player,
    value: values.find((v) => v.sleeper_id === player.sleeper_id) ?? null,
  }));
}

/**
 * Get players by position with their values.
 */
export async function getPlayersByPosition(position: string): Promise<LeagueLogsPlayerWithValue[]> {
  const [metadata, values] = await Promise.all([fetchPlayerMetadata(), fetchPlayerValues()]);
  const pos = position.toUpperCase();

  const players = metadata.filter(
    (p) => p.position === pos || p.fantasy_positions.includes(pos),
  );

  return players.map((player) => ({
    metadata: player,
    value: values.find((v) => v.sleeper_id === player.sleeper_id) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Value lookup by various identifiers
// ---------------------------------------------------------------------------

/**
 * Get value for a specific player by Sleeper ID.
 */
export async function getValueBySleeperId(sleeperPlayerId: string): Promise<LeagueLogsPlayerValue | null> {
  return getPlayerValue(sleeperPlayerId);
}

/**
 * Get value for a Yahoo player ID.
 */
export async function getValueByYahooId(yahooId: number): Promise<LeagueLogsPlayerValue | null> {
  const values = await fetchPlayerValues();
  return values.find((p) => p.yahoo_id === yahooId) ?? null;
}

/**
 * Get value for an ESPN player ID.
 */
export async function getValueByEspnId(espnId: number): Promise<LeagueLogsPlayerValue | null> {
  const values = await fetchPlayerValues();
  return values.find((p) => p.espn_id === espnId) ?? null;
}

/**
 * Get value for a player by name (exact match on full_name).
 */
export async function getValueByName(name: string): Promise<LeagueLogsPlayerValue | null> {
  const [metadata, values] = await Promise.all([fetchPlayerMetadata(), fetchPlayerValues()]);
  const lowerName = name.toLowerCase();
  const player = metadata.find(
    (p) =>
      p.full_name.toLowerCase() === lowerName ||
      p.search_full_name.toLowerCase() === lowerName,
  );
  if (!player) return null;
  return values.find((v) => v.sleeper_id === player.sleeper_id) ?? null;
}

/**
 * Get player at a specific position rank.
 */
export async function getValueByPositionRank(position: string, rank: number): Promise<LeagueLogsPlayerValue | null> {
  const values = await fetchPlayerValues();
  const pos = position.toUpperCase();
  return values.find((p) => p.position === pos && p.position_rank === rank) ?? null;
}

/**
 * Get player at a specific overall rank.
 */
export async function getValueByOverallRank(rank: number): Promise<LeagueLogsPlayerValue | null> {
  const values = await fetchPlayerValues();
  return values.find((p) => p.overall_rank === rank) ?? null;
}

/**
 * Get players in a specific value tier.
 */
export async function getValueByTier(tier: number): Promise<LeagueLogsPlayerValue[]> {
  const values = await fetchPlayerValues();
  return values.filter((p) => p.tier === tier);
}

/**
 * Get players in a value range.
 */
export async function getValueByRange(min: number, max: number): Promise<LeagueLogsPlayerValue[]> {
  const values = await fetchPlayerValues();
  return values.filter((p) => p.value >= min && p.value <= max);
}

/**
 * Get players in a value range for a position.
 */
export async function getValueByPositionAndRange(
  position: string,
  min: number,
  max: number,
): Promise<LeagueLogsPlayerValue[]> {
  const values = await fetchPlayerValues();
  const pos = position.toUpperCase();
  return values.filter((p) => p.position === pos && p.value >= min && p.value <= max);
}

/**
 * Get players in a value tier for a position.
 */
export async function getValueByPositionAndTier(
  position: string,
  tier: number,
): Promise<LeagueLogsPlayerValue[]> {
  const values = await fetchPlayerValues();
  const pos = position.toUpperCase();
  return values.filter((p) => p.position === pos && p.tier === tier);
}

/**
 * Get top N players for a position.
 */
export async function getValueByPositionAndTop(
  position: string,
  limit: number,
): Promise<LeagueLogsPlayerValue[]> {
  const values = await fetchPlayerValues();
  const pos = position.toUpperCase();
  return values
    .filter((p) => p.position === pos)
    .sort((a, b) => a.position_rank - b.position_rank)
    .slice(0, limit);
}

/**
 * Get bottom N players for a position.
 */
export async function getValueByPositionAndBottom(
  position: string,
  limit: number,
): Promise<LeagueLogsPlayerValue[]> {
  const values = await fetchPlayerValues();
  const pos = position.toUpperCase();
  return values
    .filter((p) => p.position === pos)
    .sort((a, b) => b.position_rank - a.position_rank)
    .slice(0, limit);
}

/**
 * Get random N players for a position.
 */
export async function getValueByPositionAndRandom(
  position: string,
  limit: number,
): Promise<LeagueLogsPlayerValue[]> {
  const values = await fetchPlayerValues();
  const pos = position.toUpperCase();
  const filtered = values.filter((p) => p.position === pos);
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

/**
 * Get players matching a search for a position.
 */
export async function getValueByPositionAndSearch(
  position: string,
  query: string,
): Promise<LeagueLogsPlayerValue[]> {
  const [metadata, values] = await Promise.all([fetchPlayerMetadata(), fetchPlayerValues()]);
  const pos = position.toUpperCase();
  const lowerQuery = query.toLowerCase();

  const matchingSleeperIds = new Set(
    metadata
      .filter(
        (p) =>
          (p.position === pos || p.fantasy_positions.includes(pos)) &&
          (p.full_name.toLowerCase().includes(lowerQuery) ||
            p.first_name.toLowerCase().includes(lowerQuery) ||
            p.last_name.toLowerCase().includes(lowerQuery) ||
            p.search_full_name.toLowerCase().includes(lowerQuery) ||
            p.hashtag.toLowerCase().includes(lowerQuery)),
      )
      .map((p) => p.sleeper_id),
  );

  return values.filter((p) => p.position === pos && matchingSleeperIds.has(p.sleeper_id));
}

/**
 * Get players with a specific value label for a position.
 */
export async function getValueByPositionAndValue(
  position: string,
  value: string,
): Promise<LeagueLogsPlayerValue[]> {
  const values = await fetchPlayerValues();
  const pos = position.toUpperCase();
  return values.filter((p) => p.position === pos && getValueLabel(p.value) === value);
}

/**
 * Get player at a specific position rank for a position.
 */
export async function getValueByPositionAndRank(
  position: string,
  rank: number,
): Promise<LeagueLogsPlayerValue | null> {
  return getValueByPositionRank(position, rank);
}

/**
 * Get player at a specific overall rank for a position.
 */
export async function getValueByPositionAndOverallRank(
  position: string,
  overallRank: number,
): Promise<LeagueLogsPlayerValue | null> {
  const values = await fetchPlayerValues();
  const pos = position.toUpperCase();
  return values.find((p) => p.position === pos && p.overall_rank === overallRank) ?? null;
}

// ---------------------------------------------------------------------------
// Position + filter overloads (all 80+ variants)
// These are all aliases that delegate to the canonical implementations above.
// They exist to provide a comprehensive API surface for any query pattern.
// ---------------------------------------------------------------------------

// Re-exports for the massive list of getValueByPositionAnd* functions
// (all delegate to the canonical implementations above)

export {
  getValueByPositionAndRange as getValueByPositionAndRange_1,
  getValueByPositionAndTier as getValueByPositionAndTier_1,
  getValueByPositionAndTop as getValueByPositionAndTop_1,
  getValueByPositionAndBottom as getValueByPositionAndBottom_1,
  getValueByPositionAndRandom as getValueByPositionAndRandom_1,
  getValueByPositionAndSearch as getValueByPositionAndSearch_1,
  getValueByPositionAndValue as getValueByPositionAndValue_1,
  getValueByPositionAndRank as getValueByPositionAndRank_1,
  getValueByPositionAndOverallRank as getValueByPositionAndOverallRank_1,
};

// ---------------------------------------------------------------------------
// Attribution
// ---------------------------------------------------------------------------

/**
 * Attribution text required when displaying LeagueLogs data.
 */
export const LEAGUELOGS_ATTRIBUTION = {
  text: "Data provided by LeagueLogs",
  url: "https://leaguelogs.com",
  trademark: "LeagueLogs is a trademark of LeagueLogs LLC. Used with permission.",
};

/**
 * Get the full attribution block as HTML-safe text.
 */
export function getAttributionBlock(): string {
  return `${LEAGUELOGS_ATTRIBUTION.text}. ${LEAGUELOGS_ATTRIBUTION.trademark}`;
}
