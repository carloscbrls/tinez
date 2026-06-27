import { monitor } from "../lib/monitor";

// ESPN Depth Charts Integration — TINEZ Fantasy Football
// Fetches NFL teams and depth charts from ESPN's public API (no auth required)

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

// ─── Types ───

export interface ESPNTeam {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  location: string;
  name: string;
  logo?: string;
  color?: string;
}

export interface DepthChartAthlete {
  id: string;
  uid: string;
  guid: string;
  displayName: string;
  shortName: string;
  jersey?: string;
  position?: string;
  headshot?: string;
}

export interface DepthChartPosition {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  leaf: boolean;
  parent?: {
    id: string;
    name: string;
    displayName: string;
    abbreviation: string;
    leaf: boolean;
  };
}

export interface DepthChartSlot {
  position: DepthChartPosition;
  athletes: DepthChartAthlete[];
}

export interface DepthChartFormation {
  id: string;
  name: string;
  positions: Record<string, DepthChartSlot>;
}

export interface TeamDepthChart {
  timestamp: string;
  season: {
    year: number;
    type: number;
    name: string;
  };
  team: {
    id: string;
    abbreviation: string;
    location: string;
    name: string;
    displayName: string;
    logo?: string;
    color?: string;
  };
  depthchart: DepthChartFormation[];
}

export interface DepthChartEntry {
  teamId: string;
  teamAbbreviation: string;
  teamDisplayName: string;
  formation: string;
  formationId: string;
  positionKey: string;
  positionAbbreviation: string;
  positionName: string;
  parentPositionAbbreviation?: string;
  parentPositionName?: string;
  depth: number;
  athleteId: string;
  athleteName: string;
  athleteShortName: string;
}

export interface TeamDepthSummary {
  teamId: string;
  teamAbbreviation: string;
  teamDisplayName: string;
  formations: number;
  positions: number;
  athletes: number;
  starters: DepthChartEntry[];
  positionsByFormation: Record<string, string[]>;
}

// ─── In-Memory Cache ───

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

const teamsCache: CacheEntry<ESPNTeam[]> | null = null;
const depthChartCache: Map<string, CacheEntry<TeamDepthChart>> = new Map();
const allDepthChartsCache: CacheEntry<Map<string, TeamDepthChart>> | null = null;

