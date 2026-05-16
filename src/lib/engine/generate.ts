// src/lib/engine/generate.ts
//
// ╔═══════════════════════════════════════════════════════════════════════╗
// ║  OutfitMirror Engine v7 — Professional Stylist Logic                 ║
// ║                                                                       ║
// ║  Rishkrim i plotë. Bazuar në research nga:                            ║
// ║   - Permanent Style (Seven Levels of Formality)                       ║
// ║   - Inside Out Style (Levels of Refinement)                           ║
// ║   - Gentleman's Gazette (The Formality Scale)                         ║
// ║   - The VOU / Lookiero (60-30-10 Color Rule)                          ║
// ║                                                                       ║
// ║  Output: 2 outfits per call (Safe + Colorful).                        ║
// ║  Përdoret nga: AppPageClient, TripPlanner, CoupleMode.                ║
// ╚═══════════════════════════════════════════════════════════════════════╝

import type {
  Item, Occasion, Outfit, OutfitLabel,
  GenerateOptions, Gender,
} from "./types";

// ═════════════════════════════════════════════════════════════════════════
// RANDOMNESS UTILS
// ═════════════════════════════════════════════════════════════════════════

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

// ═════════════════════════════════════════════════════════════════════════
// COLOR PALETTE (60-30-10 Rule)
// ═════════════════════════════════════════════════════════════════════════
// Neutralet janë "buffer" — s'kontaktohen në 3-color rule.
// Loud colors janë warm/cool të theksuar.

const NEUTRAL = new Set([
  "neutral", "black", "white", "grey", "gray", "beige", "brown",
  "navy", "denim", "earth", "tan", "cream", "ivory", "charcoal",
]);
const COOL = new Set(["blue", "green", "purple", "teal", "mint"]);
const WARM = new Set(["red", "orange", "yellow", "pink", "coral", "burgundy", "rust"]);
const DARK = new Set(["black", "navy", "charcoal", "burgundy"]);
const LIGHT = new Set(["white", "cream", "ivory", "beige", "neutral"]);
const BROWNS = new Set(["brown", "tan", "earth", "cognac", "burgundy"]);

// ═════════════════════════════════════════════════════════════════════════
// TYPE DETECTION
// ═════════════════════════════════════════════════════════════════════════
// Helper-at këtu marrin gjithmonë `type` me lowercase.
// Tolerojnë variantet: snake_case, dash, hapësira, shqip (trenerk).

function isAthleticBottom(t: string): boolean {
  return /jogger|sweat|track[-_ ]?pant|athletic[-_ ]?pant|running[-_ ]?pant|trenerk/.test(t) ||
         t.includes("athletic");
}

function isAthleticTop(t: string): boolean {
  return /hoodie|sweatshirt|zip[-_ ]?up|track[-_ ]?jacket/.test(t);
}

function isSleevelessTop(t: string): boolean {
  return /tank|sleeveless|crop/.test(t);
}

function isSmartTop(t: string): boolean {
  // Përjashto sweatshirt (që ka "shirt" si substring por është athletic)
  if (/sweatshirt/.test(t)) return false;
  return /(?:^|[-_ ])shirt|blazer|polo|blouse|dress[-_ ]?shirt|button[-_ ]?down|oxford[-_ ]?shirt/.test(t);
}

function isFormalShoe(t: string): boolean {
  return /oxford|derby|dress[-_ ]?shoe|brogue|monk/.test(t);
}

function isDressyShoe(t: string): boolean {
  return isFormalShoe(t) || /loafer|chelsea|heel|pump|ballet|mule/.test(t);
}

function isAthleticShoe(t: string): boolean {
  return /running|trainer|performance|athletic[-_ ]?shoe/.test(t);
}

function isCanvasSneaker(t: string): boolean {
  return /canvas/.test(t);
}

function isLeatherSneaker(t: string): boolean {
  return /leather[-_ ]?sneaker|white[-_ ]?sneaker/.test(t);
}

function isClosedOuterwear(t: string): boolean {
  // Closed = jacket-tip që nënkupton mot të ftohtë + nuk pajtohet me shorts.
  // Pullover-at (hoodie/sweater/cardigan) NUK janë closed — i mban shorts në rregull.
  if (/track[-_ ]?jacket/.test(t)) return false;
  return /blazer|coat|parka|trench|bomber/.test(t) || /(?:^|[-_ ])jacket/.test(t);
}

function isShorts(t: string): boolean {
  return t.includes("shorts");
}

function isFormalBottom(t: string): boolean {
  return /trouser|dress[-_ ]?pant|suit[-_ ]?pant|wide[-_ ]?leg/.test(t);
}

function isJeans(t: string): boolean {
  return /jean|denim/.test(t);
}

function isChino(t: string): boolean {
  return t.includes("chino");
}

function isCargo(t: string): boolean {
  return t.includes("cargo");
}

function isPulloverOuter(t: string): boolean {
  return /hoodie|sweater|cardigan|sweatshirt|knit|crewneck/.test(t);
}

// ═════════════════════════════════════════════════════════════════════════
// FORMALITY TIERS (1-5)
// ═════════════════════════════════════════════════════════════════════════
// 5 = formal evening (tuxedo, dress shirt, oxford)
// 4 = business (blazer, dress trousers, loafers/heels)
// 3 = smart casual (shirt, polo, knit, chinos, chelsea, leather sneaker)
// 2 = casual (tee, jeans, jacket, canvas sneaker)
// 1 = athletic (joggers, hoodie, sweatshirt, running shoes)
//
// Inside Out Style: "Levels 1 and 3 don't mix" → spread > 3 (tier 1 + 5) = reject.
// Bonus i fortë për spread ≤ 1 (coherent outfit).

type Tier = 1 | 2 | 3 | 4 | 5;

