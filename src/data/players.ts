export interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  espnId: number;
  byeWeek?: number;
  adp?: number;
  tier?: number;
}

export const players: Player[] = [
  // Quarterbacks
  { id: 1, name: "Patrick Mahomes", position: "QB", team: "KC", espnId: 3139477, byeWeek: 6, adp: 12.4, tier: 1 },
  { id: 2, name: "Josh Allen", position: "QB", team: "BUF", espnId: 3051392, byeWeek: 12, adp: 8.1, tier: 1 },
  { id: 3, name: "Lamar Jackson", position: "QB", team: "BAL", espnId: 3916387, byeWeek: 14, adp: 15.2, tier: 1 },
  { id: 4, name: "Jalen Hurts", position: "QB", team: "PHI", espnId: 4360310, byeWeek: 5, adp: 18.7, tier: 1 },
  { id: 5, name: "Joe Burrow", position: "QB", team: "CIN", espnId: 4361591, byeWeek: 12, adp: 22.3, tier: 2 },
  { id: 6, name: "Justin Herbert", position: "QB", team: "LAC", espnId: 4361328, byeWeek: 5, adp: 28.1, tier: 2 },
  { id: 7, name: "C.J. Stroud", position: "QB", team: "HOU", espnId: 4426333, byeWeek: 14, adp: 32.5, tier: 2 },
  { id: 8, name: "Dak Prescott", position: "QB", team: "DAL", espnId: 2577417, byeWeek: 7, adp: 35.8, tier: 2 },
  { id: 9, name: "Brock Purdy", position: "QB", team: "SF", espnId: 4431595, byeWeek: 9, adp: 42.1, tier: 3 },
  { id: 10, name: "Kyler Murray", position: "QB", team: "ARI", espnId: 3916388, byeWeek: 11, adp: 45.3, tier: 3 },
  { id: 11, name: "Tua Tagovailoa", position: "QB", team: "MIA", espnId: 4361601, byeWeek: 6, adp: 48.7, tier: 3 },
  { id: 12, name: "Jordan Love", position: "QB", team: "GB", espnId: 4361460, byeWeek: 10, adp: 50.2, tier: 3 },
  { id: 13, name: "Anthony Richardson", position: "QB", team: "IND", espnId: 4433145, byeWeek: 14, adp: 52.9, tier: 3 },
  { id: 14, name: "Trevor Lawrence", position: "QB", team: "JAX", espnId: 4361280, byeWeek: 12, adp: 55.4, tier: 3 },
  { id: 15, name: "Jared Goff", position: "QB", team: "DET", espnId: 3046789, byeWeek: 5, adp: 60.1, tier: 4 },
  { id: 16, name: "Geno Smith", position: "QB", team: "SEA", espnId: 14876, byeWeek: 10, adp: 65.3, tier: 4 },
  { id: 17, name: "Baker Mayfield", position: "QB", team: "TB", espnId: 3052584, byeWeek: 11, adp: 68.7, tier: 4 },
  { id: 18, name: "Sam Darnold", position: "QB", team: "SEA", espnId: 3917311, byeWeek: 10, adp: 72.1, tier: 4 },
  { id: 19, name: "Kirk Cousins", position: "QB", team: "ATL", espnId: 2961641, byeWeek: 12, adp: 75.4, tier: 4 },
  { id: 20, name: "Aaron Rodgers", position: "QB", team: "NYJ", espnId: 8436, byeWeek: 12, adp: 78.9, tier: 4 },
  { id: 21, name: "Russell Wilson", position: "QB", team: "PIT", espnId: 14881, byeWeek: 9, adp: 82.3, tier: 5 },
  { id: 22, name: "Matthew Stafford", position: "QB", team: "LAR", espnId: 10157, byeWeek: 6, adp: 85.1, tier: 5 },
  { id: 23, name: "Deshaun Watson", position: "QB", team: "CLE", espnId: 3116401, byeWeek: 10, adp: 88.4, tier: 5 },
  { id: 24, name: "Daniel Jones", position: "QB", team: "NYG", espnId: 4361281, byeWeek: 11, adp: 92.7, tier: 5 },
  { id: 25, name: "Justin Fields", position: "QB", team: "PIT", espnId: 4362101, byeWeek: 9, adp: 95.2, tier: 5 },
  { id: 26, name: "Will Levis", position: "QB", team: "TEN", espnId: 4433131, byeWeek: 5, adp: 98.6, tier: 5 },
  { id: 27, name: "Bryce Young", position: "QB", team: "CAR", espnId: 4432908, byeWeek: 11, adp: 102.3, tier: 5 },
  { id: 28, name: "Derek Carr", position: "QB", team: "NO", espnId: 2577414, byeWeek: 12, adp: 105.1, tier: 5 },

  // Running Backs
  { id: 29, name: "Christian McCaffrey", position: "RB", team: "SF", espnId: 3916386, byeWeek: 9, adp: 1.2, tier: 1 },
  { id: 30, name: "Bijan Robinson", position: "RB", team: "ATL", espnId: 4431596, byeWeek: 12, adp: 2.1, tier: 1 },
  { id: 31, name: "Breece Hall", position: "RB", team: "NYJ", espnId: 4431600, byeWeek: 12, adp: 3.4, tier: 1 },
  { id: 32, name: "Saquon Barkley", position: "RB", team: "PHI", espnId: 3927717, byeWeek: 5, adp: 4.8, tier: 1 },
  { id: 33, name: "Jonathan Taylor", position: "RB", team: "IND", espnId: 4361282, byeWeek: 14, adp: 5.2, tier: 1 },
  { id: 34, name: "Derrick Henry", position: "RB", team: "BAL", espnId: 3042519, byeWeek: 14, adp: 6.7, tier: 1 },
  { id: 35, name: "Jahmyr Gibbs", position: "RB", team: "DET", espnId: 4431597, byeWeek: 5, adp: 7.3, tier: 1 },
  { id: 36, name: "Travis Etienne", position: "RB", team: "JAX", espnId: 4361283, byeWeek: 12, adp: 10.1, tier: 2 },
  { id: 37, name: "Josh Jacobs", position: "RB", team: "GB", espnId: 4361284, byeWeek: 10, adp: 11.5, tier: 2 },
  { id: 38, name: "Nick Chubb", position: "RB", team: "CLE", espnId: 3917312, byeWeek: 10, adp: 13.2, tier: 2 },
  { id: 39, name: "Austin Ekeler", position: "RB", team: "WAS", espnId: 3046788, byeWeek: 14, adp: 14.8, tier: 2 },
  { id: 40, name: "Joe Mixon", position: "RB", team: "HOU", espnId: 3046787, byeWeek: 14, adp: 16.3, tier: 2 },
  { id: 41, name: "Rhamondre Stevenson", position: "RB", team: "NE", espnId: 4431598, byeWeek: 14, adp: 19.1, tier: 2 },
  { id: 42, name: "James Cook", position: "RB", team: "BUF", espnId: 4431599, byeWeek: 12, adp: 20.4, tier: 2 },
  { id: 43, name: "Kenneth Walker III", position: "RB", team: "SEA", espnId: 4431601, byeWeek: 10, adp: 22.8, tier: 2 },
  { id: 44, name: "Isiah Pacheco", position: "RB", team: "KC", espnId: 4431602, byeWeek: 6, adp: 24.1, tier: 2 },
  { id: 45, name: "Raheem Mostert", position: "RB", team: "MIA", espnId: 3046790, byeWeek: 6, adp: 26.5, tier: 3 },
  { id: 46, name: "De'Von Achane", position: "RB", team: "MIA", espnId: 4433142, byeWeek: 6, adp: 28.2, tier: 3 },
  { id: 47, name: "Kyren Williams", position: "RB", team: "LAR", espnId: 4433143, byeWeek: 6, adp: 30.7, tier: 3 },
  { id: 48, name: "David Montgomery", position: "RB", team: "DET", espnId: 3917313, byeWeek: 5, adp: 33.1, tier: 3 },
  { id: 49, name: "Tony Pollard", position: "RB", team: "TEN", espnId: 3917314, byeWeek: 5, adp: 35.4, tier: 3 },
  { id: 50, name: "Alvin Kamara", position: "RB", team: "NO", espnId: 3046786, byeWeek: 12, adp: 37.8, tier: 3 },
  { id: 51, name: "Aaron Jones", position: "RB", team: "MIN", espnId: 3046785, byeWeek: 6, adp: 40.2, tier: 3 },
  { id: 52, name: "D'Andre Swift", position: "RB", team: "CHI", espnId: 3917315, byeWeek: 7, adp: 42.6, tier: 3 },
  { id: 53, name: "Najee Harris", position: "RB", team: "PIT", espnId: 4361285, byeWeek: 9, adp: 44.9, tier: 3 },
  { id: 54, name: "Javonte Williams", position: "RB", team: "DEN", espnId: 4361286, byeWeek: 14, adp: 47.3, tier: 4 },
  { id: 55, name: "Miles Sanders", position: "RB", team: "CAR", espnId: 4361287, byeWeek: 11, adp: 50.1, tier: 4 },
  { id: 56, name: "Dameon Pierce", position: "RB", team: "HOU", espnId: 4431603, byeWeek: 14, adp: 52.8, tier: 4 },
  { id: 57, name: "Rachaad White", position: "RB", team: "TB", espnId: 4431604, byeWeek: 11, adp: 55.2, tier: 4 },
  { id: 58, name: "Brian Robinson Jr.", position: "RB", team: "WAS", espnId: 4431605, byeWeek: 14, adp: 58.4, tier: 4 },

  // Wide Receivers
  { id: 59, name: "Justin Jefferson", position: "WR", team: "MIN", espnId: 4361288, byeWeek: 6, adp: 1.8, tier: 1 },
  { id: 60, name: "Tyreek Hill", position: "WR", team: "MIA", espnId: 3046784, byeWeek: 6, adp: 3.1, tier: 1 },
  { id: 61, name: "Ja'Marr Chase", position: "WR", team: "CIN", espnId: 4361289, byeWeek: 12, adp: 4.2, tier: 1 },
  { id: 62, name: "CeeDee Lamb", position: "WR", team: "DAL", espnId: 4361290, byeWeek: 7, adp: 5.5, tier: 1 },
  { id: 63, name: "Davante Adams", position: "WR", team: "NYJ", espnId: 3046783, byeWeek: 12, adp: 7.1, tier: 1 },
  { id: 64, name: "A.J. Brown", position: "WR", team: "PHI", espnId: 3917316, byeWeek: 5, adp: 8.4, tier: 1 },
  { id: 65, name: "Stefon Diggs", position: "WR", team: "HOU", espnId: 3046782, byeWeek: 14, adp: 9.7, tier: 1 },
  { id: 66, name: "Amon-Ra St. Brown", position: "WR", team: "DET", espnId: 4361291, byeWeek: 5, adp: 11.2, tier: 1 },
  { id: 67, name: "Cooper Kupp", position: "WR", team: "LAR", espnId: 3046781, byeWeek: 6, adp: 13.5, tier: 2 },
  { id: 68, name: "Deebo Samuel", position: "WR", team: "SF", espnId: 3917317, byeWeek: 9, adp: 15.8, tier: 2 },
  { id: 69, name: "Jaylen Waddle", position: "WR", team: "MIA", espnId: 4361292, byeWeek: 6, adp: 17.2, tier: 2 },
  { id: 70, name: "Tee Higgins", position: "WR", team: "CIN", espnId: 4361293, byeWeek: 12, adp: 19.4, tier: 2 },
  { id: 71, name: "DK Metcalf", position: "WR", team: "SEA", espnId: 3917318, byeWeek: 10, adp: 21.7, tier: 2 },
  { id: 72, name: "Chris Olave", position: "WR", team: "NO", espnId: 4361294, byeWeek: 12, adp: 23.1, tier: 2 },
  { id: 73, name: "Garrett Wilson", position: "WR", team: "NYJ", espnId: 4431606, byeWeek: 12, adp: 25.4, tier: 2 },
  { id: 74, name: "Drake London", position: "WR", team: "ATL", espnId: 4431607, byeWeek: 12, adp: 27.8, tier: 2 },
  { id: 75, name: "DJ Moore", position: "WR", team: "CHI", espnId: 3917319, byeWeek: 7, adp: 30.2, tier: 2 },
  { id: 76, name: "Keenan Allen", position: "WR", team: "CHI", espnId: 3046780, byeWeek: 7, adp: 32.5, tier: 3 },
  { id: 77, name: "Mike Evans", position: "WR", team: "TB", espnId: 3046779, byeWeek: 11, adp: 34.8, tier: 3 },
  { id: 78, name: "Brandon Aiyuk", position: "WR", team: "SF", espnId: 3917320, byeWeek: 9, adp: 36.2, tier: 3 },
  { id: 79, name: "DeVonta Smith", position: "WR", team: "PHI", espnId: 4361295, byeWeek: 5, adp: 38.5, tier: 3 },
  { id: 80, name: "Terry McLaurin", position: "WR", team: "WAS", espnId: 3917321, byeWeek: 14, adp: 40.9, tier: 3 },
  { id: 81, name: "Calvin Ridley", position: "WR", team: "TEN", espnId: 3917322, byeWeek: 5, adp: 43.2, tier: 3 },
  { id: 82, name: "Christian Kirk", position: "WR", team: "JAX", espnId: 3917323, byeWeek: 12, adp: 45.6, tier: 3 },
  { id: 83, name: "Diontae Johnson", position: "WR", team: "CAR", espnId: 3917324, byeWeek: 11, adp: 48.1, tier: 3 },
  { id: 84, name: "Michael Pittman Jr.", position: "WR", team: "IND", espnId: 4361296, byeWeek: 14, adp: 50.4, tier: 3 },
  { id: 85, name: "George Pickens", position: "WR", team: "PIT", espnId: 4431608, byeWeek: 9, adp: 52.7, tier: 3 },
  { id: 86, name: "Jaxon Smith-Njigba", position: "WR", team: "SEA", espnId: 4431609, byeWeek: 10, adp: 55.1, tier: 4 },
  { id: 87, name: "Zay Flowers", position: "WR", team: "BAL", espnId: 4433144, byeWeek: 14, adp: 57.4, tier: 4 },
  { id: 88, name: "Rashee Rice", position: "WR", team: "KC", espnId: 4433145, byeWeek: 6, adp: 59.8, tier: 4 },
  { id: 89, name: "Tank Dell", position: "WR", team: "HOU", espnId: 4433146, byeWeek: 14, adp: 62.2, tier: 4 },
  { id: 90, name: "Puka Nacua", position: "WR", team: "LAR", espnId: 4433147, byeWeek: 6, adp: 64.5, tier: 4 },
  { id: 91, name: "Nico Collins", position: "WR", team: "HOU", espnId: 4431610, byeWeek: 14, adp: 66.8, tier: 4 },

  // Tight Ends
  { id: 92, name: "Travis Kelce", position: "TE", team: "KC", espnId: 3046778, byeWeek: 6, adp: 9.2, tier: 1 },
  { id: 93, name: "Sam LaPorta", position: "TE", team: "DET", espnId: 4431611, byeWeek: 5, adp: 14.5, tier: 1 },
  { id: 94, name: "Mark Andrews", position: "TE", team: "BAL", espnId: 3046777, byeWeek: 14, adp: 18.1, tier: 1 },
  { id: 95, name: "George Kittle", position: "TE", team: "SF", espnId: 3046776, byeWeek: 9, adp: 22.4, tier: 1 },
  { id: 96, name: "Trey McBride", position: "TE", team: "ARI", espnId: 4431612, byeWeek: 11, adp: 26.8, tier: 2 },
  { id: 97, name: "Dalton Kincaid", position: "TE", team: "BUF", espnId: 4431613, byeWeek: 12, adp: 31.2, tier: 2 },
  { id: 98, name: "Kyle Pitts", position: "TE", team: "ATL", espnId: 4361297, byeWeek: 12, adp: 35.5, tier: 2 },
  { id: 99, name: "Evan Engram", position: "TE", team: "JAX", espnId: 3046775, byeWeek: 12, adp: 38.9, tier: 2 },
  { id: 100, name: "David Njoku", position: "TE", team: "CLE", espnId: 3917325, byeWeek: 10, adp: 42.3, tier: 2 },
  { id: 101, name: "Dallas Goedert", position: "TE", team: "PHI", espnId: 3917326, byeWeek: 5, adp: 45.7, tier: 3 },
  { id: 102, name: "Jake Ferguson", position: "TE", team: "DAL", espnId: 4431614, byeWeek: 7, adp: 48.2, tier: 3 },
  { id: 103, name: "Pat Freiermuth", position: "TE", team: "PIT", espnId: 4361298, byeWeek: 9, adp: 51.4, tier: 3 },
  { id: 104, name: "Cole Kmet", position: "TE", team: "CHI", espnId: 4361299, byeWeek: 7, adp: 54.1, tier: 3 },
  { id: 105, name: "T.J. Hockenson", position: "TE", team: "MIN", espnId: 3917327, byeWeek: 6, adp: 56.8, tier: 3 },

  // Kickers
  { id: 106, name: "Harrison Butker", position: "K", team: "KC", espnId: 3046774, byeWeek: 6, adp: 120.1, tier: 1 },
  { id: 107, name: "Justin Tucker", position: "K", team: "BAL", espnId: 3046773, byeWeek: 14, adp: 122.4, tier: 1 },
  { id: 108, name: "Brandon Aubrey", position: "K", team: "DAL", espnId: 4431615, byeWeek: 7, adp: 125.2, tier: 1 },
  { id: 109, name: "Tyler Bass", position: "K", team: "BUF", espnId: 3917328, byeWeek: 12, adp: 128.5, tier: 2 },
  { id: 110, name: "Jake Elliott", position: "K", team: "PHI", espnId: 3046772, byeWeek: 5, adp: 131.1, tier: 2 },
  { id: 111, name: "Younghoe Koo", position: "K", team: "ATL", espnId: 3046771, byeWeek: 12, adp: 133.8, tier: 2 },
  { id: 112, name: "Jason Myers", position: "K", team: "SEA", espnId: 3046770, byeWeek: 10, adp: 136.2, tier: 2 },
  { id: 113, name: "Cameron Dicker", position: "K", team: "LAC", espnId: 4431616, byeWeek: 5, adp: 138.7, tier: 2 },

  // DST
  { id: 114, name: "49ers DST", position: "DST", team: "SF", espnId: 0, byeWeek: 9, adp: 80.1, tier: 1 },
  { id: 115, name: "Cowboys DST", position: "DST", team: "DAL", espnId: 0, byeWeek: 7, adp: 85.3, tier: 1 },
  { id: 116, name: "Ravens DST", position: "DST", team: "BAL", espnId: 0, byeWeek: 14, adp: 88.6, tier: 1 },
  { id: 117, name: "Jets DST", position: "DST", team: "NYJ", espnId: 0, byeWeek: 12, adp: 92.1, tier: 2 },
  { id: 118, name: "Browns DST", position: "DST", team: "CLE", espnId: 0, byeWeek: 10, adp: 95.4, tier: 2 },
  { id: 119, name: "Bills DST", position: "DST", team: "BUF", espnId: 0, byeWeek: 12, adp: 98.2, tier: 2 },
  { id: 120, name: "Chiefs DST", position: "DST", team: "KC", espnId: 0, byeWeek: 6, adp: 101.5, tier: 2 },
  { id: 121, name: "Eagles DST", position: "DST", team: "PHI", espnId: 0, byeWeek: 5, adp: 104.8, tier: 2 },
  { id: 122, name: "Steelers DST", position: "DST", team: "PIT", espnId: 0, byeWeek: 9, adp: 107.2, tier: 2 },
  { id: 123, name: "Saints DST", position: "DST", team: "NO", espnId: 0, byeWeek: 12, adp: 110.1, tier: 3 },
];

