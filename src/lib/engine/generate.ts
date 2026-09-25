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

import type { Item, Occasion, Outfit, OutfitPicks, GenerateOptions, Gender, VotedItemIds } from "./types";
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
    if (has("pencil") && has("skirt")) return 4;
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
  if (has("pencil") && has("skirt")) return 5;
  if (has("midi") && has("skirt")) return 10;
  if (has("skirt")) return 10;
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
  if (has("pencil") && has("skirt")) return 28;
  if (has("skirt")) return 32;
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

// Rain awareness — was previously only a separate, cruder pre-filter that
// only AppPageClient remembered to apply (filterItemsByWeather), so Trip
// Planner never considered rain at all despite having isRaining per day.
// Moved into the engine itself so every caller gets the same behavior.
function isRainUnsafeShoe(item: Item): boolean {
  if (item.category !== "shoes") return false;
  const tokens = tokenize(tt(item));
  const has = (s: string) => tokens.includes(s);
  return has("sandal") || has("flip") || has("canvas") || has("espadrille");
}

// ════════════════════════════════════════════════════════════════════════════
// SLOT MATCHER (preserved)
// ════════════════════════════════════════════════════════════════════════════
function matchesSlot(item: Item, constraint: SlotConstraint, tempC: number, allowLayered: boolean = false, isRaining: boolean = false): boolean {
  if (item.category !== constraint.category) return false;
  if (isDress(item)) return false; // dresses have their own path (dressCandidates)
  if (isRaining && isRainUnsafeShoe(item)) return false;

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
  if (votedItemIds.disliked.includes(item.id)) score -= 20;
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

function isInnerTee(it: Item): boolean {
  const tokens = tokenize(tt(it));
  return ["tee", "t", "tshirt", "longsleeve", "henley", "tank"].some(t => tokens.includes(t)) && !isMidLayerTop(it);
}

// A mid layer worn over a tee/shirt (as opposed to a coat-type outer layer).
function isMidLayerTop(it: Item): boolean {
  if (it.category !== "top") return false;
  const tokens = tokenize(tt(it));
  return ["hoodie", "sweatshirt", "zip", "cardigan", "sweater", "knit", "pullover", "crewneck", "fleece"]
    .some(t => tokens.includes(t));
}

function topIdsOf(c: { pickedItems: Item[] }): string[] {
  return c.pickedItems.filter(i => i.category === "top").map(i => i.id);
}

// One-piece garments. The photo AI files them under "top" (type "dress",
// "dress_casual", "maxi_dress", "jumpsuit"...), so they must never be treated
// as a top that gets jeans or a skirt added underneath.
export function isDress(it: Item): boolean {
  if (it.category !== "top") return false;
  const tokens = tokenize(tt(it));
  const tagged = (it.style_tags ?? []).some(t => String(t).toLowerCase() === "dress");
  const named = tokens.includes("dress") || tokens.includes("jumpsuit") || tokens.includes("romper") || tokens.includes("playsuit");
  if (!named && !tagged) return false;
  return !["shirt", "pant", "trouser", "shoe"].some(t => tokens.map(singularize).includes(t));
}

// How well an outfit's layers suit the temperature. Without this, a look with
// a jacket and the same look without one scored identically, so at 6°C the
// jacket was left out about half the time even with several in the wardrobe.
function warmthScore(pieces: Item[], tempC: number, outerAvailable: boolean): number {
  const hasOuter = pieces.some(i => i.category === "outerwear");
  const hasMid = pieces.some(isMidLayerTop);
  // Pieces worn right at the top of their temperature range (jeans at 28°C
  // when there are shorts) lose to cooler options.
  const nearlyTooWarm = pieces.filter(i => i.category !== "accessory" && tempC >= 22 && tempC >= inferMaxTemp(i) - 2).length;
  const heat = nearlyTooWarm * -6;
  if (tempC >= 20) return heat + (hasOuter ? -12 : 0);
  if (tempC >= 16) return hasOuter ? -3 : 0;
  if (tempC >= 11) return hasOuter ? 6 : hasMid ? 2 : outerAvailable ? -6 : 0;
  if (tempC >= 5) return hasOuter ? 12 : !outerAvailable ? 0 : hasMid ? -8 : -16;
  return hasOuter ? 15 : outerAvailable ? -30 : 0;
}

function avgTier(pieces: Item[]): number {
  const worn = pieces.filter(i => i.category !== "shoes" && i.category !== "accessory");
  if (!worn.length) return 2;
  return worn.reduce((s, i) => s + inferTier(i), 0) / worn.length;
}

// Jackets/coats that suit this look: right temperature, similar formality
// (a puffer doesn't go over a dress shirt for work unless it's freezing),
// and colors that still work together.
function outerOptionsFor(pieces: Item[], pool: Item[], tempC: number, max = 2): Item[] {
  if (tempC >= 20 || pool.length === 0) return [];
  const tier = avgTier(pieces);
  return pool
    .filter(o => tempC < 5 || Math.abs(inferTier(o) - tier) <= 1.5)
    .map(o => ({ o, c: colorScore([...pieces, o]) }))
    .filter(x => x.c > 0)
    .sort((a, b) => b.c - a.c)
    .slice(0, max)
    .map(x => x.o);
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
    // The AI tagger writes free-form tags like "smart casual" as a single
    // string, not the bare "smart"/"casual" this map expects - exact
    // array membership silently missed those, so match by substring instead.
    if (relevantTags.some(rt => tags.some(tag => tag.includes(rt) || rt.includes(tag)))) matchCount++;
  }
  return Math.min(15, matchCount * 5);
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
    if (k === "sunglasses" && (occasion === "night_out" || tempC < 5)) return false;
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

const NO_OUTER_NOTE = "no-outerwear";

const TYPE_FALLBACKS: Record<string, { subs: string[]; name: string }> = {
  "loafer": { subs: ["derby", "oxford", "chelsea", "leather_sneaker", "sneaker"], name: "loafers" },
  "oxford": { subs: ["derby", "loafer", "chelsea", "leather_sneaker"], name: "oxford" },
  "derby": { subs: ["oxford", "loafer", "chelsea", "leather_sneaker"], name: "derby" },
  "chelsea": { subs: ["ankle_boot", "loafer", "leather_sneaker", "sneaker"], name: "chelsea boots" },
  "ankle_boot": { subs: ["chelsea", "boot", "leather_sneaker", "sneaker"], name: "ankle boots" },
  "dress_shoe": { subs: ["oxford", "derby", "loafer", "chelsea"], name: "dress shoes" },
  "leather_sneaker": { subs: ["sneaker", "canvas"], name: "leather sneakers" },
  "shirt": { subs: ["polo", "henley", "tee"], name: "classic shirt" },
  "dress_shirt": { subs: ["shirt", "polo"], name: "dress shirt" },
  "blouse": { subs: ["shirt", "polo", "tee"], name: "blouse" },
  "polo": { subs: ["henley", "tee", "shirt"], name: "polo" },
  "sweater": { subs: ["knit", "cardigan", "sweatshirt", "hoodie"], name: "sweater" },
  "knit": { subs: ["sweater", "cardigan", "sweatshirt"], name: "knit" },
  "cardigan": { subs: ["sweater", "knit", "sweatshirt"], name: "cardigan" },
  "chino": { subs: ["jean", "trouser", "denim", "midi_skirt", "skirt"], name: "chinos" },
  "trouser": { subs: ["chino", "dress_pant", "jean", "pencil_skirt", "midi_skirt"], name: "dress trousers" },
  "dress_pant": { subs: ["trouser", "chino", "pencil_skirt", "midi_skirt"], name: "dress pants" },
  "jean": { subs: ["chino", "denim", "trouser", "skirt"], name: "jeans" },
  "dark_jean": { subs: ["jean", "denim", "chino", "trouser", "midi_skirt"], name: "dark jeans" },
  "skirt": { subs: ["midi_skirt", "chino", "trouser", "jean"], name: "skirt" },
  "midi_skirt": { subs: ["skirt", "chino", "trouser", "pencil_skirt"], name: "midi skirt" },
  "pencil_skirt": { subs: ["midi_skirt", "trouser", "dress_pant"], name: "pencil skirt" },
  "mini_skirt": { subs: ["skirt", "shorts", "jean"], name: "mini skirt" },
  "blazer": { subs: ["sport_coat", "cardigan", "jacket", "sweater"], name: "blazer" },
  "sport_coat": { subs: ["blazer", "jacket"], name: "sport coat" },
  "coat": { subs: ["trench", "overcoat", "peacoat", "jacket"], name: "coat" },
  "trench": { subs: ["coat", "overcoat", "jacket"], name: "trench coat" },
  "overcoat": { subs: ["coat", "trench", "peacoat"], name: "overcoat" },
  "peacoat": { subs: ["coat", "trench", "overcoat", "jacket"], name: "peacoat" },
  "heel": { subs: ["pump", "loafer", "flat", "ankle_boot"], name: "heels" },
  "pump": { subs: ["heel", "loafer", "flat"], name: "pump" },
  "flat": { subs: ["loafer", "leather_sneaker", "ballet"], name: "flats" },
};

const TOP_K_PER_SLOT = 15;
const MAX_COMBOS_PER_RECIPE = 50000;

// Everything a look is scored and explained against, built once per call.
type EngineCtx = {
  occasion: Occasion;
  tempC: number;
  weatherKnown: boolean;
  isRaining: boolean;
  style: string;
  votedItemIds: VotedItemIds;
  recentIds: Set<string>;
  pinnedIds: Set<string>;
  includeAcc: boolean;
  allAccessories: Item[];
  allOuter: Item[];
  outerPool: Item[]; // outerwear that suits this temperature and occasion
  rnd: () => number;
};

// Score parts shared by every kind of look (recipe, substitution, dress).
function commonScore(pieces: Item[], ctx: EngineCtx): number {
  let s = styleScore(ctx.style, pieces) + warmthScore(pieces, ctx.tempC, ctx.outerPool.length > 0);
  for (const it of pieces) {
    if (ctx.votedItemIds.liked.includes(it.id)) s += 5;
    if (ctx.votedItemIds.disliked.includes(it.id)) s -= 10;
    if (ctx.pinnedIds.has(it.id)) s += 5;
    // Recency must count in the final score, not only the per-slot pre-sort,
    // or the same pieces win every time (seen on multi-day trips).
    if (ctx.recentIds.has(it.id)) s -= 12;
  }
  return s;
}

const MAX_LOOKS = 8;
export const MILD_DEFAULT_TEMP = 18;

// Returns the best look first, followed by up to MAX_LOOKS - 1 genuinely
// different alternatives (different top, mostly different pieces) for the
// "Another look" button. Trip Planner and swap use only the first.
export function generateOutfits(
  items: Item[],
  occasion: Occasion,
  seed: number,
  opts: GenerateOptions = {}
): Outfit[] {
  const rnd = mulberry32(seed);
  const gender: Gender = opts.gender ?? "male";
  const style = opts.style ?? (typeof window !== "undefined" ? localStorage.getItem("om_style") ?? "minimal" : "minimal");
  const weatherKnown = opts.tempC !== undefined;
  // No weather (turned off / location denied): assume a mild day. It used to
  // read the last temperature saved on the device, which could be days old -
  // while the swap sheet assumed 20°C, so the two disagreed.
  const tempC = opts.tempC ?? MILD_DEFAULT_TEMP;
  const isRaining = opts.isRaining ?? false;
  const includeAcc = opts.includeAccessories ?? true;

  const votedItemIds: VotedItemIds = opts.votedItemIds ?? { liked: [], disliked: [] };
  const recentIds = new Set(opts.recentItemIds ?? []);
  const pinnedIds = new Set(opts.pinnedItemIds ?? []);

  const allTops = items.filter(i => i.category === "top" && !isDress(i));
  const dresses = items.filter(isDress);
  const allBottoms = items.filter(i => i.category === "bottom");
  const allShoes = items.filter(i => i.category === "shoes");
  const allAccessories = items.filter(i => i.category === "accessory");
  const allOuter = items.filter(i => i.category === "outerwear");

  const hasSeparates = allTops.length > 0 && allBottoms.length > 0;
  if ((!hasSeparates && dresses.length === 0) || allShoes.length === 0) {
    return makeEmptyWardrobeMessage(occasion);
  }

  const byValue = (a: Item, b: Item) => scoreItemForPool(b, votedItemIds, recentIds) - scoreItemForPool(a, votedItemIds, recentIds);
  const suitableOuter = allOuter
    .filter(o => isInTempRange(o, tempC) && !isForbiddenForOccasion(o, occasion))
    .sort(byValue);
  const pinnedOuter = suitableOuter.filter(o => pinnedIds.has(o.id));

  const ctx: EngineCtx = {
    occasion, tempC, weatherKnown, isRaining, style, votedItemIds, recentIds, pinnedIds,
    includeAcc, allAccessories, allOuter,
    outerPool: pinnedOuter.length ? pinnedOuter : suitableOuter,
    rnd,
  };

  let candidates: Candidate[] = [];
  let usedForbiddenFallback = false;
  if (hasSeparates) {
    candidates = recipeCandidates(items, gender, ctx);
    if (candidates.length === 0) {
      const sub = substitutionCandidates(allTops, allBottoms, allShoes, ctx, getRecipesFor(occasion, tempC, gender).length ? "constraint_fail" : "no_recipe");
      candidates = sub.candidates;
      usedForbiddenFallback = sub.usedForbiddenFallback;
    }
  }
  candidates.push(...dressCandidates(dresses, allShoes, ctx, false));
  if (candidates.length === 0 && dresses.length > 0) {
    candidates = dressCandidates(dresses, allShoes, ctx, true);
    usedForbiddenFallback = true;
  }
  if (candidates.length === 0) return makeEmptyWardrobeMessage(occasion);

  candidates.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const unique = candidates.filter(c => { const k = lookKey(c); return seen.has(k) ? false : (seen.add(k), true); });

  return selectLooks(unique, recentIds, rnd).map(c => {
    const look = buildOutfit(c, ctx);
    const notes: string[] = [];
    const recipeNote = c.fallbackNotes.find(n => n !== NO_OUTER_NOTE);
    if (recipeNote) notes.push(recipeNote);
    if (tempC < 12 && !look.picks.outer) {
      notes.push(allOuter.length === 0
        ? "Add a jacket or coat to your wardrobe for days like this."
        : "None of your jackets suits this temperature, so wear your warmest layer.");
    }
    if (usedForbiddenFallback) {
      notes.push(`Add a few ${occasion === "gym" ? "workout" : occasion.replace(/_/g, " ")} pieces to your wardrobe for better looks.`);
    }
    if (notes.length) look.why = `${look.why} ${notes.join(" ")}`;
    return look;
  });
}

function recipeCandidates(items: Item[], gender: Gender, ctx: EngineCtx): Candidate[] {
  const { occasion, tempC, isRaining, votedItemIds, recentIds, pinnedIds } = ctx;
  const recipes = getRecipesFor(occasion, tempC, gender);
  const allCandidates: Candidate[] = [];

  // Tees that can go under a hoodie/sweatshirt whichever recipe picked it (a
  // hoodie often fills a "sweater" slot as a substitute, and those recipes
  // have no inner slot of their own). Only "too warm" rules a tee out here.
  const innerPool = items
    .filter(it => it.category === "top" && isInnerTee(it) && tempC <= inferMaxTemp(it))
    .sort((a, b) => scoreItemForPool(b, votedItemIds, recentIds) - scoreItemForPool(a, votedItemIds, recentIds));
  const innerFor = (picked: Record<string, Item>) => {
    const tops = Object.values(picked).filter(i => i.category === "top");
    if (tops.length !== 1 || !isMidLayerTop(tops[0]) || innerPool.length === 0) return undefined;
    return innerPool.find(it => !recentIds.has(it.id)) ?? innerPool[0];
  };

  for (const recipe of recipes) {
    const slotPools: Record<string, Item[]> = {};
    let allRequiredOK = true;
    const recipeFallbackNotes: string[] = [];

    const hasRequiredOuter = recipe.slots.some(s => s.required && s.constraint.category === "outerwear");

    for (const slot of recipe.slots) {
      const allowLayered = hasRequiredOuter && slot.constraint.category === "top";
      // A tee worn under a hoodie/sweater is never "too cold" on its own - only
      // check that it isn't too warm. Without this, below ~15°C every tee was
      // filtered out and hoodies were always suggested with nothing under them.
      const isInnerLayer = slot.name === "inner_top";

      let matched = items.filter(it => {
        const t = isInnerLayer ? Math.max(tempC, inferMinTemp(it)) : tempC;
        return matchesSlot(it, slot.constraint, t, allowLayered, isRaining);
      });

      if (matched.length === 0 && slot.required) {
        const allowedSubs = new Set<string>();
        let idealName = "";
        for (const reqType of slot.constraint.types) {
          const fData = TYPE_FALLBACKS[reqType.toLowerCase()];
          if (fData) {
            fData.subs.forEach(s => allowedSubs.add(s));
            if (!idealName) idealName = fData.name;
          }
        }
        if (allowedSubs.size > 0) {
          const cleanedExclude = (slot.constraint.excludeTypes ?? []).filter(ex => !allowedSubs.has(ex.toLowerCase()));
          const looseConstraint: SlotConstraint = {
            ...slot.constraint,
            types: [...slot.constraint.types, ...Array.from(allowedSubs)],
            excludeTypes: cleanedExclude.length > 0 ? cleanedExclude : undefined,
            tierMin: Math.max(1, slot.constraint.tierMin - 2),
            tierMax: Math.min(5, slot.constraint.tierMax + 1),
            colors: undefined,
          };
          matched = items.filter(it => matchesSlot(it, looseConstraint, tempC, allowLayered, isRaining));
          if (matched.length > 0) {
            const chosenType = matched[0].type.replace(/_/g, " ");
            recipeFallbackNotes.push(
              idealName ? `No ${idealName} in your wardrobe, so we used your ${chosenType}.` : `Closest match from your wardrobe: ${chosenType}.`
            );
          }
        }
      }

      const pinnedInSlot = matched.filter(it => pinnedIds.has(it.id));
      if (pinnedInSlot.length > 0) matched = pinnedInSlot;

      matched.sort((a, b) => scoreItemForPool(b, votedItemIds, recentIds) - scoreItemForPool(a, votedItemIds, recentIds));
      slotPools[slot.name] = matched.slice(0, TOP_K_PER_SLOT);

      if (slot.required && slotPools[slot.name].length === 0) {
        if (slot.constraint.category === "outerwear") {
          // The look still works without the coat; warmthScore penalises it
          // in the cold and the final note tells the user.
          recipeFallbackNotes.push(NO_OUTER_NOTE);
          continue;
        }
        allRequiredOK = false;
        break;
      }
    }

    if (!allRequiredOK) continue;

    const requiredSlots = recipe.slots.filter(s => s.required && slotPools[s.name].length > 0);
    const optionalSlots = recipe.slots.filter(s => !s.required);
    const recipeOuters = optionalSlots
      .filter(s => s.constraint.category === "outerwear")
      .flatMap(s => slotPools[s.name] ?? []);

    for (const requiredCombo of cartesianProduct(requiredSlots.map(s => slotPools[s.name]))) {
      if (allCandidates.length >= MAX_COMBOS_PER_RECIPE) break;

      const base: Record<string, Item> = {};
      requiredSlots.forEach((s, idx) => { base[s.name] = requiredCombo[idx]; });

      // An inner layer (tee under a hoodie/sweater) is part of the look, not a
      // coin flip. Always add it when the wardrobe has one, preferring a top
      // that wasn't worn recently.
      for (const optSlot of optionalSlots) {
        if (optSlot.name !== "inner_top") continue;
        const pool = slotPools[optSlot.name];
        if (pool && pool.length > 0) base[optSlot.name] = pool.find(it => !recentIds.has(it.id)) ?? pool[0];
      }
      const extraInner = innerFor(base);
      if (extraInner) base.inner_top = extraInner;

      // Outer layer: the look with and without a jacket both compete, and
      // warmthScore decides by temperature. Uses the recipe's own coat types
      // when it has them, otherwise any jacket in the wardrobe that suits it.
      const variants: Array<Record<string, Item>> = [];
      const basePieces = Object.values(base);
      if (basePieces.some(i => i.category === "outerwear")) {
        variants.push(base);
      } else {
        const outers = outerOptionsFor(basePieces, recipeOuters.length ? recipeOuters : ctx.outerPool, tempC);
        for (const o of outers) variants.push({ ...base, outer: o });
        if (!(outerwearMandatory(tempC) && outers.length > 0)) variants.push(base);
      }

      for (const v of variants) {
        if (allCandidates.length >= MAX_COMBOS_PER_RECIPE) break;
        const pickedItems = Object.values(v);
        const colorSc = colorScore(pickedItems);
        if (colorSc === 0) continue;

        const substituted = recipeFallbackNotes.some(n => n !== NO_OUTER_NOTE);
        const total = 35 + colorSc + commonScore(pickedItems, ctx) + (substituted ? -6 : 0);
        const hash = hashStr(`${pickedItems.map(i => i.id).sort().join(",")}`);

        allCandidates.push({ recipe, picks: v, pickedItems, score: total, hash, fallbackNotes: [...recipeFallbackNotes] });
      }
    }
  }
  return allCandidates;
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

// ════════════════════════════════════════════════════════════════════════════
// OCCASION-FORBIDDEN TYPES — smartSubstitutionFallback only checks numeric
// formality tier, which is blind to category: a formal wool sweater (tier 3)
// and gym joggers (tier 1) can both fall inside an occasion's tier range while
// being completely wrong garments for it (e.g. jeans/skirts/dress shoes score
// as gym-appropriate purely because their tier happens to be low). This is a
// hard category filter on top of the tier check, only for occasions where a
// wrong-category pick is obviously broken (gym, work) or jarring (date/night
// out getting gym gear) - casual/travel stay permissive by design.
// ════════════════════════════════════════════════════════════════════════════
const OCCASION_FORBIDDEN_TYPES: Partial<Record<Occasion, string[]>> = {
  gym: [
    "jean", "denim", "chino", "trouser", "dress_pant", "skirt", "mini", "midi",
    "shirt", "dress_shirt", "blouse", "blazer", "sport_coat", "sweater", "knit",
    "cardigan", "turtleneck", "coat", "trench", "overcoat", "peacoat",
    "oxford", "derby", "loafer", "dress_shoe", "monk", "heel", "pump", "mule",
    "chelsea", "boot", "flat", "ballet",
  ],
  work: [
    "shorts", "jogger", "sweatpant", "track_pant", "tracksuit", "legging",
    "athletic", "sandal", "flip_flop", "slipper", "running", "trainer",
  ],
  date: ["jogger", "sweatpant", "track_pant", "tracksuit", "athletic", "flip_flop", "slipper"],
  night_out: ["jogger", "sweatpant", "track_pant", "tracksuit", "athletic", "flip_flop", "slipper"],
};

function isForbiddenForOccasion(item: Item, occasion: Occasion): boolean {
  const forbidden = OCCASION_FORBIDDEN_TYPES[occasion];
  if (!forbidden) return false;
  const itType = tt(item);
  return forbidden.some(pat => matchesPattern(itType, pat));
}

// Used when no recipe fits the wardrobe (or there is no recipe for this
// occasion + temperature): builds looks straight from the user's pieces,
// scored on formality fit for the occasion, colors, warmth and history.
function substitutionCandidates(
  allTops: Item[],
  allBottoms: Item[],
  allShoes: Item[],
  ctx: EngineCtx,
  reason: "no_recipe" | "constraint_fail",
): { candidates: Candidate[]; usedForbiddenFallback: boolean } {
  const { occasion, tempC, isRaining, votedItemIds, recentIds } = ctx;
  const idealTiers = getOccasionIdealTiers(occasion);

  // Tolerant temperature filter (±5°C) - better a slightly warm pick than none.
  const tempTolerance = 5;
  const inTempRange = (it: Item) => tempC >= inferMinTemp(it) - tempTolerance && tempC <= inferMaxTemp(it) + tempTolerance;

  const validTops = allTops.filter(it => inTempRange(it) && !isForbiddenForOccasion(it, occasion));
  const validBottoms = allBottoms.filter(it => inTempRange(it) && !isForbiddenForOccasion(it, occasion));
  const validShoes = allShoes.filter(it => inTempRange(it) && !isForbiddenForOccasion(it, occasion) && !(isRaining && isRainUnsafeShoe(it)));

  // With nothing in range, drop the temperature rule but keep the occasion
  // rule (no jeans for the gym just because it's cold). Only if the wardrobe
  // has literally nothing for the occasion do we fall back to everything, and
  // the look then says so.
  const occTops = allTops.filter(it => !isForbiddenForOccasion(it, occasion));
  const occBottoms = allBottoms.filter(it => !isForbiddenForOccasion(it, occasion));
  const occShoes = allShoes.filter(it => !isForbiddenForOccasion(it, occasion));
  const usedForbiddenFallback = occTops.length === 0 || occBottoms.length === 0 || occShoes.length === 0;

  const pick = (valid: Item[], occ: Item[], all: Item[]) => (valid.length ? valid : occ.length ? occ : all);
  const byValue = (a: Item, b: Item) => scoreItemForPool(b, votedItemIds, recentIds) - scoreItemForPool(a, votedItemIds, recentIds);
  const topsK = [...pick(validTops, occTops, allTops)].sort(byValue).slice(0, 6);
  const bottomsK = [...pick(validBottoms, occBottoms, allBottoms)].sort(byValue).slice(0, 6);
  const shoesK = [...pick(validShoes, occShoes, allShoes)].sort(byValue).slice(0, 6);

  const recipe: OutfitRecipe = {
    id: reason === "no_recipe" ? "no_recipe_fallback" : "constraint_fallback",
    name: "From your wardrobe",
    occasion,
    tempMin: -30,
    tempMax: 45,
    styleTier: idealTiers.ideal,
    slots: [],
  };

  const innerPool = allTops
    .filter(it => isInnerTee(it) && tempC <= inferMaxTemp(it))
    .sort(byValue);
  const innerUnder = (top: Item) =>
    isMidLayerTop(top) && innerPool.length > 0 ? (innerPool.find(it => !recentIds.has(it.id) && it.id !== top.id) ?? innerPool.find(it => it.id !== top.id)) : undefined;

  const tierFit = (pieces: Item[]) => {
    let s = 0;
    for (const it of pieces) {
      const tier = inferTier(it);
      if (tier >= idealTiers.min && tier <= idealTiers.max) s += tier === idealTiers.ideal ? 8 : 5;
      else s -= 15;
    }
    return s;
  };

  const candidates: Candidate[] = [];
  for (const t of topsK) {
    for (const b of bottomsK) {
      for (const s of shoesK) {
        const inner = innerUnder(t);
        const base: Record<string, Item> = { top: t, bottom: b, shoes: s, ...(inner ? { inner } : {}) };
        const basePieces = Object.values(base);
        const variants: Array<Record<string, Item>> = [];
        const outers = outerOptionsFor(basePieces, ctx.outerPool, tempC);
        for (const o of outers) variants.push({ ...base, outer: o });
        if (!(outerwearMandatory(tempC) && outers.length > 0)) variants.push(base);

        for (const v of variants) {
          const pieces = Object.values(v);
          const colorSc = colorScore(pieces);
          if (colorSc === 0) continue;
          const score = 20 + colorSc + tierFit([t, b, s]) + commonScore(pieces, ctx);
          candidates.push({
            recipe, picks: v, pickedItems: pieces, score,
            hash: hashStr(pieces.map(i => i.id).sort().join(",")),
            fallbackNotes: [],
          });
        }
      }
    }
  }

  // Every combination clashed on color: still return the user's own best
  // pieces rather than nothing.
  if (candidates.length === 0) {
    const [t, b, s] = [topsK[0], bottomsK[0], shoesK[0]];
    const inner = innerUnder(t);
    const outer = ctx.outerPool[0];
    const v: Record<string, Item> = { top: t, bottom: b, shoes: s, ...(inner ? { inner } : {}), ...(outer && tempC < 12 ? { outer } : {}) };
    candidates.push({
      recipe, picks: v, pickedItems: Object.values(v), score: 30,
      hash: hashStr(Object.values(v).map(i => i.id).sort().join(",")),
      fallbackNotes: [],
    });
  }
  return { candidates, usedForbiddenFallback };
}

const DRESS_RECIPE_NAME = "Dress";

// Dresses/jumpsuits are a complete look with just shoes (and a jacket when
// it's cold). `relaxed` ignores occasion/temperature fit - only used when the
// wardrobe has nothing else at all.
function dressCandidates(dresses: Item[], allShoes: Item[], ctx: EngineCtx, relaxed: boolean): Candidate[] {
  const { occasion, tempC, isRaining, votedItemIds, recentIds } = ctx;
  if (dresses.length === 0) return [];
  if (occasion === "gym" && !relaxed) return [];
  const ideal = getOccasionIdealTiers(occasion);
  const tierOk = (it: Item) => relaxed || (inferTier(it) >= ideal.min - 1 && inferTier(it) <= ideal.max + 1);
  const byValue = (a: Item, b: Item) => scoreItemForPool(b, votedItemIds, recentIds) - scoreItemForPool(a, votedItemIds, recentIds);

  const ds = dresses.filter(d => tierOk(d) && (relaxed || isInTempRange(d, tempC))).sort(byValue).slice(0, 10);
  const ss = allShoes
    .filter(s => tierOk(s) && !isForbiddenForOccasion(s, occasion) && (relaxed || isInTempRange(s, tempC)) && !(isRaining && isRainUnsafeShoe(s)))
    .sort(byValue)
    .slice(0, 10);
  if (!ds.length || !ss.length) return [];

  const recipe: OutfitRecipe = { id: "dress_look", name: DRESS_RECIPE_NAME, occasion, tempMin: -30, tempMax: 45, styleTier: ideal.ideal, slots: [] };
  const out: Candidate[] = [];
  for (const d of ds) {
    for (const s of ss) {
      const base: Record<string, Item> = { top: d, shoes: s };
      const variants: Array<Record<string, Item>> = [];
      const outers = outerOptionsFor([d, s], ctx.outerPool, tempC);
      for (const o of outers) variants.push({ ...base, outer: o });
      if (!(outerwearMandatory(tempC) && outers.length > 0)) variants.push(base);
      for (const v of variants) {
        const pieces = Object.values(v);
        const colorSc = colorScore(pieces);
        if (colorSc === 0) continue;
        // Only penalise a poor formality fit: separates from recipes get no
        // bonus for it either, and a bonus here made dresses win almost always.
        const tierFit = [d, s].reduce((acc, it) => acc + (inferTier(it) >= ideal.min && inferTier(it) <= ideal.max ? 0 : -10), 0);
        out.push({
          recipe, picks: v, pickedItems: pieces,
          score: 35 + colorSc + tierFit + commonScore(pieces, ctx),
          hash: hashStr(pieces.map(i => i.id).sort().join(",")),
          fallbackNotes: [],
        });
      }
    }
  }
  return out;
}

// Picks the looks to show: the first is one of the strongest options (so
// "Generate" gives variety without giving a worse look), the rest are the
// best remaining looks that each bring a different top and mostly different
// pieces. Recently worn tops are skipped whenever anything else exists.
// What the user actually sees: two black tees are the same to them even if
// they are different items (duplicate uploads are common).
function visualKey(it: Item): string { return `${it.category}|${tt(it)}|${cc(it)}`; }
function lookKey(c: Candidate): string { return c.pickedItems.map(visualKey).sort().join(","); }

function differsByAtMostOne(a: Candidate, b: Candidate): boolean {
  const ka = a.pickedItems.map(visualKey), kb = b.pickedItems.map(visualKey);
  const rest = [...kb];
  let shared = 0;
  for (const k of ka) { const i = rest.indexOf(k); if (i >= 0) { rest.splice(i, 1); shared++; } }
  const diff = (ka.length - shared) + (kb.length - shared);
  return diff <= 2; // one piece swapped counts as 2 (one out, one in)
}

function selectLooks(cands: Candidate[], recentIds: Set<string>, rnd: () => number): Candidate[] {
  const sorted = [...cands].sort((a, b) => b.score - a.score).slice(0, 600);
  const isFresh = (c: Candidate) => topIdsOf(c).every(id => !recentIds.has(id));
  const fresh = sorted.filter(isFresh);
  const pool0 = fresh.length ? fresh : sorted;

  const bestScore = pool0[0].score;
  const near = pool0.filter(c => c.score >= bestScore - 8);
  const worn = (c: Candidate) => c.pickedItems.filter(i => recentIds.has(i.id)).length;
  const leastWorn = Math.min(...near.map(worn));
  const firstPool = near.filter(c => worn(c) === leastWorn);
  const first = firstPool[Math.floor(rnd() * Math.min(6, firstPool.length))];

  const chosen: Candidate[] = [first];
  const topKeys = (c: Candidate) => c.pickedItems.filter(i => i.category === "top").map(visualKey);
  const usedTops = new Set(topKeys(first));
  const usedItems = new Set(first.pickedItems.map(visualKey));
  while (chosen.length < MAX_LOOKS) {
    let best: Candidate | undefined;
    let bestValue = -Infinity;
    for (const c of sorted) {
      if (chosen.includes(c)) continue;
      if (chosen.some(ch => differsByAtMostOne(ch, c))) continue;
      const topRepeat = topKeys(c).some(k => usedTops.has(k));
      const overlap = c.pickedItems.filter(i => usedItems.has(visualKey(i))).length;
      const value = c.score - (topRepeat ? 40 : 0) - overlap * 6 - (isFresh(c) ? 0 : 20);
      if (value > bestValue) { bestValue = value; best = c; }
    }
    if (!best) break;
    chosen.push(best);
    topKeys(best).forEach(k => usedTops.add(k));
    best.pickedItems.forEach(i => usedItems.add(visualKey(i)));
  }
  return chosen;
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

// Only used when the wardrobe is missing a whole category.
function makeEmptyWardrobeMessage(occasion: Occasion): Outfit[] {
  const dummy: Item = { id: "wardrobe-empty", category: "top", type: "missing", color_family: "neutral" };
  return [{
    label: "Look", occasion, score: 0,
    picks: { top: dummy, bottom: { ...dummy, category: "bottom" }, shoes: { ...dummy, category: "shoes" } },
    breakdown: { occasion: 0, harmony: 0, variety: 0, balance: 0 },
    outfit_hash: "empty",
    why: "Add at least one top, one bottom and one pair of shoes (or a dress and shoes).",
  }];
}

const OCCASION_PHRASE: Record<Occasion, string> = {
  work: "sharp enough for work",
  date: "put-together for a date",
  casual: "easy and relaxed",
  night_out: "dark and sharp for a night out",
  travel: "comfortable for a day of travel",
  gym: "made for moving",
};

function nameOf(it: Item): string {
  const color = cc(it);
  const type = tt(it).replace(/_/g, " ");
  return color === "neutral" || type.includes(color) ? type : `${color} ${type}`;
}
function capitalize(s: string): string { return s ? s[0].toUpperCase() + s.slice(1) : s; }

// A short, specific explanation: what goes with what, why it suits the
// weather, how the colors work, and the occasion. (Replaced the old
// "Recipe name: tee, jeans and sneakers." line, which explained nothing.)
function buildWhy(p: OutfitPicks, ctx: EngineCtx, substituted = false): string {
  const layered = !!(p.outer || p.inner);
  const withRest = `${layered ? "," : ""} with ${p.bottom ? `${nameOf(p.bottom)} and ` : ""}${nameOf(p.shoes)}`;
  const under = p.inner ? `${nameOf(p.top)} and a ${nameOf(p.inner)}` : nameOf(p.top);
  const first = p.outer
    ? `${capitalize(nameOf(p.outer))} over ${p.inner ? "a " : "your "}${under}${withRest}.`
    : p.inner
      ? `${capitalize(nameOf(p.top))} over a ${nameOf(p.inner)}${withRest}.`
      : `${capitalize(nameOf(p.top))}${withRest}.`;

  const reasons: string[] = [];
  if (ctx.weatherKnown) {
    const t = Math.round(ctx.tempC);
    if (p.outer && t < 12) reasons.push(`the ${tt(p.outer).replace(/_/g, " ")} keeps you warm at ${t}°C`);
    else if (p.inner && t < 16) reasons.push(`two layers suit ${t}°C`);
    else if (!p.outer && t >= 22) reasons.push(`light pieces suit ${t}°C`);
    if (ctx.isRaining) reasons.push("closed shoes for the rain");
  }
  const pieces = [p.outer, p.top, p.inner, p.bottom, p.shoes].filter(Boolean) as Item[];
  const loud = pieces.filter(i => !NEUTRAL.has(cc(i)));
  if (loud.length === 0) reasons.push("the neutral colors all go together");
  else if (new Set(loud.map(cc)).size === 1) reasons.push(`the ${cc(loud[0])} of the ${tt(loud[0]).replace(/_/g, " ")} is the one accent color`);
  else reasons.push("two colors are balanced by neutrals");

  const fit = substituted
    ? `the closest your wardrobe gets to ${ctx.occasion === "night_out" ? "a night-out look" : `${ctx.occasion.replace(/_/g, " ")} wear`}`
    : OCCASION_PHRASE[ctx.occasion];
  return `${first} ${capitalize(reasons.join(", and "))} — ${fit}.`;
}

function buildOutfit(c: Candidate, ctx: EngineCtx): Outfit {
  const pickedArr = Object.values(c.picks);
  const dress = pickedArr.find(isDress);
  const tops = pickedArr.filter(i => i.category === "top" && !isDress(i));
  const bottomItem = dress ? undefined : pickedArr.find(i => i.category === "bottom");
  const shoesItem = pickedArr.find(i => i.category === "shoes");
  const outerItem = pickedArr.find(i => i.category === "outerwear");

  // Two tops = a layered look (tee under a hoodie/sweater). Show the mid layer
  // as the main top and the tee as `inner`.
  const midLayer = tops.length > 1 ? tops.find(isMidLayerTop) : undefined;
  const innerItem = midLayer ? tops.find(t => t !== midLayer) : undefined;
  const topItem = dress ?? midLayer ?? tops.find(i => !isLayerCategory(i)) ?? tops[0];

  if (!topItem || !shoesItem || (!dress && !bottomItem)) return makeEmptyWardrobeMessage(ctx.occasion)[0];

  const accessories = ctx.includeAcc ? pickAccessories(ctx.allAccessories, ctx.occasion, ctx.tempC, shoesItem, ctx.rnd) : [];
  const picks: OutfitPicks = {
    top: topItem,
    bottom: bottomItem,
    shoes: shoesItem,
    inner: innerItem,
    outer: outerItem,
    accessories: accessories.length ? accessories : undefined,
  };

  return {
    label: "Look",
    occasion: ctx.occasion,
    // Internal ranking value only - never shown to users.
    score: clamp(Math.round(c.score), 0, 100),
    picks,
    breakdown: {
      occasion: 0,
      harmony: colorScore(c.pickedItems),
      variety: 0,
      balance: 0,
      explanation: c.recipe.name,
    },
    outfit_hash: c.hash,
    why: buildWhy(picks, ctx, c.fallbackNotes.some(n => n !== NO_OUTER_NOTE) || c.recipe.id.endsWith("_fallback")),
  };
}

// Alternatives for a single piece of a look ("swap"): items of that kind
// that suit the weather and occasion and go with the rest of the look, best
// first. Used by the swap sheet on the outfit card.
export function suggestReplacements(
  items: Item[],
  current: OutfitPicks,
  slot: "top" | "bottom" | "shoes" | "outer" | "inner",
  opts: { occasion: Occasion; tempC: number; isRaining?: boolean; votedItemIds?: VotedItemIds; max?: number },
): Item[] {
  const { occasion, tempC } = opts;
  const isRaining = opts.isRaining ?? false;
  const voted = opts.votedItemIds ?? { liked: [], disliked: [] };
  const ideal = getOccasionIdealTiers(occasion);
  const currentItem = current[slot];
  const others = ([["top", current.top], ["bottom", current.bottom], ["shoes", current.shoes], ["outer", current.outer], ["inner", current.inner]] as const)
    .filter(([k, it]) => k !== slot && it)
    .map(([, it]) => it as Item);

  const pool = items.filter(it => {
    if (currentItem && it.id === currentItem.id) return false;
    if (others.some(o => o.id === it.id)) return false;
    if (isForbiddenForOccasion(it, occasion)) return false;
    if (slot === "outer") return it.category === "outerwear" && isInTempRange(it, tempC);
    if (slot === "inner") return it.category === "top" && isInnerTee(it) && tempC <= inferMaxTemp(it);
    if (slot === "shoes") return it.category === "shoes" && isInTempRange(it, tempC) && !(isRaining && isRainUnsafeShoe(it));
    if (slot === "bottom") return it.category === "bottom" && isInTempRange(it, tempC);
    // top: a dress swaps for another dress, a top for another top
    if (it.category !== "top") return false;
    if (isDress(current.top) !== isDress(it)) return false;
    return isInTempRange(it, tempC) || (!!current.outer && inferMinTemp(it) - 8 <= tempC && tempC <= inferMaxTemp(it));
  });

  return pool
    .map(it => {
      const color = colorScore([...others, it]);
      const tier = inferTier(it);
      const tierFit = tier >= ideal.min && tier <= ideal.max ? (tier === ideal.ideal ? 8 : 5) : -12;
      const liked = voted.liked.includes(it.id) ? 5 : voted.disliked.includes(it.id) ? -10 : 0;
      return { it, s: (color === 0 ? -40 : color) + tierFit + liked };
    })
    .sort((a, b) => b.s - a.s)
    // Duplicate uploads (four identical white tees) would fill the sheet with
    // the same option; show each look-alike once.
    .filter((x, i, arr) => arr.findIndex(y => visualKey(y.it) === visualKey(x.it)) === i)
    .slice(0, opts.max ?? 6)
    .map(x => x.it);
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORTED: single source of truth for "is this item OK for this weather" -
// used internally by matchesSlot/smartSubstitutionFallback, and exported so
// UI code (e.g. the wardrobe view's "hidden by weather" badge) checks the
// exact same rule the generator itself uses, instead of a separately
// maintained approximation that can silently drift out of sync.
// ════════════════════════════════════════════════════════════════════════════
export function isWeatherAppropriate(item: Item, tempC: number, isRaining: boolean = false): boolean {
  if (isRaining && isRainUnsafeShoe(item)) return false;
  return isInTempRange(item, tempC);
}