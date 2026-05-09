// src/lib/engine/generate.ts
import type { Item, Occasion, Outfit, OutfitLabel, GenerateOptions, Gender } from "./types";

// ─── UTILS ────────────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
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

// ─── COLOR GROUPS ─────────────────────────────────────────────────────────────
const NEUTRAL = new Set(["neutral", "black", "white", "earth"]);
const COOL    = new Set(["blue", "green", "purple"]);
const WARM    = new Set(["red", "orange", "yellow", "pink"]);

// ─── TEMPERATURE LADDER (Celsius) ─────────────────────────────────────────────
// Bazuar në research: NNine, The Chic Tribe, My Jewellery, NBC News
function getTempBand(tempC: number): "extreme_hot" | "hot" | "warm" | "comfort" | "cool" | "cold" | "very_cold" | "extreme_cold" {
  if (tempC >= 30) return "extreme_hot";
  if (tempC >= 25) return "hot";
  if (tempC >= 22) return "warm";
  if (tempC >= 18) return "comfort";
  if (tempC >= 13) return "cool";
  if (tempC >= 5)  return "cold";
  if (tempC >= 0)  return "very_cold";
  return "extreme_cold";
}

// Sa layer duhen sipas temperaturës dhe occasion
function getRequiredLayers(tempC: number, occasion: Occasion): { min: number; max: number } {
  // Gym: asnjë layer gjatë stërvitjes
  if (occasion === "gym") return { min: 0, max: 0 };

  const band = getTempBand(tempC);
  switch (band) {
    case "extreme_hot": return { min: 0, max: 0 }; // tank/tee only
    case "hot":         return { min: 0, max: 0 }; // tee max
    case "warm":        return { min: 0, max: 1 }; // optional cardigan
    case "comfort":     return { min: 0, max: 1 }; // optional layer
    case "cool":        return { min: 1, max: 1 }; // sweater/blazer required
    case "cold":        return { min: 1, max: 2 }; // jacket + sweater
    case "very_cold":   return { min: 2, max: 2 }; // 3-layer system
    case "extreme_cold":return { min: 2, max: 2 }; // heavy winter
    default:            return { min: 0, max: 1 };
  }
}

// Cilat top types janë të lejuara sipas temperaturës
function isTopAllowedForTemp(topType: string, tempC: number): boolean {
  const t = topType.toLowerCase();
  const band = getTempBand(tempC);

  // Temp shumë nxehtë: jo hoodie, sweater, blazer, coat, jacket
  if (band === "extreme_hot" || band === "hot") {
    if (t.includes("hoodie") || t.includes("sweater") || t.includes("coat") ||
        t.includes("crewneck") || t.includes("henley")) return false;
  }
  // Temp nxehtë: jo coat, jo sweater të rëndë
  if (band === "warm") {
    if (t.includes("coat") || t.includes("parka")) return false;
  }
  // Temp ftohtë: jo tank, jo crop top
  if (band === "cold" || band === "very_cold" || band === "extreme_cold") {
    if (t.includes("tank") || t.includes("crop")) return false;
  }
  return true;
}

// Cilat bottom types janë të lejuara sipas temperaturës
function isBottomAllowedForTemp(bottomType: string, tempC: number): boolean {
  const b = bottomType.toLowerCase();
  const band = getTempBand(tempC);

  // Ftohtë: jo shorts
  if (band === "cold" || band === "very_cold" || band === "extreme_cold") {
    if (b.includes("shorts") || b.includes("mini")) return false;
  }
  // Shumë nxehtë: jo leggings të trasha, jo trouser të rëndë
  if (band === "extreme_hot" && (b.includes("wool") || b.includes("heavy"))) return false;

  return true;
}

// Cilat shoes janë të lejuara sipas temperaturës
function isShoesAllowedForTemp(shoeType: string, tempC: number): boolean {
  const s = shoeType.toLowerCase();
  const band = getTempBand(tempC);

  // Ftohtë: jo sandals
  if (band === "cold" || band === "very_cold" || band === "extreme_cold") {
    if (s.includes("sandal") || s.includes("flip") || s.includes("mule")) return false;
  }
  // Shumë nxehtë: jo boots të rëndë (chelsea ok)
  if (band === "extreme_hot") {
    if (s.includes("boot") && !s.includes("ankle") && !s.includes("chelsea")) return false;
  }
  return true;
}

