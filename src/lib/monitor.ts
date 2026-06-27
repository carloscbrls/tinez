/**
 * TINEZ Monitoring & Observability Layer
 *
 * Unified fetch wrapper, health tracking, and data freshness reporting
 * for all 5 data sources: Yahoo, ESPN, Sleeper, LeagueLogs, Open-Meteo.
 *
 * Usage:
 *   import { monitor } from "../lib/monitor";
 *   const data = await monitor.fetch("ESPN", url, options);
 *   const health = monitor.getHealth();
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type DataSource =
  | "Yahoo"
  | "ESPN"
  | "Sleeper"
  | "LeagueLogs"
  | "OpenMeteo"
  | "RSS";

export interface SourceStatus {
  source: DataSource;
  label: string;
  status: "ok" | "degraded" | "down" | "unknown";
  lastSuccess: number | null;       // timestamp
  lastFailure: number | null;       // timestamp
  lastError: string | null;         // most recent error message
  consecutiveFailures: number;
  totalRequests: number;
  totalFailures: number;
  avgResponseTimeMs: number;
  lastResponseTimeMs: number | null;
  cacheAge: number | null;          // ms since last cache write
  cacheHitRate: number;             // 0-1
  cacheHits: number;
  cacheMisses: number;
}

export interface HealthReport {
  timestamp: number;
  overall: "healthy" | "degraded" | "unhealthy";
  sources: SourceStatus[];
  oauth?: OAuthStatus;
  build?: BuildInfo;
}

export interface OAuthStatus {
  authenticated: boolean;
  tokenExpiresIn: number | null;    // seconds
  refreshStatus: "ok" | "failed" | "unknown";
  scope: string | null;
  lastRefresh: number | null;
  lastRefreshError: string | null;
}

export interface BuildInfo {
  deployedAt: number | null;
  version: string;
  buildTime: number | null;
}

export interface FetchOptions {
  /** Override the default timeout (default: 10000ms) */
  timeoutMs?: number;
  /** If true, don't count this request in health stats (e.g. health check itself) */
  silent?: boolean;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Cache TTL in ms — if provided, tracks cache age */
  cacheTtlMs?: number;
  /** Whether this is a cache hit (caller reports) */
  cacheHit?: boolean;
}

// ─── State ────────────────────────────────────────────────────────────────────

const sourceConfig: { source: DataSource; label: string }[] = [
  { source: "Yahoo", label: "Yahoo Fantasy Sports" },
  { source: "ESPN", label: "ESPN API" },
  { source: "Sleeper", label: "Sleeper API" },
  { source: "LeagueLogs", label: "LeagueLogs" },
  { source: "OpenMeteo", label: "Open-Meteo Weather" },
  { source: "RSS", label: "NFL News RSS" },
];

const state = new Map<DataSource, SourceStatus>();

function getState(source: DataSource): SourceStatus {
  if (!state.has(source)) {
    const cfg = sourceConfig.find((s) => s.source === source);
    state.set(source, {
      source,
      label: cfg?.label ?? source,
      status: "unknown",
      lastSuccess: null,
      lastFailure: null,
      lastError: null,
      consecutiveFailures: 0,
      totalRequests: 0,
      totalFailures: 0,
      avgResponseTimeMs: 0,
      lastResponseTimeMs: null,
      cacheAge: null,
      cacheHitRate: 0,
      cacheHits: 0,
      cacheMisses: 0,
    });
  }
  return state.get(source)!;
}

function updateAvg(current: number, count: number, newValue: number): number {
  if (count === 0) return newValue;
  return current + (newValue - current) / count;
}

// ─── OAuth State ──────────────────────────────────────────────────────────────

let oauthState: OAuthStatus = {
  authenticated: false,
  tokenExpiresIn: null,
  refreshStatus: "unknown",
  scope: null,
  lastRefresh: null,
  lastRefreshError: null,
};

export function updateOAuthStatus(status: Partial<OAuthStatus>): void {
  oauthState = { ...oauthState, ...status };
}

// ─── Build State ──────────────────────────────────────────────────────────────

let buildState: BuildInfo = {
  deployedAt: null,
  version: "0.0.1",
  buildTime: null,
};

