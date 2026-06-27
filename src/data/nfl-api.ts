import { monitor } from "../lib/monitor";

// NFL Live Data — ESPN API (no auth) + Open-Meteo weather (no key) + RSS news
// All endpoints are public, no API keys required.

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

// ─── NFL Stadium Coordinates (for weather) ───
export interface Stadium {
  name: string;
  team: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  roof: "open" | "closed" | "retractable";
}

export const stadiums: Record<string, Stadium> = {
  ARI: { name: "State Farm Stadium", team: "Arizona Cardinals", city: "Glendale", state: "AZ", lat: 33.5276, lng: -112.2626, roof: "retractable" },
  ATL: { name: "Mercedes-Benz Stadium", team: "Atlanta Falcons", city: "Atlanta", state: "GA", lat: 33.7554, lng: -84.4009, roof: "retractable" },
  BAL: { name: "M&T Bank Stadium", team: "Baltimore Ravens", city: "Baltimore", state: "MD", lat: 39.2780, lng: -76.6227, roof: "open" },
  BUF: { name: "Highmark Stadium", team: "Buffalo Bills", city: "Orchard Park", state: "NY", lat: 42.7738, lng: -78.7870, roof: "open" },
  CAR: { name: "Bank of America Stadium", team: "Carolina Panthers", city: "Charlotte", state: "NC", lat: 35.2258, lng: -80.8528, roof: "open" },
  CHI: { name: "Soldier Field", team: "Chicago Bears", city: "Chicago", state: "IL", lat: 41.8623, lng: -87.6167, roof: "open" },
  CIN: { name: "Paycor Stadium", team: "Cincinnati Bengals", city: "Cincinnati", state: "OH", lat: 39.0955, lng: -84.5161, roof: "open" },
  CLE: { name: "Huntington Bank Field", team: "Cleveland Browns", city: "Cleveland", state: "OH", lat: 41.5061, lng: -81.6995, roof: "open" },
  DAL: { name: "AT&T Stadium", team: "Dallas Cowboys", city: "Arlington", state: "TX", lat: 32.7473, lng: -97.0945, roof: "retractable" },
  DEN: { name: "Empower Field at Mile High", team: "Denver Broncos", city: "Denver", state: "CO", lat: 39.7439, lng: -105.0201, roof: "open" },
  DET: { name: "Ford Field", team: "Detroit Lions", city: "Detroit", state: "MI", lat: 42.3400, lng: -83.0456, roof: "closed" },
  GB: { name: "Lambeau Field", team: "Green Bay Packers", city: "Green Bay", state: "WI", lat: 44.5013, lng: -88.0622, roof: "open" },
  HOU: { name: "NRG Stadium", team: "Houston Texans", city: "Houston", state: "TX", lat: 29.6847, lng: -95.4107, roof: "retractable" },
  IND: { name: "Lucas Oil Stadium", team: "Indianapolis Colts", city: "Indianapolis", state: "IN", lat: 39.7601, lng: -86.1639, roof: "retractable" },
  JAX: { name: "EverBank Stadium", team: "Jacksonville Jaguars", city: "Jacksonville", state: "FL", lat: 30.3239, lng: -81.6373, roof: "open" },
  KC: { name: "GEHA Field at Arrowhead Stadium", team: "Kansas City Chiefs", city: "Kansas City", state: "MO", lat: 39.0489, lng: -94.4839, roof: "open" },
  LAC: { name: "SoFi Stadium", team: "Los Angeles Chargers", city: "Inglewood", state: "CA", lat: 33.9535, lng: -118.3390, roof: "closed" },
  LAR: { name: "SoFi Stadium", team: "Los Angeles Rams", city: "Inglewood", state: "CA", lat: 33.9535, lng: -118.3390, roof: "closed" },
  LV: { name: "Allegiant Stadium", team: "Las Vegas Raiders", city: "Las Vegas", state: "NV", lat: 36.0907, lng: -115.1834, roof: "closed" },
  MIA: { name: "Hard Rock Stadium", team: "Miami Dolphins", city: "Miami Gardens", state: "FL", lat: 25.9580, lng: -80.2389, roof: "open" },
  MIN: { name: "U.S. Bank Stadium", team: "Minnesota Vikings", city: "Minneapolis", state: "MN", lat: 44.9738, lng: -93.2574, roof: "closed" },
  NE: { name: "Gillette Stadium", team: "New England Patriots", city: "Foxborough", state: "MA", lat: 42.0909, lng: -71.2643, roof: "open" },
  NO: { name: "Caesars Superdome", team: "New Orleans Saints", city: "New Orleans", state: "LA", lat: 29.9509, lng: -90.0812, roof: "closed" },
  NYG: { name: "MetLife Stadium", team: "New York Giants", city: "East Rutherford", state: "NJ", lat: 40.8135, lng: -74.0745, roof: "open" },
  NYJ: { name: "MetLife Stadium", team: "New York Jets", city: "East Rutherford", state: "NJ", lat: 40.8135, lng: -74.0745, roof: "open" },
  PHI: { name: "Lincoln Financial Field", team: "Philadelphia Eagles", city: "Philadelphia", state: "PA", lat: 39.9008, lng: -75.1675, roof: "open" },
  PIT: { name: "Acrisure Stadium", team: "Pittsburgh Steelers", city: "Pittsburgh", state: "PA", lat: 40.4468, lng: -80.0158, roof: "open" },
  SEA: { name: "Lumen Field", team: "Seattle Seahawks", city: "Seattle", state: "WA", lat: 47.5952, lng: -122.3316, roof: "open" },
  SF: { name: "Levi's Stadium", team: "San Francisco 49ers", city: "Santa Clara", state: "CA", lat: 37.4030, lng: -121.9696, roof: "open" },
  TB: { name: "Raymond James Stadium", team: "Tampa Bay Buccaneers", city: "Tampa", state: "FL", lat: 27.9759, lng: -82.5033, roof: "open" },
  TEN: { name: "Nissan Stadium", team: "Tennessee Titans", city: "Nashville", state: "TN", lat: 36.1665, lng: -86.7713, roof: "open" },
  WAS: { name: "Northwest Stadium", team: "Washington Commanders", city: "Landover", state: "MD", lat: 38.9077, lng: -76.8645, roof: "open" },
};