// ─── HARD BLACKLIST ────────────────────────────────────────────────────────────
// Kombinimet që janë GJITHMONË GABIM — bazuar në research
function isBlacklisted(top: Item, bottom: Item, shoes: Item, occasion: Occasion): boolean {
  const t = top.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const s = shoes.type.toLowerCase();

  // Athletic sneakers + kostum/trousers për work/date
  if ((occasion === "work" || occasion === "date") &&
      (s.includes("running") || (s.includes("sneaker") && !s.includes("leather") && !s.includes("white"))) &&
      (b.includes("trouser") || b.includes("chino"))) {
    // Running shoes me trouser = blacklist
    if (s.includes("running")) return true;
  }

  // Polo + shorts për work
  if (occasion === "work" && t.includes("polo") && b.includes("shorts")) return true;

  // Hoodie + work
  if (occasion === "work" && t.includes("hoodie")) return true;

  // Shorts + blazer (mismatch formality)
  if (t.includes("blazer") && b.includes("shorts") && occasion !== "casual") return true;

  // Sandals + socks (e nënkuptuar nga kombinimet e dimrit)
  if (s.includes("sandal") && (b.includes("jean") || b.includes("trouser")) && occasion === "work") return true;

  // Cargo shorts + night_out
  if (occasion === "night_out" && b.includes("cargo") && b.includes("short")) return true;

  // Hoodie + night_out
  if (occasion === "night_out" && t.includes("hoodie")) return true;

  // Tank top + work
  if (occasion === "work" && t.includes("tank")) return true;

  // Sweatpants + work/date/night_out
  if ((occasion === "work" || occasion === "date" || occasion === "night_out") &&
      (b.includes("sweat") || b.includes("jogger"))) return true;

  // Cotton base + extreme cold (nuk po dimë fabricin, skip për tani)
  // Flip flops + work
  if (occasion === "work" && s.includes("flip")) return true;

  // Max 3 ngjyra — nuk e kontrollojmë këtu por te colorScore
  return false;
}

// ─── LAYERING LOGIC ───────────────────────────────────────────────────────────
function canLayer(innerType: string, outerType: string): boolean {
  const i = innerType.toLowerCase();
  const o = outerType.toLowerCase();
  if (i === o) return false;

  const validInner = i.includes("tee") || i.includes("polo") || i.includes("shirt") ||
                     i.includes("tank") || i.includes("blouse") || i.includes("bodysuit") ||
                     i.includes("crop") || i.includes("knit") || i.includes("henley");

  const validOuter = o.includes("blazer") || o.includes("jacket") || o.includes("hoodie") ||
                     o.includes("sweater") || o.includes("crewneck") || o.includes("cardigan") ||
                     o.includes("coat") || o.includes("parka");

  return validInner && validOuter;
}

function getLayerExplanation(tempC: number, outerType: string, occasion: Occasion): string {
  const band = getTempBand(tempC);
  const o = outerType.replace(/_/g, " ");

  if (band === "cool") return `${Math.round(tempC)}°C — a ${o} is the right call.`;
  if (band === "cold") return `${Math.round(tempC)}°C — layering with a ${o} keeps you warm.`;
  if (band === "very_cold" || band === "extreme_cold") return `${Math.round(tempC)}°C — ${o} is essential in this cold.`;
  if (occasion === "work") return `A ${o} completes the professional look.`;
  if (occasion === "date") return `A ${o} elevates the outfit for the evening.`;
  return `The ${o} adds depth and polish.`;
}

