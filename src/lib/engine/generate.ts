// src/lib/engine/generate.ts
import type { Item, Occasion, Outfit, OutfitLabel, GenerateOptions } from "./types";

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
const COOL = new Set(["blue", "green", "purple"]);
const WARM = new Set(["red", "orange", "yellow", "pink"]);

// ─── RREGULLAT E OCCASION ────────────────────────────────────────────────────
// Rregulla strikte - nëse nuk i kalon, kombinimi hidhet

function isValidForOccasion(
  occasion: Occasion,
  top: Item,
  bottom: Item,
  shoes: Item
): boolean {
  const t = top.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const s = shoes.type.toLowerCase();

  if (occasion === "work") {
    // ❌ Absolute NO
    if (t.includes("hoodie") || t.includes("tank")) return false;
    if (b.includes("shorts") || b.includes("jogger") || b.includes("sweat")) return false;
    if (s.includes("running") || s.includes("sandal")) return false;
    // ✅ Duhet top i mirë
    const goodTop = t.includes("shirt") || t.includes("polo") || t.includes("sweater") ||
      t.includes("blazer") || t.includes("crewneck") || t.includes("henley");
    if (!goodTop) return false;
    // ✅ Duhet bottom i mirë
    const goodBottom = b.includes("chino") || b.includes("trouser") || b.includes("jean") || b.includes("cargo");
    if (!goodBottom) return false;
    // ✅ Duhet këpucë të mira
    const goodShoe = s.includes("dress") || s.includes("loafer") || s.includes("boot") ||
      s.includes("chelsea") || s.includes("sneaker");
    if (!goodShoe) return false;
    return true;
  }

  if (occasion === "date") {
    // ❌ Absolute NO
    if (s.includes("running") || s.includes("sandal")) return false;
    if (b.includes("jogger") || b.includes("sweat") || b.includes("shorts")) return false;
    if (t.includes("tank")) return false;
    // ✅ Duhet top i mirë
    const goodTop = t.includes("shirt") || t.includes("polo") || t.includes("sweater") ||
      t.includes("blazer") || t.includes("henley") || t.includes("crewneck");
    if (!goodTop) return false;
    return true;
  }

  if (occasion === "casual") {
    // ❌ Kombinime absurde
    if (s.includes("sandal") && b.includes("jean")) return false;
    if (s.includes("dress") && b.includes("shorts")) return false;
    if (t.includes("blazer") && b.includes("jogger")) return false;
    if (t.includes("blazer") && b.includes("sweat")) return false;
    return true;
  }

  if (occasion === "night_out") {
    // ❌ Absolute NO
    if (s.includes("running") || s.includes("sandal")) return false;
    if (b.includes("shorts") || b.includes("jogger") || b.includes("sweat")) return false;
    // ✅ Duhet këpucë të mira
    const goodShoe = s.includes("boot") || s.includes("chelsea") || s.includes("dress") ||
      s.includes("loafer") || s.includes("sneaker");
    if (!goodShoe) return false;
    return true;
  }

  if (occasion === "travel") {
    // ❌ Jo dress shoes (jo praktike)
    if (s.includes("dress") && !s.includes("chelsea")) return false;
    // ❌ Jo blazer (shumë formal)
    if (t.includes("blazer")) return false;
    return true;
  }

  if (occasion === "gym") {
    // ✅ DUHET running shoes ose sneakers
    if (!s.includes("running") && !s.includes("sneaker")) return false;
    // ✅ DUHET bottom atletik
    if (!b.includes("jogger") && !b.includes("shorts") && !b.includes("sweat")) return false;
    // ✅ DUHET top atletik
    if (!t.includes("tee") && !t.includes("tank") && !t.includes("hoodie")) return false;
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

  // Rregull kryesore: Max 1 "loud" piece
  if (loudCount === 0) score += 30; // All neutral - timeless
  else if (loudCount === 1) score += 26; // 1 accent - perfekt
  else if (loudCount === 2) score += 10; // 2 loud - risky
  else score += 2; // 3 loud - shumë

  // Këpucët neutrale = gjithmonë mirë
  if (NEUTRAL.has(sc)) score += 8;

  // Cool + cool funksionon (blue + green = ok)
  if (COOL.has(tc) && COOL.has(bc)) score += 4;

  // Warm + warm funksionon (red + orange = ok)
  if (WARM.has(tc) && WARM.has(bc)) score += 3;

  // Cool + warm pa neutral = clash
  if (COOL.has(tc) && WARM.has(bc) && !NEUTRAL.has(sc)) score -= 10;
  if (WARM.has(tc) && COOL.has(bc) && !NEUTRAL.has(sc)) score -= 10;

  // Monochromatic (e njëjta ngjyrë) - elegant për Safe, jo për Colorful
  if (uniq === 1) score += 4;

  return clamp(score, 0, 38);
}

// ─── OCCASION FIT SCORE ───────────────────────────────────────────────────────
function occasionScore(occasion: Occasion, top: Item, bottom: Item, shoes: Item): number {
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

// ─── LABEL FILTER ────────────────────────────────────────────────────────────
function meetsLabel(label: OutfitLabel, top: Item, bottom: Item, shoes: Item): boolean {
  const colors = [top, bottom, shoes].map(i => String(i.color_family).toLowerCase());
  const loudCount = colors.filter(c => !NEUTRAL.has(c)).length;

  if (label === "Safe") {
    // Safe: 0 ose 1 loud piece - klasike
    return loudCount <= 1;
  }

  if (label === "Colorful") {
    // Colorful: saktësisht 1 loud piece - interesante por e balancuar
    return loudCount === 1;
  }

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

  const tops = items.filter(i => i.category === "top");
  const bottoms = items.filter(i => i.category === "bottom");
  const shoes = items.filter(i => i.category === "shoes");

  if (!tops.length || !bottoms.length || !shoes.length) {
    const dummy: Item = { id: "missing", category: "top", type: "missing", color_family: "neutral" };
    const mk = (label: OutfitLabel): Outfit => ({
      label, occasion, score: 0,
      picks: { top: dummy, bottom: { ...dummy, category: "bottom" }, shoes: { ...dummy, category: "shoes" } },
      breakdown: { occasion: 0, harmony: 0, variety: 0, balance: 0 },
      outfit_hash: "missing",
    });
    return [mk("Safe"), mk("Colorful")];
  }

  const pinnedTop = opts.pinnedTopId ? tops.find(x => x.id === opts.pinnedTopId) : null;
  const pinnedBottom = opts.pinnedBottomId ? bottoms.find(x => x.id === opts.pinnedBottomId) : null;
  const pinnedShoes = opts.pinnedShoesId ? shoes.find(x => x.id === opts.pinnedShoesId) : null;

  const buildOne = (label: OutfitLabel, excludeHash?: string): Outfit => {
    let best: Outfit | null = null;

    for (let t = 0; t < 120; t++) {
      const top = pinnedTop ?? pickOne(tops, rnd);
      const bottom = pinnedBottom ?? pickOne(bottoms, rnd);
      const shoe = pinnedShoes ?? pickOne(shoes, rnd);

      // Rregullat strikte
      if (!isValidForOccasion(occasion, top, bottom, shoe)) continue;
      if (!meetsLabel(label, top, bottom, shoe)) continue;

      const occ = occasionScore(occasion, top, bottom, shoe);
      const harm = colorScore(top, bottom, shoe);

      // Balance - mos mix shumë formal me shumë casual
      let balance = 10;
      const topT = top.type.toLowerCase();
      const botT = bottom.type.toLowerCase();
      if (topT.includes("blazer") && botT.includes("jogger")) balance -= 8;
      if (topT.includes("tee") && botT.includes("trouser")) balance -= 3;

      const total = clamp(Math.round(occ + harm + balance), 0, 100);

      const hash = hashStr(`${label}:${occasion}:${top.id}:${bottom.id}:${shoe.id}`);

      // Mos përsërit outfitin tjetër
      if (excludeHash && hash === excludeHash) continue;

      const outfit: Outfit = {
        label, occasion, score: total,
        picks: { top, bottom, shoes: shoe },
        breakdown: { occasion: occ, harmony: harm, variety: 0, balance },
        outfit_hash: hash,
      };

      if (!best || outfit.score > best.score) best = outfit;
    }

    // Fallback nëse nuk gjejmë
    if (!best) {
      const top = pinnedTop ?? pickOne(tops, rnd);
      const bottom = pinnedBottom ?? pickOne(bottoms, rnd);
      const shoe = pinnedShoes ?? pickOne(shoes, rnd);
      best = {
        label, occasion, score: 50,
        picks: { top, bottom, shoes: shoe },
        breakdown: { occasion: 28, harmony: 17, variety: 0, balance: 5 },
        outfit_hash: hashStr(`${label}:${occasion}:${top.id}:${bottom.id}:${shoe.id}`),
      };
    }

    return best;
  };

  const safeOutfit = buildOne("Safe");
  const colorfulOutfit = buildOne("Colorful", safeOutfit.outfit_hash);

  return [safeOutfit, colorfulOutfit];
}