function tierTop(t: string): Tier {
  if (t.includes("tuxedo")) return 5;
  if (/dress[-_ ]?shirt|tuxedo[-_ ]?shirt/.test(t)) return 4;
  if (/blazer|trench|overcoat|peacoat|suit[-_ ]?jacket|sport[-_ ]?coat/.test(t)) return 4;
  if (isSmartTop(t)) return 3;
  if (/sweater|knit|cardigan|crewneck|henley|blouse|coat/.test(t)) return 3;
  if (/tee|t[-_ ]?shirt/.test(t)) return 2;
  if (/(?:^|[-_ ])jacket/.test(t) && !isAthleticTop(t)) return 2;
  if (t.includes("crop")) return 2;
  if (isAthleticTop(t)) return 1;
  if (isSleevelessTop(t)) return 1;
  return 2;
}

function tierBottom(t: string): Tier {
  if (t.includes("tuxedo")) return 5;
  if (isFormalBottom(t)) return 4;
  if (isChino(t) || t.includes("midi")) return 3;
  if (isJeans(t) || isCargo(t) || isShorts(t) || /mini|skirt/.test(t)) return 2;
  if (isAthleticBottom(t) || t.includes("legging")) return 1;
  return 2;
}

function tierShoes(t: string): Tier {
  if (isFormalShoe(t)) return 5;
  if (/loafer|monk|heel|pump/.test(t)) return 4;
  if (/chelsea|ankle[-_ ]?boot|ballet|flat|mule/.test(t)) return 3;
  if (isLeatherSneaker(t)) return 3;
  if (t.includes("boot")) return 3;
  if (isCanvasSneaker(t)) return 2;
  if (t.includes("sneaker")) return 2;
  if (t.includes("sandal")) return 2;
  if (isAthleticShoe(t)) return 1;
  if (t.includes("flip")) return 1;
  return 2;
}

function getOutfitTiers(p: { top: Item; bottom: Item; shoes: Item; outer?: Item }): number[] {
  const tiers: number[] = [
    tierTop(p.top.type.toLowerCase()),
    tierBottom(p.bottom.type.toLowerCase()),
    tierShoes(p.shoes.type.toLowerCase()),
  ];
  if (p.outer) tiers.push(tierTop(p.outer.type.toLowerCase()));
  return tiers;
}

function formalitySpread(p: { top: Item; bottom: Item; shoes: Item; outer?: Item }): number {
  const tiers = getOutfitTiers(p);
  return Math.max(...tiers) - Math.min(...tiers);
}

// ═════════════════════════════════════════════════════════════════════════
// TEMPERATURE
// ═════════════════════════════════════════════════════════════════════════
// Bazuar në research: NNine, The Chic Tribe, My Jewellery.
// Ladder: temp (°C) → band → layer count.

type TempBand =
  | "extreme_hot" | "hot" | "warm" | "comfort"
  | "cool" | "cold" | "very_cold" | "extreme_cold";

function getTempBand(c: number): TempBand {
  if (c >= 30) return "extreme_hot";
  if (c >= 25) return "hot";
  if (c >= 22) return "warm";
  if (c >= 18) return "comfort";
  if (c >= 13) return "cool";
  if (c >= 5)  return "cold";
  if (c >= 0)  return "very_cold";
  return "extreme_cold";
}

function getRequiredLayers(c: number, occasion: Occasion): { min: number; max: number } {
  if (occasion === "gym") return { min: 0, max: 0 };
  const b = getTempBand(c);
  switch (b) {
    case "extreme_hot":
    case "hot":         return { min: 0, max: 0 };
    case "warm":        return { min: 0, max: 1 };
    case "comfort":     return { min: 0, max: 1 };
    case "cool":        return { min: 1, max: 1 };
    case "cold":        return { min: 1, max: 2 };
    case "very_cold":
    case "extreme_cold": return { min: 2, max: 2 };
  }
}

function isTopAllowedForTemp(t: string, c: number): boolean {
  const band = getTempBand(c);
  if (band === "extreme_hot" || band === "hot") {
    // ≥25°C: pa layer/heavy fabric
    if (/hoodie|sweater|coat|crewneck|henley|cardigan|knit|parka|sweatshirt|fleece|wool/.test(t)) return false;
    if (isClosedOuterwear(t)) return false;
  }
  if (band === "warm") {
    if (/coat|parka|trench|fleece|wool/.test(t)) return false;
  }
  if (band === "cold" || band === "very_cold" || band === "extreme_cold") {
    if (isSleevelessTop(t)) return false;
  }
  return true;
}

function isBottomAllowedForTemp(t: string, c: number): boolean {
  const band = getTempBand(c);
  if (band === "cold" || band === "very_cold" || band === "extreme_cold") {
    if (isShorts(t) || t.includes("mini")) return false;
  }
  if (band === "extreme_hot" && /wool|heavy|flannel/.test(t)) return false;
  return true;
}

function isShoesAllowedForTemp(t: string, c: number): boolean {
  const band = getTempBand(c);
  if (band === "cold" || band === "very_cold" || band === "extreme_cold") {
    if (/sandal|flip|mule/.test(t)) return false;
  }
  if (band === "extreme_hot") {
    if (t.includes("boot") && !/chelsea|ankle/.test(t)) return false;
  }
  return true;
}

// ═════════════════════════════════════════════════════════════════════════
// HARD BLACKLIST — Combinations që janë GJITHMONË gabim
// ═════════════════════════════════════════════════════════════════════════
// Këto JANË rregulla absolute — të kontrolluara para të gjitha të tjerave.
// Aplikohen edhe te fallback (që mos del kombinim absurd nën asnjë rrethanë).