// ─── VALIDATION PER OCCASION ──────────────────────────────────────────────────
function isValidMale(occasion: Occasion, top: Item, bottom: Item, shoes: Item, tempC: number): boolean {
  const t = top.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const s = shoes.type.toLowerCase();

  // Temperature checks first
  if (!isTopAllowedForTemp(t, tempC)) return false;
  if (!isBottomAllowedForTemp(b, tempC)) return false;
  if (!isShoesAllowedForTemp(s, tempC)) return false;

  // Hard blacklist
  if (isBlacklisted(top, bottom, shoes, occasion)) return false;

  if (occasion === "work") {
    if (t.includes("hoodie") || t.includes("tank")) return false;
    if (b.includes("shorts") || b.includes("jogger") || b.includes("sweat")) return false;
    if (s.includes("running") || s.includes("sandal") || s.includes("flip")) return false;
    const goodTop = t.includes("shirt") || t.includes("polo") || t.includes("sweater") ||
                    t.includes("blazer") || t.includes("crewneck") || t.includes("henley") ||
                    t.includes("tee"); // tee ok për smart casual work
    if (!goodTop) return false;
    const goodBottom = b.includes("chino") || b.includes("trouser") || b.includes("jean");
    if (!goodBottom) return false;
    // Tee + jeans duhet të ketë sneaker të pastër ose loafer
    if (t.includes("tee") && b.includes("jean") && s.includes("dress")) return false;
    return true;
  }

  if (occasion === "date") {
    if (s.includes("running")) return false;
    if (b.includes("jogger") || b.includes("sweat")) return false;
    if (b.includes("shorts") && tempC >= 18) return false; // shorts ok vetëm nëse nxehtë
    const goodTop = t.includes("shirt") || t.includes("polo") || t.includes("sweater") ||
                    t.includes("blazer") || t.includes("henley") || t.includes("crewneck") || t.includes("tee");
    if (!goodTop) return false;
    return true;
  }

  if (occasion === "casual") {
    if (s.includes("sandal") && b.includes("jean")) return false;
    if (t.includes("blazer") && (b.includes("jogger") || b.includes("sweat"))) return false;
    return true;
  }

  if (occasion === "night_out") {
    if (s.includes("running")) return false;
    if (b.includes("shorts") || b.includes("jogger") || b.includes("sweat")) return false;
    if (t.includes("hoodie")) return false;
    const goodShoe = s.includes("boot") || s.includes("chelsea") || s.includes("dress") ||
                     s.includes("loafer") || s.includes("sneaker");
    if (!goodShoe) return false;
    return true;
  }

  if (occasion === "travel") {
    if (t.includes("blazer")) return false; // blazer nuk është i rehatshëm për travel
    if (s.includes("dress") && !s.includes("chelsea") && !s.includes("boot")) return false;
    return true;
  }

  if (occasion === "gym") {
    // Gym: vetëm performance fabric
    const gymShoe = s.includes("running") || s.includes("sneaker") || s.includes("trainer");
    if (!gymShoe) return false;
    const gymBottom = b.includes("jogger") || b.includes("shorts") || b.includes("sweat") || b.includes("legging");
    if (!gymBottom) return false;
    const gymTop = t.includes("tee") || t.includes("tank") || t.includes("hoodie");
    if (!gymTop) return false;
    return true;
  }

  return true;
}

function isValidFemale(occasion: Occasion, top: Item, bottom: Item, shoes: Item, tempC: number): boolean {
  const t = top.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const s = shoes.type.toLowerCase();

  if (!isTopAllowedForTemp(t, tempC)) return false;
  if (!isBottomAllowedForTemp(b, tempC)) return false;
  if (!isShoesAllowedForTemp(s, tempC)) return false;

  if (isBlacklisted(top, bottom, shoes, occasion)) return false;

  if (occasion === "work") {
    if (t.includes("crop") && !t.includes("blazer")) return false;
    if (t.includes("tank") && !t.includes("structured")) return false;
    if (b.includes("mini") || b.includes("jogger") || b.includes("sweat") || b.includes("shorts")) return false;
    if (s.includes("running") || s.includes("flip")) return false;
    return true;
  }

  if (occasion === "date") {
    if (s.includes("running")) return false;
    if (b.includes("jogger") || b.includes("sweat")) return false;
    return true;
  }

  if (occasion === "casual") {
    if (t.includes("blazer") && b.includes("jogger")) return false;
    return true;
  }

  if (occasion === "night_out") {
    if (s.includes("running") || s.includes("sneaker")) return false;
    if (b.includes("jogger") || b.includes("sweat") || b.includes("shorts")) return false;
    return true;
  }

  if (occasion === "travel") {
    if (s.includes("heel") && !s.includes("kitten") && !s.includes("block")) return false;
    return true;
  }

  if (occasion === "gym") {
    const gymShoe = s.includes("running") || s.includes("sneaker") || s.includes("trainer");
    if (!gymShoe) return false;
    const gymBottom = b.includes("legging") || b.includes("jogger") || b.includes("shorts");
    if (!gymBottom) return false;
    return true;
  }

  return true;
}

