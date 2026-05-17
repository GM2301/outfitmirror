// src/lib/engine/types.ts
// ════════════════════════════════════════════════════════════════════════════
// ENGINE V12 — TYPES (HARD BREAK nga v11)
//
// CHANGES nga v11:
// - votedUp/votedDown (hash) → votedItemIds: { liked, disliked }
// - pinnedTopId/BottomId/ShoesId → pinnedItemIds: string[]
//
// Asnjë backward compat me legacy. AppPageClient do duhet refactor.
// ════════════════════════════════════════════════════════════════════════════

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
  formality_tier?: number | null;
  is_layer?: boolean | null;
  is_inner?: boolean | null;
  min_temp?: number | null;
  max_temp?: number | null;
  style_tags?: string[] | null;
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

// ─── GENERATE OPTIONS (V12 — HARD BREAK) ─────────────────────────────────────
export type VotedItemIds = {
  liked: string[];      // item IDs që user-i ka votuar 👍 (per-item, jo per-outfit)
  disliked: string[];   // item IDs që user-i ka votuar 👎 — EXCLUDE nga pool
};

export type GenerateOptions = {
  // Smart Swap / Lock — kyç cope specifike te outfit (any slot)
  pinnedItemIds?: string[];

  // Context
  gender?: Gender;
  style?: string;
  tempC?: number;
  includeAccessories?: boolean;

  // Vote learning per-item (v12 — replace legacy hash system)
  votedItemIds?: VotedItemIds;

  // Anti-repeat memory
  recentItemIds?: string[];
};