// src/lib/engine/generate.ts
// ════════════════════════════════════════════════════════════════════════════
// ENGINE V10 — Constraint Satisfaction Problem (CSP) + Scoring
// Arkitektura: 3 faza
//   FAZA A: HARD FILTERS (eliminon items që s'kalojnë temp + occasion)
//   FAZA B: COMPATIBILITY MATRIX (eliminon kombinime absurde para scoring)
//   FAZA C: SCORING + TOP-K ROTATION (zgjedh më të mirën me variety)
// ════════════════════════════════════════════════════════════════════════════

import type { Item, Occasion, Outfit, OutfitLabel, GenerateOptions, Gender } from "./types";

// ─── UTILS ───────────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function pickOne<T>(arr: T[], rnd: () => number): T { return arr[Math.floor(rnd() * arr.length)]; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function hashStr(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); }

// ─── PALETA COLOR ────────────────────────────────────────────────────────────
const NEUTRAL = new Set(["neutral","black","white","earth","grey","gray","beige","brown","navy","denim","tan","khaki","cream","ivory","stone","charcoal"]);
const COOL = new Set(["blue","green","purple","teal","mint","sage"]);
const WARM = new Set(["red","orange","yellow","pink","coral","rust","mustard","burgundy"]);
const DARK = new Set(["black","navy","charcoal","brown","burgundy","forest"]);
const LIGHT = new Set(["white","cream","ivory","stone","beige"]);

// ════════════════════════════════════════════════════════════════════════════
// TYPE FAMILY DETECTION — single source of truth
// ════════════════════════════════════════════════════════════════════════════
function tt(it: Item): string { return String(it.type ?? "").toLowerCase(); }
function cc(it: Item): string { return String(it.color_family ?? "neutral").toLowerCase(); }

// ─── ATHLETIC FAMILY ────────────────────────────────────────────────────────
function isAthleticTop(s: string): boolean {
  return s.includes("hoodie") || s.includes("sweatshirt") || s.includes("zip_up") || s.includes("zipup") ||
         s.includes("track_jacket") || s.includes("track_top") ||
         (s.includes("athletic") && !s.includes("leather")) ||
         s.includes("performance") || s.includes("sports_bra") || s.includes("workout");
}
function isAthleticBottom(s: string): boolean {
  return s.includes("jogger") || s.includes("sweatpant") || s.includes("sweat_pant") ||
         s.includes("track_pant") || s.includes("trackpant") ||
         (s.includes("athletic") && (s.includes("pant") || s.includes("short"))) ||
         s.includes("trenerk") || s.includes("legging") ||
         (s.includes("shorts") && (s.includes("athletic") || s.includes("running") || s.includes("gym")));
}
function isAthleticShoe(s: string): boolean {
  return s.includes("running") || s.includes("trainer") || s.includes("workout") ||
         (s.includes("athletic") && !s.includes("leather")) ||
         (s.includes("sneaker") && (s.includes("running") || s.includes("performance") || s.includes("nike") || s.includes("adidas")));
}

// ─── SMART / FORMAL FAMILY ──────────────────────────────────────────────────
function isSmartTop(s: string): boolean {
  if (s.includes("sweatshirt")) return false;
  return s.includes("shirt") || s.includes("blouse") || s.includes("polo") || s.includes("blazer");
}
function isFormalShoe(s: string): boolean {
  return s.includes("oxford") || s.includes("brogue") || s.includes("derby") ||
         s.includes("loafer") || s.includes("monk") || s.includes("dress_shoe") ||
         s.includes("dress shoe") || s.includes("heel") || s.includes("pump");
}
function isFormalBottom(s: string): boolean {
  return s.includes("trouser") || s.includes("dress_pant") || s.includes("suit_pant") ||
         s.includes("wide_leg") || s.includes("dress_trouser");
}

// ─── LAYER / INNER FAMILY ───────────────────────────────────────────────────
function isHoodieLike(s: string): boolean {
  return s.includes("hoodie") || s.includes("sweatshirt") || s.includes("zip_up") || s.includes("zipup");
}
function isSweaterKnit(s: string): boolean {
  if (isHoodieLike(s)) return false;
  return s.includes("sweater") || s.includes("knit") || s.includes("cardigan") || s.includes("crewneck") || s.includes("pullover") || s.includes("jumper");
}
function isTeeLike(s: string): boolean {
  if (s.includes("sweat")) return false;
  return s.includes("tee") || s.includes("t-shirt") || s.includes("tshirt") || s.includes("t_shirt");
}
function isClosedOuterwear(s: string): boolean {
  return s.includes("blazer") || s.includes("coat") || s.includes("parka") ||
         s.includes("trench") || s.includes("bomber") || s.includes("overcoat") ||
         s.includes("peacoat") || s.includes("pea_coat") ||
         (s.includes("jacket") && !s.includes("track"));
}
function isShorts(s: string): boolean {
  return s.includes("shorts") || s.includes("mini_skirt") || s.includes("mini skirt") || s.includes("miniskirt");
}

