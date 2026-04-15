// src/lib/engine/types.ts

export type Category = "top" | "bottom" | "shoes" | "dress" | "skirt" | "bag" | "outerwear";
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
  | "gym"
  // Female occasions
  | "brunch"
  | "gala"
  | "office_chic";

export type OutfitLabel = "Safe" | "Colorful";

export type OutfitPicks = {
  top: Item;
  bottom: Item;
  shoes: Item;
  outerwear?: Item;
  bag?: Item;
};

export type OutfitBreakdown = {
  occasion: number;
  harmony: number;
  variety: number;
  balance: number;
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
};

export type GenerateOptions = {
  pinnedTopId?: string | null;
  pinnedBottomId?: string | null;
  pinnedShoesId?: string | null;
  gender?: Gender;
};