// ─── COLOR HARMONY ────────────────────────────────────────────────────────────
// Max 3 ngjyra, neutral base, contrast rule
function colorScore(top: Item, bottom: Item, shoes: Item, outer?: Item): number {
  const items = outer ? [top, bottom, shoes, outer] : [top, bottom, shoes];
  const colors = items.map(i => String(i.color_family).toLowerCase());

  // Rule: max 3 ngjyra (jo neutral)
  const loudColors = colors.filter(c => !NEUTRAL.has(c));
  const uniqueLoud = new Set(loudColors).size;

  // Penalizo nëse >2 ngjyra të forta (mbi-3 total = gabim)
  if (uniqueLoud > 2) return 0; // REJECT — shum ngjyra

  const tc = String(top.color_family).toLowerCase();
  const bc = String(bottom.color_family).toLowerCase();
  const sc = String(shoes.color_family).toLowerCase();

  let score = 0;

  // Neutralet janë gjithmonë të mira
  if (loudColors.length === 0) score += 30;       // all neutral — safest
  else if (loudColors.length === 1) score += 26;  // 1 accent — great
  else score += 12;                                // 2 accents — ok

  // Shoes neutrale = +8 (klasike)
  if (NEUTRAL.has(sc)) score += 8;

  // Warm/cool consistency
  if (COOL.has(tc) && COOL.has(bc)) score += 5;
  if (WARM.has(tc) && WARM.has(bc)) score += 4;

  // Penalizo warm+cool clash pa neutral buffer
  if (COOL.has(tc) && WARM.has(bc) && !NEUTRAL.has(sc)) score -= 12;
  if (WARM.has(tc) && COOL.has(bc) && !NEUTRAL.has(sc)) score -= 12;

  // Contrast bonus: light top + dark bottom ose anasjelltas
  const isLightTop  = tc === "white" || tc === "neutral";
  const isDarkBot   = bc === "black" || bc === "blue";
  const isDarkTop   = tc === "black";
  const isLightBot  = bc === "white" || bc === "neutral";
  if ((isLightTop && isDarkBot) || (isDarkTop && isLightBot)) score += 6;

  // Penalizo nëse top dhe bottom janë saktë e njëjta ngjyrë (jo tonal)
  if (tc === bc && tc !== "neutral" && tc !== "black" && tc !== "white") score -= 8;

  return clamp(score, 0, 38);
}

