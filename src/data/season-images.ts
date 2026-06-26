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

// 2025 season images using free NFL/ESPN CDN sources
// These are placeholder images that can be replaced with real league photos
export const seasonImages: SeasonImage[] = [
  // 2025 Champion
  {
    id: "2025-champion",
    year: 2025,
    type: "champion",
    title: "2025 Champion: Best Pacheco Hoe",
    description: "jayyphilly takes the 2025 TINEZ LEAGUE championship",
    imageUrl: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/chi.png&w=200&h=200&c=1",
    thumbnailUrl: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/chi.png&w=100&h=100&c=1",
  },
  // 2025 Runner-Up
  {
    id: "2025-runner-up",
    year: 2025,
    type: "champion",
    title: "2025 Runner-Up: The Red Hare & Golden Dragon",
    description: "darnell finishes 2nd in the 2025 season",
    imageUrl: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/det.png&w=200&h=200&c=1",
    thumbnailUrl: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/det.png&w=100&h=100&c=1",
  },
  // 2025 Third Place
  {
    id: "2025-third",
    year: 2025,
    type: "champion",
    title: "2025 Third Place: LaFlamaBlanca",
    description: "scooter takes 3rd place in the 2025 season",
    imageUrl: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/mia.png&w=200&h=200&c=1",
    thumbnailUrl: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/mia.png&w=100&h=100&c=1",
  },
  // 2025 Draft
  {
    id: "2025-draft",
    year: 2025,
    type: "draft",
    title: "2025 Draft Day",
    description: "14 teams, 14 picks in Round 1 — Josh Allen went 11th overall",
    imageUrl: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/chi.png&w=200&h=200&c=1",
    thumbnailUrl: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/chi.png&w=100&h=100&c=1",
  },
  // 2025 Carlitos Team
  {
    id: "2025-carlitos-team",
    year: 2025,
    type: "team",
    title: "CC3PO — 2025 Season",
    description: "Carlitos finished 12th in the 2025 season",
    imageUrl: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/buf.png&w=200&h=200&c=1",
    thumbnailUrl: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/buf.png&w=100&h=100&c=1",
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
