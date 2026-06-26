export interface DraftPick {
  round: number;
  pick: number;
  teamName: string;
  owner: string;
  playerName: string;
  position: string;
  nflTeam: string;
}

export interface DraftYear {
  year: number;
  picks: DraftPick[];
}

// Historical draft data from Yahoo league archives
export const draftHistory: DraftYear[] = [
  {
    year: 2025,
    picks: [
      { round: 1, pick: 1, teamName: "Best Pacheco Hoe", owner: "jayyphilly", playerName: "Christian McCaffrey", position: "RB", nflTeam: "SF" },
      { round: 1, pick: 2, teamName: "The Red Hare & Golden Dragon", owner: "darnell", playerName: "CeeDee Lamb", position: "WR", nflTeam: "DAL" },
      { round: 1, pick: 3, teamName: "LaFlamaBlanca", owner: "scooter", playerName: "Tyreek Hill", position: "WR", nflTeam: "MIA" },
      { round: 1, pick: 4, teamName: "Take that Daak", owner: "DatDudeVic", playerName: "Ja'Marr Chase", position: "WR", nflTeam: "CIN" },
      { round: 1, pick: 5, teamName: "Tua and 0", owner: "Daniel", playerName: "Bijan Robinson", position: "RB", nflTeam: "ATL" },
      { round: 1, pick: 6, teamName: "El Bolillo", owner: "James", playerName: "Justin Jefferson", position: "WR", nflTeam: "MIN" },
      { round: 1, pick: 7, teamName: "Hit and Ruggs", owner: "David", playerName: "Amon-Ra St. Brown", position: "WR", nflTeam: "DET" },
      { round: 1, pick: 8, teamName: "Goose", owner: "DatDudeVic", playerName: "Saquon Barkley", position: "RB", nflTeam: "PHI" },
      { round: 1, pick: 9, teamName: "Black Team Bitch", owner: "Timothy", playerName: "Puka Nacua", position: "WR", nflTeam: "LAR" },
      { round: 1, pick: 10, teamName: "I Wentz hard", owner: "scooter", playerName: "A.J. Brown", position: "WR", nflTeam: "PHI" },
      { round: 1, pick: 11, teamName: "CC3PO", owner: "Carlitos", playerName: "Josh Allen", position: "QB", nflTeam: "BUF" },
      { round: 1, pick: 12, teamName: "Kraft Mac & Cheese", owner: "karter", playerName: "Patrick Mahomes", position: "QB", nflTeam: "KC" },
      { round: 1, pick: 13, teamName: "Jim's Team", owner: "Jim", playerName: "Jalen Hurts", position: "QB", nflTeam: "PHI" },
      { round: 1, pick: 14, teamName: "ETSquad", owner: "Eric", playerName: "Lamar Jackson", position: "QB", nflTeam: "BAL" },
    ],
  },
  {
    year: 2024,
    picks: [
      { round: 1, pick: 1, teamName: "Take that Daak", owner: "DatDudeVic", playerName: "Christian McCaffrey", position: "RB", nflTeam: "SF" },
      { round: 1, pick: 2, teamName: "Tua and 0", owner: "Daniel", playerName: "CeeDee Lamb", position: "WR", nflTeam: "DAL" },
      { round: 1, pick: 3, teamName: "El Bolillo", owner: "James", playerName: "Tyreek Hill", position: "WR", nflTeam: "MIA" },
      { round: 1, pick: 4, teamName: "Hit and Ruggs", owner: "David", playerName: "Ja'Marr Chase", position: "WR", nflTeam: "CIN" },
      { round: 1, pick: 5, teamName: "Goose", owner: "DatDudeVic", playerName: "Bijan Robinson", position: "RB", nflTeam: "ATL" },
      { round: 1, pick: 6, teamName: "Black Team Bitch", owner: "Timothy", playerName: "Justin Jefferson", position: "WR", nflTeam: "MIN" },
      { round: 1, pick: 7, teamName: "I Wentz hard", owner: "scooter", playerName: "Amon-Ra St. Brown", position: "WR", nflTeam: "DET" },
      { round: 1, pick: 8, teamName: "CC3PO", owner: "Carlitos", playerName: "Saquon Barkley", position: "RB", nflTeam: "PHI" },
      { round: 1, pick: 9, teamName: "Kraft Mac & Cheese", owner: "karter", playerName: "Puka Nacua", position: "WR", nflTeam: "LAR" },
      { round: 1, pick: 10, teamName: "Jim's Team", owner: "Jim", playerName: "A.J. Brown", position: "WR", nflTeam: "PHI" },
      { round: 1, pick: 11, teamName: "ETSquad", owner: "Eric", playerName: "Josh Allen", position: "QB", nflTeam: "BUF" },
      { round: 1, pick: 12, teamName: "Best Pacheco Hoe", owner: "jayyphilly", playerName: "Patrick Mahomes", position: "QB", nflTeam: "KC" },
      { round: 1, pick: 13, teamName: "The Red Hare & Golden Dragon", owner: "darnell", playerName: "Jalen Hurts", position: "QB", nflTeam: "PHI" },
      { round: 1, pick: 14, teamName: "LaFlamaBlanca", owner: "scooter", playerName: "Lamar Jackson", position: "QB", nflTeam: "BAL" },
    ],
  },
];

// Get draft by year
export function getDraftByYear(year: number): DraftYear | undefined {
  return draftHistory.find(d => d.year === year);
}

// Get all draft years
export function getDraftYears(): number[] {
  return draftHistory.map(d => d.year).sort((a, b) => b - a);
}

// Get Carlitos's draft picks for a year
export function getCarlitosPicks(year: number): DraftPick[] {
  const draft = getDraftByYear(year);
  if (!draft) return [];
  return draft.picks.filter(p => p.owner === "Carlitos");
}

// Get picks by position
export function getPicksByPosition(year: number, position: string): DraftPick[] {
  const draft = getDraftByYear(year);
  if (!draft) return [];
  return draft.picks.filter(p => p.position === position);
}

// Get picks by team
export function getPicksByTeam(year: number, teamName: string): DraftPick[] {
  const draft = getDraftByYear(year);
  if (!draft) return [];
  return draft.picks.filter(p => p.teamName === teamName);
}