// ════════════════════════════════════════════════════════════════════════════
// FORMALITY TIER 1-5
// ════════════════════════════════════════════════════════════════════════════
function inferTier(item: Item): number {
  if (item.formality_tier !== undefined && item.formality_tier !== null) {
    return clamp(Math.round(item.formality_tier), 1, 5);
  }
  const t = tt(item);
  const cat = item.category;

  if (cat === "top" || cat === "outerwear") {
    if (t.includes("tuxedo")) return 5;
    if (t.includes("dress_shirt")) return 4;
    if (t.includes("blazer") || t.includes("sport_coat") || t.includes("suit_jacket")) return 4;
    if (t.includes("trench") || t.includes("overcoat") || t.includes("peacoat")) return 4;
    if (t.includes("coat") && !t.includes("sport") && !t.includes("track")) return 4;
    if (t.includes("shirt") && !t.includes("sweatshirt")) return 3;
    if (t.includes("blouse") || t.includes("polo")) return 3;
    if (isSweaterKnit(t) || t.includes("henley")) return 3;
    if (t.includes("jacket") && !t.includes("track")) return 2;
    if (t.includes("bomber") || t.includes("parka")) return 2;
    if (isTeeLike(t)) return 2;
    if (isHoodieLike(t)) return 1;
    if (t.includes("tank") || t.includes("sleeveless") || t.includes("crop")) return 1;
    return 2;
  }
  if (cat === "bottom") {
    if (t.includes("tuxedo")) return 5;
    if (t.includes("dress_pant") || t.includes("suit_pant")) return 4;
    if (t.includes("trouser") || t.includes("wide_leg")) return 4;
    if (t.includes("chino") || t.includes("midi")) return 3;
    if (t.includes("jean") || t.includes("denim")) return 2;
    if (t.includes("mini") || t.includes("skirt")) return 2;
    if (t.includes("cargo")) return 2;
    if (t.includes("shorts")) return 2;
    if (isAthleticBottom(t)) return 1;
    return 2;
  }
  if (cat === "shoes") {
    if (t.includes("oxford") || t.includes("brogue") || t.includes("dress_shoe")) return 5;
    if (t.includes("derby") || t.includes("loafer") || t.includes("monk") || t.includes("heel") || t.includes("pump")) return 4;
    if (t.includes("chelsea") || t.includes("ankle_boot")) return 3;
    if (t.includes("leather_sneaker")) return 3;
    if (t.includes("boot") || t.includes("ballet") || t.includes("flat") || t.includes("mule")) return 3;
    if (t.includes("canvas") || (t.includes("sneaker") && !t.includes("running"))) return 2;
    if (t.includes("sandal")) return 2;
    if (isAthleticShoe(t)) return 1;
    if (t.includes("flip")) return 1;
    return 2;
  }
  return 2;
}

// ════════════════════════════════════════════════════════════════════════════
// LAYER / INNER LOGIC — strikte
// ════════════════════════════════════════════════════════════════════════════
// Edhe nese AI thote ndryshe, keto rregulla jane TE FORTA
function isLayerItem(item: Item): boolean {
  if (item.category === "outerwear") return true;
  const t = tt(item);
  return t.includes("blazer") || t.includes("jacket") || t.includes("coat") ||
         t.includes("parka") || t.includes("trench") || t.includes("bomber") ||
         t.includes("cardigan") || t.includes("overshirt") ||
         isSweaterKnit(t) || isHoodieLike(t);
}

function isInnerItem(item: Item): boolean {
  if (item.category !== "top") return false;
  const t = tt(item);
  // STRIKT — outerwear/jacket/coat/blazer/hoodie/sweatshirt JAMË KURRË inner
  if (t.includes("blazer") || t.includes("jacket") || t.includes("coat") ||
      t.includes("parka") || t.includes("trench") || t.includes("bomber") ||
      isHoodieLike(t)) return false;
  return isTeeLike(t) || t.includes("polo") || (t.includes("shirt") && !t.includes("sweatshirt")) ||
         t.includes("blouse") || t.includes("tank") || t.includes("sleeveless") ||
         t.includes("bodysuit") || t.includes("crop") || t.includes("henley") ||
         t.includes("longsleeve") || t.includes("long_sleeve") || isSweaterKnit(t);
}

// ════════════════════════════════════════════════════════════════════════════
// TEMPERATURE — me default të arsyeshme
// ════════════════════════════════════════════════════════════════════════════
function inferMinTemp(item: Item): number {
  if (item.min_temp !== undefined && item.min_temp !== null) return item.min_temp;
  const t = tt(item);
  if (t.includes("tank") || t.includes("sleeveless")) return 22;
  if (isTeeLike(t) || t.includes("crop")) return 18;
  if (t.includes("polo")) return 16;
  if (t.includes("blouse") || t.includes("longsleeve") || t.includes("long_sleeve")) return 12;
  if (t.includes("shirt") && !t.includes("sweatshirt")) return 10;
  if (t.includes("henley")) return 10;
  if (isHoodieLike(t)) return 5;
  if (isSweaterKnit(t)) return 0;
  if (t.includes("blazer")) return 8;
  if (t.includes("bomber") || (t.includes("jacket") && !t.includes("heavy"))) return 5;
  if (t.includes("parka")) return -20;
  if (t.includes("trench") || t.includes("coat") || t.includes("overcoat")) return -10;
  if (t.includes("shorts") || t.includes("mini")) return 20;
  if (t.includes("jean") || t.includes("chino") || t.includes("denim")) return -10;
  if (t.includes("trouser")) return 5;
  if (isAthleticBottom(t)) return 0;
  if (t.includes("sandal") || t.includes("flip")) return 22;
  if (t.includes("boot")) return -15;
  return -30;
}

