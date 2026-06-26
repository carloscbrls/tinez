export interface ScoringRule {
  category: string;
  description: string;
  points: string;
  isCustom: boolean; // true if different from Yahoo default
}

export interface PositionScoring {
  position: string;
  rules: ScoringRule[];
}

// TINEZ LEAGUE Scoring — exact values from Yahoo settings (League ID #103379)
export const leagueScoring: PositionScoring[] = [
  {
    position: "Offense",
    rules: [
      { category: "Passing Yards", description: "25 yards per point", points: "25 yds = 1 pt", isCustom: false },
      { category: "Passing Yards Bonus", description: "Bonus at 200/300/400 yards", points: "2/3/4 pts", isCustom: true },
      { category: "Passing Touchdowns", description: "6 pts (Yahoo default: 4)", points: "6", isCustom: true },
      { category: "Interceptions", description: "-3 pts (Yahoo default: -1)", points: "-3", isCustom: true },
      { category: "Sacks", description: "-2 pts (Yahoo default: 0)", points: "-2", isCustom: true },
      { category: "Rushing Yards", description: "10 yards per point", points: "10 yds = 1 pt", isCustom: false },
      { category: "Rushing Yards Bonus", description: "Bonus at 100/150/200 yards", points: "1/1.5/2 pts", isCustom: true },
      { category: "Rushing Touchdowns", description: "6 pts", points: "6", isCustom: false },
      { category: "Receptions (PPR)", description: "0.5 pts per reception", points: "0.5", isCustom: true },
      { category: "Receiving Yards", description: "10 yards per point", points: "10 yds = 1 pt", isCustom: false },
      { category: "Receiving Yards Bonus", description: "Bonus at 100/150/200 yards", points: "1/1.5/2 pts", isCustom: true },
      { category: "Receiving Touchdowns", description: "6 pts", points: "6", isCustom: false },
      { category: "Return Yards", description: "25 yards per point (Yahoo default: 0)", points: "25 yds = 1 pt", isCustom: true },
      { category: "Return Touchdowns", description: "6 pts", points: "6", isCustom: false },
      { category: "2-Point Conversions", description: "3 pts (Yahoo default: 2)", points: "3", isCustom: true },
      { category: "Fumbles", description: "-2 pts (Yahoo default: 0)", points: "-2", isCustom: true },
      { category: "Fumbles Lost", description: "-2.5 pts (Yahoo default: -2)", points: "-2.5", isCustom: true },
      { category: "Offensive Fumble Return TD", description: "6 pts", points: "6", isCustom: false },
      { category: "Pick Sixes Thrown", description: "-3 pts (Yahoo default: 0)", points: "-3", isCustom: true },
      { category: "40+ Yard Passing TD Bonus", description: "Bonus for long TDs (Yahoo default: 0)", points: "+2.5", isCustom: true },
      { category: "40+ Yard Rushing TD Bonus", description: "Bonus for long TDs (Yahoo default: 0)", points: "+3.5", isCustom: true },
      { category: "40+ Yard Receiving TD Bonus", description: "Bonus for long TDs (Yahoo default: 0)", points: "+3.5", isCustom: true },
      { category: "Passing 1st Downs", description: "0.25 pts (Yahoo default: 0)", points: "0.25", isCustom: true },
      { category: "Rushing 1st Downs", description: "0.75 pts (Yahoo default: 0)", points: "0.75", isCustom: true },
      { category: "Receiving 1st Downs", description: "0.50 pts (Yahoo default: 0)", points: "0.50", isCustom: true },
    ],
  },
  {
    position: "Kickers",
    rules: [
      { category: "FG 0-19 Yards", description: "2 pts (Yahoo default: 3)", points: "2", isCustom: true },
      { category: "FG 20-29 Yards", description: "2 pts (Yahoo default: 3)", points: "2", isCustom: true },
      { category: "FG 30-39 Yards", description: "3 pts", points: "3", isCustom: false },
      { category: "FG 40-49 Yards", description: "4 pts", points: "4", isCustom: false },
      { category: "FG 50+ Yards", description: "5 pts", points: "5", isCustom: false },
      { category: "FG Missed 0-19 Yards", description: "-5 pts (Yahoo default: 0)", points: "-5", isCustom: true },
      { category: "FG Missed 20-29 Yards", description: "-4 pts (Yahoo default: 0)", points: "-4", isCustom: true },
      { category: "FG Missed 30-39 Yards", description: "-3 pts (Yahoo default: 0)", points: "-3", isCustom: true },
      { category: "FG Missed 40-49 Yards", description: "-2 pts (Yahoo default: 0)", points: "-2", isCustom: true },
      { category: "FG Missed 50+ Yards", description: "-1 pts (Yahoo default: 0)", points: "-1", isCustom: true },
      { category: "Point After Attempt Made", description: "1 pt", points: "1", isCustom: false },
      { category: "Point After Attempt Missed", description: "-1 pt (Yahoo default: 0)", points: "-1", isCustom: true },
    ],
  },
  {
    position: "Defensive Players",
    rules: [
      { category: "Tackle Solo", description: "1.5 pts (Yahoo default: 1)", points: "1.5", isCustom: true },
      { category: "Tackle Assist", description: "0.5 pts", points: "0.5", isCustom: true },
      { category: "Sack", description: "3 pts (Yahoo default: 2)", points: "3", isCustom: true },
      { category: "Interception", description: "3 pts", points: "3", isCustom: false },
      { category: "Fumble Force", description: "2 pts", points: "2", isCustom: false },
      { category: "Fumble Recovery", description: "2 pts", points: "2", isCustom: false },
      { category: "Defensive Touchdown", description: "6 pts", points: "6", isCustom: false },
      { category: "Safety", description: "3 pts (Yahoo default: 2)", points: "3", isCustom: true },
      { category: "Pass Defended", description: "1 pt", points: "1", isCustom: true },
      { category: "Block Kick", description: "3 pts (Yahoo default: 2)", points: "3", isCustom: true },
      { category: "Tackles for Loss", description: "0.5 pts (Yahoo default: 0)", points: "0.5", isCustom: true },
      { category: "Extra Point Returned", description: "6 pts (Yahoo default: 2)", points: "6", isCustom: true },
    ],
  },
];

// Summary stats for quick reference
export const scoringSummary = {
  ppr: "0.5",
  passingTD: "6",
  interception: "-3",
  sack: "-2",
  returnYards: "25 yds/pt",
  twoPointConversion: "3",
  fumble: "-2",
  fumbleLost: "-2.5",
  pickSix: "-3",
  fortyYardPassTD: "+2.5",
  fortyYardRushTD: "+3.5",
  fortyYardRecTD: "+3.5",
  passingFirstDown: "0.25",
  rushingFirstDown: "0.75",
  receivingFirstDown: "0.50",
  tackleSolo: "1.5",
  tackleAssist: "0.5",
  sackDef: "3",
  interceptionDef: "3",
  safety: "3",
  passDefended: "1",
  blockKick: "3",
  tfl: "0.5",
  extraPointReturned: "6",
};

// Get all custom rules (different from Yahoo default)
export function getCustomRules(): ScoringRule[] {
  return leagueScoring.flatMap(ps => ps.rules.filter(r => r.isCustom));
}

// Get rules for a specific position group
export function getScoringForPosition(position: string): ScoringRule[] {
  const group = leagueScoring.find(ps => ps.position === position);
  return group?.rules || [];
}
