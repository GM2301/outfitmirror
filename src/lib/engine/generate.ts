// src/lib/engine/generate.ts
// ════════════════════════════════════════════════════════════════════════════
// ENGINE V13 — 5 CRITICAL BUGS FIXED (continuation from V12.3)
//
// FIXES IN THIS VERSION:
//
// 1. (recipes.ts) Gender filter strict — handled there
// 2a. (recipes.ts) gym_cold inner_top mandatory — handled there
// 2b. (THIS FILE) "trenerk" hequr nga inferTier (Line ~159)
// 3. (recipes.ts) Thermal overlap fix — handled there
// 4. (recipes.ts) casual_polo_shorts STRICT polo — handled there
// 5. (THIS FILE) makeGapOutfits refactor — Smart Substitution
//                NEVER returns dummy items if user has ANY items
//                Penalty -15 for tier mismatch, -25 for category substitution
//                Last resort uses real items with degraded score (35-60)
//
// All V12.x improvements preserved:
// - Smart Fallback Matrix (TYPE_FALLBACKS)
// - Last-resort recipe (V12.3)
// - Vote per-item, anti-repeat, pinned items
// - Outerwear dynamic probability
// ════════════════════════════════════════════════════════════════════════════

import type { Item, Occasion, Outfit, OutfitLabel, GenerateOptions, Gender, VotedItemIds } from "./types";
import { getRecipesFor, UNIVERSAL_FORBIDDEN_CLASHES } from "./recipes";
import type { OutfitRecipe, SlotConstraint } from "./recipes";

// ════════════════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════════════════
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function hashStr(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); }

function tt(it: Item): string { return String(it.type ?? "").toLowerCase(); }
function cc(it: Item): string { return String(it.color_family ?? "neutral").toLowerCase(); }

// ════════════════════════════════════════════════════════════════════════════
// COLOR SETS
// ════════════════════════════════════════════════════════════════════════════
const NEUTRAL = new Set(["neutral","black","white","earth","grey","gray","beige","brown","navy","denim","tan","khaki","cream","ivory","stone","charcoal"]);
const COOL = new Set(["blue","green","purple","teal","mint","sage","light_blue"]);
const WARM = new Set(["red","orange","yellow","pink","coral","rust","mustard","burgundy"]);
const LIGHT = new Set(["white","cream","ivory","stone","beige","light_blue"]);
const DARK = new Set(["black","navy","charcoal","brown","burgundy","forest"]);

// ════════════════════════════════════════════════════════════════════════════
// STRICT TYPE MATCHING (preserved from V12)
// ════════════════════════════════════════════════════════════════════════════
function tokenize(itemType: string): string[] {
  return itemType.toLowerCase().split(/[_\s-]+/).filter(t => t.length > 0);
}

function singularize(token: string): string {
  if (token.length < 4) return token;
  if (token.endsWith("ies")) return token.slice(0, -3) + "y";
  if (token.endsWith("es") && !token.endsWith("oes")) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss") && !token.endsWith("us") && !token.endsWith("is")) return token.slice(0, -1);
  return token;
}

const COMPOUND_EQUIV: Record<string, string[]> = {
  "tee": ["tshirt"],
  "tshirt": ["tee"],
  "tees": ["tshirt"],
};

function getJoinedForm(tokens: string[]): string | null {
  if (tokens.length === 2 && tokens[0] === "t" && tokens[1] === "shirt") return "tshirt";
  if (tokens.length === 2 && tokens[0] === "long" && tokens[1] === "sleeve") return "longsleeve";
  if (tokens.length === 2 && tokens[0] === "zip" && tokens[1] === "up") return "zipup";
  if (tokens.length === 2 && tokens[0] === "sweat" && tokens[1] === "shirt") return "sweatshirt";
  if (tokens.length === 2 && tokens[0] === "sweat" && tokens[1] === "pant") return "sweatpant";
  if (tokens.length === 2 && tokens[0] === "tracksuit" && tokens[1] === "bottom") return "tracksuitbottom";
  return null;
}

function normalizeToken(t: string): string {
  return singularize(t.toLowerCase());
}

function matchesPattern(itemType: string, pattern: string): boolean {
  const itLower = itemType.toLowerCase();
  const patLower = pattern.toLowerCase();

  if (itLower === patLower) return true;

  const itTokensRaw = tokenize(itLower);
  const itTokens = itTokensRaw.map(normalizeToken);
  const patTokensRaw = tokenize(patLower);
  const patTokens = patTokensRaw.map(normalizeToken);

  const itJoined = getJoinedForm(itTokens);
  const patJoined = getJoinedForm(patTokens);

  if (patTokens.length === 1) {
    const p = patTokens[0];
    if (itTokens.includes(p)) return true;
    if (itTokens.length === 1) {
      const itTok = itTokens[0];
      if (COMPOUND_EQUIV[itTok]?.includes(p)) return true;
      if (COMPOUND_EQUIV[p]?.includes(itTok)) return true;
    }
    if (itJoined) {
      if (itJoined === p) return true;
      if (COMPOUND_EQUIV[itJoined]?.includes(p)) return true;
      if (COMPOUND_EQUIV[p]?.includes(itJoined)) return true;
    }
    return false;
  }

  if (patTokens.every(pt => itTokens.includes(pt))) return true;

  if (patJoined) {
    if (itTokens.length === 1 && itTokens[0] === patJoined) return true;
    if (itTokens.length === 1 && COMPOUND_EQUIV[itTokens[0]]?.includes(patJoined)) return true;
    if (itTokens.length === 1 && COMPOUND_EQUIV[patJoined]?.includes(itTokens[0])) return true;
  }

  return false;
}

