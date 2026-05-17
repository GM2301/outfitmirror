// src/lib/engine/generate.ts
// Engine v9 — RISHKRUAR me hard rejects strikt, anti duks-mbi-duks, layering hierarchy
import type { Item, Occasion, Outfit, OutfitLabel, GenerateOptions, Gender } from "./types";

// ════════════════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════════════════
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function pickOne<T>(arr: T[], rnd: () => number): T { return arr[Math.floor(rnd() * arr.length)]; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function hashStr(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); }

const NEUTRAL = new Set(["neutral","black","white","earth","grey","gray","beige","brown","navy","denim","tan","khaki"]);
const COOL = new Set(["blue","green","purple","teal"]);
const WARM = new Set(["red","orange","yellow","pink","coral"]);

// ════════════════════════════════════════════════════════════════════════════
// TYPE FAMILIES — kategorizim i rreptë
// ════════════════════════════════════════════════════════════════════════════
function isAthleticTop(t: string): boolean {
  return t.includes("hoodie") || t.includes("sweatshirt") || t.includes("zip_up") ||
         t.includes("athletic") || t.includes("performance") || t.includes("sports_bra") ||
         t.includes("track_jacket") || t.includes("track_top");
}
function isAthleticBottom(t: string): boolean {
  return t.includes("jogger") || t.includes("sweat") || t.includes("track") ||
         t.includes("athletic_pant") || t.includes("trenerk") || t.includes("legging");
}
function isAthleticShoe(t: string): boolean {
  return t.includes("running") || t.includes("trainer") ||
         (t.includes("athletic") && !t.includes("leather")) ||
         (t.includes("sneaker") && !t.includes("leather") && !t.includes("canvas") && !t.includes("dress"));
}
function isSmartTop(t: string): boolean {
  return t.includes("shirt") && !t.includes("sweatshirt") || t.includes("blouse") || t.includes("polo") ||
         t.includes("blazer") || t.includes("dress_shirt");
}
function isFormalShoe(t: string): boolean {
  return t.includes("oxford") || t.includes("brogue") || t.includes("dress_shoe") ||
         t.includes("derby") || t.includes("loafer") || t.includes("monk") ||
         t.includes("heel") || t.includes("pump") || t.includes("dress");
}
function isClosedOuterwear(t: string): boolean {
  return t.includes("blazer") || t.includes("coat") || t.includes("parka") ||
         t.includes("trench") || t.includes("bomber") || t.includes("overcoat") ||
         t.includes("peacoat") || (t.includes("jacket") && !t.includes("track_jacket"));
}
function isHoodieLike(t: string): boolean {
  return t.includes("hoodie") || t.includes("sweatshirt") || t.includes("zip_up");
}
function isSweaterKnit(t: string): boolean {
  return (t.includes("sweater") || t.includes("knit") || t.includes("cardigan") || t.includes("crewneck"))
         && !isHoodieLike(t);
}
function isTeeLike(t: string): boolean {
  return (t.includes("tee") || t.includes("t-shirt") || t.includes("tshirt")) && !t.includes("sweat");
}