// ─── OCCASION SCORING ─────────────────────────────────────────────────────────
function occasionScore(occasion: Occasion, top: Item, bottom: Item, shoes: Item, gender: Gender): number {
  const t = top.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const s = shoes.type.toLowerCase();
  const tc = top.color_family.toLowerCase();
  const bc = bottom.color_family.toLowerCase();
  let score = 25;

  if (gender === "male") {
    if (occasion === "work") {
      if (t.includes("blazer")) score += 14;
      else if (t.includes("shirt") || t.includes("polo")) score += 10;
      else if (t.includes("sweater") || t.includes("crewneck")) score += 8;
      else if (t.includes("tee")) score += 4;
      if (b.includes("trouser")) score += 12;
      else if (b.includes("chino")) score += 10;
      else if (b.includes("jean")) score += 6;
      if (s.includes("dress") || s.includes("oxford")) score += 12;
      else if (s.includes("loafer") || s.includes("derby")) score += 10;
      else if (s.includes("chelsea") || s.includes("boot")) score += 8;
      else if (s.includes("sneaker")) score += 3;
    }
    if (occasion === "date") {
      if (s.includes("chelsea") || s.includes("boot")) score += 14;
      else if (s.includes("loafer") || s.includes("dress")) score += 12;
      else if (s.includes("sneaker")) score += 6;
      if (t.includes("shirt")) score += 10;
      else if (t.includes("polo") || t.includes("sweater") || t.includes("blazer")) score += 8;
      else if (t.includes("tee") || t.includes("henley")) score += 5;
      if (b.includes("chino")) score += 8;
      else if (b.includes("trouser")) score += 8;
      else if (b.includes("jean")) score += 6;
    }
    if (occasion === "casual") {
      if (s.includes("sneaker")) score += 12;
      else if (s.includes("loafer") || s.includes("boot")) score += 8;
      if (t.includes("tee") || t.includes("henley") || t.includes("polo")) score += 8;
      if (b.includes("jean")) score += 10;
      else if (b.includes("chino") || b.includes("shorts")) score += 7;
    }
    if (occasion === "night_out") {
      if (tc === "black" || bc === "black") score += 12;
      if (s.includes("chelsea") || s.includes("boot")) score += 14;
      else if (s.includes("loafer") || s.includes("dress")) score += 10;
      else if (s.includes("sneaker")) score += 5;
      if (t.includes("shirt") || t.includes("blazer")) score += 10;
      else if (t.includes("tee") || t.includes("polo")) score += 5;
      if (b.includes("trouser") || b.includes("jean")) score += 8;
    }
    if (occasion === "travel") {
      if (s.includes("sneaker")) score += 12;
      else if (s.includes("boot") || s.includes("loafer")) score += 8;
      if (t.includes("tee") || t.includes("polo") || t.includes("shirt")) score += 8;
      if (b.includes("jean") || b.includes("chino") || b.includes("cargo")) score += 8;
    }
    if (occasion === "gym") {
      if (s.includes("running")) score += 16;
      else if (s.includes("sneaker") || s.includes("trainer")) score += 12;
      if (b.includes("jogger") || b.includes("shorts")) score += 14;
      if (t.includes("tee") || t.includes("tank")) score += 12;
    }
  } else {
    // FEMALE
    if (occasion === "work") {
      if (t.includes("blazer") || t.includes("blouse")) score += 14;
      else if (t.includes("shirt") || t.includes("knit")) score += 10;
      else if (t.includes("tee")) score += 4;
      if (b.includes("trouser") || b.includes("wide")) score += 12;
      else if (b.includes("midi")) score += 10;
      else if (b.includes("jean")) score += 5;
      if (s.includes("heel") || s.includes("pump")) score += 12;
      else if (s.includes("loafer") || s.includes("ballet") || s.includes("flat")) score += 10;
      else if (s.includes("boot") || s.includes("ankle")) score += 8;
    }
    if (occasion === "date") {
      if (s.includes("heel") || s.includes("mule") || s.includes("ankle")) score += 14;
      else if (s.includes("boot")) score += 10;
      if (tc === "black" || bc === "black") score += 8;
      if (b.includes("midi") || b.includes("mini") || b.includes("skirt")) score += 10;
    }
    if (occasion === "casual") {
      if (s.includes("sneaker") || s.includes("flat") || s.includes("ballet")) score += 12;
      if (t.includes("tee") || t.includes("knit") || t.includes("crop")) score += 8;
      if (b.includes("jean") || b.includes("skirt") || b.includes("midi")) score += 8;
    }
    if (occasion === "night_out") {
      if (s.includes("heel") || s.includes("mule")) score += 16;
      else if (s.includes("boot")) score += 10;
      if (tc === "black" || bc === "black") score += 10;
      if (b.includes("mini") || b.includes("midi")) score += 10;
    }
    if (occasion === "travel") {
      if (s.includes("sneaker") || s.includes("loafer") || s.includes("flat")) score += 12;
      if (t.includes("tee") || t.includes("blouse") || t.includes("knit")) score += 8;
      if (b.includes("jean") || b.includes("trouser") || b.includes("midi")) score += 8;
    }
    if (occasion === "gym") {
      if (s.includes("running") || s.includes("trainer")) score += 16;
      if (b.includes("legging") || b.includes("shorts")) score += 14;
      if (t.includes("crop") || t.includes("tank") || t.includes("tee")) score += 12;
    }
  }

  return clamp(score, 0, 50);
}

