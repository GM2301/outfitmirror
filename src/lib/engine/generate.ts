// src/lib/engine/generate.ts
// ════════════════════════════════════════════════════════════════════════════
// ENGINE V12 — PRODUCTION-GRADE RECIPE-BASED ARCHITECTURE
//
// HARD BREAK nga v11. Ndryshime kryesore:
//
// 1. STRICT TYPE MATCHING (TypePatternMatcher me word boundaries)
//    - "shirt" NUK match "sweatshirt" më
//    - Token-based, regex-based fallback
//
// 2. PRE-SORTED CARTESIAN PRODUCT (jo random attempts)
//    - Çdo slot: filtro → sort sipas value → slice(15)
//    - Pastaj cartesian product i pastër (max 50,625 për 4 sloti)
//
// 3. OUTERWEAR DINAMIK (probability nga tempC)
//    - <5°C: 95% required
//    - 5-12°C: 75%
//    - 12-18°C: 45%
//    - >18°C: 15%
//
// 4. VOTE PER-ITEM
//    - votedItemIds.disliked → EXCLUDE menjëherë nga pool
//    - votedItemIds.liked → +15 bonus te sorting
//
// 5. STYLE MATCH BONUS (+15 nese item ka style_tag = opts.style)
//
// 6. SANDWICH RULE (+8 nese top.color === shoes.color && bottom != top)
//
// 7. PINNED ITEMS (smart swap ready)
//    - opts.pinnedItemIds[] → cope të kyçura te outfit
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
// STRICT TYPE MATCHING — FIX #4 (kritike!)
// ════════════════════════════════════════════════════════════════════════════
// PROBLEMI 1: t.includes("shirt") match "sweatshirt", "tshirt", "undershirt".
// PROBLEMI 2: "jeans" vs "jean" (plural/singular).
//
// ZGJIDHJA:
// 1. Tokenize me _/-/hapesira
// 2. Singularize cdo token (heq trailing "s")
// 3. Pattern match si token i plote (jo substring)
function tokenize(itemType: string): string[] {
  return itemType.toLowerCase().split(/[_\s-]+/).filter(t => t.length > 0);
}

// Hek trailing "s" per plural simplification
// "jeans" → "jean", "sneakers" → "sneaker", "chinos" → "chino"
// Por mban "dress" si "dress" (s nuk hiqet nese token me i shkurter se 4)
function singularize(token: string): string {
  if (token.length < 4) return token;
  if (token.endsWith("ies")) return token.slice(0, -3) + "y";
  if (token.endsWith("es") && !token.endsWith("oes")) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss") && !token.endsWith("us") && !token.endsWith("is")) return token.slice(0, -1);
  return token;
}

// Compound equivalents - bidirectional mapping
// Token concatenated (no separator) ↔ separated form
// "tshirt"/"tee" representojnë te njejten gje.
const COMPOUND_EQUIV: Record<string, string[]> = {
  // tee variants
  "tee": ["tshirt"],
  "tshirt": ["tee"],
  "tees": ["tshirt"],
};

// Joined-form mappings: nese item ka tokens ["t","shirt"], merr "tshirt"
function getJoinedForm(tokens: string[]): string | null {
  if (tokens.length === 2 && tokens[0] === "t" && tokens[1] === "shirt") return "tshirt";
  if (tokens.length === 2 && tokens[0] === "long" && tokens[1] === "sleeve") return "longsleeve";
  if (tokens.length === 2 && tokens[0] === "zip" && tokens[1] === "up") return "zipup";
  if (tokens.length === 2 && tokens[0] === "sweat" && tokens[1] === "shirt") return "sweatshirt";
  if (tokens.length === 2 && tokens[0] === "sweat" && tokens[1] === "pant") return "sweatpant";
  return null;
}

function normalizeToken(t: string): string {
  return singularize(t.toLowerCase());
}