function isBlacklisted(
  top: Item, bottom: Item, shoes: Item,
  occasion: Occasion, tempC: number,
): boolean {
  const t = top.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const s = shoes.type.toLowerCase();

  // ── UNIVERSAL ABSURD COMBOS ────────────────────────────────────────
  // Closed outerwear (jacket/coat/blazer/parka/bomber/trench) + shorts
  // = kontradiktë moti (jacket nënkupton ftohtë, shorts nxehtë).
  if (isClosedOuterwear(t) && isShorts(b)) return true;

  // Smart top (shirt/blazer/polo/blouse) + athletic bottom = formality clash
  if (isSmartTop(t) && isAthleticBottom(b)) return true;

  // Athletic top (hoodie/sweatshirt/zip-up) + formal bottom
  if (isAthleticTop(t) && isFormalBottom(b)) return true;

  // Athletic shoes (running) + formal bottom (trouser/dress_pant)
  if (isAthleticShoe(s) && isFormalBottom(b)) return true;

  // Dress shoes + athletic bottom
  if (isFormalShoe(s) && isAthleticBottom(b)) return true;

  // Flip-flops jashtë casual/travel
  if (s.includes("flip") && occasion !== "casual" && occasion !== "travel") return true;

  // ── WORK ───────────────────────────────────────────────────────────
  if (occasion === "work") {
    if (isAthleticTop(t)) return true;
    if (isAthleticBottom(b)) return true;
    if (isSleevelessTop(t)) return true;
    if (isShorts(b)) return true;
    if (isCargo(b)) return true;
    if (s.includes("sandal") || s.includes("flip")) return true;
    if (isAthleticShoe(s)) return true;
    if (isCanvasSneaker(s)) return true;
  }

  // ── DATE / NIGHT_OUT ───────────────────────────────────────────────
  if (occasion === "date" || occasion === "night_out") {
    if (isAthleticBottom(b)) return true;
    if (isCargo(b)) return true;
    if (s.includes("flip")) return true;
    if (isAthleticShoe(s)) return true;
    if (occasion === "night_out") {
      if (t.includes("hoodie")) return true;
      if (isShorts(b)) return true;
    }
    if (occasion === "date" && isShorts(b) && tempC < 22) return true;
  }

  // ── GYM — VETËM athletic gear ──────────────────────────────────────
  if (occasion === "gym") {
    const okTop = /tee|t[-_ ]?shirt/.test(t) || isSleevelessTop(t) || isAthleticTop(t) ||
                  /performance|athletic|sports[-_ ]?bra/.test(t);
    if (!okTop) return true;

    const okBottom = isAthleticBottom(b) || b.includes("legging") ||
                     (isShorts(b) && !isCargo(b) && !isJeans(b) && !isFormalBottom(b));
    if (!okBottom) return true;

    const okShoe = isAthleticShoe(s) ||
                   (s.includes("sneaker") && !isFormalShoe(s) && !isLeatherSneaker(s) && !isCanvasSneaker(s));
    if (!okShoe) return true;

    if (isClosedOuterwear(t)) return true;
    if (isSmartTop(t)) return true;
  }

  // ── TRAVEL ─────────────────────────────────────────────────────────
  if (occasion === "travel") {
    if (t.includes("blazer")) return true;
    if (isFormalShoe(s)) return true;
  }

  return false;
}

// ═════════════════════════════════════════════════════════════════════════
// OCCASION VALIDATION (positive rules + dependencies)
// ═════════════════════════════════════════════════════════════════════════
// Validimi pozitiv: çfarë DUHET të ketë outfit-i për occasion-in.
// Negativi është te isBlacklisted; këtu vetëm pozitivet.

function isValid(
  occasion: Occasion, top: Item, bottom: Item, shoes: Item,
  tempC: number, gender: Gender,
): boolean {
  const t = top.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const s = shoes.type.toLowerCase();

  // Temperature gating
  if (!isTopAllowedForTemp(t, tempC)) return false;
  if (!isBottomAllowedForTemp(b, tempC)) return false;
  if (!isShoesAllowedForTemp(s, tempC)) return false;

  // Hard blacklist
  if (isBlacklisted(top, bottom, shoes, occasion, tempC)) return false;

  // Per-occasion positive requirements
  if (occasion === "work") {
    const goodTop = isSmartTop(t) ||
                    /sweater|crewneck|knit|henley|polo|tee/.test(t);
    if (!goodTop) return false;
    const goodBottom = isChino(b) || isFormalBottom(b) ||
                       (isJeans(b) && !b.includes("light"));
    if (!goodBottom) return false;
    const goodShoe = isDressyShoe(s) || isLeatherSneaker(s);
    if (!goodShoe) return false;
  }

  if (occasion === "date") {
    const goodTop = isSmartTop(t) || /sweater|crewneck|knit|henley|tee/.test(t);
    if (!goodTop) return false;
    const goodShoe = isDressyShoe(s) || isLeatherSneaker(s) || s.includes("boot");
    if (!goodShoe) return false;
  }

  if (occasion === "night_out") {
    const goodTop = isSmartTop(t) || /sweater|knit|tee/.test(t);
    if (!goodTop) return false;
    const goodShoe = isDressyShoe(s) || s.includes("boot") || isLeatherSneaker(s);
    if (!goodShoe) return false;
  }

  if (occasion === "casual") {
    // Casual është më liberal — vetëm baset.
    // Sandals + jeans = mismatch i njohur
    if (s.includes("sandal") && isJeans(b)) return false;
    if (t.includes("blazer") && isAthleticBottom(b)) return false;
  }

  if (occasion === "travel") {
    if (gender === "female" && s.includes("heel") && !/kitten|block/.test(s)) return false;
  }

  if (occasion === "gym") {
    // Pozitivet janë në isBlacklisted (që mban okTop/okBottom/okShoe).
    // Asgjë e ndryshme këtu.
  }

  // Universal formality cohesion (spread > 3 = absurd)
  const spread = formalitySpread({ top, bottom, shoes });
  if (spread > 3) return false;

  return true;
}

// ═════════════════════════════════════════════════════════════════════════
// LAYERING
// ═════════════════════════════════════════════════════════════════════════

function canLayer(inner: Item, outer: Item): boolean {
  const i = inner.type.toLowerCase();
  const o = outer.type.toLowerCase();
  if (i === o) return false;
  const validInner = /tee|polo|(?:^|[-_ ])shirt|tank|blouse|crop|knit|henley|bodysuit/.test(i) &&
                     !isClosedOuterwear(i);
  const validOuter = /blazer|jacket|hoodie|sweater|crewneck|cardigan|coat|parka/.test(o);
  return validInner && validOuter;
}

