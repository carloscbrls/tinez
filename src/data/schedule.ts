export interface NFLGame {
  id: string;
  home_team: string;
  away_team: string;
  date: string;
  time: string;
  week: number;
  venue: string;
  status: string;
  home_score?: number;
  away_score?: number;
}

export async function fetchNFLSchedule(week: number = 1): Promise<NFLGame[]> {
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2025&seasontype=2&week=${week}`
  );
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
  const data = await res.json();

  return (data.events || []).map((e: any) => {
    const comp = e.competitions?.[0] || {};
    const home = comp.competitors?.find((c: any) => c.homeAway === "home") || {};
    const away = comp.competitors?.find((c: any) => c.homeAway === "away") || {};
    
    return {
      id: e.id,
      home_team: home.team?.abbreviation || "TBD",
      away_team: away.team?.abbreviation || "TBD",
      date: e.date?.split("T")[0] || "",
      time: e.date?.split("T")[1]?.replace(":00Z", "")?.replace("T", " ") || "TBD",
      week: week,
      venue: comp.venue?.fullName || "TBD",
      status: e.status?.type?.description || "Scheduled",
      home_score: home.score ? parseInt(home.score) : undefined,
      away_score: away.score ? parseInt(away.score) : undefined,
    };
  });
}

export function formatGameTime(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }) + " ET";
}

export function formatGameDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
