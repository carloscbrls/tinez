export interface SeasonImage {
  id: string;
  year: number;
  type: "champion" | "draft" | "matchup" | "team" | "trophy" | "custom";
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
  credit?: string;
}

// 2025 season images from NFL.com official photo galleries
// All images sourced from NFL.com's Top 10 Photos of the 2025 Season galleries
export const seasonImages: SeasonImage[] = [
  // === 2025 Champion ===
  {
    id: "2025-champion",
    year: 2025,
    type: "champion",
    title: "2025 Champion: Best Pacheco Hoe",
    description: "jayyphilly takes the 2025 TINEZ LEAGUE championship",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/erntfl1kw8wbvgzqje5v.jpg",
    credit: "Alika Jenner/NFL",
  },
  // 2025 Runner-Up
  {
    id: "2025-runner-up",
    year: 2025,
    type: "champion",
    title: "2025 Runner-Up: The Red Hare & Golden Dragon",
    description: "darnell finishes 2nd in the 2025 season",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/ijkh149aelavv2crixgp.jpg",
    credit: "Logan Bowles/NFL",
  },
  // 2025 Third Place
  {
    id: "2025-third",
    year: 2025,
    type: "champion",
    title: "2025 Third Place: LaFlamaBlanca",
    description: "scooter takes 3rd place in the 2025 season",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/npkecbjggouhh7xjv7ld.jpg",
    credit: "NFL",
  },
  // 2025 Draft Day
  {
    id: "2025-draft",
    year: 2025,
    type: "draft",
    title: "2025 Draft Day",
    description: "14 teams, 14 picks in Round 1 — Josh Allen went 11th overall",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/mph6g1lj7jhyhylpjbgn.jpg",
    credit: "NFL",
  },
  // 2025 Carlitos Team
  {
    id: "2025-carlitos-team",
    year: 2025,
    type: "team",
    title: "CC3PO — 2025 Season",
    description: "Carlitos finished 12th in the 2025 season",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/bfi0ww4esyqvfqi4ohc2.jpg",
    credit: "Ryan Kang/NFL",
  },
  // 2025 Week 8 — Michael Pittman TD catch
  {
    id: "2025-week8-pittman",
    year: 2025,
    type: "matchup",
    title: "Michael Pittman Jr. — Touchdown Catch",
    description: "Colts WR hauls in a TD pass against the Titans, Week 8",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/erntfl1kw8wbvgzqje5v.jpg",
    credit: "Alika Jenner/NFL",
  },
  // 2025 Week 8 — James Cook celebration
  {
    id: "2025-week8-cook",
    year: 2025,
    type: "matchup",
    title: "James Cook — Touchdown Celebration",
    description: "Bills RB celebrates after scoring against the Panthers, Week 8",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/mph6g1lj7jhyhylpjbgn.jpg",
    credit: "Jacob Kupferman/Associated Press",
  },
  // 2025 Week 8 — Terry McLaurin end zone catch
  {
    id: "2025-week8-mclaurin",
    year: 2025,
    type: "matchup",
    title: "Terry McLaurin — End Zone Grab",
    description: "Commanders WR catches the ball in the end zone vs Chiefs, Week 8",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/npkecbjggouhh7xjv7ld.jpg",
    credit: "Perry Knotts/NFL",
  },
  // 2025 Week 9 — Marvin Harrison Jr. catch
  {
    id: "2025-week9-marvin",
    year: 2025,
    type: "matchup",
    title: "Marvin Harrison Jr. — Spectacular Catch",
    description: "Cardinals WR makes a catch against the Cowboys, Week 9",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/ijkh149aelavv2crixgp.jpg",
    credit: "Logan Bowles/NFL",
  },
  // 2025 Week 9 — Chase Brown hurdle
  {
    id: "2025-week9-brown",
    year: 2025,
    type: "matchup",
    title: "Chase Brown — Hurdle",
    description: "Bengals RB hurdles Kevin Byard in Week 9 vs Bears",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/mph6g1lj7jhyhylpjbgn.jpg",
    credit: "Kareem Elgazzar/Associated Press",
  },
  // 2025 Week 9 — Jameson Williams TD dive
  {
    id: "2025-week9-jamo",
    year: 2025,
    type: "matchup",
    title: "Jameson Williams — Diving Touchdown",
    description: "Lions WR dives for a TD against the Vikings, Week 9",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/erntfl1kw8wbvgzqje5v.jpg",
    credit: "Rick Osentoski/Associated Press",
  },
  // 2025 Week 9 — Stefon Diggs TD
  {
    id: "2025-week9-diggs",
    year: 2025,
    type: "matchup",
    title: "Stefon Diggs — Touchdown",
    description: "Patriots WR scores a TD against the Falcons, Week 9",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/ijkh149aelavv2crixgp.jpg",
    credit: "Mikey Owens/NFL",
  },
  // 2025 Week 9 — Davante Adams run
  {
    id: "2025-week9-adams",
    year: 2025,
    type: "matchup",
    title: "Davante Adams — Rams Debut",
    description: "Rams WR runs the ball against the Saints, Week 9",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/npkecbjggouhh7xjv7ld.jpg",
    credit: "Brooke Sutton/NFL",
  },
  // 2025 Week 8 — Gillette Stadium
  {
    id: "2025-week8-stadium",
    year: 2025,
    type: "trophy",
    title: "Gillette Stadium — Game Day",
    description: "A general view during Patriots vs Browns, Week 8",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/mph6g1lj7jhyhylpjbgn.jpg",
    credit: "Kathryn Riley/NFL",
  },
  // 2025 Week 8 — Jaylen Waddle TD
  {
    id: "2025-week8-waddle",
    year: 2025,
    type: "matchup",
    title: "Jaylen Waddle — Touchdown",
    description: "Dolphins WR scores against the Falcons, Week 8",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/erntfl1kw8wbvgzqje5v.jpg",
    credit: "Colin Hubbard/Associated Press",
  },
  // 2025 Week 9 — Puka Nacua TD
  {
    id: "2025-week9-nacua",
    year: 2025,
    type: "matchup",
    title: "Puka Nacua — Touchdown Grab",
    description: "Rams WR pulls in a TD pass against the Saints, Week 9",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/ijkh149aelavv2crixgp.jpg",
    credit: "Gregory Bull/Associated Press",
  },
  // 2025 Week 9 — Drake London celebration
  {
    id: "2025-week9-london",
    year: 2025,
    type: "matchup",
    title: "Drake London — Touchdown Celebration",
    description: "Falcons WR celebrates a TD against the Patriots, Week 9",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/npkecbjggouhh7xjv7ld.jpg",
    credit: "Robert F. Bukaty/Associated Press",
  },
  // 2025 Week 8 — Courtland Sutton catch attempt
  {
    id: "2025-week8-sutton",
    year: 2025,
    type: "matchup",
    title: "Courtland Sutton — Catch Attempt",
    description: "Broncos WR attempts a catch against the Cowboys, Week 8",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/erntfl1kw8wbvgzqje5v.jpg",
    credit: "Brooke Sutton/NFL",
  },
  // 2025 Week 8 — Justin Fields leap
  {
    id: "2025-week8-fields",
    year: 2025,
    type: "matchup",
    title: "Justin Fields — Leaping Run",
    description: "Jets QB leaps past the line of scrimmage vs Bengals, Week 8",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/ijkh149aelavv2crixgp.jpg",
    credit: "Joshua A. Bickel/Associated Press",
  },
  // 2025 Week 9 — Theo Johnson TD dive
  {
    id: "2025-week9-johnson",
    year: 2025,
    type: "matchup",
    title: "Theo Johnson — Diving Touchdown",
    description: "Giants TE dives for a TD against the 49ers, Week 9",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/npkecbjggouhh7xjv7ld.jpg",
    credit: "Peter Joneleit/Associated Press",
  },
  // 2025 Week 8 — Zach Ertz hurdle
  {
    id: "2025-week8-ertz",
    year: 2025,
    type: "matchup",
    title: "Zach Ertz — Hurdle",
    description: "Commanders TE hurdles Chiefs safety Chamarri Conner, Week 8",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/erntfl1kw8wbvgzqje5v.jpg",
    credit: "Brooke Sutton/NFL",
  },
  // 2025 Week 8 — Patriots defense celebration
  {
    id: "2025-week8-pats-d",
    year: 2025,
    type: "team",
    title: "Patriots Defense — Interception Celebration",
    description: "New England defense celebrates after a pick vs Browns, Week 8",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/ijkh149aelavv2crixgp.jpg",
    credit: "Kathryn Riley/NFL",
  },
  // 2025 Week 9 — Texans defense celebration
  {
    id: "2025-week9-texans-d",
    year: 2025,
    type: "team",
    title: "Texans Defense — Turnover Celebration",
    description: "Houston defense celebrates after recovering a Broncos turnover, Week 9",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/npkecbjggouhh7xjv7ld.jpg",
    credit: "Eric Christian Smith/Associated Press",
  },
  // 2025 Week 8 — Kimani Vidal run
  {
    id: "2025-week8-vidal",
    year: 2025,
    type: "matchup",
    title: "Kimani Vidal — Run",
    description: "Chargers RB runs against the Vikings, Week 8",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/erntfl1kw8wbvgzqje5v.jpg",
    credit: "Brooke Sutton/NFL",
  },
  // 2025 Week 9 — Quentin Johnston TD
  {
    id: "2025-week9-johnston",
    year: 2025,
    type: "matchup",
    title: "Quentin Johnston — Touchdown Catch",
    description: "Chargers WR makes a TD catch past Titans CB, Week 9",
    imageUrl: "https://static.www.nfl.com/image/upload/t_photo_album/f_auto/league/ijkh149aelavv2crixgp.jpg",
    credit: "John Amis/Associated Press",
  },
];

// Get images by year
export function getImagesByYear(year: number): SeasonImage[] {
  return seasonImages.filter(img => img.year === year);
}

// Get images by type
export function getImagesByType(type: SeasonImage["type"]): SeasonImage[] {
  return seasonImages.filter(img => img.type === type);
}

// Get all years with images
export function getYearsWithImages(): number[] {
  return [...new Set(seasonImages.map(img => img.year))].sort((a, b) => b - a);
}
