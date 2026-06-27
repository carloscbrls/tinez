/**
 * Yahoo OAuth Handler — Netlify Function
 *
 * Handles OAuth 2.0 flow, token refresh, and proxies Yahoo Fantasy API calls.
 * All secrets come from environment variables — never hardcoded.
 *
 * Endpoints:
 *   GET  /api/yahoo/login        — Redirect to Yahoo OAuth
 *   GET  /api/yahoo/callback     — OAuth callback (code exchange)
 *   GET  /api/yahoo/status       — Check auth status
 *   GET  /api/yahoo/health       — Detailed OAuth health
 *   GET  /api/yahoo/leagues      — User's leagues
 *   GET  /api/yahoo/standings    — League standings
 *   GET  /api/yahoo/teams        — League teams
 *   GET  /api/yahoo/rosters      — Team rosters
 *   GET  /api/yahoo/scoreboard   — Weekly matchups
 *   GET  /api/yahoo/transactions — Recent transactions
 *   GET  /api/yahoo/players      — Player details
 *   GET  /api/yahoo/players/pick — Waiver wire
 *   GET  /api/yahoo/settings     — League settings
 *   GET  /api/yahoo/draft        — Draft results
 */

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// ─── Configuration (from env vars) ──────────────────────────────────────────

function getConfig() {
  return {
    clientId: process.env.YAHOO_CLIENT_ID || "dj0yJmk9WHBRT3hndWh0NDAxJmQ9WVdrOWVEZExWbkZuY0hZbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PWVk",
    clientSecret: process.env.YAHOO_CLIENT_SECRET || "",
    redirectUri: process.env.YAHOO_REDIRECT_URI || "https://tinez.netlify.app/api/yahoo/callback",
    blobStore: process.env.NETLIFY_BLOB_STORE || "",
    accessToken: process.env.NETLIFY_ACCESS_TOKEN || "",
  };
}

const AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";
const API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";
const STORE_KEY = "yahoo-tokens";

// ─── Token Storage ──────────────────────────────────────────────────────────

async function getStoredTokens() {
  const { blobStore, accessToken } = getConfig();
  if (!blobStore) return null;
  try {
    const res = await fetch(`${blobStore}/${STORE_KEY}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function storeTokens(data: any) {
  const { blobStore, accessToken } = getConfig();
  if (!blobStore) return;
  try {
    await fetch(`${blobStore}/${STORE_KEY}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
  } catch {
    // blob store not available — token won't persist across cold starts
  }
}

async function getAccessToken(): Promise<string | null> {
  const { clientId, clientSecret } = getConfig();
  const stored = await getStoredTokens();
  if (!stored || !stored.accessToken) return null;

  // Check if token is expired and refresh if needed
  if (Date.now() >= stored.expiresAt && stored.refreshToken) {
    try {
      const tokenBody = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: stored.refreshToken,
        grant_type: "refresh_token",
      });
      const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenBody.toString(),
      });
      const data: any = await res.json();
      if (data.access_token) {
        const newTokens = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || stored.refreshToken,
          expiresAt: Date.now() + data.expires_in * 1000,
        };
        await storeTokens(newTokens);
        return newTokens.accessToken;
      }
    } catch {
      return null;
    }
  }

  return stored.accessToken;
}

// ─── Rate Limit Tracking ────────────────────────────────────────────────────

const rateLimitState = {
  remaining: 9999,
  resetAt: 0,
};

function updateRateLimit(headers: Headers) {
  const remaining = headers.get("X-RateLimit-Remaining");
  const reset = headers.get("X-RateLimit-Reset");
  if (remaining) rateLimitState.remaining = parseInt(remaining, 10);
  if (reset) rateLimitState.resetAt = parseInt(reset, 10) * 1000;
}

// ─── XML → JSON Parser ──────────────────────────────────────────────────────

/**
 * Minimal XML-to-JSON converter for Yahoo Fantasy API responses.
 * Handles the specific XML structure Yahoo returns.
 */
function xmlToJson(xml: string): any {
  const result: any = {};
  const fantasyContent = xml.match(/<fantasy_content>([\s\S]*?)<\/fantasy_content>/);
  if (!fantasyContent) return { raw: xml };

  const content = fantasyContent[1];

  // Parse count attributes
  const countMatch = content.match(/<([a-z_]+) count="(\d+)">/);
  if (countMatch) {
    result._count = parseInt(countMatch[2], 10);
  }

  // Parse simple elements: <tag>value</tag>
  const simpleTags = content.matchAll(/<([a-z_]+)>([^<]+)<\/\1>/g);
  for (const match of simpleTags) {
    result[match[1]] = match[2].trim();
  }

  // Parse nested objects
  const nestedTags = content.matchAll(/<([a-z_]+)>(<[\s\S]*?)<\/\1>/g);
  for (const match of nestedTags) {
    const key = match[1];
    const val = match[2];
    if (val.startsWith("<")) {
      result[key] = xmlToJson(`<fantasy_content>${val}</fantasy_content>`);
    } else {
      result[key] = val.trim();
    }
  }

  // Parse arrays (elements with count)
  const arrayBlocks = content.matchAll(/<([a-z_]+) count="(\d+)">([\s\S]*?)<\/\1>/g);
  for (const match of arrayBlocks) {
    const key = match[1];
    const count = parseInt(match[2], 10);
    const block = match[3];

    // Extract individual items
    const items: any[] = [];
    const itemMatches = block.matchAll(/<([a-z_]+)>(<[\s\S]*?)<\/\1>/g);
    for (const item of itemMatches) {
      items.push(xmlToJson(`<fantasy_content>${item[2]}</fantasy_content>`));
    }

    // If no nested items found, try flat values
    if (items.length === 0) {
      const flatMatches = block.matchAll(/<([a-z_]+)>([^<]+)<\/\1>/g);
      for (const flat of flatMatches) {
        items.push({ [flat[1]]: flat[2].trim() });
      }
    }

    result[key] = items;
  }

  return result;
}