// ─── STYLE SCORING ────────────────────────────────────────────────────────────
function styleScore(style: string, top: Item, bottom: Item, shoes: Item, outer?: Item): number {
  const t = top.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const s = shoes.type.toLowerCase();
  const tc = top.color_family.toLowerCase();
  const bc = bottom.color_family.toLowerCase();
  const sc = shoes.color_family.toLowerCase();
  let score = 0;

  if (style === "minimal") {
    const allNeutral = [tc, bc, sc].every(c => NEUTRAL.has(c));
    if (allNeutral) score += 20;
    if (t.includes("tee") || t.includes("shirt")) score += 6;
    if (b.includes("chino") || b.includes("trouser") || b.includes("jean")) score += 6;
    if (s.includes("sneaker") || s.includes("loafer")) score += 6;
    if (outer) score += 5; // clean layer = minimal bonus
  }
  if (style === "streetwear") {
    if (t.includes("hoodie") || t.includes("tee")) score += 10;
    if (b.includes("cargo") || b.includes("jogger") || b.includes("jean")) score += 10;
    if (s.includes("sneaker") || s.includes("running")) score += 12;
    const boldColors = [tc, bc, sc].filter(c => !NEUTRAL.has(c)).length;
    if (boldColors >= 1) score += 6;
  }
  if (style === "smart_casual") {
    if (t.includes("polo") || t.includes("shirt") || t.includes("blazer") || t.includes("crewneck")) score += 12;
    if (b.includes("chino") || b.includes("trouser") || b.includes("jean")) score += 10;
    if (s.includes("loafer") || s.includes("chelsea") || s.includes("sneaker")) score += 10;
    if (outer) score += 5;
  }
  if (style === "classic") {
    if (t.includes("blazer") || t.includes("shirt") || t.includes("polo")) score += 14;
    if (b.includes("trouser") || b.includes("chino")) score += 14;
    if (s.includes("dress") || s.includes("loafer") || s.includes("chelsea") || s.includes("oxford")) score += 14;
    if (NEUTRAL.has(tc) && NEUTRAL.has(bc)) score += 8;
    if (outer?.type.toLowerCase().includes("blazer") || outer?.type.toLowerCase().includes("coat")) score += 6;
  }
  if (style === "sporty") {
    if (t.includes("tee") || t.includes("tank") || t.includes("hoodie")) score += 10;
    if (b.includes("jogger") || b.includes("shorts") || b.includes("jean")) score += 10;
    if (s.includes("sneaker") || s.includes("running")) score += 14;
  }

  return clamp(score, 0, 20);
}

// ─── LABEL FILTER ─────────────────────────────────────────────────────────────
function meetsLabel(label: OutfitLabel, top: Item, bottom: Item, shoes: Item): boolean {
  const colors = [top, bottom, shoes].map(i => String(i.color_family).toLowerCase());
  const loudCount = colors.filter(c => !NEUTRAL.has(c)).length;
  if (label === "Safe") return loudCount <= 1;
  if (label === "Colorful") return loudCount >= 1;
  return true;
}

