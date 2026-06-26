export interface NFLTeam {
  name: string;
  shortName: string;
  city: string;
  xHandle: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string;
}

export const nflTeams: NFLTeam[] = [
  { name: "Arizona Cardinals", shortName: "ARI", city: "Arizona", xHandle: "AZCardinals", primaryColor: "#97233F", secondaryColor: "#000000", logo: "🏈" },
  { name: "Atlanta Falcons", shortName: "ATL", city: "Atlanta", xHandle: "AtlantaFalcons", primaryColor: "#A71930", secondaryColor: "#000000", logo: "🏈" },
  { name: "Baltimore Ravens", shortName: "BAL", city: "Baltimore", xHandle: "Ravens", primaryColor: "#241773", secondaryColor: "#9E7C0C", logo: "🏈" },
  { name: "Buffalo Bills", shortName: "BUF", city: "Buffalo", xHandle: "BuffaloBills", primaryColor: "#00338D", secondaryColor: "#C60C30", logo: "🏈" },
  { name: "Carolina Panthers", shortName: "CAR", city: "Carolina", xHandle: "Panthers", primaryColor: "#0085CA", secondaryColor: "#000000", logo: "🏈" },
  { name: "Chicago Bears", shortName: "CHI", city: "Chicago", xHandle: "ChicagoBears", primaryColor: "#0B162A", secondaryColor: "#DC4405", logo: "🏈" },
  { name: "Cincinnati Bengals", shortName: "CIN", city: "Cincinnati", xHandle: "Bengals", primaryColor: "#FB4F14", secondaryColor: "#000000", logo: "🏈" },
  { name: "Cleveland Browns", shortName: "CLE", city: "Cleveland", xHandle: "Browns", primaryColor: "#311D00", secondaryColor: "#FF3C00", logo: "🏈" },
  { name: "Dallas Cowboys", shortName: "DAL", city: "Dallas", xHandle: "dallascowboys", primaryColor: "#003594", secondaryColor: "#869397", logo: "🏈" },
  { name: "Denver Broncos", shortName: "DEN", city: "Denver", xHandle: "Broncos", primaryColor: "#FB4F14", secondaryColor: "#002244", logo: "🏈" },
  { name: "Detroit Lions", shortName: "DET", city: "Detroit", xHandle: "Lions", primaryColor: "#0076B6", secondaryColor: "#B0B7BC", logo: "🏈" },
  { name: "Green Bay Packers", shortName: "GB", city: "Green Bay", xHandle: "packers", primaryColor: "#203731", secondaryColor: "#FFB612", logo: "🏈" },
  { name: "Houston Texans", shortName: "HOU", city: "Houston", xHandle: "HoustonTexans", primaryColor: "#03202F", secondaryColor: "#A71930", logo: "🏈" },
  { name: "Indianapolis Colts", shortName: "IND", city: "Indianapolis", xHandle: "Colts", primaryColor: "#002C5F", secondaryColor: "#A2AAAD", logo: "🏈" },
  { name: "Jacksonville Jaguars", shortName: "JAX", city: "Jacksonville", xHandle: "Jaguars", primaryColor: "#006778", secondaryColor: "#D7A22A", logo: "🏈" },
  { name: "Kansas City Chiefs", shortName: "KC", city: "Kansas City", xHandle: "Chiefs", primaryColor: "#E31837", secondaryColor: "#FFB612", logo: "🏈" },
  { name: "Las Vegas Raiders", shortName: "LV", city: "Las Vegas", xHandle: "Raiders", primaryColor: "#000000", secondaryColor: "#A5ACAF", logo: "🏈" },
  { name: "Los Angeles Chargers", shortName: "LAC", city: "LA Chargers", xHandle: "chargers", primaryColor: "#0080C6", secondaryColor: "#FFC20E", logo: "🏈" },
  { name: "Los Angeles Rams", shortName: "LAR", city: "LA Rams", xHandle: "RamsNFL", primaryColor: "#003594", secondaryColor: "#FFA300", logo: "🏈" },
  { name: "Miami Dolphins", shortName: "MIA", city: "Miami", xHandle: "MiamiDolphins", primaryColor: "#008E97", secondaryColor: "#FC4C02", logo: "🏈" },
  { name: "Minnesota Vikings", shortName: "MIN", city: "Minnesota", xHandle: "Vikings", primaryColor: "#4F2683", secondaryColor: "#FFC62F", logo: "🏈" },
  { name: "New England Patriots", shortName: "NE", city: "New England", xHandle: "Patriots", primaryColor: "#002244", secondaryColor: "#C60C30", logo: "🏈" },
  { name: "New Orleans Saints", shortName: "NO", city: "New Orleans", xHandle: "Saints", primaryColor: "#D3BC8D", secondaryColor: "#101820", logo: "🏈" },
  { name: "New York Giants", shortName: "NYG", city: "NY Giants", xHandle: "Giants", primaryColor: "#0B2265", secondaryColor: "#A71930", logo: "🏈" },
  { name: "New York Jets", shortName: "NYJ", city: "NY Jets", xHandle: "nyjets", primaryColor: "#125740", secondaryColor: "#000000", logo: "🏈" },
  { name: "Philadelphia Eagles", shortName: "PHI", city: "Philadelphia", xHandle: "Eagles", primaryColor: "#004C54", secondaryColor: "#A5ACAF", logo: "🏈" },
  { name: "Pittsburgh Steelers", shortName: "PIT", city: "Pittsburgh", xHandle: "steelers", primaryColor: "#FFB612", secondaryColor: "#000000", logo: "🏈" },
  { name: "San Francisco 49ers", shortName: "SF", city: "San Francisco", xHandle: "49ers", primaryColor: "#AA0000", secondaryColor: "#B3995D", logo: "🏈" },
  { name: "Seattle Seahawks", shortName: "SEA", city: "Seattle", xHandle: "Seahawks", primaryColor: "#002244", secondaryColor: "#69BE28", logo: "🏈" },
  { name: "Tampa Bay Buccaneers", shortName: "TB", city: "Tampa Bay", xHandle: "Buccaneers", primaryColor: "#D50A0A", secondaryColor: "#FF7900", logo: "🏈" },
  { name: "Tennessee Titans", shortName: "TEN", city: "Tennessee", xHandle: "Titans", primaryColor: "#0C2340", secondaryColor: "#4B92DB", logo: "🏈" },
  { name: "Washington Commanders", shortName: "WAS", city: "Washington", xHandle: "Commanders", primaryColor: "#5A1414", secondaryColor: "#FFB612", logo: "🏈" },
];

export function getNFLTeam(abbr: string): NFLTeam | undefined {
  return nflTeams.find(t => t.shortName === abbr.toUpperCase());
}
