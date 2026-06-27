import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const CLIENT_ID = "dj0yJmk9WHBRT3hndWh0NDAxJmQ9WVdrOWVEZExWbkZuY0hZbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PWVk";
const CLIENT_SECRET = "6558133c494c1826bba17ece74da9df4ec289696";
const REDIRECT_URI = "https://tinez.netlify.app/api/yahoo/callback";
const AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";
const API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

// Netlify Blob store for persistent token storage
const STORE_KEY = "yahoo-tokens";

async function getStoredTokens() {
  try {
    const store = process.env.NETLIFY_BLOB_STORE;
    if (!store) return null;
    const res = await fetch(`${store}/${STORE_KEY}`, {
      headers: { "Authorization": `Bearer ${process.env.NETLIFY_ACCESS_TOKEN || ""}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function storeTokens(data: any) {
  try {
    const store = process.env.NETLIFY_BLOB_STORE;
    if (!store) return;
    await fetch(`${store}/${STORE_KEY}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NETLIFY_ACCESS_TOKEN || ""}`
      },
      body: JSON.stringify(data)
    });
  } catch { /* blob store not available */ }
}

async function getAccessToken(): Promise<string | null> {
  const stored = await getStoredTokens();
  if (!stored || !stored.accessToken) return null;
  
  // Check if token is expired and refresh if needed
  if (Date.now() >= stored.expiresAt && stored.refreshToken) {
    try {
      const tokenBody = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
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
    } catch { return null; }
  }
  
  return stored.accessToken;
}

function respond(statusCode: number, body: string, contentType: string, location?: string) {
  const headers: Record<string, string> = { "Content-Type": contentType };
  if (location) headers["Location"] = location;
  return { statusCode, body, headers };
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const rawPath = event.path;
  const path = rawPath.replace(/\/\.netlify\/functions\/yahoo-oauth/, "").replace(/\/api\/yahoo/, "");
  const params = event.queryStringParameters || {};
  const httpMethod = event.httpMethod;

  // GET /api/yahoo/login — redirect to Yahoo OAuth
  if (path === "/login" || path === "/login/") {
    const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=fspt-w`;
    return respond(302, "", "text/plain", authUrl);
  }

  // Handle OAuth callback (code parameter)
  const code = params.code;
  if (code) {
    // Warm up: make the token exchange request immediately
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const tokenBody = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
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
        // Store tokens persistently
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

  // GET /api/yahoo/status — check auth status
  if (path === "/status" || path === "/status/") {
    const stored = await getStoredTokens();
    return respond(200, JSON.stringify({
      authenticated: !!accessToken,
      expiresAt: stored?.expiresAt || 0,
      expiresIn: stored ? Math.max(0, Math.floor((stored.expiresAt - Date.now()) / 1000)) : 0,
    }), "application/json");
  }

  // All endpoints below require authentication
  if (!accessToken) {
    return respond(401, JSON.stringify({ error: "Not authenticated", loginUrl: "/api/yahoo/login" }), "application/json");
  }

  // Helper to call Yahoo Fantasy API
  async function callYahoo(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.text();
  }

  // GET /api/yahoo/leagues — fetch user's leagues
  if (path === "/leagues" || path === "/leagues/") {
    try {
      const text = await callYahoo("/users;use_login=1/games;game_keys=nfl/leagues");
      return respond(200, text, "application/xml");
    } catch (err: any) {
      return respond(500, `API error: ${err.message}`, "text/plain");
    }
  }

  // GET /api/yahoo/standings — fetch league standings
  if (path === "/standings" || path === "/standings/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, "Missing league_key query param", "text/plain");
    try {
      const text = await callYahoo(`/league/${leagueKey}/standings`);
      return respond(200, text, "application/xml");
    } catch (err: any) {
      return respond(500, `API error: ${err.message}`, "text/plain");
    }
  }

  // GET /api/yahoo/teams — fetch all teams in a league
  if (path === "/teams" || path === "/teams/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, "Missing league_key query param", "text/plain");
    try {
      const text = await callYahoo(`/league/${leagueKey}/teams`);
      return respond(200, text, "application/xml");
    } catch (err: any) {
      return respond(500, `API error: ${err.message}`, "text/plain");
    }
  }

  // GET /api/yahoo/rosters — fetch team rosters
  if (path === "/rosters" || path === "/rosters/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, "Missing league_key query param", "text/plain");
    try {
      const text = await callYahoo(`/league/${leagueKey}/teams;out=roster`);
      return respond(200, text, "application/xml");
    } catch (err: any) {
      return respond(500, `API error: ${err.message}`, "text/plain");
    }
  }

  // GET /api/yahoo/scoreboard — fetch weekly matchups/scores
  if (path === "/scoreboard" || path === "/scoreboard/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, "Missing league_key query param", "text/plain");
    const week = params.week || "";
    try {
      const endpoint = week 
        ? `/league/${leagueKey}/scoreboard;week=${week}`
        : `/league/${leagueKey}/scoreboard`;
      const text = await callYahoo(endpoint);
      return respond(200, text, "application/xml");
    } catch (err: any) {
      return respond(500, `API error: ${err.message}`, "text/plain");
    }
  }

  // GET /api/yahoo/transactions — fetch recent transactions
  if (path === "/transactions" || path === "/transactions/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, "Missing league_key query param", "text/plain");
    const count = params.count || "25";
    try {
      const text = await callYahoo(`/league/${leagueKey}/transactions;count=${count}`);
      return respond(200, text, "application/xml");
    } catch (err: any) {
      return respond(500, `API error: ${err.message}`, "text/plain");
    }
  }

  // GET /api/yahoo/players — fetch player details
  if (path === "/players" || path === "/players/") {
    const leagueKey = params.league_key;
    const playerKeys = params.player_keys;
    if (!leagueKey || !playerKeys) return respond(400, "Missing league_key and/or player_keys query params", "text/plain");
    try {
      const text = await callYahoo(`/league/${leagueKey}/players;player_keys=${playerKeys}`);
      return respond(200, text, "application/xml");
    } catch (err: any) {
      return respond(500, `API error: ${err.message}`, "text/plain");
    }
  }

  // GET /api/yahoo/players/pick — fetch top available players (waiver wire)
  if (path === "/players/pick" || path === "/players/pick/") {
    const leagueKey = params.league_key;
    const count = params.count || "50";
    const sort = params.sort || "AR";
    if (!leagueKey) return respond(400, "Missing league_key query param", "text/plain");
    try {
      const text = await callYahoo(`/league/${leagueKey}/players;count=${count};sort=${sort}`);
      return respond(200, text, "application/xml");
    } catch (err: any) {
      return respond(500, `API error: ${err.message}`, "text/plain");
    }
  }

  // GET /api/yahoo/settings — fetch league settings
  if (path === "/settings" || path === "/settings/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, "Missing league_key query param", "text/plain");
    try {
      const text = await callYahoo(`/league/${leagueKey}/settings`);
      return respond(200, text, "application/xml");
    } catch (err: any) {
      return respond(500, `API error: ${err.message}`, "text/plain");
    }
  }

  // GET /api/yahoo/draft — fetch draft results
  if (path === "/draft" || path === "/draft/") {
    const leagueKey = params.league_key;
    if (!leagueKey) return respond(400, "Missing league_key query param", "text/plain");
    try {
      const text = await callYahoo(`/league/${leagueKey}/draftresults`);
      return respond(200, text, "application/xml");
    } catch (err: any) {
      return respond(500, `API error: ${err.message}`, "text/plain");
    }
  }

  // Default — show available endpoints
  return respond(200, JSON.stringify({
    authenticated: true,
    endpoints: {
      login: "/api/yahoo/login",
      callback: "/api/yahoo/callback",
      status: "/api/yahoo/status",
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
  }), "application/json");
};