// ─── WHY BUILDER ─────────────────────────────────────────────────────────────
function buildWhy(occasion: Occasion, top: Item, bottom: Item, shoes: Item, score: number, gender: Gender, outer?: Item, tempC?: number): string {
  const t = top.type.replace(/_/g, " ");
  const b = bottom.type.replace(/_/g, " ");
  const s = shoes.type.replace(/_/g, " ");
  const tc = top.color_family;
  const bc = bottom.color_family;
  const loud = [tc, bc, String(shoes.color_family)].filter(c => !NEUTRAL.has(c)).length;

  if (outer) {
    const o = outer.type.replace(/_/g, " ");
    if (tempC !== undefined && tempC <= 12) {
      return `${Math.round(tempC)}°C outside — ${o} over ${t} with ${b} and ${s}. Layered and weather-ready.`;
    }
    return `${o} over ${t} with ${b} and ${s} — the layer adds polish without overdoing it.`;
  }

  if (score >= 90) {
    if (loud === 0) return `All-neutral — ${t} + ${b} + ${s} is a foolproof combination.`;
    return `One color accent keeps the look focused. Solid formula.`;
  }

  const lines: Record<Occasion, string> = {
    work:      `${t} + ${b} strikes the right balance between polished and approachable.`,
    date:      `${s} elevates the whole look. ${t} + ${b} reads as intentional without being overdressed.`,
    casual:    `Relaxed but deliberate — the colors are harmonious, not random.`,
    night_out: `Dark tones + ${s} = sharp night look.`,
    travel:    `Comfortable, versatile, and put-together — right for any destination.`,
    gym:       `Functional and clean. ${s} is the right choice for performance.`,
  };

  return lines[occasion] ?? `${tc} + ${bc} — ${loud === 0 ? "neutral harmony" : "balanced palette"}.`;
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export function generateOutfits(
  items: Item[],
  occasion: Occasion,
  seed: number,
  opts: GenerateOptions = {}
): Outfit[] {
  const rnd    = mulberry32(seed);
  const gender: Gender = opts.gender ?? "male";
  const style  = opts.style ??
    (typeof window !== "undefined" ? localStorage.getItem("om_style") ?? "minimal" : "minimal");

  // Temperatura — nga opts ose localStorage
  const tempC  = opts.tempC ??
    (typeof window !== "undefined" ? parseFloat(localStorage.getItem("om_weather_temp") ?? "20") : 20);

  const tops      = items.filter(i => i.category === "top");
  const bottoms   = items.filter(i => i.category === "bottom");
  const shoes     = items.filter(i => i.category === "shoes");

  // Outer items: tops që funksionojnë si layer
  const outerTypes = ["blazer","jacket","hoodie","sweater","crewneck","cardigan","coat","parka","knit"];
  const outerItems = items.filter(i =>
    i.category === "top" &&
    outerTypes.some(ot => i.type.toLowerCase().includes(ot))
  );

  // Inner tops: të mira si base layer
  const innerTops = tops.filter(i => {
    const t = i.type.toLowerCase();
    return t.includes("tee") || t.includes("polo") || t.includes("shirt") ||
           t.includes("tank") || t.includes("blouse") || t.includes("crop") ||
           t.includes("bodysuit") || t.includes("henley");
  });

  if (!tops.length || !bottoms.length || !shoes.length) {
    const dummy: Item = { id: "missing", category: "top", type: "missing", color_family: "neutral" };
    const mk = (label: OutfitLabel): Outfit => ({
      label, occasion, score: 0,
      picks: { top: dummy, bottom: { ...dummy, category: "bottom" }, shoes: { ...dummy, category: "shoes" } },
      breakdown: { occasion: 0, harmony: 0, variety: 0, balance: 0 },
      outfit_hash: "missing",
      why: "Add at least 1 top, 1 bottom, and 1 shoes to generate outfits.",
    });
    return [mk("Safe"), mk("Colorful")];
  }

  const pinnedTop    = opts.pinnedTopId    ? tops.find(x => x.id === opts.pinnedTopId)    ?? null : null;
  const pinnedBottom = opts.pinnedBottomId ? bottoms.find(x => x.id === opts.pinnedBottomId) ?? null : null;
  const pinnedShoes  = opts.pinnedShoesId  ? shoes.find(x => x.id === opts.pinnedShoesId) ?? null : null;

  const isValid  = gender === "female" ? isValidFemale : isValidMale;

  // Layering: sa layer duhen
  const { min: minLayers, max: maxLayers } = getRequiredLayers(tempC, occasion);
  const shouldLayer = maxLayers >= 1 && outerItems.length >= 1 && innerTops.length >= 1;

  const buildOne = (label: OutfitLabel, excludeHash?: string): Outfit => {
    let best: Outfit | null = null;

    for (let attempt = 0; attempt < 200; attempt++) {
      const top    = pinnedTop    ?? pickOne(tops, rnd);
      const bottom = pinnedBottom ?? pickOne(bottoms, rnd);
      const shoe   = pinnedShoes  ?? pickOne(shoes, rnd);

      if (!isValid(occasion, top, bottom, shoe, tempC)) continue;
      if (!meetsLabel(label, top, bottom, shoe)) continue;

      // Decide nëse do layer
      let outer: Item | undefined = undefined;
      if (shouldLayer) {
        // Required layer nëse minLayers >= 1
        const doLayer = minLayers >= 1 || (maxLayers >= 1 && rnd() < 0.4);
        if (doLayer) {
          // Gjej inner top të mirë
          const inner = innerTops.includes(top) ? top : (innerTops.length > 0 ? pickOne(innerTops, rnd) : null);
          if (inner) {
            const validOuter = outerItems.filter(o =>
              o.id !== top.id && canLayer(inner.type, o.type)
            );
            if (validOuter.length > 0) {
              outer = pickOne(validOuter, rnd);
            }
          }
        }
      }

      // Nëse kemi outer, top bëhet inner
      const finalTop = outer
        ? (innerTops.find(i => i.id === top.id) ?? (innerTops.length > 0 ? pickOne(innerTops, rnd) : top))
        : top;

      // Score-to
      const occSc   = occasionScore(occasion, finalTop, bottom, shoe, gender);
      const harmSc  = colorScore(finalTop, bottom, shoe, outer);

      // Nëse colorScore ktheu 0 (>2 loud colors) → skip
      if (harmSc === 0) continue;

      let balanceSc = 10;
      // Penalizo mismatch formality
      const tLow = finalTop.type.toLowerCase();
      const bLow = bottom.type.toLowerCase();
      if (tLow.includes("blazer") && bLow.includes("jogger")) balanceSc -= 8;
      if (tLow.includes("hoodie") && bLow.includes("trouser")) balanceSc -= 6;
      if (outer) balanceSc += 5; // layering bonus

      const styleSc = styleScore(style, finalTop, bottom, shoe, outer);
      const total   = clamp(Math.round(occSc + harmSc + balanceSc + styleSc), 0, 100);
      const hash    = hashStr(`${label}:${occasion}:${finalTop.id}:${bottom.id}:${shoe.id}:${outer?.id ?? ""}`);

      if (excludeHash && hash === excludeHash) continue;

      const why    = buildWhy(occasion, finalTop, bottom, shoe, total, gender, outer, tempC);
      const layerExp = outer ? getLayerExplanation(tempC, outer.type, occasion) : undefined;

      const outfit: Outfit = {
        label, occasion, score: total,
        picks: { top: finalTop, bottom, shoes: shoe, outer },
        breakdown: { occasion: occSc, harmony: harmSc, variety: 0, balance: balanceSc, style: styleSc, explanation: why },
        outfit_hash: hash,
        why,
        layerExplanation: layerExp,
      };

      if (!best || outfit.score > best.score) best = outfit;
    }

    // Fallback
    if (!best) {
      const top    = pinnedTop    ?? tops[0];
      const bottom = pinnedBottom ?? bottoms[0];
      const shoe   = pinnedShoes  ?? shoes[0];
      const why    = buildWhy(occasion, top, bottom, shoe, 50, gender, undefined, tempC);
      best = {
        label, occasion, score: 50,
        picks: { top, bottom, shoes: shoe },
        breakdown: { occasion: 25, harmony: 17, variety: 0, balance: 8 },
        outfit_hash: hashStr(`${label}:${occasion}:${top.id}:${bottom.id}:${shoe.id}`),
        why,
      };
    }

    return best;
  };

  const safeOutfit     = buildOne("Safe");
  const colorfulOutfit = buildOne("Colorful", safeOutfit.outfit_hash);

  return [safeOutfit, colorfulOutfit];
}