export interface Matchup {
  week: number;
  homeTeam: string;
  homeOwner: string;
  homeScore: number;
  awayTeam: string;
  awayOwner: string;
  awayScore: number;
  winner: string;
}

export interface WeeklySchedule {
  week: number;
  matchups: Matchup[];
}

// 2025 season matchups (will be populated as season progresses)
export const matchups2025: Matchup[] = [
  // Week 1
  { week: 1, homeTeam: "Best Pacheco Hoe", homeOwner: "jayyphilly", homeScore: 0, awayTeam: "LaFlamaBlanca", awayOwner: "scooter", awayScore: 0, winner: "TBD" },
  { week: 1, homeTeam: "The Red Hare & Golden Dragon", homeOwner: "darnell", homeScore: 0, awayTeam: "Take that Daak", awayOwner: "DatDudeVic", awayScore: 0, winner: "TBD" },
  { week: 1, homeTeam: "Tua and 0", homeOwner: "Daniel", homeScore: 0, awayTeam: "El Bolillo", awayOwner: "James", awayScore: 0, winner: "TBD" },
  { week: 1, homeTeam: "Hit and Ruggs", homeOwner: "David", homeScore: 0, awayTeam: "Goose", awayOwner: "DatDudeVic", awayScore: 0, winner: "TBD" },
  { week: 1, homeTeam: "Black Team Bitch", homeOwner: "Timothy", homeScore: 0, awayTeam: "I Wentz hard", awayOwner: "scooter", awayScore: 0, winner: "TBD" },
  { week: 1, homeTeam: "CC3PO", homeOwner: "Carlitos", homeScore: 0, awayTeam: "Kraft Mac & Cheese", awayOwner: "karter", awayScore: 0, winner: "TBD" },
  { week: 1, homeTeam: "Jim's Team", homeOwner: "Jim", homeScore: 0, awayTeam: "ETSquad", awayOwner: "Eric", awayScore: 0, winner: "TBD" },
];

// Get matchups for a specific week
export function getMatchupsByWeek(week: number): Matchup[] {
  return matchups2025.filter(m => m.week === week);
}

// Get all weeks with matchups
export function getWeeksWithMatchups(): number[] {
  return [...new Set(matchups2025.map(m => m.week))].sort((a, b) => a - b);
}

// Get Carlitos's matchups
export function getCarlitosMatchups(): Matchup[] {
  return matchups2025.filter(m => m.homeOwner === "Carlitos" || m.awayOwner === "Carlitos");
}

// Get team record
export function getTeamRecord(teamName: string): { wins: number; losses: number; ties: number } {
  const teamMatchups = matchups2025.filter(m => m.homeTeam === teamName || m.awayTeam === teamName);
  return {
    wins: teamMatchups.filter(m => m.winner === teamName).length,
    losses: teamMatchups.filter(m => m.winner !== "TBD" && m.winner !== teamName).length,
    ties: 0,
  };
}