function isOuterValidForOccasion(outerType: string, occasion: Occasion): boolean {
  const o = outerType.toLowerCase();
  if (occasion === "work") {
    if (o.includes("hoodie")) return false;
    if (o.includes("parka")) return false;
    // Plain jacket (jo blazer/sport-coat) = shumë casual për work
    if (o.includes("jacket") && !o.includes("blazer") && !o.includes("sport")) return false;
    return true;
  }
  if (occasion === "date" || occasion === "night_out") {
    if (o.includes("hoodie")) return false;
    if (o.includes("parka")) return false;
    return true;
  }
  if (occasion === "gym") return false;
  return true;
}

function isOuterCompatibleWithBottom(outer: Item, bottom: Item, occasion: Occasion): boolean {
  const o = outer.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  // Closed outerwear + shorts = absurd (e mbulon edhe te blacklist por dupla siguri)
  if (isClosedOuterwear(o) && isShorts(b)) return false;
  // Blazer/coat + athletic bottom
  if ((o.includes("blazer") || o.includes("coat")) && isAthleticBottom(b)) return false;
  // Për work/date/night_out: çdo outer me athletic bottom = jo
  if ((occasion === "work" || occasion === "date" || occasion === "night_out") &&
      isAthleticBottom(b)) return false;
  return true;
}

// ═════════════════════════════════════════════════════════════════════════
// COLOR SCORING (max 38, 60-30-10 inspired)
// ═════════════════════════════════════════════════════════════════════════

function colorScore(p: { top: Item; bottom: Item; shoes: Item; outer?: Item }): number {
  const items = [p.top, p.bottom, p.shoes, ...(p.outer ? [p.outer] : [])];
  const colors = items.map(i => String(i.color_family).toLowerCase());

  // Max 2 loud colors (3+ = visual chaos)
  const loud = colors.filter(c => !NEUTRAL.has(c));
  const uniqueLoud = new Set(loud).size;
  if (uniqueLoud > 2) return 0; // REJECT

  const tc = String(p.top.color_family).toLowerCase();
  const bc = String(p.bottom.color_family).toLowerCase();
  const sc = String(p.shoes.color_family).toLowerCase();
  const oc = p.outer ? String(p.outer.color_family).toLowerCase() : null;

  let score = 0;

  // Bazë: më pak loud = më koherent
  if (loud.length === 0)      score += 30;
  else if (loud.length === 1) score += 26;
  else                        score += 14;

  // Monokromatik = sofistikim
  const uniqueAll = new Set([tc, bc, sc, ...(oc ? [oc] : [])]).size;
  if (uniqueAll === 1) score += 8;
  else if (uniqueAll === 2 && colors.filter(c => NEUTRAL.has(c)).length >= 2) score += 4;

  // Neutral shoes = klasik anchor
  if (NEUTRAL.has(sc)) score += 6;

  // Warm/cool harmoni
  if (COOL.has(tc) && COOL.has(bc)) score += 5;
  if (WARM.has(tc) && WARM.has(bc)) score += 4;

  // Warm/cool clash pa neutral buffer
  const hasBuffer = NEUTRAL.has(sc) || (oc !== null && NEUTRAL.has(oc));
  if (COOL.has(tc) && WARM.has(bc) && !hasBuffer) score -= 12;
  if (WARM.has(tc) && COOL.has(bc) && !hasBuffer) score -= 12;

  // Light/dark contrast (klasike)
  if ((LIGHT.has(tc) && DARK.has(bc)) || (DARK.has(tc) && LIGHT.has(bc))) score += 6;

  // Same loud color top/bottom = jo tonal, mungesë depth
  if (tc === bc && !NEUTRAL.has(tc)) score -= 8;

  // Black + brown classical clash
  if (tc === "black" && BROWNS.has(bc)) score -= 3;
  if (BROWNS.has(tc) && bc === "black") score -= 3;

  return clamp(score, 0, 38);
}

// ═════════════════════════════════════════════════════════════════════════
// OCCASION SCORING (max 50)
// ═════════════════════════════════════════════════════════════════════════

