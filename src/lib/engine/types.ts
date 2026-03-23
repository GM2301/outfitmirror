// src/lib/engine/types.ts

export type Category = "top" | "bottom" | "shoes";

// MVP: e lejmë flexible (string), mos u blloko me enum-e.
export type ItemType = string;

// MVP: e lejmë string që mos me u prish kur shkruan user çfarëdo
export type ColorFamily = string;

export type Item = {
  id: string;
  category: Category;
  type: ItemType;
  color_family: ColorFamily;
  image_url?: string | null;
};

export type Occasion = "work" | "date" | "casual" | "night_out" | "travel" | "gym";
export type OutfitLabel = "Safe" | "Colorful" | "Bold";

export type OutfitPicks = {
  top: Item;
  bottom: Item;
  shoes: Item;
};

export type OutfitBreakdown = {
  occasion: number; // /40
  harmony: number;  // /30
  variety: number;  // /20
  balance: number;  // /10
};

export type Outfit = {
  label: OutfitLabel;
  occasion: Occasion;
  score: number;        // /100
  picks: OutfitPicks;   // ✅ kjo i duhet OutfitCard
  breakdown: OutfitBreakdown;
  outfit_hash: string;
};

export type GenerateOptions = {
  pinnedTopId?: string | null;
  pinnedBottomId?: string | null;
  pinnedShoesId?: string | null;
};