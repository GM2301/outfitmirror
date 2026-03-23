// src/lib/engine/generate.ts
import type { Item, Occasion, Outfit, OutfitLabel, GenerateOptions } from "./types";

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

function occasionScore(occasion: Occasion, top: Item, bottom: Item, shoes: Item): number {
  let s = 0;

  if (occasion === "work") {
    if (top.type.includes("hoodie")) s -= 6;
    if (bottom.type.includes("joggers") || bottom.type.includes("shorts")) s -= 10;
    if (shoes.type.includes("running")) s -= 10;
    s += 10;
  }

  if (occasion === "date") {
    if (shoes.type.includes("dress") || shoes.type.includes("boots") || shoes.type.includes("loafers")) s += 8;
    if (top.type.includes("shirt") || top.type.includes("polo") || top.type.includes("sweater")) s += 6;
    if (shoes.type.includes("running")) s -= 10;
    s += 8;
  }

  if (occasion === "casual") {
    s += 12;
  }

  if (occasion === "night_out") {
    if (top.color_family.includes("black") || bottom.color_family.includes("black")) s += 6;
    if (shoes.type.includes("boots") || shoes.type.includes("dress") || shoes.type.includes("loafers")) s += 6;
    s += 8;
  }

  if (occasion === "travel") {
    if (shoes.type.includes("sneakers") || shoes.type.includes("running")) s += 8;
    if (shoes.type.includes("dress")) s -= 6;
    s += 8;
  }

  if (occasion === "gym") {
    if (shoes.type.includes("running") || shoes.type.includes("sneakers")) s += 18;
    else s -= 18;
    if (bottom.type.includes("joggers") || bottom.type.includes("shorts")) s += 6;
    s += 6;
  }

  return s;
}

function harmonyScore(top: Item, bottom: Item, shoes: Item): number {
  // MVP: neutral/earth/black/white/blue janë “safe-ish”
  const safe = new Set(["neutral", "earth", "black", "white", "blue"]);
  const colors = [top.color_family, bottom.color_family, shoes.color_family].map((c) => String(c).toLowerCase());

  const loud = colors.filter((c) => !safe.has(c)).length;
  const uniq = new Set(colors).size;

  let s = 0;
  s += loud === 0 ? 18 : loud === 1 ? 14 : loud === 2 ? 9 : 5; // max ~18
  s += uniq === 1 ? 6 : uniq === 2 ? 8 : 10;                  // max ~10

  return clamp(s, 0, 30);
}

function varietyScore(label: OutfitLabel, top: Item, bottom: Item, shoes: Item): number {
  const colors = [top.color_family, bottom.color_family, shoes.color_family].map((c) => String(c).toLowerCase());
  const uniq = new Set(colors).size;

  if (label === "Safe") return uniq === 1 ? 20 : uniq === 2 ? 14 : 8;
  if (label === "Colorful") return uniq === 2 ? 18 : uniq === 3 ? 20 : 10;
  return uniq === 3 ? 20 : uniq === 2 ? 16 : 10;
}

function balanceScore(top: Item, bottom: Item): number {
  // MVP placeholder
  let s = 10;
  if (String(top.type).includes("oversized") && String(bottom.type).includes("baggy")) s -= 2;
  return clamp(s, 0, 10);
}

