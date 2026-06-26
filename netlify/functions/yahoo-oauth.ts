import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const CLIENT_ID = "dj0yJmk9WHBRT3hndWh0NDAxJmQ9WVdrOWVEZExWbkZuY0hZbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PWVk";
const CLIENT_SECRET = "***";
const REDIRECT_URI = "https://tinez.netlify.app/api/yahoo/callback";
const AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";
const API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpiresAt: number = 0;
let lastCallback: any = null;

function respond(statusCode: number, body: string, contentType: string, location?: string) {
  const headers: Record<string, string> = { "Content-Type": contentType };
  if (location) headers["Location"] = location;
  return { statusCode, body, headers };
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const rawPath = event.path;
  const path = rawPath.replace(/\/\.netlify\/functions\/yahoo-oauth/, "").replace(/\/api\/yahoo/, "");
  const params = event.queryStringParameters || {};
  const rawQuery = event.rawQuery || "";

  // GET /api/yahoo/debug — show last callback data
  if (path === "/debug" || path === "/debug/") {
    return respond(200, JSON.stringify({
      lastCallback,
      currentRequest: { rawPath, path, rawQuery, params },
    }, null, 2), "application/json");
  }

  // GET /api/yahoo/login — redirect to Yahoo OAuth
  if (path === "/login" || path === "/login/") {
    const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=fspt-w`;
    return respond(302, "", "text/plain", authUrl);
  }

  // GET /api/yahoo/callback — handle OAuth callback
  if (path === "/callback" || path === "/callback/") {
    // Store everything Yahoo sent us
    lastCallback = { rawPath, path, rawQuery, params, timestamp: new Date().toISOString() };

    const code = params.code;
    if (!code) {
      return respond(400, JSON.stringify({
        error: "Missing authorization code",
        ...lastCallback,
      }), "application/json");
    }

    const body = new URLSearchParams({
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
        body: body.toString(),
      });
      const data: any = await res.json();
      accessToken = data.access_token;
      refreshToken = data.refresh_token;
      tokenExpiresAt = Date.now() + data.expires_in * 1000;

      return respond(302, "Yahoo connected! Redirecting...", "text/plain", "/");
    } catch (err: any) {
      return respond(500, `OAuth error: ${err.message}`, "text/plain");
    }
  }

  // GET /api/yahoo/leagues — fetch user's leagues
  if (path === "/leagues" || path === "/leagues/") {
    if (!accessToken) {
      return respond(401, JSON.stringify({ error: "Not authenticated", loginUrl: "/api/yahoo/login" }), "application/json");
    }

    try {
      const res = await fetch(`${API_BASE}/users;use_login=1/games;game_keys=nfl/leagues`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const text = await res.text();
      return respond(200, text, "application/xml");
    } catch (err: any) {
      return respond(500, `API error: ${err.message}`, "text/plain");
    }
  }

  // GET /api/yahoo/standings — fetch league standings
  if (path === "/standings" || path === "/standings/") {
    const leagueKey = params.league_key;
    if (!leagueKey) {
      return respond(400, "Missing league_key query param", "text/plain");
    }
    if (!accessToken) {
      return respond(401, JSON.stringify({ error: "Not authenticated", loginUrl: "/api/yahoo/login" }), "application/json");
    }

    try {
      const res = await fetch(`${API_BASE}/league/${leagueKey}/standings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const text = await res.text();
      return respond(200, text, "application/xml");
    } catch (err: any) {
      return respond(500, `API error: ${err.message}`, "text/plain");
    }
  }

  // GET /api/yahoo/status — check auth status
  if (path === "/status" || path === "/status/") {
    return respond(200, JSON.stringify({
      authenticated: !!accessToken,
      expiresAt: tokenExpiresAt,
      expiresIn: tokenExpiresAt ? Math.max(0, Math.floor((tokenExpiresAt - Date.now()) / 1000)) : 0,
    }), "application/json");
  }

  // Default — show available endpoints
  return respond(200, JSON.stringify({
    endpoints: {
      login: "/api/yahoo/login",
      callback: "/api/yahoo/callback",
      leagues: "/api/yahoo/leagues",
      standings: "/api/yahoo/standings?league_key=...",
      status: "/api/yahoo/status",
      debug: "/api/yahoo/debug",
    },
  }), "application/json");
};
