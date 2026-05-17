// src/lib/engine/types.ts
// Engine v9 — types of strikte dhe te dokumentuara mire

// ═══ CATEGORIES ═══
// "top"       — base layer ose smart top (tee, shirt, polo, blouse, etc) PLUS hoodie/sweater
// "bottom"    — pants, shorts, skirt, leggings
// "shoes"     — gjithçka për këmbë
// "outerwear" — vetëm layers të dedikuar (blazer, coat, parka, jacket, trench)
// "accessory" — belt, hat, scarf, watch, bag, tie, jewelry
export type Category = "top" | "bottom" | "shoes" | "outerwear" | "accessory";

// Type string — e lirë por engine njeh patterns specifike
// (tee, polo, shirt, jeans, chinos, joggers, sneakers, hoodie, blazer, etc)
export type ItemType = string;

// Color family — engine njeh: neutral, black, white, earth, grey, beige, brown, navy, denim,
// blue, green, red, orange, yellow, pink, purple, teal, coral, tan, khaki
export type ColorFamily = string;

// Gender — male ose female
export type Gender = "male" | "female";

// ═══ ITEM ═══
// Cdo cope ne wardrobe
export type Item = {
  // ── Bazë (gjithmonë set) ──
  id: string;
  category: Category;
  type: ItemType;
  color_family: ColorFamily;
  image_url?: string | null;

  // ── Tracking ──
  wear_count?: number;          // sa here u veshe (variety bonus)
  last_worn?: string | null;    // ISO date string
  price?: number | null;        // per cost-per-wear

  // ── STRUCTURED TAGS (AI cakton ne kohen e analizes) ──
  // formality_tier: 1 = athletic, 2 = casual, 3 = smart casual, 4 = business, 5 = formal
  formality_tier?: number | null;

  // is_layer: a mund te shkoje si OUTER mbi nje cope tjeter
  // true per: blazer, jacket, coat, parka, hoodie, sweater, cardigan, trench, bomber
  // false per: tee, polo, shirt, tank, bottom, shoes, accessories
  is_layer?: boolean | null;

  // is_inner: a mund te shkoje si INNER nen nje outer
  // true per: tee, polo, shirt, blouse, tank, henley, crop, bodysuit, sweater i lehte
  // false STRIKT per: hoodie, sweatshirt, blazer, coat, parka, jacket (asnjehere inner)
  is_inner?: boolean | null;

  // Temperatura ne Celsius — engine perdor per filtering
  min_temp?: number | null;     // tempera me e ulet ku kjo cope eshte e pershtatshme
  max_temp?: number | null;     // tempera me e larte

  // Style tags: ["athletic", "casual", "smart", "formal", "sporty", "streetwear", "elegant", "minimal"]
  style_tags?: string[] | null;
};

// ═══ OCCASIONS ═══
export type Occasion =
  | "work"      // profesional, business
  | "date"      // romantic, polished
  | "casual"    // everyday relaxed
  | "night_out" // sharp, dark palette
  | "travel"    // comfort + style
  | "gym";      // athletic only

// ═══ OUTFIT ═══
export type OutfitLabel = "Safe" | "Colorful";

export type OutfitPicks = {
  top: Item;
  bottom: Item;
  shoes: Item;
  outer?: Item;
  accessories?: Item[];
};

export type OutfitBreakdown = {
  occasion: number;       // 0-50
  harmony: number;        // 0-40 (color harmony)
  variety: number;        // 0-15 (low wear bonus + rand)
  balance: number;        // 0-25 (formality cohesion)
  style?: number;         // 0-20 (style match)
  explanation?: string;   // why-text
};

export type Outfit = {
  label: OutfitLabel;
  occasion: Occasion;
  score: number;          // 0-100
  picks: OutfitPicks;
  breakdown: OutfitBreakdown;
  outfit_hash: string;    // unique hash for tracking/votes
  why?: string;
  layerExplanation?: string;
};

// ═══ GENERATE OPTIONS ═══
export type GenerateOptions = {
  // Pinning — engine fix one or more pieces
  pinnedTopId?: string | null;
  pinnedBottomId?: string | null;
  pinnedShoesId?: string | null;

  // Context
  gender?: Gender;
  style?: string;              // user's style preference
  tempC?: number;              // current temperature (jashte ose forecast)
  includeAccessories?: boolean;

  // Vote learning — outfit hashes te votuar
  votedUp?: string[];          // outfits qe useri ka votuar 👍
  votedDown?: string[];        // outfits qe useri ka votuar 👎
};