function matchesPattern(itemType: string, pattern: string): boolean {
  const itLower = itemType.toLowerCase();
  const patLower = pattern.toLowerCase();

  // Exact match
  if (itLower === patLower) return true;

  // Tokenize + singularize
  const itTokensRaw = tokenize(itLower);
  const itTokens = itTokensRaw.map(normalizeToken);
  const patTokensRaw = tokenize(patLower);
  const patTokens = patTokensRaw.map(normalizeToken);

  // Joined form check (bidirectional)
  // P.sh. item="t_shirt" → joined "tshirt". Pattern="tee" → check via compound.
  const itJoined = getJoinedForm(itTokens);
  const patJoined = getJoinedForm(patTokens);

  // Single-token pattern
  if (patTokens.length === 1) {
    const p = patTokens[0];

    // Direct token match
    if (itTokens.includes(p)) return true;

    // Item is joined-form (e.g. "tshirt" item) and pattern is "tee" or vice versa
    if (itTokens.length === 1) {
      const itTok = itTokens[0];
      if (COMPOUND_EQUIV[itTok]?.includes(p)) return true;
      if (COMPOUND_EQUIV[p]?.includes(itTok)) return true;
    }

    // Item is split form (e.g. ["t","shirt"]) → check via joined form
    if (itJoined) {
      if (itJoined === p) return true;
      if (COMPOUND_EQUIV[itJoined]?.includes(p)) return true;
      if (COMPOUND_EQUIV[p]?.includes(itJoined)) return true;
    }
    return false;
  }

  // Multi-token pattern (e.g. "dress_shirt")
  // ALL pattern tokens must be in item tokens
  if (patTokens.every(pt => itTokens.includes(pt))) return true;

  // Pattern is split form like "t_shirt" → check if item joined version matches
  if (patJoined) {
    if (itTokens.length === 1 && itTokens[0] === patJoined) return true;
    if (itTokens.length === 1 && COMPOUND_EQUIV[itTokens[0]]?.includes(patJoined)) return true;
    if (itTokens.length === 1 && COMPOUND_EQUIV[patJoined]?.includes(itTokens[0])) return true;
  }

  return false;
}

// ════════════════════════════════════════════════════════════════════════════
// FALLBACK INFERENCE (kur AI s'ka caktuar)
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
    if (has("jogger") || has("sweatpant") || has("track") || has("athletic") || has("legging") || has("trenerk")) return 1;
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
  if (has("jogger") || has("legging") || has("sweatpant") || has("track") || has("athletic")) return 0;
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
  if (has("jogger") || has("legging") || has("sweatpant") || has("track") || has("athletic")) return 22;
  if (has("sandal") || has("flip")) return 45;
  if (has("boot")) return 16;
  return 45;
}

function isInTempRange(item: Item, tempC: number): boolean {
  return tempC >= inferMinTemp(item) && tempC <= inferMaxTemp(item);
}

// ════════════════════════════════════════════════════════════════════════════
// SLOT MATCHER — FIX #4 (strict)
// ════════════════════════════════════════════════════════════════════════════
function matchesSlot(item: Item, constraint: SlotConstraint, tempC: number, allowLayered: boolean = false): boolean {
  // 1. Category strict
  if (item.category !== constraint.category) return false;

  // 2. Tier range
  const tier = inferTier(item);
  if (tier < constraint.tierMin || tier > constraint.tierMax) return false;

  // 3. Type pattern — STRIKT me word boundaries
  const itType = tt(item);
  const matchesAnyType = constraint.types.some(pat => matchesPattern(itType, pat));
  if (!matchesAnyType) return false;

  // 4. Exclude types — STRIKT
  if (constraint.excludeTypes) {
    for (const exc of constraint.excludeTypes) {
      if (matchesPattern(itType, exc)) return false;
    }
  }

  // 5. Colors (boshatisur = pranohet me neutral fallback)
  if (constraint.colors && constraint.colors.length > 0) {
    const color = cc(item);
    const acceptable = constraint.colors.map(c => c.toLowerCase());
    if (!acceptable.includes(color) && !NEUTRAL.has(color)) return false;
  }

  // 6. Exclude colors
  if (constraint.excludeColors) {
    const color = cc(item);
    if (constraint.excludeColors.map(c => c.toLowerCase()).includes(color)) return false;
  }

  // 7. Temp range — me layered tolerance per inner items (shirt nen blazer/coat)
  if (allowLayered && item.category === "top" && tier >= 3) {
    // Inner top (shirt/polo/blouse) tolerojme deri 8°C nen min_temp kur layered
    const minT = inferMinTemp(item) - 8;
    const maxT = inferMaxTemp(item);
    if (tempC < minT || tempC > maxT) return false;
  } else {
    if (!isInTempRange(item, tempC)) return false;
  }

  return true;
}