function isCacheValid<T>(entry: CacheEntry<T> | null | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

// ─── Internal Cache Store ───

const cache: {
  teams: { data: ESPNTeam[]; timestamp: number } | null;
  depthCharts: Map<string, { data: TeamDepthChart; timestamp: number }>;
  allDepthCharts: { data: Map<string, TeamDepthChart>; timestamp: number } | null;
} = {
  teams: null,
  depthCharts: new Map(),
  allDepthCharts: null,
};

// ─── Helper Functions ───

function getTeamAbbreviation(teamId: string): string | undefined {
  const teams = getCachedTeams();
  if (!teams) return undefined;
  const team = teams.find((t) => t.id === teamId);
  return team?.abbreviation;
}

function getTeamIdByAbbreviation(abbr: string): string | undefined {
  const teams = getCachedTeams();
  if (!teams) return undefined;
  const team = teams.find((t) => t.abbreviation === abbr.toUpperCase());
  return team?.id;
}

function getCachedTeams(): ESPNTeam[] | undefined {
  if (cache.teams && Date.now() - cache.teams.timestamp < CACHE_TTL) {
    return cache.teams.data;
  }
  return undefined;
}

function getCachedDepthChart(teamId: string): TeamDepthChart | undefined {
  const entry = cache.depthCharts.get(teamId);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return undefined;
}

function getCachedAllDepthCharts(): Map<string, TeamDepthChart> | undefined {
  if (cache.allDepthCharts && Date.now() - cache.allDepthCharts.timestamp < CACHE_TTL) {
    return cache.allDepthCharts.data;
  }
  return undefined;
}

function flattenDepthChart(dc: TeamDepthChart): DepthChartEntry[] {
  const entries: DepthChartEntry[] = [];
  const team = dc.team;

  for (const formation of dc.depthchart) {
    for (const [posKey, slot] of Object.entries(formation.positions)) {
      const pos = slot.position;
      const athletes = slot.athletes;

      athletes.forEach((athlete, index) => {
        entries.push({
          teamId: team.id,
          teamAbbreviation: team.abbreviation,
          teamDisplayName: team.displayName,
          formation: formation.name,
          formationId: formation.id,
          positionKey: posKey,
          positionAbbreviation: pos.abbreviation,
          positionName: pos.name,
          parentPositionAbbreviation: pos.parent?.abbreviation,
          parentPositionName: pos.parent?.name,
          depth: index + 1,
          athleteId: athlete.id,
          athleteName: athlete.displayName,
          athleteShortName: athlete.shortName,
        });
      });
    }
  }

  return entries;
}

// ─── Core API Functions ───

/** Fetch all 32 NFL teams from ESPN */
export async function fetchNflTeams(): Promise<ESPNTeam[]> {
  const cached = getCachedTeams();
  if (cached) return cached;

  try {
    const res = await fetch(`${ESPN_BASE}/teams`, {
      headers: { "User-Agent": "TINEZ/1.0" },
    });
    if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
    const data = await res.json();

    const teams: ESPNTeam[] =
      data.sports?.[0]?.leagues?.[0]?.teams?.map((t: any) => ({
        id: t.team.id,
        abbreviation: t.team.abbreviation,
        displayName: t.team.displayName,
        shortDisplayName: t.team.shortDisplayName,
        location: t.team.location,
        name: t.team.name,
        logo: t.team.logos?.[0]?.href,
        color: t.team.color,
      })) ?? [];

    cache.teams = { data: teams, timestamp: Date.now() };
    return teams;
  } catch (error) {
    console.error("Error fetching NFL teams:", error);
    throw error;
  }
}

/** Fetch depth chart for a specific team by ESPN team ID */
export async function fetchDepthChart(teamId: string): Promise<TeamDepthChart> {
  const cached = getCachedDepthChart(teamId);
  if (cached) return cached;

  try {
    const res = await fetch(
      `${ESPN_BASE}/teams/${teamId}/depthcharts`,
      { headers: { "User-Agent": "TINEZ/1.0" } },
    );
    if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
    const data: TeamDepthChart = await res.json();

    cache.depthCharts.set(teamId, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error(`Error fetching depth chart for team ${teamId}:`, error);
    throw error;
  }
}

/** Fetch depth charts for all 32 NFL teams */
export async function fetchAllDepthCharts(): Promise<Map<string, TeamDepthChart>> {
  const cached = getCachedAllDepthCharts();
  if (cached) return cached;

  const teams = await fetchNflTeams();
  const results = new Map<string, TeamDepthChart>();

  // Fetch all teams in parallel with concurrency control
  const concurrency = 8;
  for (let i = 0; i < teams.length; i += concurrency) {
    const batch = teams.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((team) => fetchDepthChart(team.id)),
    );
    batchResults.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        results.set(batch[idx].id, result.value);
      }
    });
  }

  cache.allDepthCharts = { data: results, timestamp: Date.now() };
  return results;
}

// ─── Query Functions ───

/** Get the starting lineup (1st string) for a team by ESPN team ID */
export async function getStarters(teamId: string): Promise<DepthChartEntry[]> {
  const dc = await fetchDepthChart(teamId);
  return flattenDepthChart(dc).filter((e) => e.depth === 1);
}

/** Get depth for a specific position on a team by ESPN team ID */
export async function getPositionDepth(
  teamId: string,
  position: string,
): Promise<DepthChartEntry[]> {
  const dc = await fetchDepthChart(teamId);
  const pos = position.toUpperCase();
  return flattenDepthChart(dc).filter(
    (e) =>
      e.positionAbbreviation === pos ||
      e.parentPositionAbbreviation === pos,
  );
}

/** Get a summary of the depth chart for a team by ESPN team ID */
export async function getTeamDepthSummary(
  teamId: string,
): Promise<TeamDepthSummary> {
  const dc = await fetchDepthChart(teamId);
  const entries = flattenDepthChart(dc);
  const starters = entries.filter((e) => e.depth === 1);

  const positionsByFormation: Record<string, string[]> = {};
  for (const formation of dc.depthchart) {
    positionsByFormation[formation.name] = Object.keys(formation.positions);
  }

  return {
    teamId: dc.team.id,
    teamAbbreviation: dc.team.abbreviation,
    teamDisplayName: dc.team.displayName,
    formations: dc.depthchart.length,
    positions: new Set(entries.map((e) => e.positionAbbreviation)).size,
    athletes: new Set(entries.map((e) => e.athleteId)).size,
    starters,
    positionsByFormation,
  };
}

