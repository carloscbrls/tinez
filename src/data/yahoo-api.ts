/**
 * Yahoo Fantasy Sports API — Client Module
 *
 * Server-side data fetching with caching for static generation.
 * All calls go through the Netlify function proxy (no direct Yahoo API calls).
 * Returns parsed JSON (XML is converted server-side).
 *
 * Usage:
 *   import { yahoo } from "../data/yahoo-api";
 *   const leagues = await yahoo.getLeagues();
 *   const standings = await yahoo.getStandings(leagueKey);
 */

import { monitor } from "../lib/monitor";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface YahooLeague {
  league_key: string;
  league_id: string;
  name: string;
  url: string;
  logo_url?: string;
  draft_status: string;
  num_teams: number;
  scoring_type: string;
  season: string;
}

export interface YahooTeam {
  team_key: string;
  team_id: string;
  name: string;
  logo_url?: string;
  waiver_priority: number;
  number_of_moves: number;
  number_of_trades: number;
  managers: { manager_id: string; nickname: string; email?: string }[];
  team_standings?: {
    rank: number;
    wins: number;
    losses: number;
    ties: number;
    percentage: number;
    points_for: number;
    points_against: number;
    streak: string;
  };
}

export interface YahooPlayer {
  player_key: string;
  player_id: string;
  name: { full: string; first: string; last: string };
  editorial_team: string;
  display_position: string;
  status?: string;
  injury_note?: string;
  ownership?: {
    ownership_type: string;
    percent_owned: number;
    percent_started: number;
  };
  player_stats?: any[];
}

export interface YahooStandings {
  teams: YahooTeam[];
}

export interface YahooRoster {
  team_key: string;
  team_name: string;
  players: YahooPlayer[];
}

export interface YahooScoreboard {
  week: number;
  matchups: {
    teams: { team_key: string; name: string; points: number }[];
    winner_team_key?: string;
    is_tied: boolean;
  }[];
}

export interface YahooTransaction {
  transaction_key: string;
  transaction_id: string;
  type: string;
  status: string;
  timestamp: number;
  players: { player_key: string; name: string; source_team_key?: string; destination_team_key?: string }[];
}

export interface YahooDraftResult {
  pick: number;
  round: number;
  team_key: string;
  team_name: string;
  player_key: string;
  player_name: string;
}

export interface YahooLeagueSettings {
  league_key: string;
  name: string;
  num_teams: number;
  scoring_type: string;
  roster_positions: { position: string; count: number }[];
  draft_type: string;
  waiver_type: string;
  waiver_rule: string;
  trade_end_date?: string;
  playoff_start_week?: number;
}

// ─── Configuration ──────────────────────────────────────────────────────────

const API_BASE = "/api/yahoo";

// ─── Cache ─────────────────────────────────────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for Yahoo data
const cache = new Map<string, { data: any; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    monitor.reportCacheHit("Yahoo");
    return entry.data as T;
  }
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
  monitor.reportCacheWrite("Yahoo");
}

// ─── API Call ───────────────────────────────────────────────────────────────

async function yahooFetch<T>(endpoint: string, cacheKey: string): Promise<T> {
  // Check cache first
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  monitor.reportCacheMiss("Yahoo");

  const url = `${API_BASE}${endpoint}`;
  const result = await monitor.fetch<T>("Yahoo", url);

  if (!result.ok) {
    if (result.status === 401) {
      throw new YahooAuthError("Not authenticated with Yahoo");
    }
    if (result.status === 429) {
      throw new YahooRateLimitError("Yahoo rate limit exceeded");
    }
    throw new Error(result.error ?? `Yahoo API error: ${result.status}`);
  }

  setCache(cacheKey, result.data);
  return result.data!;
}

// ─── Custom Errors ──────────────────────────────────────────────────────────

export class YahooAuthError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "YahooAuthError";
  }
}

export class YahooRateLimitError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "YahooRateLimitError";
  }
}

// ─── API Methods ──────────────────────────────────────────────────────────

/**
 * Check if Yahoo OAuth is authenticated
 */
