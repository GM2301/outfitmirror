// src/lib/engine/generate.ts
import type { Item, Occasion, Outfit, OutfitLabel, GenerateOptions, Gender } from "./types";

// ─── RNG ─────────────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
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

// ─── NGJYRAT ─────────────────────────────────────────────────────────────────
const NEUTRAL = new Set(["neutral", "black", "white", "earth"]);
const COOL    = new Set(["blue", "green", "purple"]);
const WARM    = new Set(["red", "orange", "yellow", "pink"]);

// ─── MALE OCCASION RULES ────────────────────────────────────────────────────
function isValidMale(occasion: Occasion, top: Item, bottom: Item, shoes: Item): boolean {
  const t = top.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const s = shoes.type.toLowerCase();

  if (occasion === "work") {
    if (t.includes("hoodie") || t.includes("tank")) return false;
    if (b.includes("shorts") || b.includes("jogger") || b.includes("sweat")) return false;
    if (s.includes("running") || s.includes("sandal")) return false;
    const goodTop = t.includes("shirt") || t.includes("polo") || t.includes("sweater") || t.includes("blazer") || t.includes("crewneck") || t.includes("henley");
    if (!goodTop) return false;
    const goodBottom = b.includes("chino") || b.includes("trouser") || b.includes("jean") || b.includes("cargo");
    if (!goodBottom) return false;
    const goodShoe = s.includes("dress") || s.includes("loafer") || s.includes("boot") || s.includes("chelsea") || s.includes("sneaker");
    if (!goodShoe) return false;
    return true;
  }
  if (occasion === "date") {
    if (s.includes("running") || s.includes("sandal")) return false;
    if (b.includes("jogger") || b.includes("sweat") || b.includes("shorts")) return false;
    if (t.includes("tank")) return false;
    const goodTop = t.includes("shirt") || t.includes("polo") || t.includes("sweater") || t.includes("blazer") || t.includes("henley") || t.includes("crewneck");
    if (!goodTop) return false;
    return true;
  }
  if (occasion === "casual") {
    if (s.includes("sandal") && b.includes("jean")) return false;
    if (s.includes("dress") && b.includes("shorts")) return false;
    if (t.includes("blazer") && (b.includes("jogger") || b.includes("sweat"))) return false;
    return true;
  }
  if (occasion === "night_out") {
    if (s.includes("running") || s.includes("sandal")) return false;
    if (b.includes("shorts") || b.includes("jogger") || b.includes("sweat")) return false;
    const goodShoe = s.includes("boot") || s.includes("chelsea") || s.includes("dress") || s.includes("loafer") || s.includes("sneaker");
    if (!goodShoe) return false;
    return true;
  }
  if (occasion === "travel") {
    if (s.includes("dress") && !s.includes("chelsea")) return false;
    if (t.includes("blazer")) return false;
    return true;
  }
  if (occasion === "gym") {
    if (!s.includes("running") && !s.includes("sneaker")) return false;
    if (!b.includes("jogger") && !b.includes("shorts") && !b.includes("sweat")) return false;
    if (!t.includes("tee") && !t.includes("tank") && !t.includes("hoodie")) return false;
    return true;
  }
  return true;
}

// ─── FEMALE OCCASION RULES ──────────────────────────────────────────────────
function isValidFemale(occasion: Occasion, top: Item, bottom: Item, shoes: Item): boolean {
  const t = top.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const s = shoes.type.toLowerCase();

  if (occasion === "work" || occasion === "office_chic") {
    // Nuk lejohet: crop top, tank, mini skirt, joggers, running shoes, flip flops
    if (t.includes("crop") || t.includes("tank")) return false;
    if (b.includes("mini") || b.includes("jogger") || b.includes("sweat") || b.includes("shorts")) return false;
    if (s.includes("running") || s.includes("flip") || s.includes("sandal")) return false;
    return true;
  }
  if (occasion === "date") {
    if (s.includes("running") || s.includes("sneaker")) return false;
    if (b.includes("jogger") || b.includes("sweat")) return false;
    return true;
  }
  if (occasion === "casual" || occasion === "brunch") {
    if (t.includes("blazer") && b.includes("jogger")) return false;
    return true;
  }
  if (occasion === "night_out" || occasion === "gala") {
    if (s.includes("running") || s.includes("sneaker")) return false;
    if (b.includes("jogger") || b.includes("sweat") || b.includes("shorts")) return false;
    return true;
  }
  if (occasion === "travel") {
    if (s.includes("heel") && !s.includes("kitten")) return false;
    return true;
  }
  if (occasion === "gym") {
    if (!s.includes("running") && !s.includes("sneaker") && !s.includes("trainer")) return false;
    if (!b.includes("legging") && !b.includes("jogger") && !b.includes("shorts")) return false;
    return true;
  }
  return true;
}