export function generateOutfits(
  items: Item[],
  occasion: Occasion,
  seed: number,
  opts: GenerateOptions = {}
): Outfit[] {
  const rnd = mulberry32(seed);

  const tops = items.filter((i) => i.category === "top");
  const bottoms = items.filter((i) => i.category === "bottom");
  const shoes = items.filter((i) => i.category === "shoes");

  // nëse mungon kategori, kthe 3 placeholder outfits me picks dummy (që OutfitCard mos me “shpërthy”)
  if (!tops.length || !bottoms.length || !shoes.length) {
    const dummy: Item = { id: "missing", category: "top", type: "missing", color_family: "neutral" };
    const mk = (label: OutfitLabel): Outfit => ({
      label,
      occasion,
      score: 0,
      picks: { top: dummy, bottom: { ...dummy, category: "bottom" }, shoes: { ...dummy, category: "shoes" } },
      breakdown: { occasion: 0, harmony: 0, variety: 0, balance: 0 },
      outfit_hash: "missing",
    });
    return [mk("Safe"), mk("Colorful"), mk("Bold")];
  }

  const pinnedTop = opts.pinnedTopId ? tops.find((x) => x.id === opts.pinnedTopId) : null;
  const pinnedBottom = opts.pinnedBottomId ? bottoms.find((x) => x.id === opts.pinnedBottomId) : null;
  const pinnedShoes = opts.pinnedShoesId ? shoes.find((x) => x.id === opts.pinnedShoesId) : null;

  const buildOne = (label: OutfitLabel, tries = 70): Outfit => {
    let best: Outfit | null = null;

    for (let t = 0; t < tries; t++) {
      let top = pinnedTop ?? pickOne(tops, rnd);
      let bottom = pinnedBottom ?? pickOne(bottoms, rnd);
      let shoe = pinnedShoes ?? pickOne(shoes, rnd);

      // label bias (vetëm nëse ajo pjesë s’është pinned)
      const safeSet = ["neutral", "earth", "black", "white", "blue"];

      if (label === "Safe") {
        if (!pinnedTop) {
          const arr = tops.filter((x) => safeSet.includes(String(x.color_family).toLowerCase()));
          if (arr.length) top = pickOne(arr, rnd);
        }
        if (!pinnedBottom) {
          const arr = bottoms.filter((x) => safeSet.includes(String(x.color_family).toLowerCase()));
          if (arr.length) bottom = pickOne(arr, rnd);
        }
        if (!pinnedShoes) {
          const arr = shoes.filter((x) => safeSet.includes(String(x.color_family).toLowerCase()));
          if (arr.length) shoe = pickOne(arr, rnd);
        }
      }

      if (label === "Colorful" && (!pinnedTop || !pinnedBottom || !pinnedShoes)) {
        // syno 2 ngjyra të ndryshme
        let guard = 0;
        while (guard++ < 10) {
          if (!pinnedTop) top = pickOne(tops, rnd);
          if (!pinnedBottom) bottom = pickOne(bottoms, rnd);
          if (!pinnedShoes) shoe = pickOne(shoes, rnd);
          const uniq = new Set([top.color_family, bottom.color_family, shoe.color_family].map(String)).size;
          if (uniq >= 2) break;
        }
      }

      if (label === "Bold" && (!pinnedTop || !pinnedBottom || !pinnedShoes)) {
        // syno 3 ngjyra të ndryshme
        let guard = 0;
        while (guard++ < 12) {
          if (!pinnedTop) top = pickOne(tops, rnd);
          if (!pinnedBottom) bottom = pickOne(bottoms, rnd);
          if (!pinnedShoes) shoe = pickOne(shoes, rnd);
          const uniq = new Set([top.color_family, bottom.color_family, shoe.color_family].map(String)).size;
          if (uniq === 3) break;
        }
      }

      const occ = clamp(28 + occasionScore(occasion, top, bottom, shoe), 0, 40);
      const harm = harmonyScore(top, bottom, shoe); // 0..30
      const vari = clamp(varietyScore(label, top, bottom, shoe), 0, 20);
      const bal = clamp(balanceScore(top, bottom), 0, 10);

      const total = clamp(Math.round(occ + harm + vari + bal), 0, 100);

      const outfit: Outfit = {
        label,
        occasion,
        score: total,
        picks: { top, bottom, shoes: shoe },
        breakdown: { occasion: occ, harmony: harm, variety: vari, balance: bal },
        outfit_hash: hashStr(`${label}:${occasion}:${top.id}:${bottom.id}:${shoe.id}`),
      };

      if (!best || outfit.score > best.score) best = outfit;
    }

    return best!;
  };

  return [buildOne("Safe"), buildOne("Colorful"), buildOne("Bold")];
}