// ════════════════════════════════════════════════════════════════════════════
// SLOT POOL SCORING — FIX #2 (pre-sorting për cartesian)
// ════════════════════════════════════════════════════════════════════════════
function scoreItemForPool(
  item: Item,
  votedItemIds: VotedItemIds,
  recentIds: Set<string>
): number {
  let score = 0;

  // Vote — kontrolli per liked
  if (votedItemIds.liked.includes(item.id)) score += 15;

  // Low wear bonus
  const wc = item.wear_count ?? 0;
  if (wc < 3) score += 5;

  // Recency bonus (last_worn > 14 ditë)
  if (item.last_worn) {
    const lastDate = new Date(item.last_worn).getTime();
    const daysSince = (Date.now() - lastDate) / (1000 * 60 * 60 * 24);
    if (daysSince > 14) score += 5;
  } else {
    // Never worn = max bonus
    score += 5;
  }

  // Penalizim BRUTAL anti-repeat
  if (recentIds.has(item.id)) score -= 25;

  return score;
}

// ════════════════════════════════════════════════════════════════════════════
// COLOR HARMONY 60-30-10 + SANDWICH RULE — FIX #5
// ════════════════════════════════════════════════════════════════════════════
function colorScore(items: Item[]): number {
  const colors = items.map(i => cc(i));
  const loud = colors.filter(c => !NEUTRAL.has(c));
  const uniqueLoud = new Set(loud).size;

  let score = 0;
  if (loud.length === 0) score += 30;
  else if (uniqueLoud === 1) score += 28;
  else if (uniqueLoud === 2) score += 18;
  else return 0; // 3+ loud = REJECT

  // Warm + cool clash pa neutral = REJECT
  const hasWarm = colors.some(c => WARM.has(c));
  const hasCool = colors.some(c => COOL.has(c));
  const hasNeutral = colors.some(c => NEUTRAL.has(c));
  if (hasWarm && hasCool && !hasNeutral) return 0;

  // Forbidden clashes
  const colorSet = new Set(colors);
  for (const [a, b] of UNIVERSAL_FORBIDDEN_CLASHES) {
    if (colorSet.has(a) && colorSet.has(b)) return 0;
  }

  // Light + dark contrast bonus
  const hasLight = colors.some(c => LIGHT.has(c));
  const hasDark = colors.some(c => DARK.has(c));
  if (hasLight && hasDark) score += 6;

  // Shoes neutral anchor bonus
  const shoes = items.find(i => i.category === "shoes");
  if (shoes && NEUTRAL.has(cc(shoes))) score += 4;

  // ═══ SANDWICH RULE (FIX #5) ═══
  // Top color === Shoes color && Bottom different = +8
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

// ════════════════════════════════════════════════════════════════════════════
// STYLE MATCH BONUS — FIX #1 (ghost parameter)
// ════════════════════════════════════════════════════════════════════════════
function styleScore(style: string | undefined, items: Item[]): number {
  if (!style) return 0;
  const styleLower = style.toLowerCase();

  // Map style preferences to relevant tags
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

  // +5 per item që match (max +15 për 3 items)
  return Math.min(15, matchCount * 5);
}

// ════════════════════════════════════════════════════════════════════════════
// OUTERWEAR DYNAMIC PROBABILITY — FIX #3
// ════════════════════════════════════════════════════════════════════════════
function outerwearProbability(tempC: number): number {
  if (tempC < 5) return 0.95;
  if (tempC < 12) return 0.75;
  if (tempC < 18) return 0.45;
  return 0.15;
}

// Bool për "duhet patjetër outer" (per scoring penalty)
function outerwearMandatory(tempC: number): boolean {
  return tempC < 5;
}

// ════════════════════════════════════════════════════════════════════════════
// ACCESSORIES
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

  // 80% chance of accessories
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
// MAIN GENERATE — RECIPE-BASED V12
// ════════════════════════════════════════════════════════════════════════════
type Candidate = {
  recipe: OutfitRecipe;
  picks: Record<string, Item>;
  pickedItems: Item[];
  score: number;
  hash: string;
  fallbackNotes: string[]; // V12.1: shenime per zevendesim ne wardrobe te vogel
};

// ════════════════════════════════════════════════════════════════════════════
// SMART FALLBACK MATRIX FOR SMALL WARDROBES (V12.1)
// ────────────────────────────────────────────────────────────────────────────
// Kur slot kerkon p.sh. "loafer" por wardroba s'ka asnje, provojme zevendesues.
// Penalizim minimal (-6) sa per te treguar qe eshte fallback. Score mbetet 80+.
// Mesazh ⚠️ shfaqet te why per transparence me userin.
// ════════════════════════════════════════════════════════════════════════════
const TYPE_FALLBACKS: Record<string, { subs: string[]; nameAl: string }> = {
  // Shoes
  "loafer": { subs: ["derby", "oxford", "chelsea", "leather_sneaker", "sneaker"], nameAl: "loafers" },
  "oxford": { subs: ["derby", "loafer", "chelsea", "leather_sneaker"], nameAl: "oxford" },
  "derby": { subs: ["oxford", "loafer", "chelsea", "leather_sneaker"], nameAl: "derby" },
  "chelsea": { subs: ["ankle_boot", "loafer", "leather_sneaker", "sneaker"], nameAl: "chelsea boots" },
  "ankle_boot": { subs: ["chelsea", "boot", "leather_sneaker", "sneaker"], nameAl: "ankle boots" },
  "dress_shoe": { subs: ["oxford", "derby", "loafer", "chelsea"], nameAl: "dress shoes" },
  "leather_sneaker": { subs: ["sneaker", "canvas"], nameAl: "leather sneakers" },

  // Tops
  "shirt": { subs: ["polo", "henley", "tee"], nameAl: "kemishe klasike" },
  "dress_shirt": { subs: ["shirt", "polo"], nameAl: "kemishe formale" },
  "blouse": { subs: ["shirt", "polo", "tee"], nameAl: "blouse" },
  "polo": { subs: ["henley", "tee", "shirt"], nameAl: "polo" },
  "sweater": { subs: ["knit", "cardigan", "sweatshirt", "hoodie"], nameAl: "pullover" },
  "knit": { subs: ["sweater", "cardigan", "sweatshirt"], nameAl: "knit" },
  "cardigan": { subs: ["sweater", "knit", "sweatshirt"], nameAl: "cardigan" },

  // Bottoms
  "chino": { subs: ["jean", "trouser", "denim"], nameAl: "chinos" },
  "trouser": { subs: ["chino", "dress_pant", "jean"], nameAl: "trousers formale" },
  "dress_pant": { subs: ["trouser", "chino"], nameAl: "dress pants" },
  "jean": { subs: ["chino", "denim", "trouser"], nameAl: "jeans" },
  "dark_jean": { subs: ["jean", "denim", "chino", "trouser"], nameAl: "dark jeans" },

  // Outerwear
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

  // V12: vote per-item (HARD BREAK from v11)
  const votedItemIds: VotedItemIds = opts.votedItemIds ?? { liked: [], disliked: [] };
  const dislikedSet = new Set(votedItemIds.disliked);

  // Anti-repeat memory
  const recentIds = new Set(opts.recentItemIds ?? []);

  // Pinned items (smart swap)
  const pinnedIds = new Set(opts.pinnedItemIds ?? []);

  // ── EMPTY WARDROBE ───────────────────────────────────────────────────────
  const allTops = items.filter(i => i.category === "top" || i.category === "outerwear");
  const allBottoms = items.filter(i => i.category === "bottom");
  const allShoes = items.filter(i => i.category === "shoes");
  const allAccessories = items.filter(i => i.category === "accessory");

  if (!allTops.length || !allBottoms.length || !allShoes.length) {
    return makeGapOutfits(occasion, "Shto te pakten 1 top, 1 bottom, 1 shoes.");
  }

  // ── GJEJ RECETAT QË PËRSHTATEN ──────────────────────────────────────────
  const recipes = getRecipesFor(occasion, tempC, gender);

  if (recipes.length === 0) {
    return makeGapOutfits(occasion, `Nuk ka recetë për ${occasion} në ${tempC}°C.`);
  }

  // ── PER ÇDO RECETE: PRE-SORT + CARTESIAN PRODUCT ─────────────────────────
  const allCandidates: Candidate[] = [];

  for (const recipe of recipes) {
    // STEP 1: Filter items për çdo slot + EXCLUDE disliked
    const slotPools: Record<string, Item[]> = {};
    let allRequiredOK = true;

    // V12.1: Shenime per zevendesime te bera per kete recete
    const recipeFallbackNotes: string[] = [];

    // Determine if recipe has outerwear required - if so, inner tops can have looser temp tolerance
    const hasRequiredOuter = recipe.slots.some(s =>
      s.required && s.constraint.category === "outerwear"
    );

    for (const slot of recipe.slots) {
      // Allow layered temp tolerance for inner slots when recipe has outerwear required
      const allowLayered = hasRequiredOuter && slot.constraint.category === "top";

      // PASS 1: Filter strikt origjinal V12
      let matched = items.filter(it => {
        if (dislikedSet.has(it.id)) return false; // EXCLUDE disliked
        return matchesSlot(it, slot.constraint, tempC, allowLayered);
      });

      // ═══ V12.1: SMART FALLBACK PER WARDROBE TE VOGEL ═══
      // Nese slot eshte required dhe nuk gjeti asnje cope strikt, provo me zevendesues
      if (matched.length === 0 && slot.required) {
        const allowedSubs = new Set<string>();
        let idealName = "kete artikull";

        // Mblidh te gjithe zevendesuesit per cdo tip te kerkuar
        for (const reqType of slot.constraint.types) {
          const fData = TYPE_FALLBACKS[reqType.toLowerCase()];
          if (fData) {
            fData.subs.forEach(s => allowedSubs.add(s));
            if (idealName === "kete artikull") idealName = fData.nameAl;
          }
        }

        if (allowedSubs.size > 0) {
          // Krijo constraint te lirshem vetem per kete moment
          // V12.1: Hek nga excludeTypes ato qe jane ne allowedSubs (lejojme zevendesim)
          const cleanedExclude = (slot.constraint.excludeTypes ?? []).filter(
            ex => !allowedSubs.has(ex.toLowerCase())
          );
          const looseConstraint: SlotConstraint = {
            ...slot.constraint,
            types: [...slot.constraint.types, ...Array.from(allowedSubs)],
            excludeTypes: cleanedExclude.length > 0 ? cleanedExclude : undefined,
            // V12.1: Relaksim me i madh i tier per fallback (2 nivele)
            tierMin: Math.max(1, slot.constraint.tierMin - 2),
            tierMax: Math.min(5, slot.constraint.tierMax + 1),
            // Hek exclude colors per fleksibilitet max
            colors: undefined,
          };

          matched = items.filter(it => {
            if (dislikedSet.has(it.id)) return false;
            return matchesSlot(it, looseConstraint, tempC, allowLayered);
          });

          if (matched.length > 0) {
            // Dokumentojme zevendesimin - perdorim emrin nga TYPE_FALLBACKS
            const chosenType = matched[0].type.replace(/_/g, " ");
            recipeFallbackNotes.push(
              `Meqe s'ke ${idealName} ne dollap, e zevendesuam me ${chosenType}.`
            );
          }
        }
      }

      // Nese pinnedIds ka cope per kete slot, kufizo pool-in vetem te ato
      const pinnedInSlot = matched.filter(it => pinnedIds.has(it.id));
      if (pinnedInSlot.length > 0) {
        matched = pinnedInSlot;
      }

      // STEP 2: SORT pool sipas value
      matched.sort((a, b) => {
        const scoreA = scoreItemForPool(a, votedItemIds, recentIds);
        const scoreB = scoreItemForPool(b, votedItemIds, recentIds);
        return scoreB - scoreA;
      });

      // STEP 3: Slice top K
      slotPools[slot.name] = matched.slice(0, TOP_K_PER_SLOT);

      if (slot.required && slotPools[slot.name].length === 0) {
        // V12.1: Nese slot eshte outerwear required dhe pas fallback ende s'ka,
        // shenoj qe outfit-i do dale pa outerwear (transparence) dhe vazhdojme.
        if (slot.constraint.category === "outerwear") {
          recipeFallbackNotes.push(
            `Nuk ke veshje te jashtme (blazer/coat) ne dollap per kete kombinim.`
          );
          // Largohet slot nga required virtually - thjesht e leme pool bosh dhe vazhdojme
          // Optional slots permission do trajtohet poshte
          continue;
        }
        allRequiredOK = false;
        break;
      }
    }

    if (!allRequiredOK) continue;

    // V12.1: Re-klasifiko sloti outerwear me pool bosh si "skipped" - jo te detyrueshem
    const skippedSlotNames = new Set<string>();
    for (const slot of recipe.slots) {
      if (slot.required && slot.constraint.category === "outerwear" && slotPools[slot.name].length === 0) {
        skippedSlotNames.add(slot.name);
      }
    }

    // STEP 4: CARTESIAN PRODUCT i pastër (deterministik)
    // Per slot opsional, vendos probability bazuar te tempC
    // V12.1: Slot-et skipped (outerwear me pool bosh) trajtohen si "jo te perfshira"
    const requiredSlots = recipe.slots.filter(s => s.required && !skippedSlotNames.has(s.name));
    const optionalSlots = recipe.slots.filter(s => !s.required);

    // Outerwear handling — FIX #3
    const outerProb = outerwearProbability(tempC);

    // Cartesian product on required slots first
    const cartesianResult = cartesianProduct(requiredSlots.map(s => slotPools[s.name]));

    // Per cdo kombinim required, generato variants me/pa optional
    for (const requiredCombo of cartesianResult) {
      if (allCandidates.length >= MAX_COMBOS_PER_RECIPE) break;

      const picks: Record<string, Item> = {};
      requiredSlots.forEach((s, idx) => { picks[s.name] = requiredCombo[idx]; });

      // Optional slots: probability based
      // Per cdo optional slot:
      // - Nese eshte outerwear → outerwearProbability
      // - Nese tempC < 5 dhe slot eshte outerwear → MANDATORY (mos shto variant pa outer)
      // - Tjeret 50%

      const variants: Array<Record<string, Item>> = [];

      if (optionalSlots.length === 0) {
        variants.push({ ...picks });
      } else {
        // Generato 2 variants: nje me optional, nje pa (per variety)
        // Por respekto outerwear probability dhe mandatory rules

        // Variant 1: me te gjitha optional (probability-based)
        const withOpt: Record<string, Item> = { ...picks };
        for (const optSlot of optionalSlots) {
          const pool = slotPools[optSlot.name];
          if (!pool || pool.length === 0) continue;

          const isOuter = optSlot.constraint.category === "outerwear";
          const prob = isOuter ? outerProb : 0.5;

          if (rnd() < prob) {
            // Pick best from pool (already sorted)
            withOpt[optSlot.name] = pool[0];
          }
        }
        variants.push(withOpt);

        // Variant 2: pa optional (vetem nese outerwear nuk eshte mandatory)
        const hasOuterOpt = optionalSlots.some(s => s.constraint.category === "outerwear");
        if (!hasOuterOpt || !outerwearMandatory(tempC)) {
          variants.push({ ...picks });
        }
      }

      // Score çdo variant
      for (const v of variants) {
        if (allCandidates.length >= MAX_COMBOS_PER_RECIPE) break;

        const pickedItems = Object.values(v);

        // Color rule check
        const colorSc = colorScore(pickedItems);
        if (colorSc === 0) continue;

        // Style bonus (FIX #1)
        const styleSc = styleScore(style, pickedItems);

        // Variety: liked items in outfit
        let likedBonus = 0;
        for (const it of pickedItems) {
          if (votedItemIds.liked.includes(it.id)) likedBonus += 5;
        }

        // Pinned bonus
        let pinnedBonus = 0;
        for (const it of pickedItems) {
          if (pinnedIds.has(it.id)) pinnedBonus += 5;
        }

        // Recipe match base bonus (already passed filter)
        const recipeBonus = 35;

        // Outerwear penalty nese mandatory por mungon
        // V12.1: Skip penalty nese sloti outerwear u skipped (s'ka cope ne dollap)
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

        // V12.1: Fallback penalty (-6 nese kjo recete perdori zevendesim)
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
          fallbackNotes: [...recipeFallbackNotes], // V12.1: kopjo per kete kandidat
        });
      }
    }
  }

  // ── WARDROBE GAP ─────────────────────────────────────────────────────────
  if (allCandidates.length === 0) {
    const occLabel: Record<Occasion, string> = { work: "punë", date: "rendez-vous", casual: "casual", night_out: "mbrëmje", travel: "udhëtim", gym: "palestër" };
    return makeGapOutfits(occasion, `Garderoba ka mungesa për ${occLabel[occasion]} në ${tempC}°C.`);
  }

  // ── DEDUPLICATE ──────────────────────────────────────────────────────────
  const seen = new Set<string>();
  const uniqueCandidates: Candidate[] = [];
  for (const c of allCandidates) {
    if (seen.has(c.hash)) continue;
    seen.add(c.hash);
    uniqueCandidates.push(c);
  }

  // ── SORT BY SCORE ────────────────────────────────────────────────────────
  uniqueCandidates.sort((a, b) => b.score - a.score);

  // ── SPLIT NË SAFE/COLORFUL ───────────────────────────────────────────────
  const safePool: Candidate[] = [];
  const colorfulPool: Candidate[] = [];
  for (const c of uniqueCandidates) {
    const colors = c.pickedItems.map(i => cc(i));
    const loud = colors.filter(c => !NEUTRAL.has(c)).length;
    if (loud <= 1) safePool.push(c);
    else colorfulPool.push(c);
  }

  // TOP-K rotation per variety
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

  // V12.1: Injekto shenimet e fallback te why per transparence me userin
  if (safeCand.fallbackNotes.length > 0) {
    safe.why = `⚠️ ${safeCand.fallbackNotes.join(" ")} ${safe.why ?? ""}`.trim();
  }
  if (colorfulCand.fallbackNotes.length > 0) {
    colorful.why = `⚠️ ${colorfulCand.fallbackNotes.join(" ")} ${colorful.why ?? ""}`.trim();
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
    // Safety limit
    if (result.length > MAX_COMBOS_PER_RECIPE) {
      result = result.slice(0, MAX_COMBOS_PER_RECIPE);
      break;
    }
  }
  return result;
}

