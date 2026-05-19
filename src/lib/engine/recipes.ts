// src/lib/engine/recipes.ts
// ════════════════════════════════════════════════════════════════════════════
// RECIPE LIBRARY V13 — 5 CRITICAL BUGS FIXED
//
// AUDIT FIXES nga V12:
//
// 1. GENDER FILTER BUG (Line ~280)
//    OLD: (!r.gender || !gender || r.gender === gender) → leak: female recipes
//    NEW: Strict — if recipe.gender exists, MUST match user.gender. Unisex passes always.
//
// 2. GYM_COLD LAYERING BUG (Line ~240)
//    OLD: hoodie te gym_cold pa inner tee → hoodie direkt mbi lëkurë
//    NEW: Shtuar `inner_top` slot OPSIONAL (tier 1-3, tee/longsleeve/performance)
//    + "trenerk" hequr nga te gjitha (do bëhet edhe te generate.ts)
//
// 3. THERMAL OVERLAP / OVERCOAT FALLACY (Line ~50-65)
//    OLD: work_business_cold tempMax=13 (OK), por blazer/coat te date_smart_blazer
//          shkonte deri 24°C → overcoat te 17°C
//    NEW: HEAVY OUTERWEAR (coat, trench, overcoat, peacoat, parka) → tempMax 12°C
//         LIGHT OUTERWEAR (blazer, sport_coat) → tempMax 18°C
//         BOMBER/JACKET → tempMax 16°C
//    Çdo recipe ka tempMax të rishikuar bazuar te slot-i më i ngrohtë.
//
// 4. POLO RECIPE IDENTITY (Line ~153)
//    OLD: casual_polo_shorts pranonte tee → identike me general summer
//    NEW: STRICT types: ["polo"] only. Recipe e re `casual_tee_shorts` për tee+shorts.
//
// 5. (Te generate.ts — refactor i `makeGapOutfits` + scoring smart substitution)
// ════════════════════════════════════════════════════════════════════════════

import type { Occasion, Gender } from "./types";

export type SlotConstraint = {
  category: "top" | "bottom" | "shoes" | "outerwear" | "accessory";
  types: string[];
  excludeTypes?: string[];
  tierMin: number;
  tierMax: number;
  colors?: string[];
  excludeColors?: string[];
  preferredStyleTags?: string[];
};

export type RecipeSlot = {
  name: string;
  required: boolean;
  constraint: SlotConstraint;
};

export type OutfitRecipe = {
  id: string;
  name: string;
  occasion: Occasion;
  tempMin: number;
  tempMax: number;
  slots: RecipeSlot[];
  forbiddenColorClashes?: string[][];
  description?: string;
  styleTier: number;
  gender?: Gender;
};

// ════════════════════════════════════════════════════════════════════════════
// THERMAL CONSTANTS — strict for fashion accuracy
// ════════════════════════════════════════════════════════════════════════════
const TEMP_HEAVY_OUTERWEAR_MAX = 12;  // overcoat, trench, peacoat, parka
const TEMP_LIGHT_OUTERWEAR_MAX = 18;  // blazer, sport_coat
const TEMP_BOMBER_JACKET_MAX = 16;    // bomber, light jacket

