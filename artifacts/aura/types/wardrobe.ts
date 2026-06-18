export type ClothingCategory =
  | "tops"
  | "bottoms"
  | "dresses"
  | "shoes"
  | "accessories"
  | "outerwear"
  | "activewear";

export type Season = "spring" | "summer" | "fall" | "winter";

export type Occasion = "casual" | "work" | "formal" | "athletic" | "date";

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  colorName: string;
  colorHex: string;
  type: string;
  season: Season[];
  occasion: Occasion[];
  tags: string[];
  brand?: string;
  imageUri: string;
  addedAt: string;
  wornCount?: number;
  lastWornAt?: string;
}

export interface SavedOutfit {
  id: string;
  name: string;
  itemIds: string[];
  description: string;
  tips: string;
  occasion: string;
  weather?: string;
  savedAt: string;
}

export interface PlannedDate {
  date: string;
  outfitId: string;
}

export type WeatherCondition =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "snowy"
  | "hot"
  | "cold"
  | "windy";

export type OccasionType =
  | "casual"
  | "work"
  | "formal"
  | "date"
  | "athletic"
  | "travel";

export interface AnalyzedClothing {
  name: string;
  category: string;
  colorName: string;
  colorHex: string;
  type: string;
  season: string[];
  occasion: string[];
  tags: string[];
  brand?: string | null;
}

export interface OutfitSuggestion {
  name: string;
  itemIds: string[];
  description: string;
  tips: string;
  occasion?: string;
  weather?: string;
}

export const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  dresses: "Dresses",
  shoes: "Shoes",
  accessories: "Accessories",
  outerwear: "Outerwear",
  activewear: "Activewear",
};

export const WEATHER_LABELS: Record<WeatherCondition, string> = {
  sunny: "Sunny",
  cloudy: "Cloudy",
  rainy: "Rainy",
  snowy: "Snowy",
  hot: "Hot",
  cold: "Cold",
  windy: "Windy",
};

export const OCCASION_LABELS: Record<OccasionType, string> = {
  casual: "Casual",
  work: "Work",
  formal: "Formal",
  date: "Date Night",
  athletic: "Athletic",
  travel: "Travel",
};