export async function checkAuth(): Promise<{
  authenticated: boolean;
  expiresIn: number;
  rateLimitRemaining: number;
}> {
  const result = await monitor.fetch<any>("Yahoo", `${API_BASE}/status`);
  if (!result.ok || !result.data) {
    return { authenticated: false, expiresIn: 0, rateLimitRemaining: 0 };
  }
  return {
    authenticated: result.data.authenticated,
    expiresIn: result.data.expiresIn,
    rateLimitRemaining: result.data.rateLimitRemaining,
  };
}

/**
 * Get detailed OAuth health
 */
export async function getHealth(): Promise<any> {
  const result = await monitor.fetch<any>("Yahoo", `${API_BASE}/health`);
  return result.data ?? { authenticated: false };
}

/**
 * Fetch user's Yahoo fantasy leagues
 */
export async function getLeagues(): Promise<YahooLeague[]> {
  const data = await yahooFetch<any>("/leagues", "yahoo_leagues");
  return extractLeagues(data);
}

/**
 * Fetch league standings
 */
export async function getStandings(leagueKey: string): Promise<YahooStandings> {
  const data = await yahooFetch<any>(`/standings?league_key=${leagueKey}`, `yahoo_standings_${leagueKey}`);
  return extractStandings(data);
}

/**
 * Fetch all teams in a league
 */
export async function getTeams(leagueKey: string): Promise<YahooTeam[]> {
  const data = await yahooFetch<any>(`/teams?league_key=${leagueKey}`, `yahoo_teams_${leagueKey}`);
  return extractTeams(data);
}

/**
 * Fetch team rosters
 */
export async function getRosters(leagueKey: string): Promise<YahooRoster[]> {
  const data = await yahooFetch<any>(`/rosters?league_key=${leagueKey}`, `yahoo_rosters_${leagueKey}`);
  return extractRosters(data);
}

/**
 * Fetch weekly scoreboard
 */
export async function getScoreboard(leagueKey: string, week?: number): Promise<YahooScoreboard> {
  const weekParam = week ? `&week=${week}` : "";
  const data = await yahooFetch<any>(
    `/scoreboard?league_key=${leagueKey}${weekParam}`,
    `yahoo_scoreboard_${leagueKey}_${week || "current"}`
  );
  return extractScoreboard(data);
}

/**
 * Fetch recent transactions
 */
export async function getTransactions(leagueKey: string, count = 25): Promise<YahooTransaction[]> {
  const data = await yahooFetch<any>(
    `/transactions?league_key=${leagueKey}&count=${count}`,
    `yahoo_transactions_${leagueKey}_${count}`
  );
  return extractTransactions(data);
}

/**
 * Fetch player details
 */
export async function getPlayers(leagueKey: string, playerKeys: string[]): Promise<YahooPlayer[]> {
  const data = await yahooFetch<any>(
    `/players?league_key=${leagueKey}&player_keys=${playerKeys.join(",")}`,
    `yahoo_players_${leagueKey}_${playerKeys.length}`
  );
  return extractPlayers(data);
}

/**
 * Fetch top available players (waiver wire)
 */
export async function getWaiverWire(leagueKey: string, count = 50, sort = "AR"): Promise<YahooPlayer[]> {
  const data = await yahooFetch<any>(
    `/players/pick?league_key=${leagueKey}&count=${count}&sort=${sort}`,
    `yahoo_waiver_${leagueKey}_${count}_${sort}`
  );
  return extractPlayers(data);
}

/**
 * Fetch league settings
 */
export async function getSettings(leagueKey: string): Promise<YahooLeagueSettings> {
  const data = await yahooFetch<any>(`/settings?league_key=${leagueKey}`, `yahoo_settings_${leagueKey}`);
  return extractSettings(data);
}

/**
 * Fetch draft results
 */
export async function getDraftResults(leagueKey: string): Promise<YahooDraftResult[]> {
  const data = await yahooFetch<any>(`/draft?league_key=${leagueKey}`, `yahoo_draft_${leagueKey}`);
  return extractDraftResults(data);
}

