/**
 * Type definitions for the API-SPORTS integration.
 * Shared types used across the TINEZ projection system.
 */

// ─── League Types ────────────────────────────────────────────────────────────

export type League = 'nfl' | 'nba' | 'mlb' | 'nhl';

export type Season = number; // e.g., 2022, 2023, 2024

// ─── API Response Types ───────────────────────────────────────────────────────

export interface Team {
  id: number;
  name: string;
  code: string;
  logo: string;
  country: string;
  city?: string;
  stadium?: string;
  conference?: string;
  division?: string;
}

export interface Player {
  id: number;
  name: string;
  age?: number;
  position?: string;
  height?: string;
  weight?: string;
  college?: string;
  number?: number;
  photo?: string;
  team?: { id: number; name: string; logo: string };
  statistics?: PlayerStatistics;
}

export interface PlayerStatistics {
  // Passing
  passingYards?: number;
  passingTouchdowns?: number;
  interceptions?: number;
  completions?: number;
  attempts?: number;
  passerRating?: number;

  // Rushing
  rushingYards?: number;
  rushingTouchdowns?: number;
  rushingAttempts?: number;
  yardsPerCarry?: number;

  // Receiving
  receivingYards?: number;
  receivingTouchdowns?: number;
  receptions?: number;
  targets?: number;
  yardsPerReception?: number;

  // Misc
  returnTouchdowns?: number;
  twoPointConversions?: number;
  fumblesLost?: number;
  fumbleRecoveries?: number;

  // Kicking
  fieldGoals?: number;
  fieldGoalAttempts?: number;
  extraPoints?: number;
  extraPointAttempts?: number;

  // Defense
  defensiveTouchdowns?: number;
  sacks?: number;
  tackles?: number;
  tacklesForLoss?: number;
  passesDefended?: number;
}

export interface Game {
  id: number;
  date: string;
  week?: number;
  season: Season;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled' | 'postponed';
  venue?: string;
  scores?: {
    home: GameScore;
    away: GameScore;
  };
  teams?: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
}

export interface GameScore {
  total: number;
  quarter1?: number;
  quarter2?: number;
  quarter3?: number;
  quarter4?: number;
  overtime?: number;
  players?: Player[];
}

export interface Standing {
  position: number;
  team: { id: number; name: string; logo: string };
  conference?: string;
  division?: string;
  wins: number;
  losses: number;
  ties?: number;
  pointsFor?: number;
  pointsAgainst?: number;
  streak?: string;
  season: Season;
}

// ─── Cache Types ─────────────────────────────────────────────────────────────

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// ─── Projection Types ────────────────────────────────────────────────────────

export interface SeasonData {
  teams: Team[];
  standings: Standing[];
  games: Game[];
  teamMap: Record<number, Team>;
}

export interface ProjectionData {
  seasons: Record<Season, SeasonData>;
  lastUpdated: string;
  source: 'api-sports' | 'manual' | 'cache';
}

export interface PlayerProjection {
  playerId: number;
  name: string;
  position: string;
  teamId: number;
  seasonsPlayed: number;
  gamesPlayed: number;
  avgFantasyPoints: number;
  projectedFantasyPoints: number;
  confidence: number;
  lastUpdated: string;
}

// ─── Config Types ────────────────────────────────────────────────────────────

export interface APISportsConfig {
  apiKey: string;
  league: League;
  seasons: Season[];
  cacheTTLMs: number;
  dailyBudget: number;
}
