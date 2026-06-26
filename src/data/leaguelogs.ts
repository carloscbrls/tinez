/**
 * LeagueLogs API Data Layer
 * Server-side data fetching with caching for static generation
 *
 * TINEZ uses the 0.5 PPR, 1QB, 12-team redraft profile.
 *
 * Attribution: Data provided by LeagueLogs (https://leaguelogs.com)
 */

// ---------------------------------------------------------------------------
// Types matching the actual API response
// ---------------------------------------------------------------------------

export interface LeagueLogsMarketItem {
  sleeperPlayerId: string;
  value: number;
  rawValue: number;
  overallRank: number;
  positionRank: number;
}

export interface LeagueLogsPlayerMeta {
  sleeperPlayerId: string;
  firstName: string;
  lastName: string;
  position: string;
  team: string;
  age: number;
  yearsExp: number;
  college: string;
  heightInches: number;
  weightPounds: number;
  jerseyNumber: number;
  status: string;
  espnId: number | null;
}

export interface LeagueLogsApiResponse<T> {
  _attribution: { text: string; url: string };
  meta: { profile?: any; lastRefreshed: string; playerCount?: number; version?: number };
  data: T[];
}

export interface LeagueLogsNflState {
  season: number;
  week: number;
  seasonType: string;
  lastRefreshed: string;
}

export interface LeagueLogsProfile {
  key: string;
  label: string;
  format: "redraft" | "dynasty";
  numQbs: number;
  numTeams: number;
  ppr: number;
}

export interface LeagueLogsRookiePick {
  pick: number;
  value: number;
  label: string;
}

export interface PlayerWithValue {
  sleeperPlayerId: string;
  value: number;
  overallRank: number;
  positionRank: number;
  name: string;
  position: string;
  team: string;
  age: number;
  espnId: number | null;
}

export interface TradeComparison {
  sideA: PlayerWithValue[];
  sideB: PlayerWithValue[];
  totalA: number;
  totalB: number;
  avgA: number;
  avgB: number;
  verdict: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE = "https://developer.leaguelogs.com/v1";
const TINEZ_PROFILE_KEY = "redraft-1qb-12t-ppr0_5";

const ALL_PROFILES: LeagueLogsProfile[] = [
  { key: "redraft-1qb-12t-ppr0_5", label: "Redraft 1QB 12T 0.5 PPR", format: "redraft", numQbs: 1, numTeams: 12, ppr: 0.5 },
  { key: "redraft-1qb-12t-ppr1", label: "Redraft 1QB 12T 1 PPR", format: "redraft", numQbs: 1, numTeams: 12, ppr: 1 },
  { key: "redraft-2qb-12t-ppr0_5", label: "Redraft 2QB 12T 0.5 PPR", format: "redraft", numQbs: 2, numTeams: 12, ppr: 0.5 },
  { key: "dynasty-1qb-12t-ppr0_5", label: "Dynasty 1QB 12T 0.5 PPR", format: "dynasty", numQbs: 1, numTeams: 12, ppr: 0.5 },
  { key: "dynasty-2qb-12t-ppr0_5", label: "Dynasty 2QB 12T 0.5 PPR", format: "dynasty", numQbs: 2, numTeams: 12, ppr: 0.5 },
];

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

const cache = new Map<string, { data: any; expires: number }>();

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data as T;
  if (entry) cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T, ttlMs: number = 6 * 60 * 60 * 1000): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

// ---------------------------------------------------------------------------
// Core fetcher
// ---------------------------------------------------------------------------