function inferMaxTemp(item: Item): number {
  if (item.max_temp !== undefined && item.max_temp !== null) return item.max_temp;
  const t = tt(item);
  if (t.includes("tank") || t.includes("sleeveless")) return 40;
  if (isTeeLike(t) || t.includes("crop")) return 35;
  if (t.includes("polo")) return 32;
  if (t.includes("shirt") && !t.includes("sweatshirt")) return 28;
  if (t.includes("blouse")) return 28;
  if (t.includes("longsleeve") || t.includes("long_sleeve") || t.includes("henley")) return 24;
  if (isHoodieLike(t)) return 20;
  if (isSweaterKnit(t)) return 20;
  if (t.includes("blazer")) return 24;
  if (t.includes("bomber") || (t.includes("jacket") && !t.includes("heavy"))) return 18;
  if (t.includes("parka")) return 5;
  if (t.includes("trench") || t.includes("coat") || t.includes("overcoat")) return 12;
  if (t.includes("shorts") || t.includes("mini")) return 45;
  if (t.includes("jean") || t.includes("chino") || t.includes("denim")) return 32;
  if (t.includes("trouser")) return 28;
  if (isAthleticBottom(t)) return 22;
  if (t.includes("sandal") || t.includes("flip")) return 45;
  if (t.includes("boot")) return 16;
  return 45;
}

function isInTempRange(item: Item, tempC: number): boolean {
  return tempC >= inferMinTemp(item) && tempC <= inferMaxTemp(item);
}

// ════════════════════════════════════════════════════════════════════════════
// FAZA A: HARD FILTER PER OCCASION
// ════════════════════════════════════════════════════════════════════════════
function isOccasionAllowed(item: Item, occasion: Occasion): boolean {
  const t = tt(item);
  const tier = inferTier(item);
  const cat = item.category;

  if (occasion === "work") {
    if (tier <= 1) return false;
    if (cat === "top" && (isHoodieLike(t) || t.includes("tank") || t.includes("sleeveless"))) return false;
    if (cat === "top" && t.includes("crop") && !t.includes("blazer")) return false;
    if (cat === "bottom" && (t.includes("shorts") || t.includes("cargo") || isAthleticBottom(t))) return false;
    if (cat === "shoes" && (isAthleticShoe(t) || t.includes("flip") || t.includes("sandal") || t.includes("canvas"))) return false;
    return true;
  }
  if (occasion === "date") {
    if (tier <= 1) return false;
    if (cat === "top" && (isHoodieLike(t) || t.includes("tank") || t.includes("sleeveless"))) return false;
    if (cat === "bottom" && (isAthleticBottom(t) || t.includes("cargo"))) return false;
    if (cat === "shoes" && (isAthleticShoe(t) || t.includes("flip"))) return false;
    return true;
  }
  if (occasion === "night_out") {
    if (tier <= 1) return false;
    if (cat === "top" && (isHoodieLike(t) || t.includes("tank"))) return false;
    if (cat === "bottom" && (t.includes("shorts") || t.includes("cargo") || isAthleticBottom(t))) return false;
    if (cat === "shoes" && (isAthleticShoe(t) || t.includes("sandal") || t.includes("flip"))) return false;
    return true;
  }
  if (occasion === "gym") {
    if (tier >= 4) return false;
    if (cat === "top") return isTeeLike(t) || t.includes("tank") || t.includes("sleeveless") || isHoodieLike(t) || t.includes("athletic") || t.includes("performance") || t.includes("sports_bra");
    if (cat === "bottom") return isAthleticBottom(t) || (t.includes("shorts") && !t.includes("cargo") && !t.includes("denim") && !t.includes("jean"));
    if (cat === "shoes") return isAthleticShoe(t);
    if (cat === "outerwear") return t.includes("track") || isHoodieLike(t);
    return false;
  }
  if (occasion === "travel") {
    if (cat === "top" && t.includes("blazer")) return false;
    if (cat === "shoes" && (t.includes("dress_shoe") || t.includes("oxford") || t.includes("heel"))) return false;
    return true;
  }
  return true; // casual: gjithçka
}