// ─── COLOR HARMONY ───────────────────────────────────────────────────────────
function colorScore(top: Item, bottom: Item, shoes: Item): number {
  const colors = [top, bottom, shoes].map(i => String(i.color_family).toLowerCase());
  const [tc, bc, sc] = colors;
  const loudColors = colors.filter(c => !NEUTRAL.has(c));
  const loudCount = loudColors.length;
  const uniq = new Set(colors).size;
  let score = 0;

  if (loudCount === 0) score += 30;
  else if (loudCount === 1) score += 26;
  else if (loudCount === 2) score += 10;
  else score += 2;

  if (NEUTRAL.has(sc)) score += 8;
  if (COOL.has(tc) && COOL.has(bc)) score += 4;
  if (WARM.has(tc) && WARM.has(bc)) score += 3;
  if (COOL.has(tc) && WARM.has(bc) && !NEUTRAL.has(sc)) score -= 10;
  if (WARM.has(tc) && COOL.has(bc) && !NEUTRAL.has(sc)) score -= 10;
  if (uniq === 1) score += 4;

  return clamp(score, 0, 38);
}

// ─── OCCASION SCORE MALE ────────────────────────────────────────────────────
function occasionScoreMale(occasion: Occasion, top: Item, bottom: Item, shoes: Item): number {
  const t = top.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const s = shoes.type.toLowerCase();
  const tc = top.color_family.toLowerCase();
  const bc = bottom.color_family.toLowerCase();
  let score = 28;

  if (occasion === "work") {
    if (t.includes("blazer")) score += 12;
    else if (t.includes("shirt") || t.includes("polo")) score += 8;
    else if (t.includes("sweater")) score += 6;
    if (b.includes("trouser")) score += 10;
    else if (b.includes("chino")) score += 8;
    if (s.includes("dress") || s.includes("loafer")) score += 10;
    else if (s.includes("chelsea") || s.includes("boot")) score += 8;
    else if (s.includes("sneaker")) score += 4;
  }
  if (occasion === "date") {
    if (s.includes("chelsea") || s.includes("boot")) score += 12;
    else if (s.includes("loafer") || s.includes("dress")) score += 10;
    else if (s.includes("sneaker")) score += 4;
    if (t.includes("shirt")) score += 8;
    else if (t.includes("polo") || t.includes("sweater")) score += 6;
    if (b.includes("chino")) score += 6;
    else if (b.includes("jean")) score += 4;
  }
  if (occasion === "casual") {
    if (s.includes("sneaker")) score += 10;
    if (t.includes("tee") || t.includes("henley")) score += 6;
    if (b.includes("jean")) score += 8;
    else if (b.includes("chino")) score += 6;
    else if (b.includes("cargo")) score += 4;
  }
  if (occasion === "night_out") {
    if (tc === "black" || bc === "black") score += 12;
    if (s.includes("chelsea") || s.includes("boot")) score += 12;
    else if (s.includes("loafer") || s.includes("dress")) score += 8;
    if (t.includes("shirt") || t.includes("blazer")) score += 8;
  }
  if (occasion === "travel") {
    if (s.includes("sneaker")) score += 10;
    else if (s.includes("running")) score += 8;
    if (t.includes("tee") || t.includes("hoodie")) score += 6;
    if (b.includes("jean") || b.includes("chino") || b.includes("cargo")) score += 6;
  }
  if (occasion === "gym") {
    if (s.includes("running")) score += 14;
    else if (s.includes("sneaker")) score += 10;
    if (b.includes("jogger") || b.includes("shorts")) score += 10;
    if (t.includes("tee") || t.includes("tank")) score += 8;
    else if (t.includes("hoodie")) score += 4;
  }
  return clamp(score, 0, 50);
}

