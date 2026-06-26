export interface Team {
  id: number;
  name: string;
  owner: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
  xHandle: string;
}

// Placeholder teams — update with real Tinez league teams
export const teams: Team[] = [
  { id: 1, name: "Team 1", owner: "Owner 1", shortName: "T1", primaryColor: "#2563eb", secondaryColor: "#93c5fd", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 2, name: "Team 2", owner: "Owner 2", shortName: "T2", primaryColor: "#dc2626", secondaryColor: "#fca5a5", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 3, name: "Team 3", owner: "Owner 3", shortName: "T3", primaryColor: "#16a34a", secondaryColor: "#86efac", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 4, name: "Team 4", owner: "Owner 4", shortName: "T4", primaryColor: "#9333ea", secondaryColor: "#d8b4fe", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 5, name: "Team 5", owner: "Owner 5", shortName: "T5", primaryColor: "#f59e0b", secondaryColor: "#fde68a", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 6, name: "Team 6", owner: "Owner 6", shortName: "T6", primaryColor: "#0891b2", secondaryColor: "#a5f3fc", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 7, name: "Team 7", owner: "Owner 7", shortName: "T7", primaryColor: "#be123c", secondaryColor: "#fda4af", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 8, name: "Team 8", owner: "Owner 8", shortName: "T8", primaryColor: "#1d4ed8", secondaryColor: "#bfdbfe", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 9, name: "Team 9", owner: "Owner 9", shortName: "T9", primaryColor: "#059669", secondaryColor: "#a7f3d0", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 10, name: "Team 10", owner: "Owner 10", shortName: "T10", primaryColor: "#d97706", secondaryColor: "#fcd34d", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 11, name: "Team 11", owner: "Owner 11", shortName: "T11", primaryColor: "#7c3aed", secondaryColor: "#c4b5fd", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 12, name: "Team 12", owner: "Owner 12", shortName: "T12", primaryColor: "#b91c1c", secondaryColor: "#fecaca", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 13, name: "Team 13", owner: "Owner 13", shortName: "T13", primaryColor: "#0d9488", secondaryColor: "#99f6e4", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 14, name: "Team 14", owner: "Owner 14", shortName: "T14", primaryColor: "#4f46e5", secondaryColor: "#c7d2fe", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 15, name: "Team 15", owner: "Owner 15", shortName: "T15", primaryColor: "#e11d48", secondaryColor: "#fecdd3", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 16, name: "Team 16", owner: "Owner 16", shortName: "T16", primaryColor: "#ca8a04", secondaryColor: "#fef08a", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
];

export function getTeamById(id: number): Team | undefined {
  return teams.find(t => t.id === id);
}

export function getStandings(): Team[] {
  return [...teams].sort((a, b) => {
    const aPct = a.wins + a.ties * 0.5;
    const bPct = b.wins + b.ties * 0.5;
    if (bPct !== aPct) return bPct - aPct;
    return b.pointsFor - a.pointsFor;
  });
}