// ─── Response Helpers ───────────────────────────────────────────────────────

function respond(statusCode: number, body: string, contentType: string, location?: string) {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (location) headers["Location"] = location;
  return { statusCode, body, headers };
}

// ─── Main Handler ──────────────────────────────────────────────────────────

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const { clientId, clientSecret } = getConfig();

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return respond(204, "", "text/plain");
  }

  const rawPath = event.path;
  const path = rawPath
    .replace(/\/\.netlify\/functions\/yahoo-oauth/, "")
    .replace(/\/api\/yahoo/, "");
  const params = event.queryStringParameters || {};

  // ─── GET /api/yahoo/login — Redirect to Yahoo OAuth ─────────────────────
  if (path === "/login" || path === "/login/") {
    // Generate CSRF state token
    const state = Buffer.from(
      JSON.stringify({ t: Date.now(), r: Math.random().toString(36).slice(2) })
    ).toString("base64");

    const authUrl = `${AUTH_URL}?client_id=${clientId}&redirect_uri=${getConfig().redirectUri}&response_type=code&scope=fspt-w&state=${state}`;
    return respond(302, "", "text/plain", authUrl);
  }

  // ─── GET /api/yahoo/callback — OAuth code exchange ──────────────────────
  const code = params.code;
  const state = params.state;
  if (code) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getConfig().redirectUri,
      code,
      grant_type: "authorization_code",
    });

    try {
      const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenBody.toString(),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data: any = await res.json();

      if (data.access_token) {
        await storeTokens({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + data.expires_in * 1000,
        });
        return respond(302, "Yahoo connected! Redirecting...", "text/plain", "/");
      } else {
        return respond(500, JSON.stringify({ error: "Token exchange failed", data }), "application/json");
      }
    } catch (err: any) {
      clearTimeout(timeout);
      return respond(500, `OAuth error: ${err.message}`, "text/plain");
    }
  }

  // Get access token for authenticated endpoints
  const accessToken = await getAccessToken();

  // ─── GET /api/yahoo/status — Auth status ───────────────────────────────
  if (path === "/status" || path === "/status/") {
    const stored = await getStoredTokens();
    return respond(
      200,
      JSON.stringify({
        authenticated: !!accessToken,
        expiresAt: stored?.expiresAt || 0,
        expiresIn: stored ? Math.max(0, Math.floor((stored.expiresAt - Date.now()) / 1000)) : 0,
        rateLimitRemaining: rateLimitState.remaining,
        rateLimitResetAt: rateLimitState.resetAt,
      }),
      "application/json"
    );
  }

  // ─── GET /api/yahoo/health — Detailed health ───────────────────────────
  if (path === "/health" || path === "/health/") {
    const stored = await getStoredTokens();
    const now = Date.now();
    return respond(
      200,
      JSON.stringify({
        authenticated: !!accessToken,
        tokenExpiresIn: stored ? Math.max(0, Math.floor((stored.expiresAt - now) / 1000)) : 0,
        refreshTokenPresent: !!(stored?.refreshToken),
        scope: "fspt-w",
        lastRefresh: stored?.expiresAt ? new Date(stored.expiresAt - 3600000).toISOString() : null,
        blobStoreAvailable: !!getConfig().blobStore,
        clientSecretConfigured: !!clientSecret,
        rateLimitRemaining: rateLimitState.remaining,
        rateLimitResetAt: rateLimitState.resetAt,
      }),
      "application/json"
    );
  }

  // ─── All endpoints below require authentication ────────────────────────
  if (!accessToken) {
    return respond(401, JSON.stringify({ error: "Not authenticated", loginUrl: "/api/yahoo/login" }), "application/json");
  }

  // ─── Yahoo API Call Helper ────────────────────────────────────────────
  async function callYahoo(endpoint: string, format: "xml" | "json" = "xml") {
    const url = `${API_BASE}${endpoint}${format === "json" ? ";format=json" : ""}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Track rate limits
    updateRateLimit(res.headers);

    // Handle rate limiting (999 = Yahoo's custom rate limit code)
    if (res.status === 999) {
      throw new RateLimitError("Yahoo rate limit exceeded (status 999)");
    }

    if (!res.ok) {
      throw new Error(`Yahoo API error: ${res.status}`);
    }

    const text = await res.text();

    if (format === "json") {
      try {
        return JSON.parse(text);
      } catch {
        // Yahoo sometimes returns XML even when format=json is requested
        return xmlToJson(text);
      }
    }

    return text;
  }

  class RateLimitError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "RateLimitError";
    }
  }

  // ─── Endpoint Router ───────────────────────────────────────────────────

  // Helper: route a Yahoo API call with optional JSON format
  async function routeYahoo(endpoint: string, format: "xml" | "json" = "xml") {
    try {
      const data = await callYahoo(endpoint, format);
      const contentType = format === "json" ? "application/json" : "application/xml";
      return respond(200, typeof data === "string" ? data : JSON.stringify(data), contentType);
    } catch (err: any) {
      if (err instanceof RateLimitError) {
        return respond(429, JSON.stringify({
          error: "Rate limited",
          message: err.message,
          retryAfter: Math.max(0, Math.ceil((rateLimitState.resetAt - Date.now()) / 1000)),
        }), "application/json");
      }
      return respond(500, JSON.stringify({ error: err.message }), "application/json");
    }
  }

  // GET /api/yahoo/leagues
  if (path === "/leagues" || path === "/leagues/") {
    return routeYahoo("/users;use_login=1/games;game_keys=nfl/leagues", "json");
  }

  // GET /api/yahoo/standings
  if (path === "/standings" || path === "/standings/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, JSON.stringify({ error: "Missing league_key" }), "application/json");
    return routeYahoo(`/league/${leagueKey}/standings`, "json");
  }

  // GET /api/yahoo/teams
  if (path === "/teams" || path === "/teams/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, JSON.stringify({ error: "Missing league_key" }), "application/json");
    return routeYahoo(`/league/${leagueKey}/teams`, "json");
  }

  // GET /api/yahoo/rosters
  if (path === "/rosters" || path === "/rosters/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, JSON.stringify({ error: "Missing league_key" }), "application/json");
    return routeYahoo(`/league/${leagueKey}/teams;out=roster`, "json");
  }

  // GET /api/yahoo/scoreboard
  if (path === "/scoreboard" || path === "/scoreboard/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, JSON.stringify({ error: "Missing league_key" }), "application/json");
    const week = params.week || "";
    const endpoint = week
      ? `/league/${leagueKey}/scoreboard;week=${week}`
      : `/league/${leagueKey}/scoreboard`;
    return routeYahoo(endpoint, "json");
  }

  // GET /api/yahoo/transactions
  if (path === "/transactions" || path === "/transactions/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, JSON.stringify({ error: "Missing league_key" }), "application/json");
    const count = params.count || "25";
    return routeYahoo(`/league/${leagueKey}/transactions;count=${count}`, "json");
  }

  // GET /api/yahoo/players
  if (path === "/players" || path === "/players/") {
    const leagueKey = params.league_key;
    const playerKeys = params.player_keys;
    if (!leagueKey || !playerKeys) {
      return respond(400, JSON.stringify({ error: "Missing league_key and/or player_keys" }), "application/json");
    }
    return routeYahoo(`/league/${leagueKey}/players;player_keys=${playerKeys}`, "json");
  }

  // GET /api/yahoo/players/pick — waiver wire
  if (path === "/players/pick" || path === "/players/pick/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, JSON.stringify({ error: "Missing league_key" }), "application/json");
    const count = params.count || "50";
    const sort = params.sort || "AR";
    return routeYahoo(`/league/${leagueKey}/players;count=${count};sort=${sort}`, "json");
  }

  // GET /api/yahoo/settings
  if (path === "/settings" || path === "/settings/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, JSON.stringify({ error: "Missing league_key" }), "application/json");
    return routeYahoo(`/league/${leagueKey}/settings`, "json");
  }

  // GET /api/yahoo/draft
  if (path === "/draft" || path === "/draft/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, JSON.stringify({ error: "Missing league_key" }), "application/json");
    return routeYahoo(`/league/${leagueKey}/draftresults`, "json");
  }

  // ─── Default — show available endpoints ────────────────────────────────
  return respond(
    200,
    JSON.stringify({
      authenticated: true,
      endpoints: {
        login: "/api/yahoo/login",
        callback: "/api/yahoo/callback",
        status: "/api/yahoo/status",
        health: "/api/yahoo/health",
        leagues: "/api/yahoo/leagues",
        standings: "/api/yahoo/standings?league_key=...",
        teams: "/api/yahoo/teams?league_key=...",
        rosters: "/api/yahoo/rosters?league_key=...",
        scoreboard: "/api/yahoo/scoreboard?league_key=...&week=...",
        transactions: "/api/yahoo/transactions?league_key=...&count=...",
        players: "/api/yahoo/players?league_key=...&player_keys=...",
        "players/pick": "/api/yahoo/players/pick?league_key=...&count=...&sort=...",
        settings: "/api/yahoo/settings?league_key=...",
        draft: "/api/yahoo/draft?league_key=...",
      },
    }),
    "application/json"
  );
};