// ─── OCCASION SCORE FEMALE ──────────────────────────────────────────────────
function occasionScoreFemale(occasion: Occasion, top: Item, bottom: Item, shoes: Item): number {
  const t = top.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const s = shoes.type.toLowerCase();
  const tc = top.color_family.toLowerCase();
  const bc = bottom.color_family.toLowerCase();
  let score = 28;

  if (occasion === "work" || occasion === "office_chic") {
    if (t.includes("blazer") || t.includes("blouse")) score += 12;
    else if (t.includes("shirt") || t.includes("knit")) score += 8;
    if (b.includes("trouser") || b.includes("midi")) score += 10;
    else if (b.includes("pencil") || b.includes("skirt")) score += 8;
    if (s.includes("heel") || s.includes("loafer") || s.includes("pump")) score += 10;
    else if (s.includes("boot") || s.includes("chelsea")) score += 8;
    else if (s.includes("flat") || s.includes("ballet")) score += 6;
  }
  if (occasion === "date" || occasion === "night_out" || occasion === "gala") {
    if (tc === "black" || bc === "black") score += 8;
    if (s.includes("heel") || s.includes("pump") || s.includes("mule")) score += 14;
    else if (s.includes("boot") || s.includes("ankle")) score += 10;
    if (t.includes("silk") || t.includes("satin") || t.includes("blouse")) score += 8;
    if (b.includes("midi") || b.includes("mini") || b.includes("dress")) score += 8;
  }
  if (occasion === "casual" || occasion === "brunch") {
    if (s.includes("sneaker") || s.includes("flat") || s.includes("ballet")) score += 10;
    if (t.includes("tee") || t.includes("knit") || t.includes("crop")) score += 6;
    if (b.includes("jean") || b.includes("skirt") || b.includes("midi")) score += 8;
  }
  if (occasion === "travel") {
    if (s.includes("sneaker") || s.includes("loafer")) score += 10;
    if (t.includes("knit") || t.includes("tee")) score += 6;
    if (b.includes("jean") || b.includes("trouser")) score += 6;
  }
  if (occasion === "gym") {
    if (s.includes("running") || s.includes("trainer")) score += 14;
    if (b.includes("legging") || b.includes("shorts")) score += 12;
    if (t.includes("crop") || t.includes("tee") || t.includes("tank")) score += 8;
  }
  return clamp(score, 0, 50);
}

// ─── WHY IT WORKS ────────────────────────────────────────────────────────────
function buildWhy(occasion: Occasion, top: Item, bottom: Item, shoes: Item, score: number, gender: Gender): string {
  const t = top.type.replace(/_/g, " ");
  const b = bottom.type.replace(/_/g, " ");
  const s = shoes.type.replace(/_/g, " ");
  const tc = top.color_family;
  const bc = bottom.color_family;
  const sc = shoes.color_family;

  const loudCount = [tc, bc, sc].filter(c => !NEUTRAL.has(c)).length;

  if (score >= 90) {
    if (loudCount === 0) return `All-neutral palette — ${t} + ${b} + ${s} is a foolproof combination that always looks intentional.`;
    if (loudCount === 1) return `One color accent (${[tc, bc, sc].find(c => !NEUTRAL.has(c))}) keeps the look focused. Classic formula.`;
  }
  if (occasion === "work" || occasion === "office_chic") {
    return `${t} + ${b} strikes the right balance between polished and approachable. ${s} finishes it professionally.`;
  }
  if (occasion === "date") {
    return `${s} elevates the whole look. ${t} + ${b} in ${tc}/${bc} reads as intentional without being overdressed.`;
  }
  if (occasion === "casual" || occasion === "brunch") {
    return `Relaxed but deliberate — ${t} + ${b} works because the colors are harmonious, not just random.`;
  }
  if (occasion === "night_out" || occasion === "gala") {
    return `Dark tones + ${s} = a sharp night look. The color balance at ${loudCount} accent${loudCount !== 1 ? "s" : ""} keeps it from overdoing it.`;
  }
  if (occasion === "gym") {
    return `Functional and clean. ${s} is the right choice for performance, and the color palette stays cohesive.`;
  }
  return `${tc} top + ${bc} bottom + ${sc} shoes — ${loudCount === 0 ? "neutral harmony" : `${loudCount} accent color, properly balanced`}.`;
}