function occasionScore(
  occasion: Occasion,
  p: { top: Item; bottom: Item; shoes: Item; outer?: Item },
  gender: Gender,
): number {
  const t = p.top.type.toLowerCase();
  const b = p.bottom.type.toLowerCase();
  const s = p.shoes.type.toLowerCase();
  const tc = String(p.top.color_family).toLowerCase();
  const bc = String(p.bottom.color_family).toLowerCase();
  const outerLow = p.outer ? p.outer.type.toLowerCase() : "";
  let score = 20;

  if (gender === "male") {
    if (occasion === "work") {
      if (t.includes("blazer") || outerLow.includes("blazer")) score += 14;
      else if (isSmartTop(t)) score += 10;
      else if (/sweater|crewneck|knit/.test(t)) score += 8;
      else if (t.includes("tee")) score += 3;
      if (isFormalBottom(b)) score += 12;
      else if (isChino(b)) score += 10;
      else if (isJeans(b)) score += 5;
      if (isFormalShoe(s)) score += 12;
      else if (/loafer|chelsea/.test(s)) score += 10;
      else if (isLeatherSneaker(s)) score += 6;
    }
    if (occasion === "date") {
      if (/chelsea|boot|loafer|dress[-_ ]?shoe|leather[-_ ]?sneaker/.test(s)) score += 12;
      if (isSmartTop(t)) score += 10;
      else if (/polo|sweater|blazer/.test(t)) score += 8;
      else if (t.includes("tee")) score += 5;
      if (isChino(b) || isFormalBottom(b)) score += 8;
      else if (isJeans(b)) score += 6;
    }
    if (occasion === "casual") {
      if (/sneaker|loafer|boot/.test(s)) score += 10;
      if (/tee|polo|henley|shirt/.test(t)) score += 8;
      if (isJeans(b) || isChino(b) || isShorts(b)) score += 8;
    }
    if (occasion === "night_out") {
      if (DARK.has(tc) || DARK.has(bc)) score += 10;
      if (/chelsea|boot|dress[-_ ]?shoe|loafer/.test(s)) score += 12;
      else if (isLeatherSneaker(s)) score += 6;
      if (/shirt|blazer/.test(t)) score += 10;
    }
    if (occasion === "travel") {
      if (/sneaker|loafer|boot/.test(s)) score += 10;
      if (/tee|polo|shirt|henley/.test(t)) score += 8;
      if (isJeans(b) || isChino(b) || isCargo(b)) score += 8;
    }
    if (occasion === "gym") {
      if (isAthleticShoe(s)) score += 14;
      else if (s.includes("sneaker")) score += 8;
      if (isAthleticBottom(b) || isShorts(b)) score += 14;
      if (/tee|t[-_ ]?shirt/.test(t) || isSleevelessTop(t) || isAthleticTop(t)) score += 12;
    }
  } else {
    // FEMALE
    if (occasion === "work") {
      if (t.includes("blazer") || t.includes("blouse")) score += 14;
      else if (isSmartTop(t) || /knit|sweater/.test(t)) score += 10;
      else if (t.includes("tee")) score += 4;
      if (isFormalBottom(b) || b.includes("midi")) score += 12;
      else if (isJeans(b)) score += 5;
      if (/heel|pump/.test(s)) score += 12;
      else if (/loafer|ballet|flat/.test(s)) score += 10;
      else if (s.includes("boot")) score += 8;
    }
    if (occasion === "date") {
      if (/heel|mule|ankle[-_ ]?boot|chelsea/.test(s)) score += 14;
      else if (s.includes("boot")) score += 10;
      if (DARK.has(tc) || DARK.has(bc)) score += 6;
      if (/midi|mini|skirt|dress/.test(b)) score += 10;
    }
    if (occasion === "casual") {
      if (/sneaker|flat|ballet/.test(s)) score += 10;
      if (/tee|knit|crop|blouse/.test(t)) score += 8;
      if (isJeans(b) || /skirt|midi/.test(b)) score += 8;
    }
    if (occasion === "night_out") {
      if (/heel|mule/.test(s)) score += 16;
      else if (s.includes("boot")) score += 10;
      if (DARK.has(tc) || DARK.has(bc)) score += 10;
      if (/mini|midi/.test(b)) score += 10;
    }
    if (occasion === "travel") {
      if (/sneaker|loafer|flat/.test(s)) score += 10;
      if (/tee|blouse|knit/.test(t)) score += 8;
      if (isJeans(b) || isFormalBottom(b) || b.includes("midi")) score += 8;
    }
    if (occasion === "gym") {
      if (isAthleticShoe(s)) score += 14;
      if (b.includes("legging") || isAthleticBottom(b) || isShorts(b)) score += 14;
      if (/tee|crop|tank|sports/.test(t)) score += 12;
    }
  }

  return clamp(score, 0, 50);
}

// ═════════════════════════════════════════════════════════════════════════
// STYLE SCORING (max 20)
// ═════════════════════════════════════════════════════════════════════════

function styleScore(
  style: string,
  p: { top: Item; bottom: Item; shoes: Item; outer?: Item },
): number {
  const t = p.top.type.toLowerCase();
  const b = p.bottom.type.toLowerCase();
  const s = p.shoes.type.toLowerCase();
  const tc = String(p.top.color_family).toLowerCase();
  const bc = String(p.bottom.color_family).toLowerCase();
  const sc = String(p.shoes.color_family).toLowerCase();
  let score = 0;

  if (style === "minimal") {
    if ([tc, bc, sc].every(c => NEUTRAL.has(c))) score += 16;
    if (/tee|shirt|knit/.test(t)) score += 4;
    if (isChino(b) || isFormalBottom(b) || isJeans(b)) score += 4;
    if (/loafer|sneaker|chelsea/.test(s)) score += 4;
  }
  if (style === "streetwear") {
    if (isAthleticTop(t) || t.includes("tee")) score += 8;
    if (isCargo(b) || isAthleticBottom(b) || isJeans(b)) score += 8;
    if (/sneaker|running/.test(s)) score += 8;
  }
  if (style === "smart_casual") {
    if (/polo|shirt|blazer|crewneck|knit/.test(t)) score += 10;
    if (isChino(b) || isFormalBottom(b) || isJeans(b)) score += 8;
    if (/loafer|chelsea|leather[-_ ]?sneaker/.test(s)) score += 8;
  }
  if (style === "classic") {
    if (/blazer|shirt|polo/.test(t)) score += 12;
    if (isFormalBottom(b) || isChino(b)) score += 12;
    if (isFormalShoe(s) || /loafer|chelsea/.test(s)) score += 12;
  }
  if (style === "sporty") {
    if (/tee|tank|hoodie|sweatshirt/.test(t)) score += 8;
    if (isAthleticBottom(b) || isShorts(b)) score += 8;
    if (isAthleticShoe(s) || s.includes("sneaker")) score += 10;
  }

  return clamp(score, 0, 20);
}

// ═════════════════════════════════════════════════════════════════════════
// ACCESSORIES
// ═════════════════════════════════════════════════════════════════════════

type AccessoryKind =
  | "belt" | "tie" | "scarf" | "hat" | "watch"
  | "bag" | "jewelry" | "sunglasses" | "other";

function getAccessoryKind(t: string): AccessoryKind {
  if (t.includes("belt")) return "belt";
  if (t === "tie" || /bowtie|bow[-_ ]?tie|necktie/.test(t) || /(?:^|[-_ ])tie(?:$|[-_ ])/.test(t)) return "tie";
  if (t.includes("scarf")) return "scarf";
  if (/hat|cap|beanie/.test(t)) return "hat";
  if (t.includes("watch")) return "watch";
  if (/bag|backpack|clutch/.test(t)) return "bag";
  if (/necklace|bracelet|ring|earring|jewel/.test(t)) return "jewelry";
  if (/sunglass|glasses/.test(t)) return "sunglasses";
  return "other";
}

