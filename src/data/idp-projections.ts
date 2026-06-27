/**
 * IDP Projection Engine — TINEZ Fantasy Football
 *
 * Generates projected IDP scores based on:
 * - Player metadata (age, years_exp, position)
 * - Historical performance tiers (elite, starter, rotational, depth)
 * - TINEZ league's specific IDP scoring rules
 * - FantasyNerds expert projections (when API key is configured)
 *
 * During the season, FantasyNerds weekly projections override the
 * statistical model for players they cover. The statistical model
 * serves as a fallback for uncovered players.
 */

import { fetchPlayers } from "./sleeper";
import { monitor } from "../lib/monitor";
import {
  getFnProjectionMap,
  getFnDraftRankingMap,
  checkFnAvailability,
  type FnIdpWeeklyProjection,
} from "./fantasynerds-api";

// ─── TINEZ IDP Scoring (from scoring.ts) ──────────────────────────────────

export const IDP_SCORING = {
  tackleSolo: 1.5,
  tackleAssist: 0.5,
  sack: 3,
  interception: 3,
  forcedFumble: 2,
  fumbleRecovery: 2,
  defensiveTD: 6,
  safety: 3,
  passDefended: 1,
  blockKick: 3,
  tackleForLoss: 0.5,
  extraPointReturned: 6,
};

// ─── Types ─────────────────────────────────────────────────────────────────

export interface IdpProjection {
  playerId: string;
  name: string;
  team: string;
  position: string;
  age: number;
  yearsExp: number;
  tier: "elite" | "starter" | "rotational" | "depth" | "rookie";
  projectedPoints: number;
  projectedStats: {
    tackles: number;
    sacks: number;
    interceptions: number;
    forcedFumbles: number;
    fumbleRecoveries: number;
    passDefended: number;
    defensiveTD: number;
  };
  weeklyProjected: number;
  confidence: "high" | "medium" | "low";
  /** FantasyNerds projected points (if available) */
  fnProjected?: number;
  /** FantasyNerds draft rank (if available) */
  fnDraftRank?: number;
  /** Source of the projection */
  source: "tinez" | "fantasynerds" | "merged";
}

export interface IdpRanking {
  overallRank: number;
  positionRank: number;
  player: IdpProjection;
}

// ─── Position Groups ──────────────────────────────────────────────────────

const DL_POSITIONS = new Set(["DE", "DT", "NT", "DL"]);
const LB_POSITIONS = new Set(["LB", "OLB", "ILB", "MLB"]);
const DB_POSITIONS = new Set(["CB", "S", "DB", "FS", "SS"]);

export function getIdpPositionGroup(position: string): "DL" | "LB" | "DB" | null {
  if (DL_POSITIONS.has(position)) return "DL";
  if (LB_POSITIONS.has(position)) return "LB";
  if (DB_POSITIONS.has(position)) return "DB";
  return null;
}

// ─── Tier Classification ──────────────────────────────────────────────────

/**
 * Classify an IDP player into a performance tier based on age, experience,
 * and positional value. This is a statistical proxy until live stats arrive.
 *
 * Tier logic:
 * - Elite (24-29, 4+ years exp): Prime defensive players
 * - Starter (24-30, 2-5 years exp): Established contributors
 * - Rotational (22-26, 1-3 years exp): Developing players
 * - Depth (27+, 6+ years exp): Veterans past prime
 * - Rookie (21-23, 0-1 years exp): Unproven
 */
function classifyTier(age: number, yearsExp: number): IdpProjection["tier"] {
  if (yearsExp <= 1 && age <= 23) return "rookie";
  if (age >= 24 && age <= 29 && yearsExp >= 4) return "elite";
  if (age >= 24 && age <= 30 && yearsExp >= 2 && yearsExp <= 5) return "starter";
  if (age >= 22 && age <= 26 && yearsExp >= 1 && yearsExp <= 3) return "rotational";
  return "depth";
}

// ─── Baseline Projections by Position and Tier ────────────────────────────

/**
 * Baseline weekly stat projections per position group and tier.
 * These are derived from historical IDP scoring averages.
 *
 * Source: Historical NFL IDP data (tackles, sacks, INTs by position)
 */