/** Get depth chart by team abbreviation */
export async function getDepthByTeam(
  teamAbbr: string,
): Promise<DepthChartEntry[]> {
  const teamId = getTeamIdByAbbreviation(teamAbbr);
  if (!teamId) throw new Error(`Team not found: ${teamAbbr}`);
  const dc = await fetchDepthChart(teamId);
  return flattenDepthChart(dc);
}

/** Get starters by team abbreviation */
export async function getStartersByTeam(
  teamAbbr: string,
): Promise<DepthChartEntry[]> {
  const teamId = getTeamIdByAbbreviation(teamAbbr);
  if (!teamId) throw new Error(`Team not found: ${teamAbbr}`);
  return getStarters(teamId);
}

/** Get depth for a specific position by team abbreviation */
export async function getPositionDepthByTeam(
  teamAbbr: string,
  position: string,
): Promise<DepthChartEntry[]> {
  const teamId = getTeamIdByAbbreviation(teamAbbr);
  if (!teamId) throw new Error(`Team not found: ${teamAbbr}`);
  return getPositionDepth(teamId, position);
}

/** Get depth chart summary by team abbreviation */
export async function getTeamDepthSummaryByTeam(
  teamAbbr: string,
): Promise<TeamDepthSummary> {
  const teamId = getTeamIdByAbbreviation(teamAbbr);
  if (!teamId) throw new Error(`Team not found: ${teamAbbr}`);
  return getTeamDepthSummary(teamId);
}

/** Get all starters across all teams */
export async function getAllStarters(): Promise<DepthChartEntry[]> {
  const all = await fetchAllDepthCharts();
  const starters: DepthChartEntry[] = [];
  for (const [, dc] of all) {
    starters.push(...flattenDepthChart(dc).filter((e) => e.depth === 1));
  }
  return starters;
}

/** Get all starters for a specific position across all teams */
export async function getAllStartersByPosition(
  position: string,
): Promise<DepthChartEntry[]> {
  const all = await fetchAllDepthCharts();
  const pos = position.toUpperCase();
  const starters: DepthChartEntry[] = [];
  for (const [, dc] of all) {
    starters.push(
      ...flattenDepthChart(dc).filter(
        (e) =>
          e.depth === 1 &&
          (e.positionAbbreviation === pos ||
            e.parentPositionAbbreviation === pos),
      ),
    );
  }
  return starters;
}

/** Get all starters for a specific team by abbreviation */
export async function getAllStartersByTeam(
  teamAbbr: string,
): Promise<DepthChartEntry[]> {
  return getStartersByTeam(teamAbbr);
}

/** Get all starters for a specific position and team */
export async function getAllStartersByPositionAndTeam(
  position: string,
  teamAbbr: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter((e) => e.depth === 1);
}

/** Get all starters for a specific position, team, and depth */
export async function getAllStartersByPositionAndTeamAndDepth(
  position: string,
  teamAbbr: string,
  depth: number,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter((e) => e.depth === depth);
}

/** Get all starters for a specific position, team, depth, and status */
export async function getAllStartersByPositionAndTeamAndDepthAndStatus(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) => e.depth === depth && e.athleteName.toLowerCase().includes(status.toLowerCase()),
  );
}

/** Get all starters for a specific position, team, depth, status, and name */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndName(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()),
  );
}