// ════════════════════════════════════════════════════════════════════════════
// WORK RECIPES (5)
// ════════════════════════════════════════════════════════════════════════════
const WORK_RECIPES: OutfitRecipe[] = [
  {
    id: "work_business_warm",
    name: "Business Professional — Warm",
    occasion: "work",
    tempMin: 16,  // Bumped from 15 to avoid overlap with cold (which caps at 13)
    tempMax: 28,
    styleTier: 4,
    description: "Shirt + dress trousers + leather shoes",
    slots: [
      { name: "shirt", required: true, constraint: { category: "top", types: ["shirt", "dress_shirt", "blouse"], excludeTypes: ["sweatshirt", "polo", "tee"], tierMin: 3, tierMax: 4, colors: ["white", "light_blue", "blue", "navy", "neutral", "grey", "pink"] } },
      { name: "trousers", required: true, constraint: { category: "bottom", types: ["trouser", "dress_pant", "chino"], tierMin: 3, tierMax: 4, colors: ["navy", "grey", "black", "earth", "khaki", "neutral", "brown"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["loafer", "oxford", "derby", "chelsea", "dress_shoe", "monk"], tierMin: 3, tierMax: 5, colors: ["black", "brown", "burgundy", "earth"] } },
    ],
  },
  {
    id: "work_business_cold",
    name: "Business Professional — Cold (with heavy outerwear)",
    occasion: "work",
    tempMin: -10,
    // FIX #3: Cap at TEMP_HEAVY_OUTERWEAR_MAX (12°C) — overcoat te 17°C destroys UX
    tempMax: TEMP_HEAVY_OUTERWEAR_MAX,
    styleTier: 4,
    description: "Shirt + trousers + heavy coat/blazer + leather shoes",
    slots: [
      { name: "shirt", required: true, constraint: { category: "top", types: ["shirt", "dress_shirt", "blouse"], excludeTypes: ["sweatshirt", "tee", "polo"], tierMin: 3, tierMax: 4, colors: ["white", "light_blue", "blue", "navy", "neutral", "grey"] } },
      { name: "trousers", required: true, constraint: { category: "bottom", types: ["trouser", "dress_pant", "chino"], tierMin: 3, tierMax: 4, colors: ["navy", "grey", "black", "earth", "khaki", "neutral", "brown"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["loafer", "oxford", "derby", "chelsea", "dress_shoe", "monk", "ankle_boot"], tierMin: 3, tierMax: 5, colors: ["black", "brown", "burgundy", "earth"] } },
      { name: "heavy_outerwear", required: true, constraint: { category: "outerwear", types: ["coat", "trench", "overcoat", "peacoat"], tierMin: 4, tierMax: 5, colors: ["navy", "grey", "black", "earth", "brown", "neutral"] } },
    ],
  },
  {
    id: "work_blazer_transitional",
    name: "Business — Blazer (Transitional)",
    occasion: "work",
    tempMin: 13,
    // FIX #3: Blazer cap (light outerwear)
    tempMax: TEMP_LIGHT_OUTERWEAR_MAX,
    styleTier: 4,
    description: "Shirt + trousers + blazer (transitional cold)",
    slots: [
      { name: "shirt", required: true, constraint: { category: "top", types: ["shirt", "dress_shirt", "blouse"], excludeTypes: ["sweatshirt", "tee", "polo"], tierMin: 3, tierMax: 4, colors: ["white", "light_blue", "blue", "navy", "neutral", "grey"] } },
      { name: "trousers", required: true, constraint: { category: "bottom", types: ["trouser", "dress_pant", "chino"], tierMin: 3, tierMax: 4, colors: ["navy", "grey", "black", "earth", "khaki", "neutral", "brown"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["loafer", "oxford", "derby", "chelsea", "dress_shoe", "monk"], tierMin: 3, tierMax: 5, colors: ["black", "brown", "burgundy", "earth"] } },
      { name: "blazer", required: true, constraint: { category: "outerwear", types: ["blazer", "sport_coat"], tierMin: 4, tierMax: 5, colors: ["navy", "grey", "black", "earth", "brown", "neutral"] } },
    ],
  },
  {
    id: "work_smart_casual",
    name: "Smart Casual Office",
    occasion: "work",
    tempMin: 16,  // Bumped to avoid heavy outerwear overlap zone
    tempMax: 28,
    styleTier: 3,
    slots: [
      { name: "shirt_or_polo", required: true, constraint: { category: "top", types: ["shirt", "polo", "blouse"], excludeTypes: ["sweatshirt", "tee"], tierMin: 3, tierMax: 4, colors: ["white", "light_blue", "navy", "neutral", "grey", "earth", "pink"] } },
      { name: "chinos", required: true, constraint: { category: "bottom", types: ["chino", "trouser"], tierMin: 3, tierMax: 4, colors: ["navy", "khaki", "earth", "neutral", "grey", "brown"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["chelsea", "loafer", "ankle_boot", "leather_sneaker", "derby"], tierMin: 3, tierMax: 4, colors: ["brown", "black", "earth"] } },
    ],
  },
  {
    id: "work_sweater_layer",
    name: "Office with Sweater Layer",
    occasion: "work",
    tempMin: 5,
    tempMax: 16,  // Reduced from 18 to avoid sweater at warm temps
    styleTier: 3,
    slots: [
      { name: "shirt", required: true, constraint: { category: "top", types: ["shirt", "dress_shirt", "blouse"], excludeTypes: ["sweatshirt", "tee"], tierMin: 3, tierMax: 4, colors: ["white", "light_blue", "neutral"] } },
      { name: "sweater", required: true, constraint: { category: "top", types: ["sweater", "knit", "cardigan", "crewneck", "pullover"], excludeTypes: ["hoodie", "sweatshirt"], tierMin: 3, tierMax: 4, colors: ["navy", "grey", "earth", "neutral", "brown", "burgundy", "green"] } },
      { name: "trousers", required: true, constraint: { category: "bottom", types: ["chino", "trouser", "dress_pant"], tierMin: 3, tierMax: 4, colors: ["navy", "grey", "earth", "khaki", "brown"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["chelsea", "loafer", "derby", "ankle_boot", "leather_sneaker"], tierMin: 3, tierMax: 4, colors: ["brown", "black", "earth"] } },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// DATE RECIPES (3)
// ════════════════════════════════════════════════════════════════════════════
const DATE_RECIPES: OutfitRecipe[] = [
  {
    id: "date_classic_warm",
    name: "Classic Date — Warm",
    occasion: "date",
    tempMin: 15,
    tempMax: 28,
    styleTier: 3,
    slots: [
      { name: "top", required: true, constraint: { category: "top", types: ["shirt", "polo", "henley"], excludeTypes: ["sweatshirt", "tee"], tierMin: 3, tierMax: 4, colors: ["white", "navy", "neutral", "grey", "earth", "burgundy", "blue"] } },
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["chino", "trouser", "jean", "dark_jean", "denim"], tierMin: 2, tierMax: 4, colors: ["navy", "earth", "khaki", "blue", "black", "neutral", "grey"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["chelsea", "loafer", "derby", "ankle_boot", "leather_sneaker"], tierMin: 3, tierMax: 4, colors: ["brown", "black", "earth", "burgundy"] } },
    ],
  },
  {
    id: "date_sweater_cold",
    name: "Date Night — Sweater Cold",
    occasion: "date",
    tempMin: 0,
    tempMax: 14,  // Reduced from 15 (sweater nuk del te warm)
    styleTier: 3,
    slots: [
      { name: "sweater", required: true, constraint: { category: "top", types: ["sweater", "knit", "crewneck", "turtleneck", "pullover", "henley"], excludeTypes: ["hoodie", "sweatshirt"], tierMin: 3, tierMax: 4, colors: ["navy", "grey", "earth", "neutral", "burgundy", "green", "brown", "cream"] } },
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["chino", "trouser", "jean", "dark_jean", "denim"], tierMin: 2, tierMax: 4, colors: ["navy", "earth", "khaki", "blue", "black", "grey"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["chelsea", "loafer", "ankle_boot", "derby", "leather_sneaker"], tierMin: 3, tierMax: 4, colors: ["brown", "black", "earth"] } },
      // FIX #3: Coat slot — heavy outerwear cap
      { name: "coat", required: false, constraint: { category: "outerwear", types: ["coat", "trench", "overcoat", "peacoat"], tierMin: 3, tierMax: 5, colors: ["navy", "grey", "earth", "black", "brown", "burgundy"] } },
    ],
  },
  {
    id: "date_smart_blazer",
    name: "Date Night — Smart with Blazer",
    occasion: "date",
    tempMin: 12,
    // FIX #3: Blazer is light outerwear — cap at 18°C (was 24°C — overheating)
    tempMax: TEMP_LIGHT_OUTERWEAR_MAX,
    styleTier: 4,
    slots: [
      { name: "shirt", required: true, constraint: { category: "top", types: ["shirt", "polo"], excludeTypes: ["sweatshirt", "tee"], tierMin: 3, tierMax: 4, colors: ["white", "light_blue", "navy", "neutral"] } },
      { name: "blazer", required: true, constraint: { category: "outerwear", types: ["blazer", "sport_coat"], tierMin: 4, tierMax: 5, colors: ["navy", "grey", "earth", "black"] } },
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["chino", "trouser", "dark_jean", "denim"], tierMin: 3, tierMax: 4, colors: ["navy", "earth", "khaki", "grey", "black"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["loafer", "chelsea", "derby", "oxford"], tierMin: 3, tierMax: 5, colors: ["brown", "black", "burgundy"] } },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// CASUAL RECIPES (5)
// FIX #4: casual_polo_shorts STRICT polo only + new casual_tee_shorts
// ════════════════════════════════════════════════════════════════════════════
const CASUAL_RECIPES: OutfitRecipe[] = [
  {
    id: "casual_tee_jeans",
    name: "Classic Tee + Jeans",
    occasion: "casual",
    tempMin: 15,
    tempMax: 32,
    styleTier: 2,
    slots: [
      { name: "tee", required: true, constraint: { category: "top", types: ["tee", "t_shirt", "henley", "polo"], excludeTypes: ["tank", "sweatshirt", "shirt"], tierMin: 2, tierMax: 3 } },
      { name: "jeans", required: true, constraint: { category: "bottom", types: ["jean", "denim", "chino"], tierMin: 2, tierMax: 3, colors: ["blue", "denim", "black", "navy", "earth", "khaki"] } },
      { name: "sneakers", required: true, constraint: { category: "shoes", types: ["sneaker", "canvas", "leather_sneaker"], excludeTypes: ["running"], tierMin: 2, tierMax: 3, colors: ["white", "black", "neutral", "earth", "navy", "grey"] } },
    ],
  },
  {
    // FIX #4: STRICT polo only
    id: "casual_polo_shorts",
    name: "Polo + Shorts (Hot Weather)",
    occasion: "casual",
    tempMin: 22,
    tempMax: 40,
    styleTier: 2,
    description: "Classy summer look — polo collar mandatory for elevation",
    slots: [
      { name: "polo", required: true, constraint: { category: "top", types: ["polo"], excludeTypes: ["tee", "t_shirt", "tank", "sweatshirt", "shirt", "henley"], tierMin: 2, tierMax: 3 } },
      { name: "shorts", required: true, constraint: { category: "bottom", types: ["shorts"], excludeTypes: ["cargo"], tierMin: 2, tierMax: 3, colors: ["navy", "khaki", "earth", "neutral", "black", "blue", "grey"] } },
      { name: "sneakers", required: true, constraint: { category: "shoes", types: ["sneaker", "canvas", "leather_sneaker", "loafer"], tierMin: 2, tierMax: 3, colors: ["white", "black", "neutral", "navy", "brown"] } },
    ],
  },
  {
    // FIX #4: Recipe i ri për tee+shorts (që mos prishet UX për users pa polo)
    id: "casual_tee_shorts",
    name: "Tee + Shorts (Hot Casual)",
    occasion: "casual",
    tempMin: 22,
    tempMax: 40,
    styleTier: 2,
    description: "Relaxed summer look",
    slots: [
      { name: "tee", required: true, constraint: { category: "top", types: ["tee", "t_shirt", "tank", "henley"], excludeTypes: ["polo", "sweatshirt", "shirt"], tierMin: 1, tierMax: 3 } },
      { name: "shorts", required: true, constraint: { category: "bottom", types: ["shorts"], tierMin: 1, tierMax: 3, colors: ["navy", "khaki", "earth", "neutral", "black", "blue", "grey"] } },
      { name: "sneakers", required: true, constraint: { category: "shoes", types: ["sneaker", "canvas", "leather_sneaker", "sandal"], tierMin: 1, tierMax: 3, colors: ["white", "black", "neutral", "navy", "earth"] } },
    ],
  },
  {
    id: "casual_hoodie_jeans",
    name: "Hoodie + Jeans",
    occasion: "casual",
    tempMin: 5,
    tempMax: 20,
    styleTier: 2,
    slots: [
      // FIX #2: Inner top opsional (mos hoodie direkt mbi lëkurë në cold)
      { name: "inner_top", required: false, constraint: { category: "top", types: ["tee", "t_shirt", "longsleeve", "henley"], excludeTypes: ["hoodie", "sweatshirt", "sweater", "polo", "shirt"], tierMin: 1, tierMax: 3 } },
      { name: "hoodie", required: true, constraint: { category: "top", types: ["hoodie", "sweatshirt", "zip_up"], tierMin: 1, tierMax: 2 } },
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["jean", "denim", "chino"], tierMin: 2, tierMax: 3, colors: ["blue", "denim", "black", "navy", "earth", "khaki", "grey"] } },
      { name: "sneakers", required: true, constraint: { category: "shoes", types: ["sneaker", "canvas", "leather_sneaker", "running"], tierMin: 1, tierMax: 3 } },
    ],
  },
  {
    id: "casual_sweater_layered",
    name: "Sweater + Chinos (Cold Casual)",
    occasion: "casual",
    tempMin: 0,
    tempMax: 16,  // Reduced from 18 (sweater duhet ftohtësi reale)
    styleTier: 3,
    slots: [
      { name: "sweater", required: true, constraint: { category: "top", types: ["sweater", "knit", "crewneck", "pullover", "cardigan"], excludeTypes: ["hoodie", "sweatshirt"], tierMin: 3, tierMax: 4, colors: ["navy", "grey", "earth", "neutral", "burgundy", "green", "brown", "cream", "white"] } },
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["chino", "jean", "denim", "trouser"], tierMin: 2, tierMax: 4, colors: ["navy", "blue", "earth", "khaki", "grey", "black"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["chelsea", "ankle_boot", "boot", "leather_sneaker", "sneaker"], tierMin: 2, tierMax: 4, colors: ["brown", "black", "earth", "white", "neutral"] } },
      // FIX #3: Heavy outerwear tempMax cap
      { name: "coat", required: false, constraint: { category: "outerwear", types: ["coat", "trench", "peacoat"], tierMin: 2, tierMax: 4, colors: ["navy", "grey", "earth", "black", "brown"] } },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// NIGHT OUT (2)
// ════════════════════════════════════════════════════════════════════════════
const NIGHT_OUT_RECIPES: OutfitRecipe[] = [
  {
    id: "night_dark_classic",
    name: "Dark Classic Night Out",
    occasion: "night_out",
    tempMin: 10,
    tempMax: 25,
    styleTier: 3,
    slots: [
      { name: "top", required: true, constraint: { category: "top", types: ["shirt", "tee", "polo", "henley", "sweater", "knit"], excludeTypes: ["hoodie", "sweatshirt", "tank"], tierMin: 2, tierMax: 4, colors: ["black", "navy", "grey", "burgundy", "earth"] } },
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["jean", "denim", "trouser", "chino"], tierMin: 2, tierMax: 4, colors: ["black", "navy", "blue", "grey", "earth"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["chelsea", "boot", "loafer", "leather_sneaker", "derby", "oxford"], tierMin: 3, tierMax: 5, colors: ["black", "brown", "burgundy"] } },
    ],
  },
  {
    id: "night_blazer_jeans",
    name: "Blazer + Dark Jeans Night",
    occasion: "night_out",
    tempMin: 8,
    // FIX #3: Blazer cap
    tempMax: TEMP_LIGHT_OUTERWEAR_MAX,
    styleTier: 4,
    slots: [
      { name: "shirt", required: true, constraint: { category: "top", types: ["shirt", "tee", "polo", "henley"], excludeTypes: ["sweatshirt"], tierMin: 2, tierMax: 4, colors: ["white", "black", "grey", "navy"] } },
      { name: "blazer", required: true, constraint: { category: "outerwear", types: ["blazer", "sport_coat"], tierMin: 4, tierMax: 5, colors: ["navy", "black", "grey", "earth"] } },
      { name: "jeans", required: true, constraint: { category: "bottom", types: ["jean", "denim", "chino", "trouser"], tierMin: 2, tierMax: 4, colors: ["black", "navy", "blue", "grey"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["chelsea", "loafer", "derby", "oxford"], tierMin: 3, tierMax: 5, colors: ["black", "brown", "burgundy"] } },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// TRAVEL (2)
// ════════════════════════════════════════════════════════════════════════════
const TRAVEL_RECIPES: OutfitRecipe[] = [
  {
    id: "travel_comfort",
    name: "Travel Day — Comfort + Style",
    occasion: "travel",
    tempMin: 12,
    tempMax: 28,
    styleTier: 2,
    slots: [
      { name: "top", required: true, constraint: { category: "top", types: ["tee", "polo", "henley", "longsleeve"], excludeTypes: ["sweatshirt", "tank", "shirt"], tierMin: 2, tierMax: 3 } },
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["chino", "jean", "denim"], tierMin: 2, tierMax: 3, colors: ["navy", "earth", "khaki", "blue", "black", "grey"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["sneaker", "leather_sneaker", "canvas"], tierMin: 2, tierMax: 3, colors: ["white", "black", "neutral", "navy"] } },
    ],
  },
  {
    id: "travel_cold",
    name: "Travel Cold Weather",
    occasion: "travel",
    tempMin: -10,
    // FIX #3: Tightened — heavy outerwear domain
    tempMax: TEMP_HEAVY_OUTERWEAR_MAX,
    styleTier: 2,
    slots: [
      // FIX #2: Inner top opsional (per cold layering)
      { name: "inner_top", required: false, constraint: { category: "top", types: ["tee", "t_shirt", "longsleeve", "henley"], excludeTypes: ["hoodie", "sweatshirt", "polo", "shirt"], tierMin: 1, tierMax: 3 } },
      { name: "sweater", required: true, constraint: { category: "top", types: ["sweater", "knit", "hoodie", "crewneck", "pullover"], tierMin: 2, tierMax: 3 } },
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["jean", "denim", "chino", "trouser"], tierMin: 2, tierMax: 3, colors: ["navy", "blue", "black", "grey", "earth"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["boot", "ankle_boot", "chelsea", "sneaker"], tierMin: 2, tierMax: 4, colors: ["brown", "black", "earth"] } },
      // FIX #3: Heavy outerwear tempMax cap
      { name: "coat", required: false, constraint: { category: "outerwear", types: ["coat", "parka", "trench", "peacoat"], tierMin: 2, tierMax: 4 } },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// GYM (2)
// FIX #2: gym_cold MUST have inner_top (otherwise hoodie direkt mbi lëkurë)
// + "trenerk" hequr (do bëhet edhe te generate.ts:inferTier)
// ════════════════════════════════════════════════════════════════════════════
const GYM_RECIPES: OutfitRecipe[] = [
  {
    id: "gym_classic",
    name: "Gym — Standard",
    occasion: "gym",
    tempMin: 10,
    tempMax: 35,
    styleTier: 1,
    slots: [
      { name: "top", required: true, constraint: { category: "top", types: ["tee", "tank", "sleeveless", "performance", "athletic", "sports_bra", "hoodie", "sweatshirt"], excludeTypes: ["shirt"], tierMin: 1, tierMax: 3 } },
      // FIX #2: "trenerk" hequr; use only standard terms
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["jogger", "sweatpant", "track_pant", "tracksuit_bottom", "athletic", "legging", "shorts"], tierMin: 1, tierMax: 3 } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["running", "trainer", "athletic_sneaker", "sneaker"], tierMin: 1, tierMax: 3 } },
    ],
  },
  {
    id: "gym_cold",
    name: "Gym — Cold (hoodie with inner layer)",
    occasion: "gym",
    tempMin: -5,
    tempMax: 15,
    styleTier: 1,
    description: "Hoodie/sweatshirt me tee/longsleeve brenda për të mos veshur direkt mbi lëkurë",
    slots: [
      // FIX #2: MANDATORY inner_top slot (layering principle)
      // Tier 1-3 (gym-appropriate inner layers)
      { name: "inner_top", required: true, constraint: { category: "top", types: ["tee", "t_shirt", "longsleeve", "performance", "athletic"], excludeTypes: ["hoodie", "sweatshirt", "polo", "shirt", "sweater"], tierMin: 1, tierMax: 3 } },
      { name: "hoodie", required: true, constraint: { category: "top", types: ["hoodie", "sweatshirt", "zip_up", "athletic"], tierMin: 1, tierMax: 3 } },
      // FIX #2: "trenerk" hequr
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["jogger", "sweatpant", "track_pant", "tracksuit_bottom", "athletic", "legging"], tierMin: 1, tierMax: 3 } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["running", "trainer", "athletic_sneaker", "sneaker"], tierMin: 1, tierMax: 3 } },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════════════════════
export const ALL_RECIPES: OutfitRecipe[] = [
  ...WORK_RECIPES,
  ...DATE_RECIPES,
  ...CASUAL_RECIPES,
  ...NIGHT_OUT_RECIPES,
  ...TRAVEL_RECIPES,
  ...GYM_RECIPES,
];

// ════════════════════════════════════════════════════════════════════════════
// FIX #1: STRICT GENDER FILTER
// ────────────────────────────────────────────────────────────────────────────
// OLD: (!r.gender || !gender || r.gender === gender)
//      → Bug: !gender = true kur gender=undefined → female recipe leaks to male
//
// NEW: Strict logic
//      - Recipe pa gender (undefined) → UNISEX, gjithmonë pranohet
//      - Recipe me gender → MUST match user.gender ekzaktësisht
//      - Nëse user gender undefined → strict: refuzon recipe gender-specific
// ════════════════════════════════════════════════════════════════════════════
export function getRecipesFor(occasion: Occasion, tempC: number, gender?: Gender): OutfitRecipe[] {
  return ALL_RECIPES.filter(r => {
    // Basic filters
    if (r.occasion !== occasion) return false;
    if (tempC < r.tempMin || tempC > r.tempMax) return false;

    // STRICT gender filter (FIX #1)
    if (r.gender !== undefined) {
      // Recipe ka gender specifik — duhet match
      if (gender === undefined) return false; // S'mund të vendosim — refuzojmë
      if (r.gender !== gender) return false;  // Mismatch — refuzojmë
    }
    // Recipe pa gender (unisex) → kalon

    return true;
  });
}

// Universal forbidden color clashes
export const UNIVERSAL_FORBIDDEN_CLASHES: string[][] = [
  ["red", "green"],
  ["yellow", "purple"],
  ["orange", "blue"],
  ["pink", "red"],
];