const BASELINE_PROJECTIONS: Record<string, Record<string, {
  tackles: number;
  sacks: number;
  interceptions: number;
  forcedFumbles: number;
  fumbleRecoveries: number;
  passDefended: number;
  defensiveTD: number;
}>> = {
  DL: {
    elite:      { tackles: 4.5, sacks: 0.8,  interceptions: 0.02, forcedFumbles: 0.15, fumbleRecoveries: 0.08, passDefended: 0.3,  defensiveTD: 0.01 },
    starter:    { tackles: 3.5, sacks: 0.5,  interceptions: 0.01, forcedFumbles: 0.10, fumbleRecoveries: 0.05, passDefended: 0.2,  defensiveTD: 0.01 },
    rotational: { tackles: 2.5, sacks: 0.3,  interceptions: 0.01, forcedFumbles: 0.05, fumbleRecoveries: 0.03, passDefended: 0.15, defensiveTD: 0.005 },
    depth:      { tackles: 1.5, sacks: 0.15, interceptions: 0.01, forcedFumbles: 0.03, fumbleRecoveries: 0.02, passDefended: 0.1,  defensiveTD: 0.003 },
    rookie:     { tackles: 2.0, sacks: 0.2,  interceptions: 0.01, forcedFumbles: 0.05, fumbleRecoveries: 0.03, passDefended: 0.1,  defensiveTD: 0.005 },
  },
  LB: {
    elite:      { tackles: 8.0, sacks: 0.4,  interceptions: 0.08, forcedFumbles: 0.12, fumbleRecoveries: 0.06, passDefended: 0.6,  defensiveTD: 0.02 },
    starter:    { tackles: 6.0, sacks: 0.25, interceptions: 0.05, forcedFumbles: 0.08, fumbleRecoveries: 0.04, passDefended: 0.4,  defensiveTD: 0.01 },
    rotational: { tackles: 4.0, sacks: 0.15, interceptions: 0.03, forcedFumbles: 0.05, fumbleRecoveries: 0.03, passDefended: 0.25, defensiveTD: 0.01 },
    depth:      { tackles: 2.5, sacks: 0.1,  interceptions: 0.02, forcedFumbles: 0.03, fumbleRecoveries: 0.02, passDefended: 0.15, defensiveTD: 0.005 },
    rookie:     { tackles: 3.5, sacks: 0.15, interceptions: 0.03, forcedFumbles: 0.05, fumbleRecoveries: 0.03, passDefended: 0.2,  defensiveTD: 0.01 },
  },
  DB: {
    elite:      { tackles: 5.5, sacks: 0.05, interceptions: 0.12, forcedFumbles: 0.08, fumbleRecoveries: 0.04, passDefended: 1.2,  defensiveTD: 0.03 },
    starter:    { tackles: 4.5, sacks: 0.03, interceptions: 0.08, forcedFumbles: 0.05, fumbleRecoveries: 0.03, passDefended: 0.8,  defensiveTD: 0.02 },
    rotational: { tackles: 3.0, sacks: 0.02, interceptions: 0.05, forcedFumbles: 0.03, fumbleRecoveries: 0.02, passDefended: 0.5,  defensiveTD: 0.01 },
    depth:      { tackles: 2.0, sacks: 0.01, interceptions: 0.03, forcedFumbles: 0.02, fumbleRecoveries: 0.01, passDefended: 0.3,  defensiveTD: 0.005 },
    rookie:     { tackles: 2.5, sacks: 0.02, interceptions: 0.04, forcedFumbles: 0.03, fumbleRecoveries: 0.02, passDefended: 0.4,  defensiveTD: 0.01 },
  },
};

// ─── Projection Engine ────────────────────────────────────────────────────

function calculateProjectedPoints(stats: IdpProjection["projectedStats"]): number {
  return (
    stats.tackles * IDP_SCORING.tackleSolo +
    stats.sacks * IDP_SCORING.sack +
    stats.interceptions * IDP_SCORING.interception +
    stats.forcedFumbles * IDP_SCORING.forcedFumble +
    stats.fumbleRecoveries * IDP_SCORING.fumbleRecovery +
    stats.passDefended * IDP_SCORING.passDefended +
    stats.defensiveTD * IDP_SCORING.defensiveTD
  );
}

function getConfidence(tier: IdpProjection["tier"]): IdpProjection["confidence"] {
  switch (tier) {
    case "elite": return "high";
    case "starter": return "high";
    case "rotational": return "medium";
    case "depth": return "low";
    case "rookie": return "low";
  }
}

/**
 * Generate IDP projections for all defensive players
 *
 * Merges FantasyNerds expert projections when available.
 * Falls back to the statistical model for uncovered players.
 */