// ════════════════════════════════════════════════════════════════════════════
// FALLBACK INFERENCE
// FIX #2b: "trenerk" HEQUR nga bottom inference
// ════════════════════════════════════════════════════════════════════════════
function inferTier(item: Item): number {
  if (item.formality_tier !== undefined && item.formality_tier !== null) {
    return clamp(Math.round(item.formality_tier), 1, 5);
  }
  const tokens = tokenize(tt(item));
  const has = (s: string) => tokens.includes(s);
  const cat = item.category;

  if (cat === "top" || cat === "outerwear") {
    if (has("tuxedo")) return 5;
    if (has("dress") && (has("shirt") || tokens.join("_").includes("dress_shirt"))) return 4;
    if (has("blazer") || has("sport") || has("suit")) return 4;
    if (has("trench") || has("overcoat") || has("peacoat")) return 4;
    if (has("coat") && !has("sport") && !has("track")) return 4;
    if ((has("shirt") && !has("sweatshirt")) || has("blouse") || has("polo")) return 3;
    if (has("sweater") || has("knit") || has("cardigan") || has("crewneck") || has("henley")) return 3;
    if (has("jacket") && !has("track")) return 2;
    if (has("bomber")) return 2;
    if (has("tee") || has("tshirt") || tt(item) === "t-shirt") return 2;
    if (has("hoodie") || has("sweatshirt") || has("zipup")) return 1;
    if (has("tank") || has("sleeveless") || has("crop")) return 1;
    return 2;
  }
  if (cat === "bottom") {
    if (has("tuxedo")) return 5;
    if (has("dress") || has("suit")) return 4;
    if (has("trouser")) return 4;
    if (has("chino") || has("midi")) return 3;
    if (has("jean") || has("denim") || has("skirt") || has("mini")) return 2;
    if (has("cargo") || has("shorts")) return 2;
    // FIX #2b: "trenerk" HEQUR - use standard terminology only
    if (has("jogger") || has("sweatpant") || has("track") || has("athletic") || has("legging") || has("tracksuit")) return 1;
    return 2;
  }
  if (cat === "shoes") {
    if (has("oxford") || has("brogue")) return 5;
    if (has("derby") || has("loafer") || has("monk") || has("heel") || has("pump")) return 4;
    if (has("dress")) return 5;
    if (has("chelsea") || has("ankle")) return 3;
    if (has("leather") && has("sneaker")) return 3;
    if (has("boot") || has("ballet") || has("flat") || has("mule")) return 3;
    if (has("canvas") || (has("sneaker") && !has("running"))) return 2;
    if (has("sandal")) return 2;
    if (has("running") || has("trainer") || has("flip")) return 1;
    return 2;
  }
  return 2;
}

function inferMinTemp(item: Item): number {
  if (item.min_temp !== undefined && item.min_temp !== null) return item.min_temp;
  const tokens = tokenize(tt(item));
  const has = (s: string) => tokens.includes(s);
  if (has("tank") || has("sleeveless")) return 22;
  if (has("tee") || has("tshirt") || has("crop")) return 18;
  if (has("polo")) return 16;
  if (has("blouse") || has("longsleeve")) return 12;
  if (has("shirt") && !has("sweatshirt")) return 10;
  if (has("henley")) return 10;
  if (has("hoodie") || has("sweatshirt")) return 5;
  if (has("sweater") || has("knit") || has("cardigan")) return 0;
  if (has("blazer")) return 8;
  if (has("bomber") || (has("jacket") && !has("heavy"))) return 5;
  if (has("parka")) return -20;
  if (has("trench") || has("coat") || has("overcoat")) return -10;
  if (has("shorts") || has("mini")) return 20;
  if (has("jean") || has("chino") || has("denim")) return -10;
  if (has("trouser")) return 5;
  if (has("jogger") || has("legging") || has("sweatpant") || has("track") || has("athletic") || has("tracksuit")) return 0;
  if (has("sandal") || has("flip")) return 22;
  if (has("boot")) return -15;
  return -30;
}

function inferMaxTemp(item: Item): number {
  if (item.max_temp !== undefined && item.max_temp !== null) return item.max_temp;
  const tokens = tokenize(tt(item));
  const has = (s: string) => tokens.includes(s);
  if (has("tank") || has("sleeveless")) return 40;
  if (has("tee") || has("tshirt") || has("crop")) return 35;
  if (has("polo")) return 32;
  if ((has("shirt") && !has("sweatshirt")) || has("blouse")) return 28;
  if (has("longsleeve") || has("henley")) return 24;
  if (has("hoodie") || has("sweatshirt")) return 20;
  if (has("sweater") || has("knit") || has("cardigan")) return 20;
  if (has("blazer")) return 24;
  if (has("bomber") || (has("jacket") && !has("heavy"))) return 18;
  if (has("parka")) return 5;
  if (has("trench") || has("coat") || has("overcoat")) return 12;
  if (has("shorts") || has("mini")) return 45;
  if (has("jean") || has("chino") || has("denim")) return 32;
  if (has("trouser")) return 28;
  if (has("jogger") || has("legging") || has("sweatpant") || has("track") || has("athletic") || has("tracksuit")) return 22;
  if (has("sandal") || has("flip")) return 45;
  if (has("boot")) return 16;
  return 45;
}

function isInTempRange(item: Item, tempC: number): boolean {
  return tempC >= inferMinTemp(item) && tempC <= inferMaxTemp(item);
}

