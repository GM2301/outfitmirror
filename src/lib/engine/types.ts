// src/lib/engine/types.ts

export type Category = "top" | "bottom" | "shoes" | "outerwear" | "accessory";
export type ItemType = string;
export type ColorFamily = string;
export type Gender = "male" | "female";

export type Item = {
  id: string;
  category: Category;
  type: ItemType;
  color_family: ColorFamily;
  image_url?: string | null;
  wear_count?: number;
  last_worn?: string | null;
  price?: number | null;
};

export type Occasion =
  | "work"
  | "date"
  | "casual"
  | "night_out"
  | "travel"
  | "gym";

export type OutfitLabel = "Safe" | "Colorful";

export type OutfitPicks = {
  top: Item;
  bottom: Item;
  shoes: Item;
  outer?: Item;
  accessories?: Item[];
};

export type OutfitBreakdown = {
  occasion: number;
  harmony: number;
  variety: number;
  balance: number;
  style?: number;
  explanation?: string;
};

export type Outfit = {
  label: OutfitLabel;
  occasion: Occasion;
  score: number;
  picks: OutfitPicks;
  breakdown: OutfitBreakdown;
  outfit_hash: string;
  why?: string;
  layerExplanation?: string;
};

export type GenerateOptions = {
  pinnedTopId?: string | null;
  pinnedBottomId?: string | null;
  pinnedShoesId?: string | null;
  gender?: Gender;
  style?: string;
  tempC?: number;
  includeAccessories?: boolean;
  votedUp?: string[];
  votedDown?: string[];
};