// ════════════════════════════════════════════════════════════════════════════
// FORMALITY TIER 1-5
// ════════════════════════════════════════════════════════════════════════════
function inferTier(item: Item): number {
  if (item.formality_tier !== undefined && item.formality_tier !== null) {
    return clamp(item.formality_tier, 1, 5);
  }
  const t = item.type.toLowerCase();
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
// IS_LAYER / IS_INNER — RREGULLA STRIKTE
// ════════════════════════════════════════════════════════════════════════════
// IMPORTANT: edhe nëse AI thotë ndryshe, këto rregulla janë STRIKTE
function isLayerItem(item: Item): boolean {
  // Outerwear category gjithmonë layer
  if (item.category === "outerwear") return true;
  const t = item.type.toLowerCase();
  // Layer items: blazer, jacket, coat, parka, trench, bomber, cardigan, sweater, hoodie
  return t.includes("blazer") || t.includes("jacket") || t.includes("coat") ||
         t.includes("parka") || t.includes("trench") || t.includes("bomber") ||
         t.includes("cardigan") || t.includes("overshirt") ||
         isSweaterKnit(t) || isHoodieLike(t);
}

function isInnerItem(item: Item): boolean {
  if (item.category !== "top") return false;
  const t = item.type.toLowerCase();
  // STRIKTE: outerwear/jacket/coat/blazer/hoodie NUK janë inner kurrë
  if (t.includes("blazer") || t.includes("jacket") || t.includes("coat") ||
      t.includes("parka") || t.includes("trench") || t.includes("bomber") ||
      isHoodieLike(t)) return false;
  // Inner: tee, polo, shirt, tank, blouse, bodysuit, crop, henley, sweater (i lehtë), longsleeve
  return isTeeLike(t) || t.includes("polo") || (t.includes("shirt") && !t.includes("sweatshirt")) ||
         t.includes("blouse") || t.includes("tank") || t.includes("sleeveless") ||
         t.includes("bodysuit") || t.includes("crop") || t.includes("henley") ||
         t.includes("longsleeve") || isSweaterKnit(t);
}

// ════════════════════════════════════════════════════════════════════════════
// TEMPERATURE — me default të arsyeshme
// ════════════════════════════════════════════════════════════════════════════
function inferMinTemp(item: Item): number {
  if (item.min_temp !== undefined && item.min_temp !== null) return item.min_temp;
  const t = item.type.toLowerCase();
  if (t.includes("tank") || t.includes("sleeveless")) return 22;
  if (isTeeLike(t) || t.includes("crop")) return 18;
  if (t.includes("polo")) return 16;
  if (t.includes("blouse") || t.includes("longsleeve")) return 12;
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
  const t = item.type.toLowerCase();
  if (t.includes("tank") || t.includes("sleeveless")) return 40;
  if (isTeeLike(t) || t.includes("crop")) return 35;
  if (t.includes("polo")) return 32;
  if (t.includes("shirt") && !t.includes("sweatshirt")) return 28;
  if (t.includes("blouse")) return 28;
  if (t.includes("longsleeve") || t.includes("henley")) return 24;
  if (isHoodieLike(t)) return 20;
  if (isSweaterKnit(t)) return 20;
  if (t.includes("blazer")) return 24;
  if (t.includes("bomber") || (t.includes("jacket") && !t.includes("heavy"))) return 18;
  if (t.includes("parka")) return 5;
  if (t.includes("trench") || t.includes("coat") || t.includes("overcoat")) return 12;
  if (t.includes("shorts") || t.includes("mini")) return 45;
  if (t.includes("jean") || t.includes("chino") || t.includes("denim")) return 28;
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
// OCCASION VALIDATION
// ════════════════════════════════════════════════════════════════════════════
function isOccasionAllowed(item: Item, occasion: Occasion): boolean {
  const t = item.type.toLowerCase();
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
    if (cat === "top") {
      return isTeeLike(t) || t.includes("tank") || t.includes("sleeveless") ||
             isHoodieLike(t) || t.includes("athletic") || t.includes("performance") || t.includes("sports_bra");
    }
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
  return true;
}

// ════════════════════════════════════════════════════════════════════════════
// UNIVERSAL HARD BLOCKS — ASNJË COPE NUK I THYEN KËTO
// ════════════════════════════════════════════════════════════════════════════
function isBlacklistedCombo(top: Item, bottom: Item, shoes: Item, outer?: Item): boolean {
  const tt = top.type.toLowerCase();
  const bt = bottom.type.toLowerCase();
  const st = shoes.type.toLowerCase();
  const ot = outer?.type.toLowerCase() ?? "";

  // ─── ANTI DUKS-MBI-DUKS ───
  // Hoodie/sweatshirt + outer hoodie/sweatshirt = NEVER
  if (outer && isHoodieLike(tt) && isHoodieLike(ot)) return true;
  // Sweater + sweater outer = NEVER (përveç cardigan mbi tee)
  if (outer && isSweaterKnit(tt) && isSweaterKnit(ot) && !ot.includes("cardigan")) return true;
  // Jacket + jacket = NEVER
  if (outer && tt.includes("jacket") && ot.includes("jacket")) return true;
  // Blazer + blazer = NEVER
  if (outer && tt.includes("blazer") && ot.includes("blazer")) return true;
  // Coat + coat = NEVER
  if (outer && tt.includes("coat") && ot.includes("coat")) return true;

  // ─── CLOSED OUTERWEAR + SHORTS ───
  if ((bt.includes("shorts") || bt.includes("mini"))) {
    if (isClosedOuterwear(tt)) return true;
    if (outer && isClosedOuterwear(ot)) return true;
  }

  // ─── SMART TOP + ATHLETIC BOTTOM ───
  if (isSmartTop(tt) && isAthleticBottom(bt)) return true;

  // ─── ATHLETIC TOP + FORMAL/SMART BOTTOM ───
  if (isHoodieLike(tt) && (bt.includes("trouser") || bt.includes("dress_pant") || bt.includes("suit"))) return true;
  if (isAthleticTop(tt) && bt.includes("trouser")) return true;

  // ─── FORMAL SHOES + ATHLETIC BOTTOM ───
  if (isFormalShoe(st) && isAthleticBottom(bt)) return true;

  // ─── ATHLETIC SHOES + FORMAL BOTTOM ───
  if (isAthleticShoe(st) && (bt.includes("trouser") || bt.includes("dress_pant") || bt.includes("suit"))) return true;
  // Running shoes + chinos formal context — strict për occasion specifik
  // (kjo handle-ohet te isOccasionAllowed për occasion)

  // ─── TIER MISMATCH I MADH ───
  const topTier = inferTier(top);
  const bottomTier = inferTier(bottom);
  const shoeTier = inferTier(shoes);
  // Athletic top (1) + formal bottom (4+) = NEVER
  if (topTier <= 1 && bottomTier >= 4) return true;
  // Smart top (3+) + athletic bottom (1) = NEVER
  if (topTier >= 3 && bottomTier <= 1) return true;
  // Athletic shoes (1) + formal bottom (4+) = NEVER
  if (shoeTier <= 1 && bottomTier >= 4) return true;
  // Formal shoes (4+) + athletic bottom (1) = NEVER
  if (shoeTier >= 4 && bottomTier <= 1) return true;
  // Formal shoes (4+) + athletic top (1) = NEVER
  if (shoeTier >= 4 && topTier <= 1) return true;

  // ─── HOODIE + DRESS SHOES ───
  if (isHoodieLike(tt) && isFormalShoe(st)) return true;

  // ─── BELT/SHOE LEATHER MISMATCH ───
  // (handled te accessory match)

  return false;
}

function getFormalitySpread(top: Item, bottom: Item, shoes: Item, outer?: Item): number {
  const tiers = [inferTier(top), inferTier(bottom), inferTier(shoes)];
  if (outer) tiers.push(inferTier(outer));
  return Math.max(...tiers) - Math.min(...tiers);
}

// ════════════════════════════════════════════════════════════════════════════
// LAYERING — STRIKTE
// ════════════════════════════════════════════════════════════════════════════
function canLayerOver(inner: Item, outer: Item): boolean {
  if (inner.id === outer.id) return false;
  if (!isLayerItem(outer)) return false;
  if (!isInnerItem(inner)) return false;

  const i = inner.type.toLowerCase();
  const o = outer.type.toLowerCase();
  const innerTier = inferTier(inner);
  const outerTier = inferTier(outer);

  // ─── REGULL #1: HOODIE/SWEATSHIRT mbi GJITHQKA SMART = NEVER ───
  if (isHoodieLike(o) && (isSmartTop(i) || i.includes("sweater") || i.includes("knit") || i.includes("cardigan"))) return false;
  if (isHoodieLike(o) && innerTier >= 3) return false;

  // ─── REGULL #2: HOODIE OUTER + HOODIE INNER = NEVER ───
  if (isHoodieLike(o) && isHoodieLike(i)) return false;

  // ─── REGULL #3: BLAZER mbi HOODIE/ATHLETIC = NEVER ───
  if (o.includes("blazer") && (isHoodieLike(i) || isAthleticTop(i))) return false;

  // ─── REGULL #4: SWEATER mbi HOODIE = NEVER ───
  if ((isSweaterKnit(o)) && isHoodieLike(i)) return false;
  // Sweater mbi sweater = NEVER (përveç cardigan)
  if (isSweaterKnit(o) && !o.includes("cardigan") && isSweaterKnit(i)) return false;

  // ─── REGULL #5: TIER COMPATIBILITY ───
  // Outer tier nuk duhet të jetë shumë më i ulët se inner
  // Hoodie (tier 1) mbi shirt (tier 3) = absurd
  // Blazer (tier 4) mbi tee (tier 2) = OK
  // Vetëm lejojmë outer tier >= inner tier - 1 ose layering down logjik
  if (outerTier < innerTier - 1) return false;

  // ─── REGULL #6: JACKET + JACKET kombinime ───
  if (o.includes("jacket") && i.includes("jacket")) return false;
  if (o.includes("coat") && (i.includes("coat") || i.includes("jacket"))) return false;

  return true;
}

function isOuterValidForOccasion(outer: Item, occasion: Occasion): boolean {
  const o = outer.type.toLowerCase();
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
  const o = outer.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const oTier = inferTier(outer);
  const bTier = inferTier(bottom);
  // Tier spread max 2
  if (Math.abs(oTier - bTier) > 2) return false;
  // Closed outer + athletic bottom
  if (isClosedOuterwear(o) && isAthleticBottom(b)) return false;
  // Closed outer + shorts = NEVER (universal)
  if (isClosedOuterwear(o) && (b.includes("shorts") || b.includes("mini"))) return false;
  return true;
}

// ════════════════════════════════════════════════════════════════════════════
// COLOR HARMONY 60-30-10
// ════════════════════════════════════════════════════════════════════════════
function colorScore(top: Item, bottom: Item, shoes: Item, outer?: Item): number {
  const items = outer ? [top, bottom, shoes, outer] : [top, bottom, shoes];
  const colors = items.map(i => String(i.color_family).toLowerCase());
  const loud = colors.filter(c => !NEUTRAL.has(c));
  const uniqueLoud = new Set(loud).size;
  if (uniqueLoud > 2) return 0; // 3+ ngjyra loud = REJECT

  const tc = String(top.color_family).toLowerCase();
  const bc = String(bottom.color_family).toLowerCase();
  const sc = String(shoes.color_family).toLowerCase();

  let score = 0;
  if (loud.length === 0) score += 30;
  else if (uniqueLoud === 1) score += 26;
  else score += 14;

  if (NEUTRAL.has(sc)) score += 6;
  if (COOL.has(tc) && COOL.has(bc)) score += 4;
  if (WARM.has(tc) && WARM.has(bc)) score += 4;
  if (COOL.has(tc) && WARM.has(bc) && !NEUTRAL.has(sc)) score -= 12;
  if (WARM.has(tc) && COOL.has(bc) && !NEUTRAL.has(sc)) score -= 12;

  const lightSet = new Set(["white","neutral","beige","grey","gray"]);
  const darkSet = new Set(["black","navy","blue"]);
  if ((lightSet.has(tc) && darkSet.has(bc)) || (darkSet.has(tc) && lightSet.has(bc))) score += 6;
  if (tc === bc && !NEUTRAL.has(tc)) score -= 8;

  return clamp(score, 0, 40);
}

// ════════════════════════════════════════════════════════════════════════════
// OCCASION + STYLE SCORING
// ════════════════════════════════════════════════════════════════════════════
function occasionScore(occasion: Occasion, top: Item, bottom: Item, shoes: Item): number {
  const tierSum = inferTier(top) + inferTier(bottom) + inferTier(shoes);
  let score = 25;
  if (occasion === "work" || occasion === "night_out") score += tierSum * 2;
  if (occasion === "date") score += (tierSum >= 7 && tierSum <= 12) ? 15 : Math.max(0, tierSum - 3);
  if (occasion === "casual") score += (tierSum >= 4 && tierSum <= 9) ? 12 : (tierSum < 4 ? 6 : 0);
  if (occasion === "travel") score += (tierSum >= 4 && tierSum <= 8) ? 12 : 4;
  if (occasion === "gym") score += Math.max(0, 15 - tierSum * 2);
  return clamp(score, 0, 50);
}

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
// ACCESSORIES
// ════════════════════════════════════════════════════════════════════════════
type AccessoryKind = "belt" | "tie" | "scarf" | "hat" | "watch" | "bag" | "jewelry" | "sunglasses" | "other";

function getAccessoryKind(t: string): AccessoryKind {
  if (t.includes("belt")) return "belt";
  if (t.includes("tie") || t.includes("bowtie")) return "tie";
  if (t.includes("scarf")) return "scarf";
  if (t.includes("hat") || t.includes("cap") || t.includes("beanie")) return "hat";
  if (t.includes("watch")) return "watch";
  if (t.includes("bag") || t.includes("backpack")) return "bag";
  if (t.includes("necklace") || t.includes("bracelet") || t.includes("ring") || t.includes("earring")) return "jewelry";
  if (t.includes("sunglass") || t.includes("glasses")) return "sunglasses";
  return "other";
}

function beltShoesLeatherMatch(belt: Item, shoes: Item): boolean {
  const bc = String(belt.color_family).toLowerCase();
  const sc = String(shoes.color_family).toLowerCase();
  const st = shoes.type.toLowerCase();
  const leatherShoes = st.includes("dress") || st.includes("oxford") || st.includes("loafer") || st.includes("derby") || st.includes("chelsea") || st.includes("brogue");
  if (!leatherShoes) return true;
  const browns = new Set(["brown","earth","tan"]);
  const blacks = new Set(["black"]);
  if (blacks.has(bc) && browns.has(sc)) return false;
  if (browns.has(bc) && blacks.has(sc)) return false;
  return true;
}

function pickAccessories(pool: Item[], occasion: Occasion, tempC: number, shoes: Item, rnd: () => number): Item[] {
  if (rnd() < 0.45) return [];
  const maxCount = (occasion === "work" || occasion === "date" || occasion === "night_out") ? 2 : 1;
  const valid = pool.filter(a => {
    const k = getAccessoryKind(a.type.toLowerCase());
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
    const k = getAccessoryKind(a.type.toLowerCase());
    if (used.has(k)) continue;
    used.add(k);
    picked.push(a);
  }
  return picked;
}

// ════════════════════════════════════════════════════════════════════════════
// LABEL FILTER
// ════════════════════════════════════════════════════════════════════════════
function meetsLabel(label: OutfitLabel, top: Item, bottom: Item, shoes: Item): boolean {
  const colors = [top, bottom, shoes].map(i => String(i.color_family).toLowerCase());
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
  if (tempC >= 5)  return { min: 1, max: 2 };
  return { min: 1, max: 2 };
}

// ════════════════════════════════════════════════════════════════════════════
// WHY
// ════════════════════════════════════════════════════════════════════════════
function buildWhy(occasion: Occasion, top: Item, bottom: Item, shoes: Item, outer?: Item, tempC?: number): string {
  const t = top.type.replace(/_/g, " ");
  const b = bottom.type.replace(/_/g, " ");
  const s = shoes.type.replace(/_/g, " ");
  if (outer && tempC !== undefined && tempC <= 12) {
    const o = outer.type.replace(/_/g, " ");
    return `${Math.round(tempC)}°C jashtë — ${o} mbi ${t} me ${b} dhe ${s}.`;
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

  // ── KATEGORIZIM ───────────────────────────────────────────────────────────
  // STRIKT: items që janë "top" category dhe NUK janë layer-only → mund të jenë standalone top
  // items që janë layer (cdo lloj) → outer pool
  // items që janë inner (jo layer) → inner pool për kur top = hoodie/jacket etc

  const allTops = items.filter(i => i.category === "top" || i.category === "outerwear");
  const allBottoms = items.filter(i => i.category === "bottom");
  const allShoes = items.filter(i => i.category === "shoes");
  const allAccessories = items.filter(i => i.category === "accessory");

  // Standalone tops = items që NUK janë layer-only (jo blazer, jo coat, jo parka)
  // Hoodie mund të jetë standalone — kalon këtu
  // Sweater mund të jetë standalone — kalon këtu
  // Blazer/coat/jacket/parka — NUK standalone (vetëm layer)
  const standaloneTops = allTops.filter(i => {
    if (i.category === "outerwear") return false;
    const t = i.type.toLowerCase();
    if (t.includes("blazer") || t.includes("coat") || t.includes("parka") || t.includes("trench") || t.includes("bomber")) return false;
    if (t.includes("jacket") && !t.includes("track")) return false;
    return true;
  });

  // Inner tops = strict (vetëm tee/polo/shirt/blouse/tank/etc)
  const innerTops = allTops.filter(i => isInnerItem(i));

  // Outer items = strict (vetëm cope që janë layer dhe NUK janë inner)
  const outerItems = allTops.filter(i => isLayerItem(i));

  // ── FILTRO PER TEMP + OCCASION ────────────────────────────────────────────
  const validStandaloneTops = standaloneTops.filter(i => isInTempRange(i, tempC) && isOccasionAllowed(i, occasion));
  const validBottoms = allBottoms.filter(i => isInTempRange(i, tempC) && isOccasionAllowed(i, occasion));
  const validShoes = allShoes.filter(i => isInTempRange(i, tempC) && isOccasionAllowed(i, occasion));
  const validInners = innerTops.filter(i => isInTempRange(i, tempC) && isOccasionAllowed(i, occasion));
  const validOuters = outerItems.filter(i => isInTempRange(i, tempC) && isOuterValidForOccasion(i, occasion));

  // No items
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

  // Wardrobe gap
  if (!validStandaloneTops.length || !validBottoms.length || !validShoes.length) {
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

  const pinnedTop = opts.pinnedTopId ? validStandaloneTops.find(x => x.id === opts.pinnedTopId) ?? null : null;
  const pinnedBottom = opts.pinnedBottomId ? validBottoms.find(x => x.id === opts.pinnedBottomId) ?? null : null;
  const pinnedShoes = opts.pinnedShoesId ? validShoes.find(x => x.id === opts.pinnedShoesId) ?? null : null;
  const { min: minLayers } = getRequiredLayers(tempC, occasion);

  const buildOne = (label: OutfitLabel, excludeHash?: string): Outfit => {
    let best: Outfit | null = null;
    const candidates: Outfit[] = [];
    const seen = new Set<string>();

    for (let attempt = 0; attempt < 300; attempt++) {
      const top = pinnedTop ?? pickOne(validStandaloneTops, rnd);
      const bottom = pinnedBottom ?? pickOne(validBottoms, rnd);
      const shoe = pinnedShoes ?? pickOne(validShoes, rnd);

      // ─── HARD BLACKLIST CHECK ───
      if (isBlacklistedCombo(top, bottom, shoe)) continue;
      if (!meetsLabel(label, top, bottom, shoe)) continue;

      // ─── FORMALITY SPREAD ───
      const spreadNoOuter = getFormalitySpread(top, bottom, shoe);
      if (spreadNoOuter > 2) continue;

      // ─── LAYERING ───
      let outer: Item | undefined = undefined;
      let finalTop = top;
      const needsLayer = minLayers >= 1;
      const wantsLayer = needsLayer || rnd() < 0.35;

      if (wantsLayer && validOuters.length > 0) {
        // KRITIK: nese top eshte hoodie/sweater/etc qe ka edhe is_inner, perdor si inner
        // Por nese top eshte hoodie, atehere s'duhet outer (sepse dual hoodie absurd)
        // Pra: nese top eshte hoodie standalone, mos shto outer fare (përveç jacket te lehtë)
        const topIsHoodie = isHoodieLike(top.type.toLowerCase());

        let innerCandidate: Item | null = null;
        if (isInnerItem(top)) {
          innerCandidate = top;
        } else if (validInners.length > 0) {
          innerCandidate = pickOne(validInners, rnd);
        }

        // Nese top eshte hoodie: outer mund te jete vetem jacket/coat (jo hoodie tjeter, jo blazer)
        if (innerCandidate) {
          const compatibleOuters = validOuters.filter(o => {
            // KRITIK: outer ≠ inner ID
            if (o.id === innerCandidate!.id) return false;
            // canLayerOver siguron qe nuk ka duks mbi duks
            if (!canLayerOver(innerCandidate!, o)) return false;
            if (!isOuterCompatibleWithBottom(o, bottom)) return false;
            // BLACKLIST CHECK ME OUTER
            if (isBlacklistedCombo(innerCandidate!, bottom, shoe, o)) return false;
            return true;
          });

          if (compatibleOuters.length > 0) {
            outer = pickOne(compatibleOuters, rnd);
            finalTop = innerCandidate;
          } else if (topIsHoodie && needsLayer) {
            // hoodie ka ngrohtësi vetë, mund të mos kërkojë outer për 13°C+
            // Nëse temp >= 13, hoodie OK pa outer
            if (tempC < 13) continue; // nën 13°C duhet outer real
          }
        }
      }

      if (needsLayer && !outer) {
        // Toleranco: hoodie/sweater single (te ngrohte) deri ne 5°C
        const finalTopT = finalTop.type.toLowerCase();
        const finalTopWarmEnough = isHoodieLike(finalTopT) || isSweaterKnit(finalTopT);
        if (!finalTopWarmEnough || tempC < 5) continue;
      }

      if (outer) {
        if (!isOuterCompatibleWithBottom(outer, bottom)) continue;
        if (getFormalitySpread(finalTop, bottom, shoe, outer) > 2) continue;
        if (isBlacklistedCombo(finalTop, bottom, shoe, outer)) continue;
      }

      // ─── SCORING ───
      const harmSc = colorScore(finalTop, bottom, shoe, outer);
      if (harmSc === 0) continue;

      const occSc = occasionScore(occasion, finalTop, bottom, shoe);
      let balanceSc = 10;
      const finalSpread = outer ? getFormalitySpread(finalTop, bottom, shoe, outer) : spreadNoOuter;
      if (finalSpread <= 1) balanceSc += 8;
      else if (finalSpread === 2) balanceSc += 3;
      if (outer) balanceSc += 4;

      const lowWearBonus = ((finalTop.wear_count ?? 0) < 3 ? 4 : 0) + ((bottom.wear_count ?? 0) < 3 ? 4 : 0) + ((shoe.wear_count ?? 0) < 3 ? 4 : 0);
      const varietyRand = Math.floor(rnd() * 7);
      const varietySc = lowWearBonus + varietyRand;

      // Vote learning
      const itemIds = [finalTop.id, bottom.id, shoe.id];
      const extractIds = (hashes: string[]): Set<string> => {
        const set = new Set<string>();
        for (const h of hashes) { const parts = h.split(":"); for (let i = 2; i < parts.length; i++) if (parts[i]) set.add(parts[i]); }
        return set;
      };
      const upIds = extractIds(votedUp);
      const downIds = extractIds(votedDown);
      let voteAdj = 0;
      if (upIds.size && itemIds.some(id => upIds.has(id))) voteAdj += 10;
      if (downIds.size && itemIds.some(id => downIds.has(id))) voteAdj -= 15;

      const styleSc = styleScore(style, finalTop, bottom, shoe);
      const accessories = includeAcc ? pickAccessories(allAccessories, occasion, tempC, shoe, rnd) : [];
      if (accessories.length > 0) balanceSc += 2;

      const total = clamp(Math.round(occSc + harmSc + balanceSc + styleSc + varietySc + voteAdj), 0, 100);
      const accIds = accessories.map(a => a.id).join(",");
      const hash = hashStr(`${label}:${occasion}:${finalTop.id}:${bottom.id}:${shoe.id}:${outer?.id ?? ""}:${accIds}`);

      if (excludeHash && hash === excludeHash) continue;
      if (seen.has(hash)) continue;
      seen.add(hash);

      const why = buildWhy(occasion, finalTop, bottom, shoe, outer, tempC);
      const outfit: Outfit = {
        label, occasion, score: total,
        picks: { top: finalTop, bottom, shoes: shoe, outer, accessories: accessories.length ? accessories : undefined },
        breakdown: { occasion: occSc, harmony: harmSc, variety: varietySc, balance: balanceSc, style: styleSc, explanation: why },
        outfit_hash: hash,
        why,
      };
      candidates.push(outfit);
      if (!best || outfit.score > best.score) best = outfit;
    }

    // Top-K rotation
    if (best && candidates.length > 1) {
      const threshold = best.score - 8;
      const topPool = candidates.filter(c => c.score >= threshold).sort((a, b) => b.score - a.score).slice(0, 5);
      if (topPool.length > 1) best = topPool[Math.floor(rnd() * topPool.length)];
    }

    // Fallback i sigurt — kontrolloj blacklist edhe te fallback
    if (!best) {
      // Provoj çdo kombinim derisa gjej një qe NUK eshte blacklist
      for (const t of validStandaloneTops) {
        for (const b of validBottoms) {
          for (const s of validShoes) {
            if (!isBlacklistedCombo(t, b, s)) {
              const why = buildWhy(occasion, t, b, s, undefined, tempC);
              best = {
                label, occasion, score: 40,
                picks: { top: t, bottom: b, shoes: s },
                breakdown: { occasion: 25, harmony: 15, variety: 0, balance: 5 },
                outfit_hash: hashStr(`${label}:${occasion}:${t.id}:${b.id}:${s.id}`),
                why,
              };
              break;
            }
          }
          if (best) break;
        }
        if (best) break;
      }
    }

    // Last resort wardrobe gap
    if (!best) {
      const dummy: Item = { id: "wardrobe-gap-" + label, category: "top", type: "missing", color_family: "neutral" };
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