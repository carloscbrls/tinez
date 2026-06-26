export interface SleeperPlayer {
  player_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  position: string;
  team: string;
  number: number;
  age: number;
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
  yahoo_id: number | null;
}

export interface TrendingPlayer {
  player_id: string;
  count: number;
  player?: SleeperPlayer;
}

const PLAYERS_CACHE_KEY = "sleeper_players";
const CACHE_TTL = 3600000; // 1 hour

let playersCache: Record<string, SleeperPlayer> | null = null;
let cacheTime = 0;

export async function fetchPlayers(): Promise<Record<string, SleeperPlayer>> {
  const now = Date.now();
  if (playersCache && now - cacheTime < CACHE_TTL) {
    return playersCache;
  }

  const res = await fetch("https://api.sleeper.app/v1/players/nfl");
  if (!res.ok) throw new Error(`Sleeper API error: ${res.status}`);
  const data = await res.json();
  playersCache = data;
  cacheTime = now;
  return data;
}

export async function fetchTrending(
  type: "add" | "drop" = "add",
  lookbackHours = 24,
  limit = 25
): Promise<TrendingPlayer[]> {
  const res = await fetch(
    `https://api.sleeper.app/v1/players/nfl/trending/${type}?lookback_hours=${lookbackHours}&limit=${limit}`
  );
  if (!res.ok) throw new Error(`Sleeper trending error: ${res.status}`);
  const data: TrendingPlayer[] = await res.json();

  // Enrich with player details
  const players = await fetchPlayers();
  return data.map((t) => ({
    ...t,
    player: players[t.player_id] || undefined,
  }));
}

export async function fetchTrendingWithDetails(
  type: "add" | "drop" = "add",
  lookbackHours = 24,
  limit = 25
): Promise<TrendingPlayer[]> {
  const trending = await fetchTrending(type, lookbackHours, limit);
  return trending.filter((t) => t.player);
}

export function getPositionEmoji(pos: string): string {
  const map: Record<string, string> = {
    QB: "🎯",
    RB: "🏃",
    WR: "🏈",
    TE: "🔗",
    K: "🦵",
    DEF: "🛡️",
    LB: "🛡️",
    DB: "🛡️",
    DL: "🛡️",
  };
  return map[pos] || "📋";
}

export function getInjuryBadge(status: string | null): { label: string; color: string } | null {
  if (!status || status === "None" || status === "") return null;
  const s = status.toLowerCase();
  if (s.includes("questionable")) return { label: "Questionable", color: "bg-amber-500/20 text-amber-400" };
  if (s.includes("doubtful")) return { label: "Doubtful", color: "bg-orange-500/20 text-orange-400" };
  if (s.includes("out")) return { label: "Out", color: "bg-red-500/20 text-red-400" };
  if (s.includes("ir") || s.includes("injured")) return { label: "IR", color: "bg-red-600/20 text-red-500" };
  if (s.includes("susp")) return { label: "Suspended", color: "bg-purple-500/20 text-purple-400" };
  if (s === "Active" || s === "healthy") return null;
  return { label: status, color: "bg-zinc-500/20 text-zinc-400" };
}