function makeGapOutfits(occasion: Occasion, message: string): Outfit[] {
  const dummy: Item = { id: "wardrobe-gap", category: "top", type: "missing", color_family: "neutral" };
  const mk = (label: OutfitLabel): Outfit => ({
    label, occasion, score: 25,
    picks: { top: dummy, bottom: { ...dummy, category: "bottom" }, shoes: { ...dummy, category: "shoes" } },
    breakdown: { occasion: 0, harmony: 0, variety: 0, balance: 0 },
    outfit_hash: "gap-" + label,
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

  // Find items by category from picks
  const pickedArr = Object.values(picks);
  let topItem = pickedArr.find(i => i.category === "top" && !isLayerCategory(i));
  let bottomItem = pickedArr.find(i => i.category === "bottom");
  let shoesItem = pickedArr.find(i => i.category === "shoes");
  let outerItem = pickedArr.find(i => i.category === "outerwear");

  // Nese top mungon (psh receta ka vetem sweater layer si "top"), merr layer top
  if (!topItem) {
    topItem = pickedArr.find(i => i.category === "top");
  }

  if (!topItem || !bottomItem || !shoesItem) {
    const dummy: Item = { id: "gap-" + label, category: "top", type: "missing", color_family: "neutral" };
    return {
      label, occasion, score: 25,
      picks: { top: dummy, bottom: { ...dummy, category: "bottom" }, shoes: { ...dummy, category: "shoes" } },
      breakdown: { occasion: 0, harmony: 0, variety: 0, balance: 0 },
      outfit_hash: "gap-" + label,
      why: "Garderoba ka mungesa.",
    };
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