// ════════════════════════════════════════════════════════════════════════════
// FAZA B: COMPATIBILITY MATRIX — HARD BLACKLIST
// Asnjë kombinim që thyen këto rregulla nuk del KURRË
// ════════════════════════════════════════════════════════════════════════════
function isBlacklistedCombo(top: Item, bottom: Item, shoes: Item, outer?: Item): boolean {
  const tt_ = tt(top);
  const bt = tt(bottom);
  const st = tt(shoes);
  const ot = outer ? tt(outer) : "";

  // ─── ANTI DUPLICATE LAYERING ────────────────────────────────────────────
  if (outer) {
    if (isHoodieLike(tt_) && isHoodieLike(ot)) return true;
    if (isSweaterKnit(tt_) && isSweaterKnit(ot) && !ot.includes("cardigan")) return true;
    if (tt_.includes("jacket") && ot.includes("jacket")) return true;
    if (tt_.includes("blazer") && ot.includes("blazer")) return true;
    if (tt_.includes("coat") && (ot.includes("coat") || ot.includes("parka"))) return true;
  }

  // ─── CLOSED OUTERWEAR + SHORTS = NEVER ──────────────────────────────────
  if (isShorts(bt)) {
    if (isClosedOuterwear(tt_)) return true;
    if (outer && isClosedOuterwear(ot)) return true;
  }

  // ─── SMART TOP + ATHLETIC BOTTOM ────────────────────────────────────────
  if (isSmartTop(tt_) && isAthleticBottom(bt)) return true;
  if (outer && isSmartTop(ot) && isAthleticBottom(bt)) return true;

  // ─── SWEATER / KNIT + ATHLETIC BOTTOM = jo coherent ─────────────────────
  if (isSweaterKnit(tt_) && isAthleticBottom(bt)) return true;
  if (outer && isSweaterKnit(ot) && isAthleticBottom(bt)) return true;

  // ─── ATHLETIC TOP + FORMAL/SMART BOTTOM ─────────────────────────────────
  if (isHoodieLike(tt_) && isFormalBottom(bt)) return true;
  if (isAthleticTop(tt_) && isFormalBottom(bt)) return true;

  // ─── FORMAL SHOES + ATHLETIC BOTTOM ─────────────────────────────────────
  if (isFormalShoe(st) && isAthleticBottom(bt)) return true;

  // ─── ATHLETIC SHOES + FORMAL BOTTOM ─────────────────────────────────────
  if (isAthleticShoe(st) && isFormalBottom(bt)) return true;

  // ─── HOODIE + DRESS SHOES = NEVER ───────────────────────────────────────
  if (isHoodieLike(tt_) && isFormalShoe(st)) return true;

  // ─── BLAZER (smart outer) + ATHLETIC SHOES = NEVER ──────────────────────
  if (outer && ot.includes("blazer") && isAthleticShoe(st)) return true;
  if (tt_.includes("blazer") && isAthleticShoe(st)) return true;

  // ─── COAT/TRENCH + ATHLETIC SHOES = NEVER ───────────────────────────────
  if (outer && (ot.includes("coat") || ot.includes("trench") || ot.includes("overcoat")) && isAthleticShoe(st)) return true;

  // ─── TIER MISMATCH I MADH (>= 3) ────────────────────────────────────────
  const topT = inferTier(top);
  const botT = inferTier(bottom);
  const shoT = inferTier(shoes);
  if (Math.abs(topT - botT) > 2) return true;
  if (Math.abs(topT - shoT) > 2) return true;
  if (Math.abs(botT - shoT) > 2) return true;
  if (outer) {
    const outT = inferTier(outer);
    if (Math.abs(outT - topT) > 2) return true;
    if (Math.abs(outT - botT) > 2) return true;
  }

  // ─── COLOR: max 2 LOUD ──────────────────────────────────────────────────
  const allItems = outer ? [top, bottom, shoes, outer] : [top, bottom, shoes];
  const loudColors = new Set<string>();
  for (const it of allItems) {
    const c = cc(it);
    if (!NEUTRAL.has(c)) loudColors.add(c);
  }
  if (loudColors.size > 2) return true;

  // ─── WARM + COOL CLASH PA NEUTRAL ───────────────────────────────────────
  const colors = allItems.map(i => cc(i));
  const hasWarm = colors.some(c => WARM.has(c));
  const hasCool = colors.some(c => COOL.has(c));
  const hasNeutral = colors.some(c => NEUTRAL.has(c));
  if (hasWarm && hasCool && !hasNeutral) return true;

  return false;
}

// ════════════════════════════════════════════════════════════════════════════
// LAYERING — strikte
// ════════════════════════════════════════════════════════════════════════════
function canLayerOver(inner: Item, outer: Item): boolean {
  if (inner.id === outer.id) return false;
  if (!isLayerItem(outer)) return false;
  if (!isInnerItem(inner)) return false;

  const i = tt(inner);
  const o = tt(outer);
  const innerTier = inferTier(inner);
  const outerTier = inferTier(outer);

  // ─── HOODIE/SWEATSHIRT mbi GJITHQKA SMART/SWEATER = NEVER ───
  if (isHoodieLike(o)) {
    if (isSmartTop(i) || isSweaterKnit(i) || innerTier >= 3) return false;
    if (isHoodieLike(i)) return false;
  }
  // Blazer/coat mbi hoodie/athletic = NEVER
  if ((o.includes("blazer") || o.includes("coat") || o.includes("trench")) && (isHoodieLike(i) || isAthleticTop(i))) return false;
  // Sweater mbi hoodie = NEVER
  if (isSweaterKnit(o) && isHoodieLike(i)) return false;
  // Sweater mbi sweater = NEVER (përveç cardigan)
  if (isSweaterKnit(o) && !o.includes("cardigan") && isSweaterKnit(i)) return false;
  // Tier compatibility: outer tier nuk duhet të jetë shumë më i ulët se inner
  if (outerTier < innerTier - 1) return false;
  // Jacket + jacket
  if (o.includes("jacket") && i.includes("jacket")) return false;
  return true;
}

function isOuterValidForOccasion(outer: Item, occasion: Occasion): boolean {
  const o = tt(outer);
  if (occasion === "work") {
    if (isHoodieLike(o)) return false;
    if (o.includes("parka") || o.includes("bomber")) return false;
    if (o.includes("track")) return false;
    return true;
  }
  if (occasion === "date" || occasion === "night_out") {
    if (isHoodieLike(o)) return false;
    if (o.includes("parka")) return false;
    if (o.includes("track")) return false;
    return true;
  }
  if (occasion === "gym") return false;
  return true;
}

