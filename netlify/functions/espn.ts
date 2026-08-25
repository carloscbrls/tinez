/**
 * ESPN Fantasy Football API — Netlify Function
 *
 * Fetches league rosters and NFL news/blogs from ESPN's public endpoints.
 * No OAuth, no app approval, no API key required.
 *
 * Endpoints:
 *   GET /api/espn/rosters?leagueId=XXXXX&season=2026&teamId=1   — League rosters (optionally one team)
 *   GET /api/espn/news?limit=20                                  — NFL news/blog headlines
 *   GET /api/espn/health                                         — Config + upstream check
 *
 * League defaults come from env vars (ESPN_LEAGUE_ID, ESPN_SEASON) with query-param overrides.
 */

import type { Handler } from "@netlify/functions";

const ESPN_FANTASY_BASE =
  "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl";
const ESPN_NEWS_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/news";

function getConfig() {
  return {
    leagueId: process.env.ESPN_LEAGUE_ID || "",
    season: process.env.ESPN_SEASON || String(new Date().getFullYear()),
  };
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
    body: JSON.stringify(body),
  };
}

// ─── Rosters ─────────────────────────────────────────────────────────────────

async function fetchRosters(leagueId: string, season: string, teamId?: string) {
  const views = [
    "mTeam",
    "mRoster",
    "mSettings",
    "mMatchupScore",
    "mStandings",
    "mPendingTransactions",
  ];
  const url = `${ESPN_FANTASY_BASE}/seasons/${season}/segments/0/leagues/${leagueId}?${views
    .map((v) => `view=${v}`)
    .join("&")}`;

  const res = await fetch(url, { headers: { "User-Agent": "TINEZ/1.0" } });
  if (!res.ok) {
    return { ok: false, status: res.status, data: null };
  }
  const data = await res.json();

  const teams = (data.teams || []).map((t: any) => ({
    teamId: t.id,
    name: t.name,
    abbrev: t.abbrev,
    record: t.record?.overall
      ? `${t.record.overall.wins}-${t.record.overall.losses}`
      : "0-0",
    division: t.divisionId ?? null,
    roster: (t.roster?.entries || []).map((e: any) => {
      const p = e.playerPoolEntry?.player || e.player;
      const onTeam = e.playerPoolEntry?.onTeamId ?? e.onTeamId ?? null;
      return {
        id: p?.id ?? null,
        name: p?.fullName ?? "Unknown",
        position: p?.defaultPosition?.abbrev ?? "FA",
        proTeam: p?.proTeam?.abbrev ?? null,
        onTeamId: onTeam,
        slot: e.lineupSlotId ?? null,
        percentOwned: p?.ownership?.percentOwned ?? null,
        injuryStatus: p?.injuryStatus ?? null,
      };
    }),
  }));

  const meta = {
    leagueId,
    season,
    totalTeams: teams.length,
    scoringPeriodId: data.scoringPeriodId ?? null,
    currentMatchupPeriod: data.currentMatchupPeriod ?? null,
  };

  const filtered = teamId ? teams.filter((t: any) => String(t.teamId) === String(teamId)) : teams;
  return { ok: true, status: 200, data: { meta, teams: filtered } };
}

// ─── News / Blog ─────────────────────────────────────────────────────────────

async function fetchNews(limit = 20) {
  const res = await fetch(`${ESPN_NEWS_BASE}?limit=${limit}`, {
    headers: { "User-Agent": "TINEZ/1.0" },
  });
  if (!res.ok) {
    return { ok: false, status: res.status, data: null };
  }
  const data = await res.json();
  const items = (data.articles || []).map((a: any) => ({
    id: a.id ?? null,
    title: a.headline ?? "",
    description: a.description ?? "",
    link: a.links?.web?.href ?? "",
    source: "ESPN",
    published: a.published ?? "",
    images: (a.images || []).map((i: any) => ({ url: i.url, alt: i.alt ?? "" })),
    byline: a.byline ?? "",
    categories: (a.categories || []).map((c: any) => c.description).filter(Boolean),
  }));
  return { ok: true, status: 200, data: { items, total: data.articles?.length ?? 0 } };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return json(204, "");
  }

  const rawPath = event.path
    .replace(/\/\.netlify\/functions\/espn/, "")
    .replace(/\/api\/espn/, "")
    .replace(/\/+$/, "");

  const { leagueId: envLeague, season: envSeason } = getConfig();
  const params = event.queryStringParameters || {};

  if (rawPath === "" || rawPath === "/" || rawPath === "/health") {
    return json(200, {
      ok: true,
      service: "espn",
      endpoints: ["/api/espn/rosters", "/api/espn/news"],
      leagueIdConfigured: !!envLeague,
      season: envSeason,
      note: envLeague
        ? "League ID configured via ESPN_LEAGUE_ID env var."
        : "No ESPN_LEAGUE_ID set. Pass ?leagueId=XXXX to /api/espn/rosters.",
    });
  }

  if (rawPath === "/news") {
    const limit = Math.min(parseInt(params.limit || "20", 10) || 20, 50);
    const result = await fetchNews(limit);
    if (!result.ok) return json(result.status, { error: `ESPN news fetch failed (${result.status})` });
    return json(200, result.data);
  }

  if (rawPath === "/rosters") {
    const leagueId = params.leagueId || envLeague;
    const season = params.season || envSeason;
    const teamId = params.team;
    if (!leagueId) {
      return json(400, {
        error: "Missing leagueId. Set ESPN_LEAGUE_ID env var or pass ?leagueId=XXXX",
      });
    }
    const result = await fetchRosters(leagueId, season, teamId);
    if (!result.ok) return json(result.status, { error: `ESPN rosters fetch failed (${result.status})` });
    return json(200, result.data);
  }

  return json(404, { error: `Unknown ESPN endpoint: ${rawPath}` });
};