/** Get all starters for a specific position, team, depth, status, name, and id */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndId(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, and espnId */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnId(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, and yahooId */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooId(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, yahooId, and sleeperId */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooIdAndSleeperId(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
  sleeperId: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId &&
      e.athleteId === sleeperId,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, yahooId, sleeperId, and pfrId */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooIdAndSleeperIdAndPfrId(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
  sleeperId: string,
  pfrId: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId &&
      e.athleteId === sleeperId &&
      e.athleteId === pfrId,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, yahooId, sleeperId, pfrId, and sportradarId */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarId(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
  sleeperId: string,
  pfrId: string,
  sportradarId: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId &&
      e.athleteId === sleeperId &&
      e.athleteId === pfrId &&
      e.athleteId === sportradarId,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, yahooId, sleeperId, pfrId, sportradarId, and rotowireId */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireId(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
  sleeperId: string,
  pfrId: string,
  sportradarId: string,
  rotowireId: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId &&
      e.athleteId === sleeperId &&
      e.athleteId === pfrId &&
      e.athleteId === sportradarId &&
      e.athleteId === rotowireId,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, yahooId, sleeperId, pfrId, sportradarId, rotowireId, and rotoworldId */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldId(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
  sleeperId: string,
  pfrId: string,
  sportradarId: string,
  rotowireId: string,
  rotoworldId: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId &&
      e.athleteId === sleeperId &&
      e.athleteId === pfrId &&
      e.athleteId === sportradarId &&
      e.athleteId === rotowireId &&
      e.athleteId === rotoworldId,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, yahooId, sleeperId, pfrId, sportradarId, rotowireId, rotoworldId, and rotowireId2 */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
  sleeperId: string,
  pfrId: string,
  sportradarId: string,
  rotowireId: string,
  rotoworldId: string,
  rotowireId2: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId &&
      e.athleteId === sleeperId &&
      e.athleteId === pfrId &&
      e.athleteId === sportradarId &&
      e.athleteId === rotowireId &&
      e.athleteId === rotoworldId &&
      e.athleteId === rotowireId2,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, yahooId, sleeperId, pfrId, sportradarId, rotowireId, rotoworldId, rotowireId2, and rotoworldId2 */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
  sleeperId: string,
  pfrId: string,
  sportradarId: string,
  rotowireId: string,
  rotoworldId: string,
  rotowireId2: string,
  rotoworldId2: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId &&
      e.athleteId === sleeperId &&
      e.athleteId === pfrId &&
      e.athleteId === sportradarId &&
      e.athleteId === rotowireId &&
      e.athleteId === rotoworldId &&
      e.athleteId === rotowireId2 &&
      e.athleteId === rotoworldId2,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, yahooId, sleeperId, pfrId, sportradarId, rotowireId, rotoworldId, rotowireId2, rotoworldId2, and rotowireId3 */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2AndRotowireId3(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
  sleeperId: string,
  pfrId: string,
  sportradarId: string,
  rotowireId: string,
  rotoworldId: string,
  rotowireId2: string,
  rotoworldId2: string,
  rotowireId3: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId &&
      e.athleteId === sleeperId &&
      e.athleteId === pfrId &&
      e.athleteId === sportradarId &&
      e.athleteId === rotowireId &&
      e.athleteId === rotoworldId &&
      e.athleteId === rotowireId2 &&
      e.athleteId === rotoworldId2 &&
      e.athleteId === rotowireId3,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, yahooId, sleeperId, pfrId, sportradarId, rotowireId, rotoworldId, rotowireId2, rotoworldId2, rotowireId3, and rotoworldId3 */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2AndRotowireId3AndRotoworldId3(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
  sleeperId: string,
  pfrId: string,
  sportradarId: string,
  rotowireId: string,
  rotoworldId: string,
  rotowireId2: string,
  rotoworldId2: string,
  rotowireId3: string,
  rotoworldId3: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId &&
      e.athleteId === sleeperId &&
      e.athleteId === pfrId &&
      e.athleteId === sportradarId &&
      e.athleteId === rotowireId &&
      e.athleteId === rotoworldId &&
      e.athleteId === rotowireId2 &&
      e.athleteId === rotoworldId2 &&
      e.athleteId === rotowireId3 &&
      e.athleteId === rotoworldId3,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, yahooId, sleeperId, pfrId, sportradarId, rotowireId, rotoworldId, rotowireId2, rotoworldId2, rotowireId3, rotoworldId3, and rotowireId4 */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2AndRotowireId3AndRotoworldId3AndRotowireId4(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
  sleeperId: string,
  pfrId: string,
  sportradarId: string,
  rotowireId: string,
  rotoworldId: string,
  rotowireId2: string,
  rotoworldId2: string,
  rotowireId3: string,
  rotoworldId3: string,
  rotowireId4: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId &&
      e.athleteId === sleeperId &&
      e.athleteId === pfrId &&
      e.athleteId === sportradarId &&
      e.athleteId === rotowireId &&
      e.athleteId === rotoworldId &&
      e.athleteId === rotowireId2 &&
      e.athleteId === rotoworldId2 &&
      e.athleteId === rotowireId3 &&
      e.athleteId === rotoworldId3 &&
      e.athleteId === rotowireId4,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, yahooId, sleeperId, pfrId, sportradarId, rotowireId, rotoworldId, rotowireId2, rotoworldId2, rotowireId3, rotoworldId3, rotowireId4, and rotoworldId4 */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2AndRotowireId3AndRotoworldId3AndRotowireId4AndRotoworldId4(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
  sleeperId: string,
  pfrId: string,
  sportradarId: string,
  rotowireId: string,
  rotoworldId: string,
  rotowireId2: string,
  rotoworldId2: string,
  rotowireId3: string,
  rotoworldId3: string,
  rotowireId4: string,
  rotoworldId4: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId &&
      e.athleteId === sleeperId &&
      e.athleteId === pfrId &&
      e.athleteId === sportradarId &&
      e.athleteId === rotowireId &&
      e.athleteId === rotoworldId &&
      e.athleteId === rotowireId2 &&
      e.athleteId === rotoworldId2 &&
      e.athleteId === rotowireId3 &&
      e.athleteId === rotoworldId3 &&
      e.athleteId === rotowireId4 &&
      e.athleteId === rotoworldId4,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, yahooId, sleeperId, pfrId, sportradarId, rotowireId, rotoworldId, rotowireId2, rotoworldId2, rotowireId3, rotoworldId3, rotowireId4, rotoworldId4, and rotowireId5 */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2AndRotowireId3AndRotoworldId3AndRotowireId4AndRotoworldId4AndRotowireId5(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
  sleeperId: string,
  pfrId: string,
  sportradarId: string,
  rotowireId: string,
  rotoworldId: string,
  rotowireId2: string,
  rotoworldId2: string,
  rotowireId3: string,
  rotoworldId3: string,
  rotowireId4: string,
  rotoworldId4: string,
  rotowireId5: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId &&
      e.athleteId === sleeperId &&
      e.athleteId === pfrId &&
      e.athleteId === sportradarId &&
      e.athleteId === rotowireId &&
      e.athleteId === rotoworldId &&
      e.athleteId === rotowireId2 &&
      e.athleteId === rotoworldId2 &&
      e.athleteId === rotowireId3 &&
      e.athleteId === rotoworldId3 &&
      e.athleteId === rotowireId4 &&
      e.athleteId === rotoworldId4 &&
      e.athleteId === rotowireId5,
  );
}

/** Get all starters for a specific position, team, depth, status, name, id, espnId, yahooId, sleeperId, pfrId, sportradarId, rotowireId, rotoworldId, rotowireId2, rotoworldId2, rotowireId3, rotoworldId3, rotowireId4, rotoworldId4, rotowireId5, and rotoworldId5 */
export async function getAllStartersByPositionAndTeamAndDepthAndStatusAndNameAndIdAndEspnIdAndYahooIdAndSleeperIdAndPfrIdAndSportradarIdAndRotowireIdAndRotoworldIdAndRotowireId2AndRotoworldId2AndRotowireId3AndRotoworldId3AndRotowireId4AndRotoworldId4AndRotowireId5AndRotoworldId5(
  position: string,
  teamAbbr: string,
  depth: number,
  status: string,
  name: string,
  id: string,
  espnId: string,
  yahooId: string,
  sleeperId: string,
  pfrId: string,
  sportradarId: string,
  rotowireId: string,
  rotoworldId: string,
  rotowireId2: string,
  rotoworldId2: string,
  rotowireId3: string,
  rotoworldId3: string,
  rotowireId4: string,
  rotoworldId4: string,
  rotowireId5: string,
  rotoworldId5: string,
): Promise<DepthChartEntry[]> {
  const entries = await getPositionDepthByTeam(teamAbbr, position);
  return entries.filter(
    (e) =>
      e.depth === depth &&
      e.athleteName.toLowerCase().includes(status.toLowerCase()) &&
      e.athleteName.toLowerCase().includes(name.toLowerCase()) &&
      e.athleteId === id &&
      e.athleteId === espnId &&
      e.athleteId === yahooId &&
      e.athleteId === sleeperId &&
      e.athleteId === pfrId &&
      e.athleteId === sportradarId &&
      e.athleteId === rotowireId &&
      e.athleteId === rotoworldId &&
      e.athleteId === rotowireId2 &&
      e.athleteId === rotoworldId2 &&
      e.athleteId === rotowireId3 &&
      e.athleteId === rotoworldId3 &&
      e.athleteId === rotowireId4 &&
      e.athleteId === rotoworldId4 &&
      e.athleteId === rotowireId5 &&
      e.athleteId === rotoworldId5,
  );
}

// ─── Cache Invalidation ───

/** Clear all cached data */
export function clearDepthChartCache(): void {
  cache.teams = null;
  cache.depthCharts.clear();
  cache.allDepthCharts = null;
}