function isOuterCompatibleWithBottom(outer: Item, bottom: Item): boolean {
  const o = tt(outer);
  const b = tt(bottom);
  if (isClosedOuterwear(o) && isAthleticBottom(b)) return false;
  if (isClosedOuterwear(o) && isShorts(b)) return false;
  const oTier = inferTier(outer);
  const bTier = inferTier(bottom);
  if (Math.abs(oTier - bTier) > 2) return false;
  return true;
}

// ════════════════════════════════════════════════════════════════════════════
// FAZA C: COLOR HARMONY 60-30-10
// ════════════════════════════════════════════════════════════════════════════
function colorScore(top: Item, bottom: Item, shoes: Item, outer?: Item): number {
  const items = outer ? [top, bottom, shoes, outer] : [top, bottom, shoes];
  const colors = items.map(i => cc(i));
  const loud = colors.filter(c => !NEUTRAL.has(c));
  const uniqueLoud = new Set(loud).size;

  let score = 0;
  if (loud.length === 0) score += 30;            // monochrome neutral
  else if (uniqueLoud === 1) score += 26;        // 1 accent
  else if (uniqueLoud === 2) score += 16;        // 2 colors
  else return 0;                                  // 3+ = REJECT

  const tc = cc(top);
  const bc = cc(bottom);
  const sc = cc(shoes);

  // Shoes neutral = anchor
  if (NEUTRAL.has(sc)) score += 6;
  // Same family bonus
  if (COOL.has(tc) && COOL.has(bc)) score += 4;
  if (WARM.has(tc) && WARM.has(bc)) score += 4;
  // Light + dark contrast bonus
  if ((LIGHT.has(tc) && DARK.has(bc)) || (DARK.has(tc) && LIGHT.has(bc))) score += 6;
  // Same exact loud color top+bottom = penalty
  if (tc === bc && !NEUTRAL.has(tc)) score -= 8;

  return clamp(score, 0, 40);
}

// ════════════════════════════════════════════════════════════════════════════
// OCCASION SCORE
// ════════════════════════════════════════════════════════════════════════════
function occasionScore(occasion: Occasion, top: Item, bottom: Item, shoes: Item, outer?: Item): number {
  const tiers = outer ? [inferTier(top), inferTier(bottom), inferTier(shoes), inferTier(outer)] : [inferTier(top), inferTier(bottom), inferTier(shoes)];
  const avgTier = tiers.reduce((a, b) => a + b, 0) / tiers.length;
  let score = 20;

  if (occasion === "work") {
    // Ideal: 3-4
    if (avgTier >= 3.5 && avgTier <= 4) score += 25;
    else if (avgTier >= 3) score += 15;
    else if (avgTier >= 2.5) score += 5;
  }
  if (occasion === "date") {
    // Ideal: 2.5-3.5
    if (avgTier >= 2.5 && avgTier <= 3.5) score += 25;
    else if (avgTier >= 2) score += 15;
  }
  if (occasion === "casual") {
    // Ideal: 2-3
    if (avgTier >= 2 && avgTier <= 3) score += 22;
    else if (avgTier < 2) score += 10;
    else score += 5;
  }
  if (occasion === "night_out") {
    if (avgTier >= 3 && avgTier <= 4) score += 25;
    else if (avgTier >= 2.5) score += 15;
  }
  if (occasion === "travel") {
    if (avgTier >= 2 && avgTier <= 3) score += 22;
    else score += 10;
  }
  if (occasion === "gym") {
    if (avgTier <= 1.5) score += 25;
    else if (avgTier <= 2) score += 10;
  }

  return clamp(score, 0, 50);
}

// ════════════════════════════════════════════════════════════════════════════
// STYLE SCORE
// ════════════════════════════════════════════════════════════════════════════
function styleScore(style: string, top: Item, bottom: Item, shoes: Item): number {
  const items = [top, bottom, shoes];
  const tags = items.flatMap(i => i.style_tags ?? []).map(s => s.toLowerCase());
  let score = 0;
  if (style === "minimal" && (tags.includes("minimal") || tags.includes("smart"))) score += 12;
  if (style === "streetwear" && (tags.includes("streetwear") || tags.includes("athletic"))) score += 15;
  if (style === "smart_casual" && (tags.includes("smart") || tags.includes("casual"))) score += 12;
  if (style === "classic" && (tags.includes("formal") || tags.includes("elegant") || tags.includes("smart"))) score += 15;
  if (style === "sporty" && (tags.includes("sporty") || tags.includes("athletic"))) score += 15;
  return clamp(score, 0, 20);
}