// ════════════════════════════════════════════════════════════════════════════
// SLOT MATCHER (preserved)
// ════════════════════════════════════════════════════════════════════════════
function matchesSlot(item: Item, constraint: SlotConstraint, tempC: number, allowLayered: boolean = false): boolean {
  if (item.category !== constraint.category) return false;

  const tier = inferTier(item);
  if (tier < constraint.tierMin || tier > constraint.tierMax) return false;

  const itType = tt(item);
  const matchesAnyType = constraint.types.some(pat => matchesPattern(itType, pat));
  if (!matchesAnyType) return false;

  if (constraint.excludeTypes) {
    for (const exc of constraint.excludeTypes) {
      if (matchesPattern(itType, exc)) return false;
    }
  }

  if (constraint.colors && constraint.colors.length > 0) {
    const color = cc(item);
    const acceptable = constraint.colors.map(c => c.toLowerCase());
    if (!acceptable.includes(color) && !NEUTRAL.has(color)) return false;
  }

  if (constraint.excludeColors) {
    const color = cc(item);
    if (constraint.excludeColors.map(c => c.toLowerCase()).includes(color)) return false;
  }

  if (allowLayered && item.category === "top" && tier >= 3) {
    const minT = inferMinTemp(item) - 8;
    const maxT = inferMaxTemp(item);
    if (tempC < minT || tempC > maxT) return false;
  } else {
    if (!isInTempRange(item, tempC)) return false;
  }

  return true;
}

// ════════════════════════════════════════════════════════════════════════════
// SLOT POOL SCORING
// ════════════════════════════════════════════════════════════════════════════
function scoreItemForPool(
  item: Item,
  votedItemIds: VotedItemIds,
  recentIds: Set<string>
): number {
  let score = 0;
  if (votedItemIds.liked.includes(item.id)) score += 15;
  const wc = item.wear_count ?? 0;
  if (wc < 3) score += 5;
  if (item.last_worn) {
    const lastDate = new Date(item.last_worn).getTime();
    const daysSince = (Date.now() - lastDate) / (1000 * 60 * 60 * 24);
    if (daysSince > 14) score += 5;
  } else {
    score += 5;
  }
  if (recentIds.has(item.id)) score -= 25;
  return score;
}

// ════════════════════════════════════════════════════════════════════════════
// COLOR HARMONY + SANDWICH RULE
// ════════════════════════════════════════════════════════════════════════════
function colorScore(items: Item[]): number {
  const colors = items.map(i => cc(i));
  const loud = colors.filter(c => !NEUTRAL.has(c));
  const uniqueLoud = new Set(loud).size;

  let score = 0;
  if (loud.length === 0) score += 30;
  else if (uniqueLoud === 1) score += 28;
  else if (uniqueLoud === 2) score += 18;
  else return 0;

  const hasWarm = colors.some(c => WARM.has(c));
  const hasCool = colors.some(c => COOL.has(c));
  const hasNeutral = colors.some(c => NEUTRAL.has(c));
  if (hasWarm && hasCool && !hasNeutral) return 0;

  const colorSet = new Set(colors);
  for (const [a, b] of UNIVERSAL_FORBIDDEN_CLASHES) {
    if (colorSet.has(a) && colorSet.has(b)) return 0;
  }

  const hasLight = colors.some(c => LIGHT.has(c));
  const hasDark = colors.some(c => DARK.has(c));
  if (hasLight && hasDark) score += 6;

  const shoes = items.find(i => i.category === "shoes");
  if (shoes && NEUTRAL.has(cc(shoes))) score += 4;

  const top = items.find(i => i.category === "top" && !isLayerCategory(i));
  const bottom = items.find(i => i.category === "bottom");
  if (top && bottom && shoes) {
    const tc = cc(top);
    const bc = cc(bottom);
    const sc = cc(shoes);
    if (tc === sc && tc !== bc) {
      score += 8;
    }
  }

  return clamp(score, 0, 50);
}

function isLayerCategory(it: Item): boolean {
  if (it.category === "outerwear") return true;
  const tokens = tokenize(tt(it));
  return tokens.includes("blazer") || tokens.includes("coat") || tokens.includes("jacket") ||
         tokens.includes("parka") || tokens.includes("trench") || tokens.includes("bomber");
}

function styleScore(style: string | undefined, items: Item[]): number {
  if (!style) return 0;
  const styleLower = style.toLowerCase();
  const styleMap: Record<string, string[]> = {
    "minimal": ["minimal", "smart", "elegant"],
    "streetwear": ["streetwear", "athletic", "casual"],
    "smart_casual": ["smart", "casual"],
    "classic": ["formal", "elegant", "smart", "classic"],
    "sporty": ["sporty", "athletic"],
    "elegant": ["elegant", "formal", "smart"],
    "casual": ["casual", "minimal"],
  };
  const relevantTags = styleMap[styleLower] ?? [styleLower];
  let matchCount = 0;
  for (const item of items) {
    const tags = (item.style_tags ?? []).map(t => t.toLowerCase());
    if (relevantTags.some(rt => tags.includes(rt))) matchCount++;
  }
  return Math.min(15, matchCount * 5);
}

function outerwearProbability(tempC: number): number {
  if (tempC < 5) return 0.95;
  if (tempC < 12) return 0.75;
  if (tempC < 18) return 0.45;
  return 0.15;
}

function outerwearMandatory(tempC: number): boolean {
  return tempC < 5;
}

// ════════════════════════════════════════════════════════════════════════════
// ACCESSORIES (preserved)
// ════════════════════════════════════════════════════════════════════════════
type AccessoryKind = "belt" | "tie" | "scarf" | "hat" | "watch" | "bag" | "jewelry" | "sunglasses" | "other";

function getAccessoryKind(s: string): AccessoryKind {
  const tokens = tokenize(s);
  if (tokens.includes("belt")) return "belt";
  if (tokens.includes("tie") || tokens.includes("bowtie")) return "tie";
  if (tokens.includes("scarf")) return "scarf";
  if (tokens.includes("hat") || tokens.includes("cap") || tokens.includes("beanie")) return "hat";
  if (tokens.includes("watch")) return "watch";
  if (tokens.includes("bag") || tokens.includes("backpack") || tokens.includes("tote") || tokens.includes("clutch")) return "bag";
  if (tokens.includes("necklace") || tokens.includes("bracelet") || tokens.includes("ring") || tokens.includes("earring") || tokens.includes("jewelry")) return "jewelry";
  if (tokens.includes("sunglass") || tokens.includes("sunglasses") || tokens.includes("glasses")) return "sunglasses";
  return "other";
}