async function fetchApi<T>(url: string, fallback: T[]): Promise<T[]> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "TINEZ/1.0" },
    });
    if (!response.ok) {
      console.warn(`[LeagueLogs] HTTP ${response.status} fetching ${url}`);
      return fallback;
    }
    const json: LeagueLogsApiResponse<T> = await response.json();
    return json.data ?? fallback;
  } catch (error) {
    console.error(`[LeagueLogs] Error fetching ${url}:`, error);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Core data fetching (cached)
// ---------------------------------------------------------------------------

export async function fetchPlayerValues(): Promise<LeagueLogsMarketItem[]> {
  const cacheKey = `player_values_${TINEZ_PROFILE_KEY}`;
  const cached = getFromCache<LeagueLogsMarketItem[]>(cacheKey);
  if (cached) return cached;
  const url = `${API_BASE}/market/${TINEZ_PROFILE_KEY}`;
  const data = await fetchApi<LeagueLogsMarketItem>(url, []);
  setCache(cacheKey, data);
  setLastRefreshTimestamp(new Date().toISOString());
  return data;
}

export async function fetchPlayerMetadata(): Promise<LeagueLogsPlayerMeta[]> {
  const cacheKey = "player_metadata";
  const cached = getFromCache<LeagueLogsPlayerMeta[]>(cacheKey);
  if (cached) return cached;
  const url = `${API_BASE}/players`;
  const data = await fetchApi<LeagueLogsPlayerMeta>(url, []);
  setCache(cacheKey, data);
  setLastRefreshTimestamp(new Date().toISOString());
  return data;
}

// ---------------------------------------------------------------------------
// Joined data: market values + player metadata
// ---------------------------------------------------------------------------

export async function fetchAllPlayersWithValues(): Promise<PlayerWithValue[]> {
  const [values, metadata] = await Promise.all([fetchPlayerValues(), fetchPlayerMetadata()]);
  const metaMap = new Map<string, LeagueLogsPlayerMeta>();
  metadata.forEach(m => metaMap.set(m.sleeperPlayerId, m));

  return values.map(v => {
    const meta = metaMap.get(v.sleeperPlayerId);
    return {
      sleeperPlayerId: v.sleeperPlayerId,
      value: v.value,
      overallRank: v.overallRank,
      positionRank: v.positionRank,
      name: meta ? `${meta.firstName} ${meta.lastName}` : `Player ${v.sleeperPlayerId}`,
      position: meta?.position || "?",
      team: meta?.team || "?",
      age: meta?.age || 0,
      espnId: meta?.espnId || null,
    };
  });
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

export async function getTopPlayers(limit: number, position?: string): Promise<PlayerWithValue[]> {
  const players = await fetchAllPlayersWithValues();
  const filtered = position
    ? players.filter(p => p.position === position.toUpperCase())
    : players;
  return filtered.slice(0, limit);
}

export async function getPlayersByPosition(position: string): Promise<PlayerWithValue[]> {
  const players = await fetchAllPlayersWithValues();
  return players.filter(p => p.position === position.toUpperCase());
}

export async function getPlayerBySleeperId(sleeperPlayerId: string): Promise<PlayerWithValue | null> {
  const players = await fetchAllPlayersWithValues();
  return players.find(p => p.sleeperPlayerId === sleeperPlayerId) ?? null;
}

export async function getPlayerByEspnId(espnId: number): Promise<PlayerWithValue | null> {
  const players = await fetchAllPlayersWithValues();
  return players.find(p => p.espnId === espnId) ?? null;
}

export async function searchPlayers(query: string): Promise<PlayerWithValue[]> {
  const players = await fetchAllPlayersWithValues();
  const q = query.toLowerCase();
  return players.filter(p => p.name.toLowerCase().includes(q));
}

export async function getTradeValue(
  playersGiven: string[],
  playersReceived: string[]
): Promise<TradeComparison> {
  const all = await fetchAllPlayersWithValues();
  const map = new Map(all.map(p => [p.sleeperPlayerId, p]));

  const sideA = playersGiven.map(id => map.get(id)).filter(Boolean) as PlayerWithValue[];
  const sideB = playersReceived.map(id => map.get(id)).filter(Boolean) as PlayerWithValue[];

  const totalA = sideA.reduce((s, p) => s + p.value, 0);
  const totalB = sideB.reduce((s, p) => s + p.value, 0);
  const avgA = sideA.length ? totalA / sideA.length : 0;
  const avgB = sideB.length ? totalB / sideB.length : 0;

  const diff = totalA - totalB;
  let verdict: string;
  if (Math.abs(diff) < 5) verdict = "Fair trade";
  else if (diff > 0) verdict = `Side A wins by ${diff.toFixed(1)} value points`;
  else verdict = `Side B wins by ${Math.abs(diff).toFixed(1)} value points`;

  return { sideA, sideB, totalA, totalB, avgA, avgB, verdict };
}

// ---------------------------------------------------------------------------
// Value helpers
// ---------------------------------------------------------------------------

export function getValueLabel(value: number): string {
  if (value >= 80) return "Elite";
  if (value >= 60) return "High";
  if (value >= 40) return "Mid";
  if (value >= 20) return "Low";
  return "Depth";
}

export function getValueColor(value: number): string {
  if (value >= 80) return "text-amber-400";
  if (value >= 60) return "text-emerald-400";
  if (value >= 40) return "text-blue-400";
  if (value >= 20) return "text-zinc-400";
  return "text-zinc-600";
}

export function getValueBg(value: number): string {
  if (value >= 80) return "bg-amber-500/15 border-amber-500/20";
  if (value >= 60) return "bg-emerald-500/15 border-emerald-500/20";
  if (value >= 40) return "bg-blue-500/15 border-blue-500/20";
  if (value >= 20) return "bg-zinc-500/15 border-zinc-500/20";
  return "bg-zinc-700/30 border-zinc-700/20";
}

export function getProfileKey(): string {
  return TINEZ_PROFILE_KEY;
}

export function getAllProfiles(): LeagueLogsProfile[] {
  return ALL_PROFILES;
}

export function getEspnHeadshotUrl(espnId: number | null): string | null {
  if (!espnId) return null;
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${espnId}.png&w=350&h=254`;
}

export function getNflTeamLogo(teamAbbr: string): string {
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${teamAbbr.toLowerCase()}.png`;
}

export function getAttributionBlock(): string {
  return 'Data provided by <a href="https://leaguelogs.com" target="_blank" rel="noopener">LeagueLogs</a>';
}

// ---------------------------------------------------------------------------
// Build timestamp tracking
// ---------------------------------------------------------------------------

let _lastRefreshTimestamp: string | null = null;

export function setLastRefreshTimestamp(ts: string): void {
  _lastRefreshTimestamp = ts;
}

export function getLastRefreshTimestamp(): string {
  return _lastRefreshTimestamp || new Date().toISOString();
}

export function getTimeSinceRefresh(): string {
  const now = Date.now();
  const then = new Date(getLastRefreshTimestamp()).getTime();
  const diff = now - then;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m ago`;
  return `${minutes}m ago`;
}
