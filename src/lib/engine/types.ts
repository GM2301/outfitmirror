// src/lib/engine/types.ts

export type Category = "top" | "bottom" | "shoes";
export type ItemType = string;
export type ColorFamily = string;

export type Item = {
  id: string;
  category: Category;
  type: ItemType;
  color_family: ColorFamily;
  image_url?: string | null;
};

export type Occasion = "work" | "date" | "casual" | "night_out" | "travel" | "gym";

// Bold u hoq - vetëm Safe dhe Colorful
export type OutfitLabel = "Safe" | "Colorful";

export type OutfitPicks = {
  top: Item;
  bottom: Item;
  shoes: Item;
};

export type OutfitBreakdown = {
  occasion: number;
  harmony: number;
  variety: number;
  balance: number;
};

export type Outfit = {
  label: OutfitLabel;
  occasion: Occasion;
  score: number;
  picks: OutfitPicks;
  breakdown: OutfitBreakdown;
  outfit_hash: string;
};

export type GenerateOptions = {
  pinnedTopId?: string | null;
  pinnedBottomId?: string | null;
  pinnedShoesId?: string | null;
};