// ─── LABEL FILTER ────────────────────────────────────────────────────────────
function meetsLabel(label: OutfitLabel, top: Item, bottom: Item, shoes: Item): boolean {
  const colors = [top, bottom, shoes].map(i => String(i.color_family).toLowerCase());
  const loudCount = colors.filter(c => !NEUTRAL.has(c)).length;
  if (label === "Safe") return loudCount <= 1;
  if (label === "Colorful") return loudCount === 1;
  return true;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function generateOutfits(
  items: Item[],
  occasion: Occasion,
  seed: number,
  opts: GenerateOptions = {}
): Outfit[] {
  const rnd = mulberry32(seed);
  const gender: Gender = opts.gender ?? "male";

  const tops    = items.filter(i => i.category === "top");
  const bottoms = items.filter(i => i.category === "bottom");
  const shoes   = items.filter(i => i.category === "shoes");

  if (!tops.length || !bottoms.length || !shoes.length) {
    const dummy: Item = { id: "missing", category: "top", type: "missing", color_family: "neutral" };
    const mk = (label: OutfitLabel): Outfit => ({
      label, occasion, score: 0,
      picks: { top: dummy, bottom: { ...dummy, category: "bottom" }, shoes: { ...dummy, category: "shoes" } },
      breakdown: { occasion: 0, harmony: 0, variety: 0, balance: 0, explanation: "Not enough items" },
      outfit_hash: "missing",
      why: "Add at least 1 top, 1 bottom, and 1 shoes to generate outfits.",
    });
    return [mk("Safe"), mk("Colorful")];
  }

  const pinnedTop    = opts.pinnedTopId    ? tops.find(x => x.id === opts.pinnedTopId)    : null;
  const pinnedBottom = opts.pinnedBottomId ? bottoms.find(x => x.id === opts.pinnedBottomId) : null;
  const pinnedShoes  = opts.pinnedShoesId  ? shoes.find(x => x.id === opts.pinnedShoesId) : null;

  const isValid = gender === "female" ? isValidFemale : isValidMale;
  const occScore = gender === "female" ? occasionScoreFemale : occasionScoreMale;

  const buildOne = (label: OutfitLabel, excludeHash?: string): Outfit => {
    let best: Outfit | null = null;

    for (let t = 0; t < 150; t++) {
      const top    = pinnedTop    ?? pickOne(tops, rnd);
      const bottom = pinnedBottom ?? pickOne(bottoms, rnd);
      const shoe   = pinnedShoes  ?? pickOne(shoes, rnd);

      if (!isValid(occasion, top, bottom, shoe)) continue;
      if (!meetsLabel(label, top, bottom, shoe)) continue;

      const occ  = occScore(occasion, top, bottom, shoe);
      const harm = colorScore(top, bottom, shoe);

      let balance = 10;
      const topT = top.type.toLowerCase();
      const botT = bottom.type.toLowerCase();
      if (topT.includes("blazer") && botT.includes("jogger")) balance -= 8;
      if (topT.includes("tee") && botT.includes("trouser")) balance -= 2;

      const total = clamp(Math.round(occ + harm + balance), 0, 100);
      const hash  = hashStr(`${label}:${occasion}:${top.id}:${bottom.id}:${shoe.id}`);

      if (excludeHash && hash === excludeHash) continue;

      const why = buildWhy(occasion, top, bottom, shoe, total, gender);

      const outfit: Outfit = {
        label, occasion, score: total,
        picks: { top, bottom, shoes: shoe },
        breakdown: { occasion: occ, harmony: harm, variety: 0, balance, explanation: why },
        outfit_hash: hash,
        why,
      };

      if (!best || outfit.score > best.score) best = outfit;
    }

    if (!best) {
      const top    = pinnedTop    ?? pickOne(tops, rnd);
      const bottom = pinnedBottom ?? pickOne(bottoms, rnd);
      const shoe   = pinnedShoes  ?? pickOne(shoes, rnd);
      const why    = buildWhy(occasion, top, bottom, shoe, 50, gender);
      best = {
        label, occasion, score: 50,
        picks: { top, bottom, shoes: shoe },
        breakdown: { occasion: 28, harmony: 17, variety: 0, balance: 5, explanation: why },
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