// ─── ESPN Scoreboard Types ───
export interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  status: {
    type: {
      id: string;
      name: string;
      state: "pre" | "in" | "post";
      completed: boolean;
      description: string;
      detail: string;
      shortDetail: string;
    };
    displayClock: string;
    period: number;
  };
  competitions: Array<{
    competitors: Array<{
      team: { abbreviation: string; displayName: string; logo: string };
      score: string;
      homeAway: "home" | "away";
      winner: boolean;
      records: Array<{ summary: string }>;
    }>;
    venue?: { fullName: string };
    status: {
      type: { state: string; description: string };
      displayClock: string;
      period: number;
    };
  }>;
}

export interface ESPNScoreboard {
  week: { number: number };
  season: { year: number; type: number };
  events: ESPNEvent[];
}

// ─── Weather Types ───
export interface WeatherForecast {
  temperature: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  weatherLabel: string;
}

const WMO_CODES: Record<number, string> = {
  0: "Clear", 1: "Mostly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Foggy", 48: "Foggy",
  51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle",
  56: "Freezing Drizzle", 57: "Freezing Drizzle",
  61: "Light Rain", 63: "Rain", 65: "Heavy Rain",
  66: "Freezing Rain", 67: "Freezing Rain",
  71: "Light Snow", 73: "Snow", 75: "Heavy Snow",
  77: "Snow Grains",
  80: "Light Showers", 81: "Showers", 82: "Heavy Showers",
  85: "Light Snow Showers", 86: "Snow Showers",
  95: "Thunderstorm", 96: "Thunderstorm + Hail", 99: "Thunderstorm + Hail",
};

// ─── API Functions ───

/** Fetch the NFL scoreboard for a given week */
export async function fetchScoreboard(week?: number): Promise<ESPNScoreboard> {
  const url = week
    ? `${ESPN_BASE}/scoreboard?week=${week}`
    : `${ESPN_BASE}/scoreboard`;
  const result = await monitor.fetch<ESPNScoreboard>("ESPN", url, {
    headers: { "User-Agent": "TINEZ/1.0" },
  });
  if (!result.ok || !result.data) throw new Error(result.error ?? `ESPN API error`);
  return result.data;
}