export function getPlayerById(id: number): Player | undefined {
  return players.find(p => p.id === id);
}

export function getPlayersByPosition(pos: string): Player[] {
  return players.filter(p => p.position === pos);
}

export function getPositionColor(pos: string): string {
  const colors: Record<string, string> = {
    QB: "#3B82F6",
    RB: "#22C55E",
    WR: "#EAB308",
    TE: "#A855F7",
    K: "#EC4899",
    DST: "#EF4444",
  };
  return colors[pos] || "#6B7280";
}

export function getPositionGradient(pos: string): string {
  const gradients: Record<string, string> = {
    QB: "from-blue-500/20 to-blue-600/10",
    RB: "from-green-500/20 to-green-600/10",
    WR: "from-yellow-500/20 to-yellow-600/10",
    TE: "from-purple-500/20 to-purple-600/10",
    K: "from-pink-500/20 to-pink-600/10",
    DST: "from-red-500/20 to-red-600/10",
  };
  return gradients[pos] || "from-zinc-500/20 to-zinc-600/10";
}

export function getEspnHeadshotUrl(espnId: number): string {
  if (espnId === 0) return "";
  return `https://a.espncdn.com/i/headshots/nfl/players/full/${espnId}.png`;
}

export function getNflTeamLogoUrl(abbr: string): string {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`;
}

/**
 * Get player headshot URL from ESPN CDN
 */
export function getPlayerHeadshotUrl(player: { espn_id?: number; yahoo_id?: number | null }): string {
  const espnId = player.espn_id || player.yahoo_id;
  if (espnId) {
    return `https://a.espncdn.com/i/headshots/nfl/players/full/${espnId}.png`;
  }
  return "";
}