export async function generateIdpProjections(): Promise<IdpProjection[]> {
  const allPlayers = await fetchPlayers();
  const projections: IdpProjection[] = [];

  // Fetch FantasyNerds data in parallel
  const [fnProjections, fnDraftRankings] = await Promise.all([
    getFnProjectionMap(),
    getFnDraftRankingMap(),
  ]);

  const fnAvailable = fnProjections.size > 0;

  for (const [playerId, player] of Object.entries(allPlayers)) {
    const pos = player.position || "";
    const group = getIdpPositionGroup(pos);
    if (!group) continue;

    // Skip free agents and inactive players
    const team = player.team || "FA";
    if (team === "FA" || team === "" || player.status === "Inactive") continue;

    const age = player.age || 25;
    const yearsExp = player.years_exp ?? Math.max(0, age - 23);
    const tier = classifyTier(age, yearsExp);
    const baseline = BASELINE_PROJECTIONS[group][tier];

    // Add some variance based on age (prime = 26-28)
    const ageFactor = age >= 26 && age <= 28 ? 1.1 : age >= 24 && age <= 30 ? 1.0 : 0.85;
    // Experience bonus for veterans
    const expFactor = yearsExp >= 4 ? 1.05 : yearsExp >= 2 ? 1.0 : 0.9;

    const projectedStats = {
      tackles: Math.round(baseline.tackles * ageFactor * expFactor * 10) / 10,
      sacks: Math.round(baseline.sacks * ageFactor * 10) / 10,
      interceptions: Math.round(baseline.interceptions * ageFactor * 10) / 10,
      forcedFumbles: Math.round(baseline.forcedFumbles * ageFactor * 10) / 10,
      fumbleRecoveries: Math.round(baseline.fumbleRecoveries * ageFactor * 10) / 10,
      passDefended: Math.round(baseline.passDefended * ageFactor * 10) / 10,
      defensiveTD: Math.round(baseline.defensiveTD * 100) / 100,
    };

    const weeklyProjected = calculateProjectedPoints(projectedStats);
    const projectedPoints = Math.round(weeklyProjected * 17 * 10) / 10; // Season total

    // Check if FantasyNerds has a projection for this player
    const fnProj = fnProjections.get(playerId);
    const fnRank = fnDraftRankings.get(playerId);

    let source: IdpProjection["source"] = "tinez";
    let finalWeekly = Math.round(weeklyProjected * 10) / 10;
    let finalStats = projectedStats;

    if (fnProj) {
      // FantasyNerds has weekly projections — use them as primary
      // Map FantasyNerds stats to our format
      const fnStats = {
        tackles: Math.round((fnProj.tackles + fnProj.assists * 0.5) * 10) / 10,
        sacks: fnProj.sacks,
        interceptions: fnProj.interceptions,
        forcedFumbles: fnProj.fumblesForced,
        fumbleRecoveries: 0, // FantasyNerds doesn't provide this
        passDefended: fnProj.passesDefended,
        defensiveTD: fnProj.interceptionTouchdowns + fnProj.fumbleReturnTouchdowns,
      };

      // Blend: 70% FantasyNerds, 30% TINEZ model (smoothing)
      const blendedWeekly = Math.round(
        (fnProj.projPts * 0.7 + weeklyProjected * 0.3) * 10
      ) / 10;

      finalWeekly = blendedWeekly;
      finalStats = fnStats;
      source = "merged";
    }

    projections.push({
      playerId,
      name: player.full_name || `${player.first_name} ${player.last_name}`,
      team,
      position: pos,
      age,
      yearsExp,
      tier,
      projectedPoints: Math.round(finalWeekly * 17 * 10) / 10,
      projectedStats: finalStats,
      weeklyProjected: finalWeekly,
      confidence: fnProj ? "high" : getConfidence(tier),
      fnProjected: fnProj?.projPts,
      fnDraftRank: fnRank?.rank,
      source,
    });
  }

  return projections;
}

/**
 * Get IDP rankings sorted by projected weekly points
 */
export async function getIdpRankings(): Promise<{
  overall: IdpRanking[];
  byPosition: Record<string, IdpRanking[]>;
}> {
  const projections = await generateIdpProjections();

  // Sort by weekly projected points descending
  const sorted = projections.sort((a, b) => b.weeklyProjected - a.weeklyProjected);

  // Overall rankings
  const overall: IdpRanking[] = sorted.map((player, i) => ({
    overallRank: i + 1,
    positionRank: 0, // filled below
    player,
  }));

  // Position-specific rankings
  const byPosition: Record<string, IdpRanking[]> = {};
  for (const ranking of overall) {
    const pos = ranking.player.position;
    if (!byPosition[pos]) byPosition[pos] = [];
    byPosition[pos].push(ranking);
  }

  // Assign position ranks
  for (const [pos, rankings] of Object.entries(byPosition)) {
    rankings.forEach((r, i) => { r.positionRank = i + 1; });
  }

  return { overall, byPosition };
}

/**
 * Get top IDP players by position group
 */
export async function getTopIdpByGroup(
  group: "DL" | "LB" | "DB",
  limit = 30
): Promise<IdpRanking[]> {
  const { overall } = await getIdpRankings();
  return overall
    .filter((r) => getIdpPositionGroup(r.player.position) === group)
    .slice(0, limit);
}

/**
 * Get IDP sleepers — players with high projected value but low ownership
 * (rotational/rookie tiers with good age-adjusted projections)
 */
export async function getIdpSleepers(limit = 15): Promise<IdpProjection[]> {
  const projections = await generateIdpProjections();
  return projections
    .filter((p) => p.tier === "rotational" || p.tier === "rookie")
    .filter((p) => p.weeklyProjected >= 5)
    .sort((a, b) => b.weeklyProjected - a.weeklyProjected)
    .slice(0, limit);
}

/**
 * Get IDP players by team
 */
export async function getIdpByTeam(team: string): Promise<IdpProjection[]> {
  const projections = await generateIdpProjections();
  return projections
    .filter((p) => p.team === team.toUpperCase())
    .sort((a, b) => b.weeklyProjected - a.weeklyProjected);
}

/**
 * Search IDP players by name
 */
export async function searchIdpPlayers(query: string): Promise<IdpProjection[]> {
  const projections = await generateIdpProjections();
  const q = query.toLowerCase();
  return projections.filter((p) => p.name.toLowerCase().includes(q));
}