/** Fetch weather for a stadium location */
export async function fetchWeather(lat: number, lng: number): Promise<WeatherForecast | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&forecast_days=1`;
  const result = await monitor.fetch<any>("OpenMeteo", url);
  if (!result.ok || !result.data) return null;
  const c = result.data.current;
  return {
    temperature: c.temperature_2m,
    precipitation: c.precipitation || 0,
    windSpeed: c.wind_speed_10m,
    weatherCode: c.weather_code,
    weatherLabel: WMO_CODES[c.weather_code] || "Unknown",
  };
}

/** Fetch weather for a team's home stadium */
export async function fetchTeamWeather(teamAbbr: string): Promise<WeatherForecast | null> {
  const stadium = stadiums[teamAbbr.toUpperCase()];
  if (!stadium || stadium.roof !== "open") return null;
  return fetchWeather(stadium.lat, stadium.lng);
}

/** Get weather emoji based on conditions */
export function getWeatherEmoji(code: number): string {
  if (code >= 95) return "⛈️"; // Thunderstorm
  if (code >= 71) return "❄️"; // Snow
  if (code >= 61) return "🌧️"; // Rain
  if (code >= 51) return "🌦️"; // Drizzle
  if (code >= 45) return "🌫️"; // Fog
  if (code >= 20) return "🌨️"; // Showers
  if (code <= 2) return "☀️"; // Clear
  if (code <= 3) return "☁️"; // Cloudy
  return "🌤️";
}

/** Get weather impact on fantasy scoring */
export function getWeatherImpact(weather: WeatherForecast): { label: string; color: string; description: string } {
  if (weather.weatherCode >= 95) return { label: "Severe", color: "text-red-400", description: "Thunderstorms — expect low scoring" };
  if (weather.weatherCode >= 71) return { label: "Snow", color: "text-blue-300", description: "Snow game — running backs get a boost" };
  if (weather.precipitation > 5) return { label: "Heavy Rain", color: "text-blue-400", description: "Heavy rain — passing game impacted" };
  if (weather.precipitation > 1) return { label: "Rain", color: "text-cyan-400", description: "Rain — slight passing disadvantage" };
  if (weather.windSpeed > 30) return { label: "Windy", color: "text-amber-400", description: "Strong winds — deep passing affected" };
  if (weather.windSpeed > 20) return { label: "Breezy", color: "text-amber-300", description: "Breezy — minor wind factor" };
  return { label: "Good", color: "text-emerald-400", description: "Clear conditions — normal scoring" };
}

// ─── RSS News ───
export interface NewsItem {
  title: string;
  link: string;
  source: string;
  date: string;
  snippet: string;
}

const RSS_FEEDS = [
  { url: "https://www.espn.com/espn/rss/nfl/news", source: "ESPN" },
  { url: "https://www.nfl.com/rss/news", source: "NFL.com" },
  { url: "https://www.rotoworld.com/rss/feed", source: "Rotoworld" },
];

/** Fetch and parse RSS news feeds */
export async function fetchNflNews(limit = 20): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  for (const feed of RSS_FEEDS) {
    const result = await monitor.fetch<string>("RSS", feed.url, {
      headers: { "User-Agent": "TINEZ/1.0" },
    });
    if (!result.ok || !result.data) continue;
    const text = result.data;

    // Simple RSS XML parser (no dependencies)
    const items = text.split("<item>").slice(1);
    for (const item of items) {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
      const link = item.match(/<link>(.*?)<\/link>/);
      const desc = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/);
      const date = item.match(/<pubDate>(.*?)<\/pubDate>/);

      if (title && link) {
        allItems.push({
          title: title[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
          link: link[1].trim(),
          source: feed.source,
          date: date ? date[1].trim() : "",
          snippet: desc ? desc[1].replace(/<[^>]*>/g, "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().substring(0, 200) : "",
        });
      }
    }
  }

  // Sort by date (newest first) and limit
  return allItems
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    })
    .slice(0, limit);
}

/** Get the current NFL week number */
export async function getCurrentWeek(): Promise<number> {
  try {
    const sb = await fetchScoreboard();
    return sb.week.number;
  } catch {
    return 1;
  }
}