function beltShoesLeatherMatch(belt: Item, shoes: Item): boolean {
  const bc = String(belt.color_family).toLowerCase();
  const sc = String(shoes.color_family).toLowerCase();
  const bt = belt.type.toLowerCase();
  const st = shoes.type.toLowerCase();

  const leatherShoes = /dress|oxford|loafer|derby|chelsea|brogue|monk/.test(st);
  const leatherBelt = /leather|dress/.test(bt);
  if (!leatherShoes && !leatherBelt) return true; // s'ka rregull për canvas/woven

  const blacks = new Set(["black"]);

  if (blacks.has(bc) && blacks.has(sc)) return true;
  if (BROWNS.has(bc) && BROWNS.has(sc)) return true;

  // Neutralet (jo black/brown) janë në rregull
  if (NEUTRAL.has(bc) && !blacks.has(bc) && !BROWNS.has(bc)) return true;
  if (NEUTRAL.has(sc) && !blacks.has(sc) && !BROWNS.has(sc)) return true;

  // Black ↔ brown mismatch = REJECT
  if ((blacks.has(bc) && BROWNS.has(sc)) || (BROWNS.has(bc) && blacks.has(sc))) return false;

  return true;
}

function isAccessoryValid(kind: AccessoryKind, occasion: Occasion, tempC: number): boolean {
  if (kind === "tie") return occasion === "work" || occasion === "date" || occasion === "night_out";
  if (kind === "scarf") return tempC < 15;
  if (kind === "hat") return occasion !== "work";
  return true;
}

function pickAccessories(
  pool: Item[], occasion: Occasion, tempC: number, shoes: Item, rnd: () => number,
): Item[] {
  // 45% chance pa accessories për natyralitet
  if (rnd() < 0.45) return [];

  const max = (occasion === "work" || occasion === "date" || occasion === "night_out") ? 2 : 1;

  const valid = pool.filter(a => {
    const k = getAccessoryKind(a.type.toLowerCase());
    if (!isAccessoryValid(k, occasion, tempC)) return false;
    if (k === "belt" && !beltShoesLeatherMatch(a, shoes)) return false;
    return true;
  });
  if (valid.length === 0) return [];

  const target = 1 + Math.floor(rnd() * max);
  const actualTarget = Math.min(target, max, valid.length);

  const picked: Item[] = [];
  const usedKinds = new Set<AccessoryKind>();
  const shuffled = [...valid].sort(() => rnd() - 0.5);

  for (const a of shuffled) {
    if (picked.length >= actualTarget) break;
    const k = getAccessoryKind(a.type.toLowerCase());
    if (usedKinds.has(k)) continue;
    usedKinds.add(k);
    picked.push(a);
  }
  return picked;
}

// ═════════════════════════════════════════════════════════════════════════
// VARIETY (wear_count + noise)
// ═════════════════════════════════════════════════════════════════════════

function varietyScore(
  p: { top: Item; bottom: Item; shoes: Item; outer?: Item },
  rnd: () => number,
): number {
  const bonus = (it?: Item) => (it && (it.wear_count ?? 0) < 3 ? 4 : 0);
  return bonus(p.top) + bonus(p.bottom) + bonus(p.shoes) + bonus(p.outer) + Math.floor(rnd() * 7);
}

// ═════════════════════════════════════════════════════════════════════════
// VOTE LEARNING
// ═════════════════════════════════════════════════════════════════════════

function extractVotedItemIds(hashes: string[]): Set<string> {
  const set = new Set<string>();
  for (const h of hashes) {
    const parts = h.split(":");
    for (let i = 2; i < parts.length; i++) if (parts[i]) set.add(parts[i]);
  }
  return set;
}

function voteScore(
  p: { top: Item; bottom: Item; shoes: Item },
  upIds: Set<string>, downIds: Set<string>,
): number {
  const ids = [p.top.id, p.bottom.id, p.shoes.id];
  let s = 0;
  if (upIds.size > 0 && ids.some(id => upIds.has(id))) s += 10;
  if (downIds.size > 0 && ids.some(id => downIds.has(id))) s -= 15;
  return s;
}

// ═════════════════════════════════════════════════════════════════════════
// WHY / EXPLANATION BUILDERS
// ═════════════════════════════════════════════════════════════════════════

function buildWhy(
  occasion: Occasion,
  p: { top: Item; bottom: Item; shoes: Item; outer?: Item },
  score: number, tempC: number,
): string {
  const t = p.top.type.replace(/_/g, " ");
  const b = p.bottom.type.replace(/_/g, " ");
  const s = p.shoes.type.replace(/_/g, " ");
  const tc = p.top.color_family;
  const bc = p.bottom.color_family;
  const loud = [tc, bc, String(p.shoes.color_family)].filter(c => !NEUTRAL.has(String(c).toLowerCase())).length;

  if (p.outer) {
    const o = p.outer.type.replace(/_/g, " ");
    if (tempC <= 12) return `${Math.round(tempC)}°C outside — ${o} over ${t} with ${b} and ${s}. Layered and weather-ready.`;
    return `${o} over ${t} with ${b} and ${s} — polished layering without overdoing it.`;
  }

  if (score >= 88) {
    if (loud === 0) return `All-neutral palette — ${t} + ${b} + ${s} is a stylist-proof formula.`;
    return `One color accent keeps the look intentional — ${t} + ${b} + ${s}.`;
  }

  const lines: Record<Occasion, string> = {
    work:      `${t} + ${b} hits the sweet spot — polished but approachable.`,
    date:      `${s} elevates the look; ${t} + ${b} reads intentional.`,
    casual:    `Relaxed but deliberate — the palette is harmonious.`,
    night_out: `Dark tones + ${s} = sharp evening look.`,
    travel:    `Comfortable, versatile, put-together.`,
    gym:       `Functional and clean — ${s} is the right call for performance.`,
  };
  return lines[occasion] ?? `${tc} + ${bc} — balanced palette.`;
}

function buildLayerExplanation(tempC: number, outer: Item, occasion: Occasion): string {
  const o = outer.type.replace(/_/g, " ");
  const band = getTempBand(tempC);
  if (band === "cool") return `${Math.round(tempC)}°C — a ${o} is the right call.`;
  if (band === "cold") return `${Math.round(tempC)}°C — layering with a ${o} keeps you warm.`;
  if (band === "very_cold" || band === "extreme_cold") return `${Math.round(tempC)}°C — ${o} is essential in this cold.`;
  if (occasion === "work") return `A ${o} completes the professional look.`;
  if (occasion === "date") return `A ${o} elevates the outfit for the evening.`;
  return `The ${o} adds polish.`;
}

