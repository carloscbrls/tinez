export interface WeeklyWinner {
  week: number;
  teamName: string;
  owner: string;
  points: number;
  prize: number;
}

export interface PayoutRecord {
  year: number;
  type: "champion" | "runnerUp" | "weekly" | "total";
  recipient: string;
  amount: number;
  note: string;
}

// Weekly winners from the constitution (Weeks 11-14, $30 each)
export const weeklyWinners: WeeklyWinner[] = [
  { week: 11, teamName: "TBD", owner: "TBD", points: 0, prize: 30 },
  { week: 12, teamName: "TBD", owner: "TBD", points: 0, prize: 30 },
  { week: 13, teamName: "TBD", owner: "TBD", points: 0, prize: 30 },
  { week: 14, teamName: "TBD", owner: "TBD", points: 0, prize: 30 },
];

// Payout structure from constitution
export const payoutStructure = {
  entryFee: 175,
  totalTeams: 14,
  totalPool: 2450,
  yahooPool: 1400,
  bonusPool: 840,
  firstPlace: 1435,
  secondPlace: 175,
  weeklyPrize: 30,
  weeklyWeeks: [11, 12, 13, 14],
};

// Historical payouts (will be filled as data comes in)
export const payoutHistory: PayoutRecord[] = [
  { year: 2025, type: "champion", recipient: "Best Pacheco Hoe (jayyphilly)", amount: 1435, note: "1st Place" },
  { year: 2025, type: "runnerUp", recipient: "The Red Hare & Golden Dragon (darnell)", amount: 175, note: "2nd Place" },
  { year: 2024, type: "champion", recipient: "Take that Daak (DatDudeVic)", amount: 1435, note: "1st Place" },
  { year: 2024, type: "runnerUp", recipient: "Tua and 0 (Daniel)", amount: 175, note: "2nd Place" },
  { year: 2023, type: "champion", recipient: "Hit and Ruggs (David)", amount: 1435, note: "1st Place" },
  { year: 2023, type: "runnerUp", recipient: "Goose (DatDudeVic)", amount: 175, note: "2nd Place" },
  { year: 2022, type: "champion", recipient: "I Wentz hard (scooter)", amount: 1435, note: "1st Place" },
  { year: 2022, type: "runnerUp", recipient: "CC3PO (Carlitos)", amount: 175, note: "2nd Place" },
  { year: 2021, type: "champion", recipient: "Jim's Team (Jim)", amount: 1435, note: "1st Place" },
  { year: 2021, type: "runnerUp", recipient: "Kraft Mac & Cheese (karter)", amount: 175, note: "2nd Place" },
  { year: 2020, type: "champion", recipient: "ETSquad (Eric)", amount: 1435, note: "1st Place" },
  { year: 2020, type: "runnerUp", recipient: "Deebo's Dak (David)", amount: 175, note: "2nd Place" },
  { year: 2019, type: "champion", recipient: "King Greatness (Timothy)", amount: 1435, note: "1st Place" },
  { year: 2019, type: "runnerUp", recipient: "Last & Alone ! (Carlitos)", amount: 175, note: "2nd Place" },
  { year: 2018, type: "champion", recipient: "ChampIsHere! (Carlitos)", amount: 1435, note: "1st Place" },
  { year: 2018, type: "runnerUp", recipient: "RAidER EmPiRE (Todd)", amount: 175, note: "2nd Place" },
  { year: 2017, type: "champion", recipient: "Boom Tho! (darnell)", amount: 1435, note: "1st Place" },
  { year: 2017, type: "runnerUp", recipient: "RAidER EmPiRE (Todd)", amount: 175, note: "2nd Place" },
  { year: 2016, type: "champion", recipient: "CCFINS (Carlitos)", amount: 1435, note: "1st Place" },
  { year: 2016, type: "runnerUp", recipient: "CARLTONSWAGPROPER (darnell)", amount: 175, note: "2nd Place" },
  { year: 2015, type: "champion", recipient: "CCFINS (Carlitos)", amount: 1435, note: "1st Place" },
  { year: 2015, type: "runnerUp", recipient: "P.Team (Eric)", amount: 175, note: "2nd Place" },
  { year: 2014, type: "champion", recipient: "Dan's Groovy Team (Daniel)", amount: 1435, note: "1st Place" },
  { year: 2014, type: "runnerUp", recipient: "Tinez (Carlitos)", amount: 175, note: "2nd Place" },
];

// Get total paid out to an owner
export function getTotalPayouts(owner: string): number {
  return payoutHistory
    .filter(p => p.recipient.includes(owner))
    .reduce((sum, p) => sum + p.amount, 0);
}

// Get payouts by year
export function getPayoutsByYear(year: number): PayoutRecord[] {
  return payoutHistory.filter(p => p.year === year);
}

// Get Carlitos's total career earnings
export function getCarlitosEarnings(): number {
  return getTotalPayouts("Carlitos");
}
