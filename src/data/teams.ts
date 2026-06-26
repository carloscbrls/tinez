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
  nflTeam?: string;
}

// TINEZ LEAGUE — 14 teams, Yahoo Fantasy Football (ID# 103379)
// Custom URL: https://football.fantasysports.yahoo.com/league/riptinez
export const teams: Team[] = [
  { id: 1, name: "Frozen Fury", owner: "Carlitos", shortName: "FF", primaryColor: "#00BFFF", secondaryColor: "#FFFFFF", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 2, name: "The Red Hare & Golden Dragon", owner: "darnell", shortName: "RHGD", primaryColor: "#DC2626", secondaryColor: "#FFD700", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 3, name: "LaFlamaBlanca", owner: "scooter", shortName: "LFB", primaryColor: "#FF4500", secondaryColor: "#FFD700", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 4, name: "Black Team Bitch", owner: "Timothy", shortName: "BTB", primaryColor: "#1A1A2E", secondaryColor: "#E94560", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 5, name: "El Bolillo", owner: "James", shortName: "EB", primaryColor: "#2D6A4F", secondaryColor: "#D4A373", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 6, name: "L.E.T. Gang", owner: "Eric", shortName: "LET", primaryColor: "#4A0E4E", secondaryColor: "#C77DFF", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 7, name: "JUST IN Tucker's Massage…", owner: "Skyler Gray", shortName: "JITM", primaryColor: "#0A9396", secondaryColor: "#94D2BD", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 8, name: "Take that Daak", owner: "DatDudeVic", shortName: "TTD", primaryColor: "#001219", secondaryColor: "#EE9B00", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 9, name: "Injured Reserve's Finest", owner: "David", shortName: "IRF", primaryColor: "#5C4D7D", secondaryColor: "#B8B8D1", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 10, name: "Syrup Squad", owner: "karter", shortName: "SS", primaryColor: "#7F4F24", secondaryColor: "#DDB892", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 11, name: "THIS WILL HURTS A LITTLE", owner: "tyler", shortName: "TWHL", primaryColor: "#9B2226", secondaryColor: "#CA6702", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 12, name: "Best Pacheco Hoe", owner: "jayyphilly", shortName: "BPH", primaryColor: "#005F73", secondaryColor: "#AE2012", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 13, name: "APieceofToast!", owner: "Daniel", shortName: "APT", primaryColor: "#6B705C", secondaryColor: "#A5A58D", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
  { id: 14, name: "RemeberTheTrojans", owner: "Todd", shortName: "RTT", primaryColor: "#800000", secondaryColor: "#FFB347", wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, streak: "-", xHandle: "" },
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