// ─── Response Extractors ───────────────────────────────────────────────────
// These handle the Yahoo API response structure (which varies by endpoint)

function extractLeagues(data: any): YahooLeague[] {
  if (!data) return [];
  // Handle both XML-parsed and JSON response formats
  const leagues = data.fantasy_content?.users?.user?.[0]?.games?.game?.[0]?.leagues?.league;
  if (Array.isArray(leagues)) {
    return leagues.map((l: any) => ({
      league_key: l.league_key || "",
      league_id: l.league_id || "",
      name: l.name || "",
      url: l.url || "",
      logo_url: l.logo_url,
      draft_status: l.draft_status || "",
      num_teams: parseInt(l.num_teams, 10) || 0,
      scoring_type: l.scoring_type || "",
      season: l.season || "",
    }));
  }
  return [];
}

function extractStandings(data: any): YahooStandings {
  const teams = extractTeams(data);
  return { teams };
}

function extractTeams(data: any): YahooTeam[] {
  if (!data) return [];
  const teams = data.fantasy_content?.league?.[0]?.standings?.[0]?.teams?.team
    || data.fantasy_content?.league?.[0]?.teams?.team
    || [];
  if (!Array.isArray(teams)) return [];
  return teams.map((t: any) => ({
    team_key: t.team_key || "",
    team_id: t.team_id || "",
    name: t.name || "",
    logo_url: t.logo_url,
    waiver_priority: parseInt(t.waiver_priority, 10) || 0,
    number_of_moves: parseInt(t.number_of_moves, 10) || 0,
    number_of_trades: parseInt(t.number_of_trades, 10) || 0,
    managers: Array.isArray(t.managers?.manager)
      ? t.managers.manager.map((m: any) => ({
          manager_id: m.manager_id || "",
          nickname: m.nickname || "",
          email: m.email,
        }))
      : [],
    team_standings: t.team_standings
      ? {
          rank: parseInt(t.team_standings.rank, 10) || 0,
          wins: parseFloat(t.team_standings.wins) || 0,
          losses: parseFloat(t.team_standings.losses) || 0,
          ties: parseFloat(t.team_standings.ties) || 0,
          percentage: parseFloat(t.team_standings.percentage) || 0,
          points_for: parseFloat(t.team_standings.points_for) || 0,
          points_against: parseFloat(t.team_standings.points_against) || 0,
          streak: t.team_standings.streak || "",
        }
      : undefined,
  }));
}

function extractRosters(data: any): YahooRoster[] {
  if (!data) return [];
  const teams = data.fantasy_content?.league?.[0]?.teams?.team || [];
  if (!Array.isArray(teams)) return [];
  return teams.map((t: any) => ({
    team_key: t.team_key || "",
    team_name: t.name || "",
    players: extractPlayersFromTeam(t),
  }));
}

function extractPlayersFromTeam(team: any): YahooPlayer[] {
  const players = team?.roster?.[0]?.players?.player || [];
  if (!Array.isArray(players)) return [];
  return players.map((p: any) => ({
    player_key: p.player_key || "",
    player_id: p.player_id || "",
    name: {
      full: p.name?.full || "",
      first: p.name?.first || "",
      last: p.name?.last || "",
    },
    editorial_team: p.editorial_team || "",
    display_position: p.display_position || "",
    status: p.status,
    injury_note: p.injury_note,
    ownership: p.ownership
      ? {
          ownership_type: p.ownership.ownership_type || "",
          percent_owned: parseFloat(p.ownership.percent_owned) || 0,
          percent_started: parseFloat(p.ownership.percent_started) || 0,
        }
      : undefined,
  }));
}

