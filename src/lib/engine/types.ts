// src/lib/engine/types.ts
// Engine v10 — types strikte

export type Category = "top" | "bottom" | "shoes" | "outerwear" | "accessory";
export type ItemType = string;
export type ColorFamily = string;
export type Gender = "male" | "female";

// ─── ITEM (data nga AI + tracking) ───────────────────────────────────────────
export type Item = {
  // Bazë
  id: string;
  category: Category;
  type: ItemType;
  color_family: ColorFamily;
  image_url?: string | null;

  // Tracking
  wear_count?: number;
  last_worn?: string | null;
  price?: number | null;

  // Structured AI tags
  formality_tier?: number | null;   // 1=athletic ... 5=formal tuxedo
  is_layer?: boolean | null;        // mund të jetë outer mbi diçka
  is_inner?: boolean | null;        // mund të jetë inner nën outer
  min_temp?: number | null;         // °C minimum që pranohet
  max_temp?: number | null;         // °C maksimum që pranohet
  style_tags?: string[] | null;     // ["athletic","casual","smart","formal","sporty","streetwear","elegant","minimal"]
};

export type Occasion = "work" | "date" | "casual" | "night_out" | "travel" | "gym";

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
  recentItemIds?: string[];          // ID të cope të përdorura në generations të fundit (anti-repeat)
};