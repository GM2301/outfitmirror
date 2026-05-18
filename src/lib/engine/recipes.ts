// src/lib/engine/recipes.ts
// ════════════════════════════════════════════════════════════════════════════
// RECIPE LIBRARY V2 — me gender filter ready
//
// CHANGES nga v1:
// - Shtuar gender?: Gender te OutfitRecipe (per gender-specific receta ne te ardhmen)
// - getRecipesFor() accepts gender filter
// ════════════════════════════════════════════════════════════════════════════

import type { Occasion, Gender } from "./types";

export type SlotConstraint = {
  category: "top" | "bottom" | "shoes" | "outerwear" | "accessory";

  // Type patterns të lejuara (do behet strikt me word boundaries te matcher)
  types: string[];

  // Types e ndaluara
  excludeTypes?: string[];

  // Tier range (formality 1-5)
  tierMin: number;
  tierMax: number;

  // Color families të lejuara (boshatisur = çdo neutral pranohet)
  colors?: string[];

  // Color families të ndaluara
  excludeColors?: string[];

  // Style tags që preferohen
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

  // V12: optional gender filter (undefined = unisex)
  gender?: Gender;
};

// ════════════════════════════════════════════════════════════════════════════
// WORK RECIPES (5)
// ════════════════════════════════════════════════════════════════════════════
const WORK_RECIPES: OutfitRecipe[] = [
  {
    id: "work_business_warm",
    name: "Business Professional — Warm",
    occasion: "work",
    tempMin: 15,
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
    name: "Business Professional — Cold (with blazer/coat)",
    occasion: "work",
    tempMin: -10,
    tempMax: 13,
    styleTier: 4,
    description: "Shirt + trousers + blazer/coat + leather shoes",
    slots: [
      { name: "shirt", required: true, constraint: { category: "top", types: ["shirt", "dress_shirt", "blouse"], excludeTypes: ["sweatshirt", "tee", "polo"], tierMin: 3, tierMax: 4, colors: ["white", "light_blue", "blue", "navy", "neutral", "grey"] } },
      { name: "trousers", required: true, constraint: { category: "bottom", types: ["trouser", "dress_pant", "chino"], tierMin: 3, tierMax: 4, colors: ["navy", "grey", "black", "earth", "khaki", "neutral", "brown"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["loafer", "oxford", "derby", "chelsea", "dress_shoe", "monk", "ankle_boot"], tierMin: 3, tierMax: 5, colors: ["black", "brown", "burgundy", "earth"] } },
      { name: "blazer_or_coat", required: true, constraint: { category: "outerwear", types: ["blazer", "coat", "trench", "overcoat", "peacoat"], tierMin: 4, tierMax: 5, colors: ["navy", "grey", "black", "earth", "brown", "neutral"] } },
    ],
  },
  {
    id: "work_smart_casual",
    name: "Smart Casual Office",
    occasion: "work",
    tempMin: 15,
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
    tempMax: 18,
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
    tempMax: 15,
    styleTier: 3,
    slots: [
      { name: "sweater", required: true, constraint: { category: "top", types: ["sweater", "knit", "crewneck", "turtleneck", "pullover", "henley"], excludeTypes: ["hoodie", "sweatshirt"], tierMin: 3, tierMax: 4, colors: ["navy", "grey", "earth", "neutral", "burgundy", "green", "brown", "cream"] } },
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["chino", "trouser", "jean", "dark_jean", "denim"], tierMin: 2, tierMax: 4, colors: ["navy", "earth", "khaki", "blue", "black", "grey"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["chelsea", "loafer", "ankle_boot", "derby", "leather_sneaker"], tierMin: 3, tierMax: 4, colors: ["brown", "black", "earth"] } },
      { name: "coat", required: false, constraint: { category: "outerwear", types: ["coat", "trench", "overcoat", "peacoat", "blazer"], tierMin: 3, tierMax: 5, colors: ["navy", "grey", "earth", "black", "brown", "burgundy"] } },
    ],
  },
  {
    id: "date_smart_blazer",
    name: "Date Night — Smart with Blazer",
    occasion: "date",
    tempMin: 12,
    tempMax: 24,
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
// CASUAL RECIPES (4)
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
    id: "casual_polo_shorts",
    name: "Polo + Shorts (Hot Weather)",
    occasion: "casual",
    tempMin: 22,
    tempMax: 40,
    styleTier: 2,
    slots: [
      { name: "top", required: true, constraint: { category: "top", types: ["polo", "tee", "t_shirt"], excludeTypes: ["sweatshirt", "shirt"], tierMin: 2, tierMax: 3 } },
      { name: "shorts", required: true, constraint: { category: "bottom", types: ["shorts"], excludeTypes: ["cargo"], tierMin: 2, tierMax: 3, colors: ["navy", "khaki", "earth", "neutral", "black", "blue", "grey"] } },
      { name: "sneakers", required: true, constraint: { category: "shoes", types: ["sneaker", "canvas", "leather_sneaker"], tierMin: 2, tierMax: 3, colors: ["white", "black", "neutral", "navy"] } },
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
    tempMax: 18,
    styleTier: 3,
    slots: [
      { name: "sweater", required: true, constraint: { category: "top", types: ["sweater", "knit", "crewneck", "pullover", "cardigan"], excludeTypes: ["hoodie", "sweatshirt"], tierMin: 3, tierMax: 4, colors: ["navy", "grey", "earth", "neutral", "burgundy", "green", "brown", "cream", "white"] } },
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["chino", "jean", "denim", "trouser"], tierMin: 2, tierMax: 4, colors: ["navy", "blue", "earth", "khaki", "grey", "black"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["chelsea", "ankle_boot", "boot", "leather_sneaker", "sneaker"], tierMin: 2, tierMax: 4, colors: ["brown", "black", "earth", "white", "neutral"] } },
      { name: "coat", required: false, constraint: { category: "outerwear", types: ["coat", "jacket", "trench", "peacoat", "bomber"], tierMin: 2, tierMax: 4, colors: ["navy", "grey", "earth", "black", "brown"] } },
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
    tempMax: 22,
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
    tempMax: 12,
    styleTier: 2,
    slots: [
      { name: "sweater", required: true, constraint: { category: "top", types: ["sweater", "knit", "hoodie", "crewneck", "pullover"], tierMin: 2, tierMax: 3 } },
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["jean", "denim", "chino", "trouser"], tierMin: 2, tierMax: 3, colors: ["navy", "blue", "black", "grey", "earth"] } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["boot", "ankle_boot", "chelsea", "sneaker"], tierMin: 2, tierMax: 4, colors: ["brown", "black", "earth"] } },
      { name: "coat", required: false, constraint: { category: "outerwear", types: ["coat", "parka", "trench", "jacket", "peacoat"], tierMin: 2, tierMax: 4 } },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// GYM (2)
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
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["jogger", "sweatpant", "track_pant", "athletic", "legging", "shorts"], tierMin: 1, tierMax: 3 } },
      { name: "shoes", required: true, constraint: { category: "shoes", types: ["running", "trainer", "athletic_sneaker", "sneaker"], tierMin: 1, tierMax: 3 } },
    ],
  },
  {
    id: "gym_cold",
    name: "Gym — Cold (with hoodie)",
    occasion: "gym",
    tempMin: -5,
    tempMax: 15,
    styleTier: 1,
    slots: [
      { name: "hoodie", required: true, constraint: { category: "top", types: ["hoodie", "sweatshirt", "zip_up", "athletic"], tierMin: 1, tierMax: 3 } },
      { name: "bottom", required: true, constraint: { category: "bottom", types: ["jogger", "sweatpant", "track_pant", "athletic", "legging"], tierMin: 1, tierMax: 3 } },
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

// V12: gender filter
export function getRecipesFor(occasion: Occasion, tempC: number, gender?: Gender): OutfitRecipe[] {
  return ALL_RECIPES.filter(r =>
    r.occasion === occasion &&
    tempC >= r.tempMin &&
    tempC <= r.tempMax &&
    (!r.gender || !gender || r.gender === gender)
  );
}

// Universal forbidden color clashes
export const UNIVERSAL_FORBIDDEN_CLASHES: string[][] = [
  ["red", "green"],
  ["yellow", "purple"],
  ["orange", "blue"],
  ["pink", "red"],
];