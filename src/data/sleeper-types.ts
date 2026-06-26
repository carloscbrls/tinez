// Sleeper API TypeScript Interfaces

export interface SleeperLeague {
  total_rosters: number;
  status: string;
  sport: string;
  season: string;
  season_type: string;
  scoring_settings: Record<string, number>;
  roster_positions: string[];
  previous_league_id: string;
  name: string;
  league_id: string;
  draft_id: string;
  avatar: string;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  league_id: string;
  players: string[];
  starters: string[];
  settings: {
    wins: number;
    losses: number;
    ties: number;
    fpts: number;
    fpts_against: number;
    waiver_position: number;
    waiver_budget_used: number;
    total_moves: number;
    division: number;
  };
  reserve: string[];
  taxi: string[];
  metadata: Record<string, string>;
}

export interface SleeperUser {
  user_id: string;
  display_name: string;
  avatar: string;
  metadata: {
    team_name?: string;
    team_name_update?: string;
    allow_pn?: string;
    mention_pn?: string;
  };
  is_owner: boolean;
  is_bot: boolean;
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  points: number;
  starters: string[];
  players: string[];
  custom_points: number | null;
}

export interface SleeperTransaction {
  transaction_id: string;
  type: "trade" | "free_agent" | "waiver" | "commissioner";
  status: "complete" | "pending" | "failed";
  roster_ids: number[];
  adds: Record<string, number> | null;
  drops: Record<string, number> | null;
  waiver_budget: Record<string, number> | null;
  draft_picks: Record<string, number> | null;
  consenter_ids: number[];
  creator: string;
  created: string;
  leg: number;
  settings: Record<string, number>;
  metadata: Record<string, string>;
}

export interface SleeperDraftPick {
  round: number;
  roster_id: number;
  player_id: string;
  picked_by: string;
  pick_no: number;
  is_keeper: boolean | null;
  metadata: {
    first_name: string;
    last_name: string;
    team: string;
    position: string;
    years_exp: string;
    number: string;
  };
}

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
  espn_id: number | null;
  sportradar_id: string | null;
  rotowire_id: number | null;
  rotoworld_id: number | null;
  swish_id: number | null;
  fantasy_data_id: number | null;
  stats_id: number | null;
  gsis_id: string | null;
  pandascore_id: string | null;
}

export interface TrendingPlayer {
  player_id: string;
  count: number;
  player?: SleeperPlayer;
}

export interface SleeperDraft {
  draft_id: string;
  league_id: string;
  status: string;
  season: string;
  type: string;
  settings: {
    rounds: number;
    teams: number;
    pick_timer: number;
    nomination_timer: number;
    budget: number;
  };
  metadata: Record<string, string>;
}

export interface PowerRanking {
  rank: number;
  teamName: string;
  owner: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  totalMoves: number;
  waiverBudgetUsed: number;
  powerScore: number;
  trend: "up" | "down" | "stable";
  trendAmount: number;
}

export interface LeagueRecord {
  category: string;
  value: string;
  holder: string;
  year: number;
  icon: string;
  description: string;
}