// ════════════════════════════════════════════════════════════════════════════
// VARIETY SCORE — bazuar në wear_count + last_worn + anti-repeat
// ════════════════════════════════════════════════════════════════════════════
function varietyScore(top: Item, bottom: Item, shoes: Item, outer: Item | undefined, recentIds: Set<string>, rnd: () => number): number {
  const items = outer ? [top, bottom, shoes, outer] : [top, bottom, shoes];
  let score = 0;

  // Wear count bonus (cope te papërdorura = bonus)
  for (const it of items) {
    const wc = it.wear_count ?? 0;
    if (wc < 2) score += 3;
    else if (wc < 5) score += 1;
  }

  // Last worn — cope që s'ka kohë qe u veshe
  const now = Date.now();
  for (const it of items) {
    if (it.last_worn) {
      const lastDate = new Date(it.last_worn).getTime();
      const daysSince = (now - lastDate) / (1000 * 60 * 60 * 24);
      if (daysSince > 30) score += 2;
      else if (daysSince > 14) score += 1;
    }
  }

  // Anti-repeat — penalizo cope të përdorura në generations të fundit
  let repeatPenalty = 0;
  for (const it of items) {
    if (recentIds.has(it.id)) repeatPenalty += 8;
  }
  score -= repeatPenalty;

  // Randomization mikroskopike
  score += Math.floor(rnd() * 5);

  return clamp(score, -30, 30);
}

// ════════════════════════════════════════════════════════════════════════════
// VOTE LEARNING
// ════════════════════════════════════════════════════════════════════════════
function voteAdjust(itemIds: string[], votedUp: string[], votedDown: string[]): number {
  const upSet = new Set<string>();
  const downSet = new Set<string>();
  for (const h of votedUp) { const p = h.split(":"); for (let i = 2; i < p.length; i++) if (p[i]) upSet.add(p[i]); }
  for (const h of votedDown) { const p = h.split(":"); for (let i = 2; i < p.length; i++) if (p[i]) downSet.add(p[i]); }
  let adj = 0;
  if (upSet.size && itemIds.some(id => upSet.has(id))) adj += 10;
  if (downSet.size && itemIds.some(id => downSet.has(id))) adj -= 15;
  return adj;
}

// ════════════════════════════════════════════════════════════════════════════
// ACCESSORIES
// ════════════════════════════════════════════════════════════════════════════
type AccessoryKind = "belt" | "tie" | "scarf" | "hat" | "watch" | "bag" | "jewelry" | "sunglasses" | "other";

function getAccessoryKind(s: string): AccessoryKind {
  if (s.includes("belt")) return "belt";
  if (s.includes("tie") || s.includes("bowtie")) return "tie";
  if (s.includes("scarf")) return "scarf";
  if (s.includes("hat") || s.includes("cap") || s.includes("beanie")) return "hat";
  if (s.includes("watch")) return "watch";
  if (s.includes("bag") || s.includes("backpack") || s.includes("tote") || s.includes("clutch")) return "bag";
  if (s.includes("necklace") || s.includes("bracelet") || s.includes("ring") || s.includes("earring") || s.includes("jewelry")) return "jewelry";
  if (s.includes("sunglass") || s.includes("glasses")) return "sunglasses";
  return "other";
}

function beltShoesLeatherMatch(belt: Item, shoes: Item): boolean {
  const bc = cc(belt);
  const sc = cc(shoes);
  const st = tt(shoes);
  const leatherShoes = st.includes("dress") || st.includes("oxford") || st.includes("loafer") || st.includes("derby") || st.includes("chelsea") || st.includes("brogue");
  if (!leatherShoes) return true;
  const browns = new Set(["brown","earth","tan"]);
  const blacks = new Set(["black"]);
  if (blacks.has(bc) && browns.has(sc)) return false;
  if (browns.has(bc) && blacks.has(sc)) return false;
  return true;
}