function beltShoesLeatherMatch(belt: Item, shoes: Item): boolean {
  const bc = cc(belt);
  const sc = cc(shoes);
  const browns = new Set(["brown","earth","tan"]);
  const blacks = new Set(["black"]);
  if (blacks.has(bc) && browns.has(sc)) return false;
  if (browns.has(bc) && blacks.has(sc)) return false;
  return true;
}

function pickAccessories(pool: Item[], occasion: Occasion, tempC: number, shoes: Item, rnd: () => number): Item[] {
  if (!pool.length) return [];
  if (rnd() < 0.2) return [];
  const maxCount = 2;
  const valid = pool.filter(a => {
    const k = getAccessoryKind(tt(a));
    if (k === "tie" && (occasion === "casual" || occasion === "travel" || occasion === "gym")) return false;
    if (k === "scarf" && tempC >= 15) return false;
    if (k === "hat" && occasion === "work") return false;
    if (k === "belt" && !beltShoesLeatherMatch(a, shoes)) return false;
    return true;
  });
  if (!valid.length) return [];
  const target = 1 + Math.floor(rnd() * maxCount);
  const picked: Item[] = [];
  const used = new Set<AccessoryKind>();
  const shuffled = [...valid].sort(() => rnd() - 0.5);
  for (const a of shuffled) {
    if (picked.length >= Math.min(target, maxCount)) break;
    const k = getAccessoryKind(tt(a));
    if (used.has(k)) continue;
    used.add(k);
    picked.push(a);
  }
  return picked;
}