export function updateBuildInfo(info: Partial<BuildInfo>): void {
  buildState = { ...buildState, ...info };
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

interface FetchResult<T> {
  ok: boolean;
  data: T | null;
  status: number;
  timeMs: number;
  fromCache: boolean;
  error: string | null;
}

async function monitoredFetch<T>(
  source: DataSource,
  url: string,
  options: RequestInit & FetchOptions = {},
): Promise<FetchResult<T>> {
  const s = getState(source);
  const timeoutMs = options.timeoutMs ?? 10000;
  const start = performance.now();

  s.totalRequests++;

  // Report cache hit if caller says so
  if (options.cacheHit) {
    s.cacheHits++;
    s.cacheHitRate = s.cacheHits / (s.cacheHits + s.cacheMisses || 1);
    return { ok: true, data: null as T, status: 200, timeMs: 0, fromCache: true, error: null };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "TINEZ/1.0",
        ...options.headers,
      },
    });

    clearTimeout(timeout);
    const timeMs = performance.now() - start;
    s.lastResponseTimeMs = Math.round(timeMs);
    s.avgResponseTimeMs = updateAvg(s.avgResponseTimeMs, s.totalRequests, timeMs);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const errMsg = `HTTP ${res.status}: ${text.slice(0, 200)}`;
      recordFailure(s, errMsg);
      if (!options.silent) {
        console.warn(`[Monitor:${source}] ${errMsg} (${Math.round(timeMs)}ms)`);
      }
      return { ok: false, data: null, status: res.status, timeMs: Math.round(timeMs), fromCache: false, error: errMsg };
    }

    // Success
    s.status = "ok";
    s.lastSuccess = Date.now();
    s.consecutiveFailures = 0;

    if (!options.silent && s.totalRequests % 10 === 0) {
      console.info(`[Monitor:${source}] ${s.totalRequests} requests, ${s.totalFailures} failures, ${s.avgResponseTimeMs.toFixed(0)}ms avg`);
    }

    // Parse response based on content type
    const contentType = res.headers.get("content-type") || "";
    let data: T;
    if (contentType.includes("application/json")) {
      data = (await res.json()) as T;
    } else if (contentType.includes("text/xml") || contentType.includes("application/xml")) {
      data = (await res.text()) as unknown as T;
    } else {
      data = (await res.text()) as unknown as T;
    }

    return { ok: true, data, status: res.status, timeMs: Math.round(timeMs), fromCache: false, error: null };
  } catch (err: any) {
    const timeMs = performance.now() - start;
    const errMsg = err.name === "AbortError"
      ? `Timeout after ${timeoutMs}ms`
      : err.message ?? String(err);
    recordFailure(s, errMsg);
    if (!options.silent) {
      console.warn(`[Monitor:${source}] ${errMsg} (${Math.round(timeMs)}ms)`);
    }
    return { ok: false, data: null, status: 0, timeMs: Math.round(timeMs), fromCache: false, error: errMsg };
  }
}

function recordFailure(s: SourceStatus, error: string): void {
  s.totalFailures++;
  s.consecutiveFailures++;
  s.lastFailure = Date.now();
  s.lastError = error;

  // Degrade status based on consecutive failures
  if (s.consecutiveFailures >= 5) {
    s.status = "down";
  } else if (s.consecutiveFailures >= 2) {
    s.status = "degraded";
  } else {
    s.status = "degraded";
  }
}

// ─── Cache Tracking ───────────────────────────────────────────────────────────

export function reportCacheHit(source: DataSource): void {
  const s = getState(source);
  s.cacheHits++;
  s.cacheHitRate = s.cacheHits / (s.cacheHits + s.cacheMisses || 1);
}

export function reportCacheMiss(source: DataSource): void {
  const s = getState(source);
  s.cacheMisses++;
  s.cacheHitRate = s.cacheHits / (s.cacheHits + s.cacheMisses || 1);
}

export function reportCacheWrite(source: DataSource): void {
  const s = getState(source);
  s.cacheAge = 0; // reset — will grow as time passes
}

export function updateCacheAge(source: DataSource): void {
  const s = getState(source);
  if (s.cacheAge !== null) {
    s.cacheAge = Date.now() - (s.lastSuccess ?? Date.now());
  }
}

// ─── Health Report ────────────────────────────────────────────────────────────

export function getHealth(): HealthReport {
  // Update cache ages
  for (const cfg of sourceConfig) {
    updateCacheAge(cfg.source);
  }

  const sources = sourceConfig.map((cfg) => getState(cfg.source));

  const downCount = sources.filter((s) => s.status === "down").length;
  const degradedCount = sources.filter((s) => s.status === "degraded").length;

  let overall: "healthy" | "degraded" | "unhealthy";
  if (downCount >= 2) {
    overall = "unhealthy";
  } else if (downCount > 0 || degradedCount > 0) {
    overall = "degraded";
  } else {
    overall = "healthy";
  }

  return {
    timestamp: Date.now(),
    overall,
    sources,
    oauth: { ...oauthState },
    build: { ...buildState },
  };
}

// ─── Convenience Export ────────────────────────────────────────────────────────

export const monitor = {
  fetch: monitoredFetch,
  getHealth,
  updateOAuthStatus,
  updateBuildInfo,
  reportCacheHit,
  reportCacheMiss,
  reportCacheWrite,
};
