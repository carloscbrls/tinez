export interface Champion {
  year: number;
  champion: string;
  championOwner: string;
  runnerUp: string;
  runnerUpOwner: string;
  thirdPlace: string;
  thirdPlaceOwner: string;
  finish: string; // your finish position
  leagueId: number;
}

// TINEZ LEAGUE All-Time Champions — 12 seasons (2014-2025)
// Source: Yahoo Fantasy Football League ID #103379 All-Time Standings
export const champions: Champion[] = [
  {
    year: 2025,
    champion: "Best Pacheco Hoe",
    championOwner: "jayyphilly",
    runnerUp: "The Red Hare & Golden Dragon",
    runnerUpOwner: "darnell",
    thirdPlace: "LaFlamaBlanca",
    thirdPlaceOwner: "scooter",
    finish: "12th",
    leagueId: 541137,
  },
  {
    year: 2024,
    champion: "Take that Daak",
    championOwner: "DatDudeVic",
    runnerUp: "Tua and 0",
    runnerUpOwner: "Daniel",
    thirdPlace: "El Bolillo",
    thirdPlaceOwner: "James",
    finish: "5th",
    leagueId: 729934,
  },
  {
    year: 2023,
    champion: "Hit and Ruggs",
    championOwner: "David",
    runnerUp: "Goose",
    runnerUpOwner: "DatDudeVic",
    thirdPlace: "Black Team Bitch",
    thirdPlaceOwner: "Timothy",
    finish: "6th",
    leagueId: 67032,
  },
  {
    year: 2022,
    champion: "I Wentz hard",
    championOwner: "scooter",
    runnerUp: "CC3PO",
    runnerUpOwner: "Carlitos",
    thirdPlace: "Tua and 0",
    thirdPlaceOwner: "Daniel",
    finish: "2nd",
    leagueId: 63143,
  },
  {
    year: 2021,
    champion: "Jim's Team",
    championOwner: "Jim",
    runnerUp: "Kraft Mac & Cheese",
    runnerUpOwner: "karter",
    thirdPlace: "The People's Tight End",
    thirdPlaceOwner: "scooter",
    finish: "5th",
    leagueId: 47615,
  },
  {
    year: 2020,
    champion: "ETSquad",
    championOwner: "Eric",
    runnerUp: "Deebo's Dak",
    runnerUpOwner: "David",
    thirdPlace: "RAidER EmPiRE",
    thirdPlaceOwner: "Todd",
    finish: "12th",
    leagueId: 85602,
  },
  {
    year: 2019,
    champion: "King Greatness",
    championOwner: "Timothy",
    runnerUp: "Last & Alone !",
    runnerUpOwner: "Carlitos",
    thirdPlace: "Jimmy Geezus",
    thirdPlaceOwner: "James",
    finish: "2nd",
    leagueId: 53128,
  },
  {
    year: 2018,
    champion: "ChampIsHere!",
    championOwner: "Carlitos",
    runnerUp: "RAidER EmPiRE",
    runnerUpOwner: "Todd",
    thirdPlace: "The G.O.A.T",
    thirdPlaceOwner: "Skyler Gray",
    finish: "1st",
    leagueId: 40241,
  },
  {
    year: 2017,
    champion: "Boom Tho!",
    championOwner: "darnell",
    runnerUp: "RAidER EmPiRE",
    runnerUpOwner: "Todd",
    thirdPlace: "Finally Found a Hole",
    thirdPlaceOwner: "James",
    finish: "6th",
    leagueId: 169727,
  },
  {
    year: 2016,
    champion: "CCFINS",
    championOwner: "Carlitos",
    runnerUp: "CARLTONSWAGPROPER",
    runnerUpOwner: "darnell",
    thirdPlace: "TheFettyOfAllWaps",
    thirdPlaceOwner: "scooter",
    finish: "7th",
    leagueId: 20053,
  },
  {
    year: 2015,
    champion: "CCFINS",
    championOwner: "Carlitos",
    runnerUp: "P.Team",
    runnerUpOwner: "Eric",
    thirdPlace: "Boom Tho!",
    thirdPlaceOwner: "darnell",
    finish: "4th",
    leagueId: 145056,
  },
  {
    year: 2014,
    champion: "Dan's Groovy Team",
    championOwner: "Daniel",
    runnerUp: "Tinez",
    runnerUpOwner: "Carlitos",
    thirdPlace: "Hispanic Ryders",
    thirdPlaceOwner: "Todd",
    finish: "3rd",
    leagueId: 78733,
  },
];

// Get champion by year
export function getChampion(year: number): Champion | undefined {
  return champions.find(c => c.year === year);
}

// Get all champions sorted by year (most recent first)
export function getChampionsByYear(): Champion[] {
  return [...champions].sort((a, b) => b.year - a.year);
}

// Get Carlitos's championships
export function getCarlitosChampionships(): Champion[] {
  return champions.filter(c => c.championOwner === "Carlitos");
}

// Get Carlitos's runner-up finishes
export function getCarlitosRunnerUps(): Champion[] {
  return champions.filter(c => c.runnerUpOwner === "Carlitos");
}

// Get all-time champion count by owner
export function getChampionCounts(): { owner: string; wins: number; runnerUps: number; thirds: number }[] {
  const counts: Record<string, { wins: number; runnerUps: number; thirds: number }> = {};
  
  champions.forEach(c => {
    // Champion
    if (!counts[c.championOwner]) counts[c.championOwner] = { wins: 0, runnerUps: 0, thirds: 0 };
    counts[c.championOwner].wins++;
    
    // Runner up
    if (!counts[c.runnerUpOwner]) counts[c.runnerUpOwner] = { wins: 0, runnerUps: 0, thirds: 0 };
    counts[c.runnerUpOwner].runnerUps++;
    
    // Third place
    if (!counts[c.thirdPlaceOwner]) counts[c.thirdPlaceOwner] = { wins: 0, runnerUps: 0, thirds: 0 };
    counts[c.thirdPlaceOwner].thirds++;
  });
  
  return Object.entries(counts)
    .map(([owner, stats]) => ({ owner, ...stats }))
    .sort((a, b) => b.wins - a.wins || b.runnerUps - a.runnerUps);
}