// ════════════════════════════════════════════════════════════════════════════
// WHY BUILDER
// ════════════════════════════════════════════════════════════════════════════
function buildWhy(recipe: OutfitRecipe, top: Item, bottom: Item, shoes: Item, outer?: Item, tempC?: number): string {
  const t = top.type.replace(/_/g, " ");
  const b = bottom.type.replace(/_/g, " ");
  const s = shoes.type.replace(/_/g, " ");
  if (outer && tempC !== undefined && tempC <= 12) {
    const o = outer.type.replace(/_/g, " ");
    return `${Math.round(tempC)}°C jashtë — ${recipe.name}. ${o} mbi ${t}, ${b} dhe ${s}.`;
  }
  if (outer) {
    const o = outer.type.replace(/_/g, " ");
    return `${recipe.name} — ${o} mbi ${t} me ${b} dhe ${s}.`;
  }
  return `${recipe.name} — ${t} + ${b} + ${s}.`;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN GENERATE
// ════════════════════════════════════════════════════════════════════════════
type Candidate = {
  recipe: OutfitRecipe;
  picks: Record<string, Item>;
  pickedItems: Item[];
  score: number;
  hash: string;
  fallbackNotes: string[];
};

const TYPE_FALLBACKS: Record<string, { subs: string[]; nameAl: string }> = {
  "loafer": { subs: ["derby", "oxford", "chelsea", "leather_sneaker", "sneaker"], nameAl: "loafers" },
  "oxford": { subs: ["derby", "loafer", "chelsea", "leather_sneaker"], nameAl: "oxford" },
  "derby": { subs: ["oxford", "loafer", "chelsea", "leather_sneaker"], nameAl: "derby" },
  "chelsea": { subs: ["ankle_boot", "loafer", "leather_sneaker", "sneaker"], nameAl: "chelsea boots" },
  "ankle_boot": { subs: ["chelsea", "boot", "leather_sneaker", "sneaker"], nameAl: "ankle boots" },
  "dress_shoe": { subs: ["oxford", "derby", "loafer", "chelsea"], nameAl: "dress shoes" },
  "leather_sneaker": { subs: ["sneaker", "canvas"], nameAl: "leather sneakers" },
  "shirt": { subs: ["polo", "henley", "tee"], nameAl: "kemishe klasike" },
  "dress_shirt": { subs: ["shirt", "polo"], nameAl: "kemishe formale" },
  "blouse": { subs: ["shirt", "polo", "tee"], nameAl: "blouse" },
  "polo": { subs: ["henley", "tee", "shirt"], nameAl: "polo" },
  "sweater": { subs: ["knit", "cardigan", "sweatshirt", "hoodie"], nameAl: "pullover" },
  "knit": { subs: ["sweater", "cardigan", "sweatshirt"], nameAl: "knit" },
  "cardigan": { subs: ["sweater", "knit", "sweatshirt"], nameAl: "cardigan" },
  "chino": { subs: ["jean", "trouser", "denim"], nameAl: "chinos" },
  "trouser": { subs: ["chino", "dress_pant", "jean"], nameAl: "trousers formale" },
  "dress_pant": { subs: ["trouser", "chino"], nameAl: "dress pants" },
  "jean": { subs: ["chino", "denim", "trouser"], nameAl: "jeans" },
  "dark_jean": { subs: ["jean", "denim", "chino", "trouser"], nameAl: "dark jeans" },
  "blazer": { subs: ["sport_coat", "cardigan", "jacket", "sweater"], nameAl: "blazer" },
  "sport_coat": { subs: ["blazer", "jacket"], nameAl: "sport coat" },
  "coat": { subs: ["trench", "overcoat", "peacoat", "jacket"], nameAl: "coat" },
  "trench": { subs: ["coat", "overcoat", "jacket"], nameAl: "trench coat" },
  "overcoat": { subs: ["coat", "trench", "peacoat"], nameAl: "overcoat" },
  "peacoat": { subs: ["coat", "trench", "overcoat", "jacket"], nameAl: "peacoat" },
};

const TOP_K_PER_SLOT = 15;
const MAX_COMBOS_PER_RECIPE = 50000;

export function generateOutfits(
  items: Item[],
  occasion: Occasion,
  seed: number,
  opts: GenerateOptions = {}
): Outfit[] {
  const rnd = mulberry32(seed);
  const gender: Gender = opts.gender ?? "male";
  const style = opts.style ?? (typeof window !== "undefined" ? localStorage.getItem("om_style") ?? "minimal" : "minimal");
  const tempC = opts.tempC ?? (typeof window !== "undefined" ? parseFloat(localStorage.getItem("om_weather_temp") ?? "20") : 20);
  const includeAcc = opts.includeAccessories ?? true;

  const votedItemIds: VotedItemIds = opts.votedItemIds ?? { liked: [], disliked: [] };
  const dislikedSet = new Set(votedItemIds.disliked);
  const recentIds = new Set(opts.recentItemIds ?? []);
  const pinnedIds = new Set(opts.pinnedItemIds ?? []);

  const allTops = items.filter(i => i.category === "top" || i.category === "outerwear");
  const allBottoms = items.filter(i => i.category === "bottom");
  const allShoes = items.filter(i => i.category === "shoes");
  const allAccessories = items.filter(i => i.category === "accessory");

  // FIX #5 (part 1): EMPTY WARDROBE — vetëm këtu kemi dummy items
  if (!allTops.length || !allBottoms.length || !allShoes.length) {
    return makeEmptyWardrobeMessage(occasion);
  }

  const recipes = getRecipesFor(occasion, tempC, gender);

  if (recipes.length === 0) {
    // S'ka recetë por user-i ka items — provo smart substitution
    return smartSubstitutionFallback(allTops, allBottoms, allShoes, allAccessories, occasion, tempC, style, votedItemIds, recentIds, pinnedIds, dislikedSet, rnd, includeAcc, "no_recipe");
  }

  // ── PER ÇDO RECETE: PRE-SORT + CARTESIAN PRODUCT ─────────────────────────
  const allCandidates: Candidate[] = [];

  for (const recipe of recipes) {
    const slotPools: Record<string, Item[]> = {};
    let allRequiredOK = true;
    const recipeFallbackNotes: string[] = [];

    const hasRequiredOuter = recipe.slots.some(s =>
      s.required && s.constraint.category === "outerwear"
    );

    for (const slot of recipe.slots) {
      const allowLayered = hasRequiredOuter && slot.constraint.category === "top";

      let matched = items.filter(it => {
        if (dislikedSet.has(it.id)) return false;
        return matchesSlot(it, slot.constraint, tempC, allowLayered);
      });

      if (matched.length === 0 && slot.required) {
        const allowedSubs = new Set<string>();
        let idealName = "kete artikull";

        for (const reqType of slot.constraint.types) {
          const fData = TYPE_FALLBACKS[reqType.toLowerCase()];
          if (fData) {
            fData.subs.forEach(s => allowedSubs.add(s));
            if (idealName === "kete artikull") idealName = fData.nameAl;
          }
        }

        if (allowedSubs.size > 0) {
          const cleanedExclude = (slot.constraint.excludeTypes ?? []).filter(
            ex => !allowedSubs.has(ex.toLowerCase())
          );
          const looseConstraint: SlotConstraint = {
            ...slot.constraint,
            types: [...slot.constraint.types, ...Array.from(allowedSubs)],
            excludeTypes: cleanedExclude.length > 0 ? cleanedExclude : undefined,
            tierMin: Math.max(1, slot.constraint.tierMin - 2),
            tierMax: Math.min(5, slot.constraint.tierMax + 1),
            colors: undefined,
          };

          matched = items.filter(it => {
            if (dislikedSet.has(it.id)) return false;
            return matchesSlot(it, looseConstraint, tempC, allowLayered);
          });

          if (matched.length > 0) {
            const chosenType = matched[0].type.replace(/_/g, " ");
            recipeFallbackNotes.push(
              `Meqe s'ke ${idealName} ne dollap, e zevendesuam me ${chosenType}.`
            );
          }
        }
      }

      const pinnedInSlot = matched.filter(it => pinnedIds.has(it.id));
      if (pinnedInSlot.length > 0) {
        matched = pinnedInSlot;
      }

      matched.sort((a, b) => {
        const scoreA = scoreItemForPool(a, votedItemIds, recentIds);
        const scoreB = scoreItemForPool(b, votedItemIds, recentIds);
        return scoreB - scoreA;
      });

      slotPools[slot.name] = matched.slice(0, TOP_K_PER_SLOT);

      if (slot.required && slotPools[slot.name].length === 0) {
        if (slot.constraint.category === "outerwear") {
          recipeFallbackNotes.push(
            `Nuk ke veshje te jashtme (blazer/coat) ne dollap per kete kombinim.`
          );
          continue;
        }
        allRequiredOK = false;
        break;
      }
    }

    if (!allRequiredOK) continue;

    const skippedSlotNames = new Set<string>();
    for (const slot of recipe.slots) {
      if (slot.required && slot.constraint.category === "outerwear" && slotPools[slot.name].length === 0) {
        skippedSlotNames.add(slot.name);
      }
    }

    const requiredSlots = recipe.slots.filter(s => s.required && !skippedSlotNames.has(s.name));
    const optionalSlots = recipe.slots.filter(s => !s.required);
    const outerProb = outerwearProbability(tempC);

    const cartesianResult = cartesianProduct(requiredSlots.map(s => slotPools[s.name]));

    for (const requiredCombo of cartesianResult) {
      if (allCandidates.length >= MAX_COMBOS_PER_RECIPE) break;

      const picks: Record<string, Item> = {};
      requiredSlots.forEach((s, idx) => { picks[s.name] = requiredCombo[idx]; });

      const variants: Array<Record<string, Item>> = [];

      if (optionalSlots.length === 0) {
        variants.push({ ...picks });
      } else {
        const withOpt: Record<string, Item> = { ...picks };
        for (const optSlot of optionalSlots) {
          const pool = slotPools[optSlot.name];
          if (!pool || pool.length === 0) continue;
          const isOuter = optSlot.constraint.category === "outerwear";
          const prob = isOuter ? outerProb : 0.5;
          if (rnd() < prob) {
            withOpt[optSlot.name] = pool[0];
          }
        }
        variants.push(withOpt);

        const hasOuterOpt = optionalSlots.some(s => s.constraint.category === "outerwear");
        if (!hasOuterOpt || !outerwearMandatory(tempC)) {
          variants.push({ ...picks });
        }
      }

      for (const v of variants) {
        if (allCandidates.length >= MAX_COMBOS_PER_RECIPE) break;

        const pickedItems = Object.values(v);
        const colorSc = colorScore(pickedItems);
        if (colorSc === 0) continue;

        const styleSc = styleScore(style, pickedItems);

        let likedBonus = 0;
        for (const it of pickedItems) {
          if (votedItemIds.liked.includes(it.id)) likedBonus += 5;
        }

        let pinnedBonus = 0;
        for (const it of pickedItems) {
          if (pinnedIds.has(it.id)) pinnedBonus += 5;
        }

        const recipeBonus = 35;

        let outerPenalty = 0;
        const outerSlotSkipped = recipe.slots.some(s =>
          s.constraint.category === "outerwear" && skippedSlotNames.has(s.name)
        );
        if (outerwearMandatory(tempC) && !outerSlotSkipped) {
          const hasOuter = pickedItems.some(it => it.category === "outerwear");
          if (!hasOuter && optionalSlots.some(s => s.constraint.category === "outerwear")) {
            outerPenalty = -20;
          }
        }

        const fallbackPenalty = recipeFallbackNotes.length > 0 ? -6 : 0;

        const total = clamp(
          Math.round(colorSc + styleSc + likedBonus + pinnedBonus + recipeBonus + outerPenalty + fallbackPenalty),
          0, 100
        );

        const sortedIds = pickedItems.map(i => i.id).sort().join(",");
        const hash = hashStr(`${recipe.id}:${sortedIds}`);

        allCandidates.push({
          recipe,
          picks: v,
          pickedItems,
          score: total,
          hash,
          fallbackNotes: [...recipeFallbackNotes],
        });
      }
    }
  }

  // ── FIX #5: SMART SUBSTITUTION FALLBACK ──────────────────────────────────
  // V13: NEVER dummy items if user has real wardrobe. Score 35-65.
  if (allCandidates.length === 0) {
    return smartSubstitutionFallback(allTops, allBottoms, allShoes, allAccessories, occasion, tempC, style, votedItemIds, recentIds, pinnedIds, dislikedSet, rnd, includeAcc, "constraint_fail");
  }

  // ── DEDUPLICATE ──────────────────────────────────────────────────────────
  const seen = new Set<string>();
  const uniqueCandidates: Candidate[] = [];
  for (const c of allCandidates) {
    if (seen.has(c.hash)) continue;
    seen.add(c.hash);
    uniqueCandidates.push(c);
  }

  uniqueCandidates.sort((a, b) => b.score - a.score);

  const safePool: Candidate[] = [];
  const colorfulPool: Candidate[] = [];
  for (const c of uniqueCandidates) {
    const colors = c.pickedItems.map(i => cc(i));
    const loud = colors.filter(c => !NEUTRAL.has(c)).length;
    if (loud <= 1) safePool.push(c);
    else colorfulPool.push(c);
  }

  const ROTATION_K = 6;
  const safeCandidates = (safePool.length > 0 ? safePool : uniqueCandidates).slice(0, ROTATION_K);
  const colorfulCandidates = (colorfulPool.length > 0 ? colorfulPool : uniqueCandidates).slice(0, ROTATION_K);

  const safeCand = safeCandidates[Math.floor(rnd() * safeCandidates.length)];
  let colorfulCand = colorfulCandidates[Math.floor(rnd() * colorfulCandidates.length)];

  if (colorfulCand.hash === safeCand.hash && colorfulCandidates.length > 1) {
    colorfulCand = colorfulCandidates.find(c => c.hash !== safeCand.hash) ?? colorfulCand;
  }

  const safe = buildOutfit(safeCand, "Safe", occasion, includeAcc, allAccessories, tempC, rnd);
  const colorful = buildOutfit(colorfulCand, "Colorful", occasion, includeAcc, allAccessories, tempC, rnd);

  const isCold = tempC < 15;
  const safeOuterNote = safeCand.fallbackNotes.find(n => n.includes("veshje te jashtme"));
  if (isCold && safeOuterNote) {
    safe.why = `${safe.why ?? ""} (Pa veshje te jashtme — mbaje me hoodie/jacket nese ke ftohte.)`.trim();
  }
  const colorfulOuterNote = colorfulCand.fallbackNotes.find(n => n.includes("veshje te jashtme"));
  if (isCold && colorfulOuterNote) {
    colorful.why = `${colorful.why ?? ""} (Pa veshje te jashtme — mbaje me hoodie/jacket nese ke ftohte.)`.trim();
  }

  return [safe, colorful];
}

// ════════════════════════════════════════════════════════════════════════════
// FIX #5: SMART SUBSTITUTION FALLBACK
// ────────────────────────────────────────────────────────────────────────────
// Përdoret kur:
//   (a) Wardroba ka items por asnjë recipe nuk match (constraint fail)
//   (b) S'ka recetë për këtë occasion+tempC
//
// Logjika:
//   1. Filtro items në tempC range (jo strict — toleron ±5°C)
//   2. Sort sipas value (vote, recency, wear count)
//   3. Cartesian product top 5 për slot
//   4. Score: 35 (base) + colorScore + styleScore + tier bonus
//      - Tier compatibility check: nese tier match occasion ideal → +10
//      - Nese mismatch i lehtë → -10 (e.g. tee për work casual)
//      - Nese mismatch i rëndë → -20 (e.g. shorts për work formal)
//   5. Mbahen 2 me score më të lartë (Safe + Colorful split)
// ════════════════════════════════════════════════════════════════════════════
function getOccasionIdealTiers(occasion: Occasion): { min: number; max: number; ideal: number } {
  switch (occasion) {
    case "work": return { min: 3, max: 5, ideal: 4 };
    case "date": return { min: 2, max: 5, ideal: 3 };
    case "night_out": return { min: 2, max: 5, ideal: 3 };
    case "casual": return { min: 1, max: 3, ideal: 2 };
    case "travel": return { min: 1, max: 3, ideal: 2 };
    case "gym": return { min: 1, max: 2, ideal: 1 };
    default: return { min: 1, max: 5, ideal: 2 };
  }
}

function smartSubstitutionFallback(
  allTops: Item[],
  allBottoms: Item[],
  allShoes: Item[],
  allAccessories: Item[],
  occasion: Occasion,
  tempC: number,
  style: string,
  votedItemIds: VotedItemIds,
  recentIds: Set<string>,
  pinnedIds: Set<string>,
  dislikedSet: Set<string>,
  rnd: () => number,
  includeAcc: boolean,
  reason: "no_recipe" | "constraint_fail"
): Outfit[] {
  const idealTiers = getOccasionIdealTiers(occasion);

  // Filtër me toleranca: tempC ±5°C (mos jemi tepër strikt)
  const tempTolerance = 5;
  const inTempRange = (it: Item) => {
    const minT = inferMinTemp(it) - tempTolerance;
    const maxT = inferMaxTemp(it) + tempTolerance;
    return tempC >= minT && tempC <= maxT;
  };

  const validTops = allTops.filter(it =>
    !dislikedSet.has(it.id) &&
    it.category === "top" &&
    inTempRange(it)
  );
  const validBottoms = allBottoms.filter(it =>
    !dislikedSet.has(it.id) && inTempRange(it)
  );
  const validShoes = allShoes.filter(it =>
    !dislikedSet.has(it.id) && inTempRange(it)
  );

  // Nese ende nuk ka items në tempC range (clima ekstreme), përdor TË GJITHA items
  // Bun: mos kthe dummy NIVERZ
  const finalTops = validTops.length > 0 ? validTops : allTops.filter(it => !dislikedSet.has(it.id) && it.category === "top");
  const finalBottoms = validBottoms.length > 0 ? validBottoms : allBottoms.filter(it => !dislikedSet.has(it.id));
  const finalShoes = validShoes.length > 0 ? validShoes : allShoes.filter(it => !dislikedSet.has(it.id));

  if (finalTops.length === 0 || finalBottoms.length === 0 || finalShoes.length === 0) {
    return makeEmptyWardrobeMessage(occasion);
  }

  // Sort sipas value
  const valueSort = (a: Item, b: Item) =>
    scoreItemForPool(b, votedItemIds, recentIds) - scoreItemForPool(a, votedItemIds, recentIds);

  finalTops.sort(valueSort);
  finalBottoms.sort(valueSort);
  finalShoes.sort(valueSort);

  // Top 5 per slot
  const topsK = finalTops.slice(0, 5);
  const bottomsK = finalBottoms.slice(0, 5);
  const shoesK = finalShoes.slice(0, 5);

  const fallbackRecipe: OutfitRecipe = {
    id: reason === "no_recipe" ? "no_recipe_fallback" : "constraint_fallback",
    name: reason === "no_recipe"
      ? "Best fit from your wardrobe"
      : "Adapted from your wardrobe",
    occasion,
    tempMin: -30,
    tempMax: 45,
    styleTier: idealTiers.ideal,
    slots: [],
  };

  const candidates: Candidate[] = [];

  for (const t of topsK) {
    for (const b of bottomsK) {
      for (const s of shoesK) {
        const items = [t, b, s];

        // Color check (mos i kthe outfits me ngjyra të papajtueshme)
        const colorSc = colorScore(items);
        if (colorSc === 0) continue;

        // Tier compatibility scoring (FIX #5 KEY LOGIC)
        const tTier = inferTier(t);
        const bTier = inferTier(b);
        const sTier = inferTier(s);

        let tierScore = 0;
        for (const tier of [tTier, bTier, sTier]) {
          const diff = Math.abs(tier - idealTiers.ideal);
          if (tier >= idealTiers.min && tier <= idealTiers.max) {
            // Brenda range — +5 për item
            tierScore += 5;
            // Bonus nese ideal
            if (diff === 0) tierScore += 3;
          } else {
            // Jashtë range — penalty -15 per item (smart substitution penalty)
            // Mos break flow — vetëm penalizo
            tierScore -= 15;
          }
        }
        tierScore = clamp(tierScore, -45, 24);

        // Style match
        const styleSc = styleScore(style, items);

        // Liked bonus
        let likedBonus = 0;
        for (const it of items) {
          if (votedItemIds.liked.includes(it.id)) likedBonus += 5;
        }

        // Pinned bonus
        let pinnedBonus = 0;
        for (const it of items) {
          if (pinnedIds.has(it.id)) pinnedBonus += 5;
        }

        // Base score (fallback recipe = lower than normal recipe match)
        // Normal recipe: 35 base bonus
        // Fallback: 20 base bonus (sinjal se s'kemi recipe perfect)
        const fallbackBase = 20;

        const total = clamp(
          Math.round(colorSc + styleSc + likedBonus + pinnedBonus + tierScore + fallbackBase),
          35,  // Min 35 — KURRË score 25!
          75   // Max 75 — sinjal se s'është recipe-perfect
        );

        const sortedIds = items.map(i => i.id).sort().join(",");
        const hash = hashStr(`fallback:${sortedIds}`);

        const fallbackNotes: string[] = [];
        if (reason === "constraint_fail") {
          fallbackNotes.push("Adapted nga wardroba jote — provo me item të reja për kombinime më të mira.");
        } else {
          fallbackNotes.push("Best fit nga wardroba aktuale për këtë temperaturë.");
        }

        candidates.push({
          recipe: fallbackRecipe,
          picks: { top: t, bottom: b, shoes: s },
          pickedItems: items,
          score: total,
          hash,
          fallbackNotes,
        });
      }
    }
  }

  // Nese asnjë kombinim nuk kalon (krejt outfits klash në ngjyra)
  if (candidates.length === 0) {
    // Last resort: krijo 1 kombinim me items më të dashur, IGNORE color check
    const t = topsK[0];
    const b = bottomsK[0];
    const s = shoesK[0];
    const items = [t, b, s];

    const fallbackRecipe2: OutfitRecipe = {
      ...fallbackRecipe,
      name: "From your wardrobe",
    };

    const fallbackCand: Candidate = {
      recipe: fallbackRecipe2,
      picks: { top: t, bottom: b, shoes: s },
      pickedItems: items,
      score: 40,
      hash: hashStr(`last_resort:${items.map(i => i.id).join(",")}`),
      fallbackNotes: ["Wardroba aktuale — provo me ngjyra më të kombinueshme."],
    };
    candidates.push(fallbackCand);
  }

  candidates.sort((a, b) => b.score - a.score);

  // Build 2 outfits
  const safeCand = candidates[0];
  const colorfulCand = candidates.length > 1 ? candidates[1] : candidates[0];

  const safe = buildOutfit(safeCand, "Safe", occasion, includeAcc, allAccessories, tempC, rnd);
  const colorful = buildOutfit(colorfulCand, "Colorful", occasion, includeAcc, allAccessories, tempC, rnd);

  // Shtoj why context per transparence
  if (reason === "no_recipe") {
    const note = ` (S'kemi recetë specifike për këtë temperaturë + occasion — kjo është më e mira nga wardroba.)`;
    safe.why = `${safe.why ?? ""}${note}`.trim();
    colorful.why = `${colorful.why ?? ""}${note}`.trim();
  }

  return [safe, colorful];
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════
function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  if (arrays.some(a => a.length === 0)) return [];

  let result: T[][] = [[]];
  for (const arr of arrays) {
    const next: T[][] = [];
    for (const prefix of result) {
      for (const item of arr) {
        next.push([...prefix, item]);
      }
    }
    result = next;
    if (result.length > MAX_COMBOS_PER_RECIPE) {
      result = result.slice(0, MAX_COMBOS_PER_RECIPE);
      break;
    }
  }
  return result;
}

// FIX #5: VETËM kur user-i s'ka NJË kategori (top/bottom/shoes), përdor dummy
function makeEmptyWardrobeMessage(occasion: Occasion): Outfit[] {
  const message = "Shto te pakten 1 top, 1 bottom, 1 shoes.";
  const dummy: Item = { id: "wardrobe-empty", category: "top", type: "missing", color_family: "neutral" };
  const mk = (label: OutfitLabel): Outfit => ({
    label, occasion, score: 0,
    picks: { top: dummy, bottom: { ...dummy, category: "bottom" }, shoes: { ...dummy, category: "shoes" } },
    breakdown: { occasion: 0, harmony: 0, variety: 0, balance: 0 },
    outfit_hash: "empty-" + label,
    why: message,
  });
  return [mk("Safe"), mk("Colorful")];
}

function buildOutfit(
  c: Candidate,
  label: OutfitLabel,
  occasion: Occasion,
  includeAcc: boolean,
  allAccessories: Item[],
  tempC: number,
  rnd: () => number
): Outfit {
  const picks = c.picks;
  const pickedArr = Object.values(picks);

  let topItem = pickedArr.find(i => i.category === "top" && !isLayerCategory(i));
  let bottomItem = pickedArr.find(i => i.category === "bottom");
  let shoesItem = pickedArr.find(i => i.category === "shoes");
  let outerItem = pickedArr.find(i => i.category === "outerwear");

  if (!topItem) {
    topItem = pickedArr.find(i => i.category === "top");
  }

  if (!topItem || !bottomItem || !shoesItem) {
    // Kjo s'duhet të ndodhë me v13 smart substitution
    // Vetëm si safety net
    return makeEmptyWardrobeMessage(occasion)[0];
  }

  const accessories = includeAcc ? pickAccessories(allAccessories, occasion, tempC, shoesItem, rnd) : [];
  const finalScore = clamp(c.score + (accessories.length > 0 ? 3 : 0), 0, 100);

  return {
    label,
    occasion,
    score: finalScore,
    picks: {
      top: topItem,
      bottom: bottomItem,
      shoes: shoesItem,
      outer: outerItem,
      accessories: accessories.length ? accessories : undefined,
    },
    breakdown: {
      occasion: 35,
      harmony: colorScore(c.pickedItems),
      variety: 10,
      balance: 15,
      style: 0,
      explanation: c.recipe.name,
    },
    outfit_hash: hashStr(`${label}:${c.hash}`),
    why: buildWhy(c.recipe, topItem, bottomItem, shoesItem, outerItem, tempC),
  };
}