function extractPlayers(data: any): YahooPlayer[] {
  if (!data) return [];
  const players = data.fantasy_content?.league?.[0]?.players?.player || [];
  if (!Array.isArray(players)) return [];
  return players.map((p: any) => ({
    player_key: p.player_key || "",
    player_id: p.player_id || "",
    name: {
      full: p.name?.full || "",
      first: p.name?.first || "",
      last: p.name?.last || "",
    },
    editorial_team: p.editorial_team || "",
    display_position: p.display_position || "",
    status: p.status,
    injury_note: p.injury_note,
    ownership: p.ownership
      ? {
          ownership_type: p.ownership.ownership_type || "",
          percent_owned: parseFloat(p.ownership.percent_owned) || 0,
          percent_started: parseFloat(p.ownership.percent_started) || 0,
        }
      : undefined,
  }));
}

function extractScoreboard(data: any): YahooScoreboard {
  if (!data) return { week: 0, matchups: [] };
  const league = data.fantasy_content?.league?.[0];
  const week = parseInt(league?.scoreboard?.[0]?.week, 10) || 0;
  const matchups = league?.scoreboard?.[0]?.matchups?.matchup || [];
  return {
    week,
    matchups: Array.isArray(matchups)
      ? matchups.map((m: any) => ({
          teams: extractMatchupTeams(m),
          winner_team_key: m.winner_team_key,
          is_tied: m.is_tied === "1",
        }))
      : [],
  };
}

function extractMatchupTeams(matchup: any): { team_key: string; name: string; points: number }[] {
  const teams = matchup?.teams?.team || [];
  if (!Array.isArray(teams)) return [];
  return teams.map((t: any) => ({
    team_key: t.team_key || "",
    name: t.name || "",
    points: parseFloat(t.team_points?.total) || 0,
  }));
}

function extractTransactions(data: any): YahooTransaction[] {
  if (!data) return [];
  const transactions = data.fantasy_content?.league?.[0]?.transactions?.transaction || [];
  if (!Array.isArray(transactions)) return [];
  return transactions.map((t: any) => ({
    transaction_key: t.transaction_key || "",
    transaction_id: t.transaction_id || "",
    type: t.type || "",
    status: t.status || "",
    timestamp: parseInt(t.timestamp, 10) || 0,
    players: extractTransactionPlayers(t),
  }));
}

function extractTransactionPlayers(transaction: any): { player_key: string; name: string; source_team_key?: string; destination_team_key?: string }[] {
  const players = transaction?.players?.player || [];
  if (!Array.isArray(players)) return [];
  return players.map((p: any) => ({
    player_key: p.player_key || "",
    name: p.name?.full || "",
    source_team_key: p.source_team_key,
    destination_team_key: p.destination_team_key,
  }));
}

function extractDraftResults(data: any): YahooDraftResult[] {
  if (!data) return [];
  const picks = data.fantasy_content?.league?.[0]?.draft_results?.draft_result || [];
  if (!Array.isArray(picks)) return [];
  return picks.map((p: any) => ({
    pick: parseInt(p.pick, 10) || 0,
    round: parseInt(p.round, 10) || 0,
    team_key: p.team_key || "",
    team_name: "",
    player_key: p.player_key || "",
    player_name: "",
  }));
}

function extractSettings(data: any): YahooLeagueSettings {
  if (!data) return { league_key: "", name: "", num_teams: 0, scoring_type: "", roster_positions: [], draft_type: "", waiver_type: "", waiver_rule: "" };
  const league = data.fantasy_content?.league?.[0];
  return {
    league_key: league?.league_key || "",
    name: league?.name || "",
    num_teams: parseInt(league?.num_teams, 10) || 0,
    scoring_type: league?.scoring_type || "",
    roster_positions: [],
    draft_type: league?.draft_type || "",
    waiver_type: league?.waiver_type || "",
    waiver_rule: league?.waiver_rule || "",
    trade_end_date: league?.trade_end_date,
    playoff_start_week: parseInt(league?.playoff_start_week, 10) || undefined,
  };
}

// ─── Convenience Export ────────────────────────────────────────────────────

export const yahoo = {
  checkAuth,
  getHealth,
  getLeagues,
  getStandings,
  getTeams,
  getRosters,
  getScoreboard,
  getTransactions,
  getPlayers,
  getWaiverWire,
  getSettings,
  getDraftResults,
};