function pickAccessories(pool: Item[], occasion: Occasion, tempC: number, shoes: Item, rnd: () => number): Item[] {
  if (rnd() < 0.4) return [];
  const maxCount = (occasion === "work" || occasion === "date" || occasion === "night_out") ? 2 : 1;
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
// LABEL FILTER
// ════════════════════════════════════════════════════════════════════════════
function meetsLabel(label: OutfitLabel, top: Item, bottom: Item, shoes: Item, occasion?: Occasion): boolean {
  // Gym: skip label filter — athletic items rrallë kanë ngjyra loud, accept both
  if (occasion === "gym") return true;
  const colors = [top, bottom, shoes].map(i => cc(i));
  const loud = colors.filter(c => !NEUTRAL.has(c)).length;
  if (label === "Safe") return loud <= 1;
  if (label === "Colorful") return loud >= 1;
  return true;
}

// ════════════════════════════════════════════════════════════════════════════
// LAYER REQUIREMENTS PER TEMP
// ════════════════════════════════════════════════════════════════════════════
function getRequiredLayers(tempC: number, occasion: Occasion): { min: number; max: number } {
  if (occasion === "gym") return { min: 0, max: 0 };
  if (tempC >= 25) return { min: 0, max: 0 };
  if (tempC >= 22) return { min: 0, max: 1 };
  if (tempC >= 18) return { min: 0, max: 1 };
  if (tempC >= 13) return { min: 1, max: 1 };
  if (tempC >= 5) return { min: 1, max: 2 };
  return { min: 1, max: 2 };
}

// ════════════════════════════════════════════════════════════════════════════
// WHY BUILDER
// ════════════════════════════════════════════════════════════════════════════
function buildWhy(occasion: Occasion, top: Item, bottom: Item, shoes: Item, outer?: Item, tempC?: number): string {
  const t = top.type.replace(/_/g, " ");
  const b = bottom.type.replace(/_/g, " ");
  const s = shoes.type.replace(/_/g, " ");
  if (outer && tempC !== undefined && tempC <= 12) {
    const o = outer.type.replace(/_/g, " ");
    return `${Math.round(tempC)}°C jashtë — ${o} mbi ${t}, ${b} dhe ${s}.`;
  }
  if (outer) {
    const o = outer.type.replace(/_/g, " ");
    return `${o} mbi ${t} me ${b} dhe ${s} — layered me kohezion.`;
  }
  const lines: Record<Occasion, string> = {
    work: `${t} + ${b} — profesional dhe i menduar.`,
    date: `${s} e ngre look-un. ${t} + ${b} duket intentional.`,
    casual: `Relaxed por i menduar — ngjyrat balancohen mirë.`,
    night_out: `Look i mprehtë me ${s}.`,
    travel: `Komfort + stil për çdo destinacion.`,
    gym: `Funksional. ${s} ideal për performance.`,
  };
  return lines[occasion];
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN GENERATE
// ════════════════════════════════════════════════════════════════════════════
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
  const votedUp = opts.votedUp ?? [];
  const votedDown = opts.votedDown ?? [];
  const recentIds = new Set(opts.recentItemIds ?? []);

  // ── KATEGORIZIM ─────────────────────────────────────────────────────────
  const allTops = items.filter(i => i.category === "top" || i.category === "outerwear");
  const allBottoms = items.filter(i => i.category === "bottom");
  const allShoes = items.filter(i => i.category === "shoes");
  const allAccessories = items.filter(i => i.category === "accessory");

  // Standalone tops (jo pure outerwear)
  const standaloneTops = allTops.filter(i => {
    if (i.category === "outerwear") return false;
    const t = tt(i);
    if (t.includes("blazer") || t.includes("coat") || t.includes("parka") || t.includes("trench") || t.includes("bomber")) return false;
    if (t.includes("jacket") && !t.includes("track")) return false;
    return true;
  });

  const innerTops = allTops.filter(i => isInnerItem(i));
  const outerItems = allTops.filter(i => isLayerItem(i));

  // FAZA A: Hard filter per temp + occasion
  const validTops = standaloneTops.filter(i => isInTempRange(i, tempC) && isOccasionAllowed(i, occasion));
  const validBottoms = allBottoms.filter(i => isInTempRange(i, tempC) && isOccasionAllowed(i, occasion));
  const validShoes = allShoes.filter(i => isInTempRange(i, tempC) && isOccasionAllowed(i, occasion));
  const validInners = innerTops.filter(i => isInTempRange(i, tempC) && isOccasionAllowed(i, occasion));
  const validOuters = outerItems.filter(i => isInTempRange(i, tempC) && isOuterValidForOccasion(i, occasion));

  // Empty wardrobe
  if (!allTops.length || !allBottoms.length || !allShoes.length) {
    const dummy: Item = { id: "missing", category: "top", type: "missing", color_family: "neutral" };
    const mk = (label: OutfitLabel): Outfit => ({
      label, occasion, score: 0,
      picks: { top: dummy, bottom: { ...dummy, category: "bottom" }, shoes: { ...dummy, category: "shoes" } },
      breakdown: { occasion: 0, harmony: 0, variety: 0, balance: 0 },
      outfit_hash: "missing",
      why: "Shto te pakten 1 top, 1 bottom, 1 shoes.",
    });
    return [mk("Safe"), mk("Colorful")];
  }

  // Wardrobe gap per occasion
  if (!validTops.length || !validBottoms.length || !validShoes.length) {
    const occLabel: Record<Occasion, string> = { work: "punë", date: "rendez-vous", casual: "casual", night_out: "mbrëmje", travel: "udhëtim", gym: "palestër" };
    const dummy: Item = { id: "wardrobe-gap", category: "top", type: "missing", color_family: "neutral" };
    const mk = (label: OutfitLabel): Outfit => ({
      label, occasion, score: 25,
      picks: { top: dummy, bottom: { ...dummy, category: "bottom" }, shoes: { ...dummy, category: "shoes" } },
      breakdown: { occasion: 0, harmony: 0, variety: 0, balance: 0 },
      outfit_hash: "gap",
      why: `Garderoba ka mungesa për ${occLabel[occasion]}. Shto cope të përshtatshme.`,
    });
    return [mk("Safe"), mk("Colorful")];
  }

  const pinnedTop = opts.pinnedTopId ? validTops.find(x => x.id === opts.pinnedTopId) ?? null : null;
  const pinnedBottom = opts.pinnedBottomId ? validBottoms.find(x => x.id === opts.pinnedBottomId) ?? null : null;
  const pinnedShoes = opts.pinnedShoesId ? validShoes.find(x => x.id === opts.pinnedShoesId) ?? null : null;
  const { min: minLayers } = getRequiredLayers(tempC, occasion);

  // ── BUILD ONE OUTFIT ─────────────────────────────────────────────────────
  const buildOne = (label: OutfitLabel, excludeHash?: string): Outfit => {
    let best: Outfit | null = null;
    const candidates: Outfit[] = [];
    const seen = new Set<string>();

    // 400 attempts per cope of variety + chance per top-K
    for (let attempt = 0; attempt < 400; attempt++) {
      const top = pinnedTop ?? pickOne(validTops, rnd);
      const bottom = pinnedBottom ?? pickOne(validBottoms, rnd);
      const shoe = pinnedShoes ?? pickOne(validShoes, rnd);

      // FAZA B: Hard blacklist check
      if (isBlacklistedCombo(top, bottom, shoe)) continue;
      if (!meetsLabel(label, top, bottom, shoe, occasion)) continue;

      // Layering decision
      let outer: Item | undefined = undefined;
      let finalTop = top;
      const needsLayer = minLayers >= 1;
      const wantsLayer = needsLayer || rnd() < 0.30;

      if (wantsLayer && validOuters.length > 0) {
        let innerCandidate: Item | null = null;
        if (isInnerItem(top)) innerCandidate = top;
        else if (validInners.length > 0) innerCandidate = pickOne(validInners, rnd);

        if (innerCandidate) {
          const compatibleOuters = validOuters.filter(o => {
            if (o.id === innerCandidate!.id) return false;
            if (!canLayerOver(innerCandidate!, o)) return false;
            if (!isOuterCompatibleWithBottom(o, bottom)) return false;
            if (isBlacklistedCombo(innerCandidate!, bottom, shoe, o)) return false;
            return true;
          });
          if (compatibleOuters.length > 0) {
            outer = pickOne(compatibleOuters, rnd);
            finalTop = innerCandidate;
          }
        }
      }

      // Si nuk gjeti outer por kerkohet
      if (needsLayer && !outer) {
        const finalT = tt(finalTop);
        const warm = isHoodieLike(finalT) || isSweaterKnit(finalT);
        if (!warm || tempC < 5) continue;
      }

      // RE-CHECK me outer
      if (outer && isBlacklistedCombo(finalTop, bottom, shoe, outer)) continue;

      // FAZA C: SCORING
      const harmSc = colorScore(finalTop, bottom, shoe, outer);
      if (harmSc === 0) continue;

      const occSc = occasionScore(occasion, finalTop, bottom, shoe, outer);
      let balanceSc = 10;
      if (outer) balanceSc += 4;

      const varSc = varietyScore(finalTop, bottom, shoe, outer, recentIds, rnd);
      const styleSc = styleScore(style, finalTop, bottom, shoe);
      const itemIds = outer ? [finalTop.id, bottom.id, shoe.id, outer.id] : [finalTop.id, bottom.id, shoe.id];
      const voteAdj = voteAdjust(itemIds, votedUp, votedDown);
      const accessories = includeAcc ? pickAccessories(allAccessories, occasion, tempC, shoe, rnd) : [];
      if (accessories.length > 0) balanceSc += 2;

      const total = clamp(Math.round(occSc + harmSc + balanceSc + styleSc + varSc + voteAdj), 0, 100);

      const accIds = accessories.map(a => a.id).join(",");
      const hash = hashStr(`${label}:${occasion}:${finalTop.id}:${bottom.id}:${shoe.id}:${outer?.id ?? ""}:${accIds}`);

      if (excludeHash && hash === excludeHash) continue;
      if (seen.has(hash)) continue;
      seen.add(hash);

      const why = buildWhy(occasion, finalTop, bottom, shoe, outer, tempC);
      const outfit: Outfit = {
        label, occasion, score: total,
        picks: { top: finalTop, bottom, shoes: shoe, outer, accessories: accessories.length ? accessories : undefined },
        breakdown: { occasion: occSc, harmony: harmSc, variety: varSc, balance: balanceSc, style: styleSc, explanation: why },
        outfit_hash: hash,
        why,
      };
      candidates.push(outfit);
      if (!best || outfit.score > best.score) best = outfit;
    }

    // TOP-K ROTATION për variety
    if (best && candidates.length > 1) {
      const threshold = best.score - 10;
      const topPool = candidates.filter(c => c.score >= threshold).sort((a, b) => b.score - a.score).slice(0, 6);
      if (topPool.length > 1) best = topPool[Math.floor(rnd() * topPool.length)];
    }

    // SAFE FALLBACK — provo gjithe kombinimet derisa gjej nje qe s'eshte blacklist
    if (!best) {
      outer: for (const t of validTops) {
        for (const b of validBottoms) {
          for (const s of validShoes) {
            if (!isBlacklistedCombo(t, b, s) && meetsLabel(label, t, b, s, occasion)) {
              const why = buildWhy(occasion, t, b, s, undefined, tempC);
              best = {
                label, occasion, score: 40,
                picks: { top: t, bottom: b, shoes: s },
                breakdown: { occasion: 25, harmony: 15, variety: 0, balance: 5 },
                outfit_hash: hashStr(`fallback:${label}:${t.id}:${b.id}:${s.id}`),
                why,
              };
              break outer;
            }
          }
        }
      }
    }

    if (!best) {
      const dummy: Item = { id: "gap-" + label, category: "top", type: "missing", color_family: "neutral" };
      best = {
        label, occasion, score: 25,
        picks: { top: dummy, bottom: { ...dummy, category: "bottom" }, shoes: { ...dummy, category: "shoes" } },
        breakdown: { occasion: 0, harmony: 0, variety: 0, balance: 0 },
        outfit_hash: "gap-" + label,
        why: `Garderoba ka mungesa për ${occasion}. Shto cope të përshtatshme.`,
      };
    }
    return best;
  };

  const safe = buildOne("Safe");
  const colorful = buildOne("Colorful", safe.outfit_hash);
  return [safe, colorful];
}