// ═════════════════════════════════════════════════════════════════════════
// LABEL FILTER (Safe / Colorful)
// ═════════════════════════════════════════════════════════════════════════

function meetsLabel(
  label: OutfitLabel,
  p: { top: Item; bottom: Item; shoes: Item; outer?: Item },
): boolean {
  const colors = [p.top, p.bottom, p.shoes, ...(p.outer ? [p.outer] : [])]
    .map(i => String(i.color_family).toLowerCase());
  const loudCount = colors.filter(c => !NEUTRAL.has(c)).length;
  if (label === "Safe")     return loudCount <= 1;
  if (label === "Colorful") return loudCount >= 1;
  return true;
}

// ═════════════════════════════════════════════════════════════════════════
// FALLBACK (3-phase, kurrë absurd)
// ═════════════════════════════════════════════════════════════════════════
// Nëse 250 attempts s'gjejnë outfit valid (wardrobe gap), zbutim:
//   Faza 1: full isValid
//   Faza 2: pa occasion-strict, vetëm temp + blacklist
//   Faza 3: vetëm pa blacklist (kurrë mos lësho absurd!)
// Nëse asgjë → score 25 + why "Add appropriate items".

function fallbackOutfit(
  label: OutfitLabel, occasion: Occasion, tempC: number, gender: Gender,
  topsPool: Item[], bottomsPool: Item[], shoesPool: Item[],
  rnd: () => number,
  accessoryPool: Item[], includeAccessories: boolean,
): Outfit {
  let pickedTop = topsPool[0];
  let pickedBottom = bottomsPool[0];
  let pickedShoes = shoesPool[0];

  const phases: Array<(t: Item, b: Item, s: Item) => boolean> = [
    (t, b, s) => isValid(occasion, t, b, s, tempC, gender),
    (t, b, s) =>
      !isBlacklisted(t, b, s, occasion, tempC) &&
      isTopAllowedForTemp(t.type.toLowerCase(), tempC) &&
      isBottomAllowedForTemp(b.type.toLowerCase(), tempC) &&
      isShoesAllowedForTemp(s.type.toLowerCase(), tempC),
    (t, b, s) => !isBlacklisted(t, b, s, occasion, tempC),
  ];

  let found = false;
  for (const accept of phases) {
    for (const t of topsPool) {
      for (const b of bottomsPool) {
        for (const s of shoesPool) {
          if (accept(t, b, s)) {
            pickedTop = t; pickedBottom = b; pickedShoes = s;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
    if (found) break;
  }

  const occasionLabel: Record<Occasion, string> = {
    work: "work", date: "date night", casual: "casual",
    night_out: "a night out", travel: "travel", gym: "the gym",
  };
  const finalScore = found ? 50 : 25;
  const why = found
    ? buildWhy(occasion, { top: pickedTop, bottom: pickedBottom, shoes: pickedShoes }, 50, tempC)
    : `Your wardrobe is missing pieces for ${occasionLabel[occasion]}. Add appropriate items to get a better outfit.`;

  const fbAccessories = (found && includeAccessories)
    ? pickAccessories(accessoryPool, occasion, tempC, pickedShoes, rnd)
    : [];

  return {
    label, occasion, score: finalScore,
    picks: {
      top: pickedTop, bottom: pickedBottom, shoes: pickedShoes,
      accessories: fbAccessories.length ? fbAccessories : undefined,
    },
    breakdown: { occasion: 25, harmony: 17, variety: 0, balance: 8 },
    outfit_hash: hashStr(`${label}:${occasion}:${pickedTop.id}:${pickedBottom.id}:${pickedShoes.id}`),
    why,
  };
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═════════════════════════════════════════════════════════════════════════

export function generateOutfits(
  items: Item[],
  occasion: Occasion,
  seed: number,
  opts: GenerateOptions = {},
): Outfit[] {
  const rnd = mulberry32(seed);
  const gender: Gender = opts.gender ?? "male";
  const style = opts.style ??
    (typeof window !== "undefined" ? (localStorage.getItem("om_style") ?? "minimal") : "minimal");

  // Temperatura: nga opts (trip planner kalon forecast) → ose localStorage → default 20°C.
  const tempC = opts.tempC ??
    (typeof window !== "undefined" ? parseFloat(localStorage.getItem("om_weather_temp") ?? "20") : 20);

  const includeAccessories = opts.includeAccessories ?? true;
  const upIds   = extractVotedItemIds(opts.votedUp   ?? []);
  const downIds = extractVotedItemIds(opts.votedDown ?? []);

  // Item categorization
  const tops    = items.filter(i => i.category === "top");
  const bottoms = items.filter(i => i.category === "bottom");
  const shoes   = items.filter(i => i.category === "shoes");
  const accessoryPool = items.filter(i => i.category === "accessory");

  // Outer items: items në kategori "outerwear" OSE tops që funksionojnë si layer
  const outerTypeRegex = /blazer|jacket|hoodie|sweater|crewneck|cardigan|coat|parka|knit/;
  const outerItems = items.filter(i =>
    i.category === "outerwear" ||
    (i.category === "top" && outerTypeRegex.test(i.type.toLowerCase())),
  );

  // Inner tops: të mira si base layer (jo closed outerwear)
  const innerTops = tops.filter(i => {
    const t = i.type.toLowerCase();
    return /tee|polo|(?:^|[-_ ])shirt|tank|blouse|crop|bodysuit|henley/.test(t) &&
           !isClosedOuterwear(t);
  });

  // Empty wardrobe guard
  if (!tops.length || !bottoms.length || !shoes.length) {
    const dummy: Item = { id: "missing", category: "top", type: "missing", color_family: "neutral" };
    const mk = (label: OutfitLabel): Outfit => ({
      label, occasion, score: 0,
      picks: {
        top: dummy,
        bottom: { ...dummy, category: "bottom" },
        shoes: { ...dummy, category: "shoes" },
      },
      breakdown: { occasion: 0, harmony: 0, variety: 0, balance: 0 },
      outfit_hash: "missing",
      why: "Add at least 1 top, 1 bottom, and 1 pair of shoes to generate outfits.",
    });
    return [mk("Safe"), mk("Colorful")];
  }

  const pinnedTop    = opts.pinnedTopId    ? tops.find(x => x.id === opts.pinnedTopId)    ?? null : null;
  const pinnedBottom = opts.pinnedBottomId ? bottoms.find(x => x.id === opts.pinnedBottomId) ?? null : null;
  const pinnedShoes  = opts.pinnedShoesId  ? shoes.find(x => x.id === opts.pinnedShoesId) ?? null : null;

  const { min: minLayers, max: maxLayers } = getRequiredLayers(tempC, occasion);
  const shouldLayer = maxLayers >= 1 && outerItems.length >= 1 && innerTops.length >= 1;

  const buildOne = (label: OutfitLabel, excludeHash?: string): Outfit => {
    const candidates: Outfit[] = [];
    const seenHashes = new Set<string>();

    for (let attempt = 0; attempt < 250; attempt++) {
      const top    = pinnedTop    ?? pickOne(tops, rnd);
      const bottom = pinnedBottom ?? pickOne(bottoms, rnd);
      const shoe   = pinnedShoes  ?? pickOne(shoes, rnd);

      // Hard validation (temp + blacklist + occasion-positive)
      if (!isValid(occasion, top, bottom, shoe, tempC, gender)) continue;
      if (!meetsLabel(label, { top, bottom, shoes: shoe })) continue;

      // Layering
      let outer: Item | undefined = undefined;
      if (shouldLayer) {
        const doLayer = minLayers >= 1 || (maxLayers >= 1 && rnd() < 0.4);
        if (doLayer) {
          const inner = innerTops.includes(top) ? top : (innerTops.length > 0 ? pickOne(innerTops, rnd) : null);
          if (inner) {
            const validOuters = outerItems.filter(o =>
              o.id !== top.id &&
              canLayer(inner, o) &&
              isOuterValidForOccasion(o.type, occasion) &&
              isOuterCompatibleWithBottom(o, bottom, occasion) &&
              isTopAllowedForTemp(o.type.toLowerCase(), tempC),
            );
            if (validOuters.length > 0) {
              outer = pickOne(validOuters, rnd);
            }
          }
        }
      }

      // Swap: nëse outer, top → finalTop (inner)
      const finalTop = outer
        ? (innerTops.find(i => i.id === top.id) ?? (innerTops.length > 0 ? pickOne(innerTops, rnd) : top))
        : top;

      // Re-validim pas swap-it
      if (outer && finalTop.id !== top.id) {
        if (!isValid(occasion, finalTop, bottom, shoe, tempC, gender)) continue;
      }

      // Layer i kërkuar nga moti por jo i gjetur → skip
      if (minLayers >= 1 && !outer) continue;

      // Formality cohesion full (me outer)
      const spread = formalitySpread({ top: finalTop, bottom, shoes: shoe, outer });
      if (spread > 3) continue;

      // Color score
      const harmSc = colorScore({ top: finalTop, bottom, shoes: shoe, outer });
      if (harmSc === 0) continue; // >2 loud colors

      // Scoring
      const occSc   = occasionScore(occasion, { top: finalTop, bottom, shoes: shoe, outer }, gender);
      const styleSc = styleScore(style, { top: finalTop, bottom, shoes: shoe, outer });
      const varSc   = varietyScore({ top: finalTop, bottom, shoes: shoe, outer }, rnd);
      const vSc     = voteScore({ top: finalTop, bottom, shoes: shoe }, upIds, downIds);

      let balanceSc = 10;
      // Bonus formality cohesion
      balanceSc += spread <= 1 ? 8 : spread === 2 ? 3 : 0;
      // Shoe-bottom formality fine-tuning
      const sLow = shoe.type.toLowerCase();
      const bLow = bottom.type.toLowerCase();
      if (isAthleticShoe(sLow) && (isFormalBottom(bLow) || isChino(bLow))) balanceSc -= 6;
      if (isFormalShoe(sLow) && (isJeans(bLow) || isShorts(bLow))) balanceSc -= 4;
      if (outer) balanceSc += 5;

      // Accessories
      const accessories = includeAccessories
        ? pickAccessories(accessoryPool, occasion, tempC, shoe, rnd)
        : [];
      if (accessories.length > 0) balanceSc += 2;

      // Total
      const total = clamp(Math.round(occSc + harmSc + balanceSc + styleSc + varSc + vSc), 0, 100);

      // Hash
      const accIds = accessories.map(a => a.id).join(",");
      const hash = hashStr(`${label}:${occasion}:${finalTop.id}:${bottom.id}:${shoe.id}:${outer?.id ?? ""}:${accIds}`);

      if (excludeHash && hash === excludeHash) continue;
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);

      const why = buildWhy(occasion, { top: finalTop, bottom, shoes: shoe, outer }, total, tempC);
      const layerExp = outer ? buildLayerExplanation(tempC, outer, occasion) : undefined;

      candidates.push({
        label, occasion, score: total,
        picks: {
          top: finalTop, bottom, shoes: shoe, outer,
          accessories: accessories.length ? accessories : undefined,
        },
        breakdown: { occasion: occSc, harmony: harmSc, variety: varSc, balance: balanceSc, style: styleSc, explanation: why },
        outfit_hash: hash,
        why,
        layerExplanation: layerExp,
      });
    }

    // Top-K rotation: zgjedh random nga top-5 me score brenda 8 pikave të best-it.
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      const bestScore = candidates[0].score;
      const topPool = candidates.filter(c => c.score >= bestScore - 8).slice(0, 5);
      return topPool[Math.floor(rnd() * topPool.length)];
    }

    // Fallback i sigurt
    return fallbackOutfit(
      label, occasion, tempC, gender,
      pinnedTop    ? [pinnedTop]    : tops,
      pinnedBottom ? [pinnedBottom] : bottoms,
      pinnedShoes  ? [pinnedShoes]  : shoes,
      rnd, accessoryPool, includeAccessories,
    );
  };

  const safe     = buildOne("Safe");
  const colorful = buildOne("Colorful", safe.outfit_hash);
  return [safe, colorful];
}
