// src/lib/engine/generate.ts
// Engine v8 — strukturuar, përdor formality_tier, is_layer, is_inner, min/max_temp nga AI
import type { Item, Occasion, Outfit, OutfitLabel, GenerateOptions, Gender } from "./types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function pickOne<T>(arr: T[], rnd: () => number): T { return arr[Math.floor(rnd() * arr.length)]; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function hashStr(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); }

const NEUTRAL = new Set(["neutral","black","white","earth","grey","gray","beige","brown","navy","denim"]);
const COOL = new Set(["blue","green","purple","teal"]);
const WARM = new Set(["red","orange","yellow","pink","coral"]);

// ─── FALLBACK INFERENCE për items pa structured tags ─────────────────────────
function inferTier(item: Item): number {
  if (item.formality_tier !== undefined && item.formality_tier !== null) return item.formality_tier;
  const t = item.type.toLowerCase();
  const cat = item.category;

  if (cat === "top" || cat === "outerwear") {
    if (t.includes("tuxedo")) return 5;
    if (t.includes("dress_shirt")) return 4;
    if (t.includes("blazer") || t.includes("sport_coat") || t.includes("suit_jacket")) return 4;
    if (t.includes("trench") || t.includes("overcoat") || t.includes("peacoat")) return 4;
    if (t.includes("shirt") || t.includes("blouse") || t.includes("polo")) return 3;
    if (t.includes("knit") || t.includes("sweater") || t.includes("cardigan") || t.includes("crewneck") || t.includes("henley")) return 3;
    if (t.includes("coat") && !t.includes("sport")) return 4;
    if (t.includes("jacket") || t.includes("bomber") || t.includes("parka")) return 2;
    if (t.includes("tee")) return 2;
    if (t.includes("hoodie") || t.includes("sweatshirt") || t.includes("zip_up")) return 1;
    if (t.includes("tank") || t.includes("sleeveless") || t.includes("crop")) return 1;
    return 2;
  }
  if (cat === "bottom") {
    if (t.includes("tuxedo")) return 5;
    if (t.includes("dress_pant") || t.includes("suit_pant")) return 4;
    if (t.includes("trouser") || t.includes("wide_leg")) return 4;
    if (t.includes("chino") || t.includes("midi")) return 3;
    if (t.includes("jean") || t.includes("denim") || t.includes("mini") || t.includes("skirt")) return 2;
    if (t.includes("cargo") || t.includes("shorts")) return 2;
    if (t.includes("jogger") || t.includes("sweat") || t.includes("track") || t.includes("athletic") || t.includes("legging") || t.includes("trenerk")) return 1;
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
    if (t.includes("running") || t.includes("trainer") || t.includes("flip")) return 1;
    return 2;
  }
  return 2;
}

function inferIsLayer(item: Item): boolean {
  if (item.is_layer !== undefined && item.is_layer !== null) return item.is_layer;
  const t = item.type.toLowerCase();
  if (item.category === "outerwear") return true;
  return t.includes("blazer") || t.includes("jacket") || t.includes("hoodie") || t.includes("sweater") || t.includes("crewneck") || t.includes("cardigan") || t.includes("coat") || t.includes("parka") || t.includes("overshirt") || t.includes("trench") || t.includes("bomber") || t.includes("knit");
}

function inferIsInner(item: Item): boolean {
  if (item.is_inner !== undefined && item.is_inner !== null) return item.is_inner;
  if (item.category !== "top") return false;
  const t = item.type.toLowerCase();
  if (t.includes("blazer") || t.includes("coat") || t.includes("parka") || t.includes("trench") || t.includes("bomber")) return false;
  return t.includes("tee") || t.includes("polo") || t.includes("shirt") || t.includes("tank") || t.includes("blouse") || t.includes("bodysuit") || t.includes("crop") || t.includes("henley") || t.includes("knit") || t.includes("longsleeve") || t.includes("sweater") || t.includes("cardigan");
}

function inferMinTemp(item: Item): number {
  if (item.min_temp !== undefined && item.min_temp !== null) return item.min_temp;
  const t = item.type.toLowerCase();
  if (t.includes("tank") || t.includes("sleeveless")) return 22;
  if (t.includes("tee") || t.includes("crop")) return 18;
  if (t.includes("polo")) return 16;
  if (t.includes("shirt") || t.includes("blouse") || t.includes("longsleeve")) return 12;
  if (t.includes("henley")) return 10;
  if (t.includes("hoodie") || t.includes("sweatshirt")) return 5;
  if (t.includes("sweater") || t.includes("knit") || t.includes("cardigan")) return 0;
  if (t.includes("blazer")) return 8;
  if (t.includes("bomber") || (t.includes("jacket") && !t.includes("heavy"))) return 5;
  if (t.includes("parka")) return -20;
  if (t.includes("trench") || t.includes("coat") || t.includes("overcoat")) return -10;
  if (t.includes("shorts") || t.includes("mini")) return 20;
  if (t.includes("jean") || t.includes("chino")) return -10;
  if (t.includes("trouser")) return 5;
  if (t.includes("jogger") || t.includes("legging")) return 0;
  if (t.includes("sandal") || t.includes("flip")) return 22;
  if (t.includes("boot")) return -15;
  return -30;
}

function inferMaxTemp(item: Item): number {
  if (item.max_temp !== undefined && item.max_temp !== null) return item.max_temp;
  const t = item.type.toLowerCase();
  if (t.includes("tank") || t.includes("sleeveless")) return 40;
  if (t.includes("tee") || t.includes("crop")) return 35;
  if (t.includes("polo")) return 32;
  if (t.includes("shirt") || t.includes("blouse")) return 28;
  if (t.includes("longsleeve") || t.includes("henley")) return 24;
  if (t.includes("hoodie") || t.includes("sweatshirt")) return 22;
  if (t.includes("sweater") || t.includes("knit") || t.includes("cardigan")) return 20;
  if (t.includes("blazer")) return 25;
  if (t.includes("bomber") || (t.includes("jacket") && !t.includes("heavy"))) return 20;
  if (t.includes("parka")) return 5;
  if (t.includes("trench") || t.includes("coat") || t.includes("overcoat")) return 12;
  if (t.includes("shorts") || t.includes("mini")) return 45;
  if (t.includes("jean") || t.includes("chino")) return 28;
  if (t.includes("trouser")) return 28;
  if (t.includes("jogger") || t.includes("legging")) return 22;
  if (t.includes("sandal") || t.includes("flip")) return 45;
  if (t.includes("boot")) return 18;
  return 45;
}

function isInTempRange(item: Item, tempC: number): boolean {
  return tempC >= inferMinTemp(item) && tempC <= inferMaxTemp(item);
}

function isOccasionAllowed(item: Item, occasion: Occasion): boolean {
  const t = item.type.toLowerCase();
  const tier = inferTier(item);

  if (occasion === "work") {
    if (tier <= 1) return false;
    if (t.includes("hoodie") || t.includes("sweatshirt") || t.includes("zip_up")) return false;
    if (t.includes("tank") || t.includes("sleeveless")) return false;
    if (t.includes("crop") && !t.includes("blazer")) return false;
    if (t.includes("shorts") || t.includes("cargo")) return false;
    if (t.includes("jogger") || t.includes("sweat") || t.includes("track") || t.includes("athletic_pant") || t.includes("trenerk")) return false;
    if (t.includes("running") || t.includes("flip") || t.includes("sandal") || t.includes("canvas")) return false;
    return true;
  }
  if (occasion === "date") {
    if (tier <= 1) return false;
    if (t.includes("hoodie") || t.includes("sweatshirt")) return false;
    if (t.includes("tank") || t.includes("sleeveless")) return false;
    if (t.includes("jogger") || t.includes("sweat") || t.includes("track") || t.includes("trenerk") || t.includes("athletic")) return false;
    if (t.includes("running") || t.includes("flip") || t.includes("cargo")) return false;
    return true;
  }
  if (occasion === "night_out") {
    if (tier <= 1) return false;
    if (t.includes("hoodie") || t.includes("sweatshirt") || t.includes("zip_up")) return false;
    if (t.includes("tank")) return false;
    if (t.includes("shorts") || t.includes("cargo")) return false;
    if (t.includes("jogger") || t.includes("sweat") || t.includes("track") || t.includes("trenerk") || t.includes("athletic")) return false;
    if (t.includes("running") || t.includes("sandal") || t.includes("flip")) return false;
    return true;
  }
  if (occasion === "gym") {
    if (tier >= 4) return false;
    if (item.category === "top") {
      return t.includes("tee") || t.includes("tank") || t.includes("sleeveless") || t.includes("hoodie") || t.includes("sweatshirt") || t.includes("zip_up") || t.includes("athletic") || t.includes("performance") || t.includes("sports_bra");
    }
    if (item.category === "bottom") {
      return t.includes("jogger") || t.includes("sweat") || t.includes("track") || t.includes("athletic") || t.includes("trenerk") || t.includes("legging") || (t.includes("shorts") && !t.includes("cargo") && !t.includes("denim") && !t.includes("jean"));
    }
    if (item.category === "shoes") {
      return t.includes("running") || t.includes("trainer") || t.includes("athletic") || (t.includes("sneaker") && !t.includes("leather") && !t.includes("canvas") && !t.includes("dress"));
    }
    return false;
  }
  if (occasion === "travel") {
    if (t.includes("blazer") || t.includes("dress_shoe") || t.includes("oxford") || t.includes("heel")) return false;
    return true;
  }
  return true;
}

function closedOuterShortsBlock(top: Item, bottom: Item, outer?: Item): boolean {
  const b = bottom.type.toLowerCase();
  if (!b.includes("shorts") && !b.includes("mini")) return false;
  const checkItem = (i?: Item): boolean => {
    if (!i) return false;
    const t = i.type.toLowerCase();
    return t.includes("blazer") || t.includes("coat") || t.includes("parka") || t.includes("trench") || t.includes("bomber") || (t.includes("jacket") && !t.includes("track_jacket"));
  };
  return checkItem(top) || checkItem(outer);
}

function getFormalitySpread(top: Item, bottom: Item, shoes: Item, outer?: Item): number {
  const tiers = [inferTier(top), inferTier(bottom), inferTier(shoes)];
  if (outer) tiers.push(inferTier(outer));
  return Math.max(...tiers) - Math.min(...tiers);
}

// KEY FIX: canLayerOver bllokon hoodie+shirt etj
function canLayerOver(inner: Item, outer: Item): boolean {
  if (inner.id === outer.id) return false;
  if (!inferIsLayer(outer)) return false;
  if (!inferIsInner(inner)) return false;

  const i = inner.type.toLowerCase();
  const o = outer.type.toLowerCase();
  const innerTier = inferTier(inner);
  const outerTier = inferTier(outer);

  // Outer tier nuk duhet të jetë shumë më i ulët se inner
  if (outerTier < innerTier - 1) return false;

  // Hoodie/sweatshirt mbi shirt/blouse/polo = NEVER
  if ((o.includes("hoodie") || o.includes("sweatshirt") || o.includes("zip_up")) &&
      (i.includes("shirt") || i.includes("blouse") || i.includes("polo"))) return false;
  // Hoodie mbi tier 3+ inner = absurd
  if ((o.includes("hoodie") || o.includes("sweatshirt")) && innerTier >= 3) return false;

  // Blazer mbi hoodie/sweatshirt = NEVER
  if (o.includes("blazer") && (i.includes("hoodie") || i.includes("sweatshirt"))) return false;

  // Sweater/cardigan mbi hoodie = NEVER
  if ((o.includes("sweater") || o.includes("cardigan") || o.includes("knit")) &&
      (i.includes("hoodie") || i.includes("sweatshirt"))) return false;

  return true;
}

function isOuterValidForOccasion(outer: Item, occasion: Occasion): boolean {
  const o = outer.type.toLowerCase();
  if (occasion === "work") {
    if (o.includes("hoodie") || o.includes("sweatshirt") || o.includes("zip_up")) return false;
    if (o.includes("parka") || o.includes("bomber")) return false;
    return true;
  }
  if (occasion === "date" || occasion === "night_out") {
    if (o.includes("hoodie") || o.includes("sweatshirt")) return false;
    if (o.includes("parka")) return false;
    return true;
  }
  if (occasion === "gym") return false;
  return true;
}

function isOuterCompatibleWithBottom(outer: Item, bottom: Item, occasion: Occasion): boolean {
  const o = outer.type.toLowerCase();
  const b = bottom.type.toLowerCase();
  const oTier = inferTier(outer);
  const bTier = inferTier(bottom);
  if (Math.abs(oTier - bTier) > 2) return false;
  if ((o.includes("blazer") || o.includes("coat") || o.includes("trench") || o.includes("overcoat")) &&
      (b.includes("jogger") || b.includes("sweat") || b.includes("track") || b.includes("athletic"))) return false;
  const isClosed = o.includes("blazer") || o.includes("coat") || o.includes("parka") || o.includes("trench") || o.includes("bomber") || (o.includes("jacket") && !o.includes("track_jacket"));
  if (isClosed && (b.includes("shorts") || b.includes("mini"))) return false;
  return true;
}

function colorScore(top: Item, bottom: Item, shoes: Item, outer?: Item): number {
  const items = outer ? [top, bottom, shoes, outer] : [top, bottom, shoes];
  const colors = items.map(i => String(i.color_family).toLowerCase());
  const loud = colors.filter(c => !NEUTRAL.has(c));
  const uniqueLoud = new Set(loud).size;
  if (uniqueLoud > 2) return 0;

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

function occasionScore(occasion: Occasion, top: Item, bottom: Item, shoes: Item, _gender: Gender): number {
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

function meetsLabel(label: OutfitLabel, top: Item, bottom: Item, shoes: Item): boolean {
  const colors = [top, bottom, shoes].map(i => String(i.color_family).toLowerCase());
  const loud = colors.filter(c => !NEUTRAL.has(c)).length;
  if (label === "Safe") return loud <= 1;
  if (label === "Colorful") return loud >= 1;
  return true;
}

function getRequiredLayers(tempC: number, occasion: Occasion): { min: number; max: number } {
  if (occasion === "gym") return { min: 0, max: 0 };
  if (tempC >= 25) return { min: 0, max: 0 };
  if (tempC >= 22) return { min: 0, max: 1 };
  if (tempC >= 18) return { min: 0, max: 1 };
  if (tempC >= 13) return { min: 1, max: 1 };
  if (tempC >= 5)  return { min: 1, max: 2 };
  return { min: 1, max: 2 };
}

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

  const allTops = items.filter(i => i.category === "top" || i.category === "outerwear");
  const allBottoms = items.filter(i => i.category === "bottom");
  const allShoes = items.filter(i => i.category === "shoes");
  const allAccessories = items.filter(i => i.category === "accessory");

  const innerTops = allTops.filter(i => inferIsInner(i) && !inferIsLayer(i));
  const outerItems = allTops.filter(i => inferIsLayer(i));
  const standaloneTops = allTops.filter(i => i.category === "top");

  const validTops = standaloneTops.filter(i => isInTempRange(i, tempC) && isOccasionAllowed(i, occasion));
  const validBottoms = allBottoms.filter(i => isInTempRange(i, tempC) && isOccasionAllowed(i, occasion));
  const validShoes = allShoes.filter(i => isInTempRange(i, tempC) && isOccasionAllowed(i, occasion));
  const validInners = innerTops.filter(i => isInTempRange(i, tempC) && isOccasionAllowed(i, occasion));
  const validOuters = outerItems.filter(i => isInTempRange(i, tempC) && isOuterValidForOccasion(i, occasion));

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

  const buildOne = (label: OutfitLabel, excludeHash?: string): Outfit => {
    let best: Outfit | null = null;
    const candidates: Outfit[] = [];
    const seen = new Set<string>();

    for (let attempt = 0; attempt < 250; attempt++) {
      const top = pinnedTop ?? pickOne(validTops, rnd);
      const bottom = pinnedBottom ?? pickOne(validBottoms, rnd);
      const shoe = pinnedShoes ?? pickOne(validShoes, rnd);

      if (closedOuterShortsBlock(top, bottom)) continue;
      if (!meetsLabel(label, top, bottom, shoe)) continue;

      const spreadNoOuter = getFormalitySpread(top, bottom, shoe);
      if (spreadNoOuter > 2) continue;

      const topTier = inferTier(top);
      const bottomTier = inferTier(bottom);
      const shoeTier = inferTier(shoe);
      if (topTier >= 3 && bottomTier <= 1) continue;
      if (topTier <= 1 && bottomTier >= 4) continue;
      if (shoeTier <= 1 && bottomTier >= 4) continue;
      if (shoeTier >= 4 && bottomTier <= 1) continue;

      let outer: Item | undefined = undefined;
      let finalTop = top;
      const needsLayer = minLayers >= 1;
      const wantsLayer = needsLayer || rnd() < 0.35;

      if (wantsLayer && validOuters.length > 0) {
        const innerCandidate = inferIsInner(top) ? top : (validInners.length > 0 ? pickOne(validInners, rnd) : null);
        if (innerCandidate) {
          const compatibleOuters = validOuters.filter(o =>
            canLayerOver(innerCandidate, o) &&
            isOuterCompatibleWithBottom(o, bottom, occasion) &&
            !closedOuterShortsBlock(innerCandidate, bottom, o)
          );
          if (compatibleOuters.length > 0) {
            outer = pickOne(compatibleOuters, rnd);
            finalTop = innerCandidate;
          }
        }
      }

      if (needsLayer && !outer) continue;
      if (outer) {
        if (!isOuterCompatibleWithBottom(outer, bottom, occasion)) continue;
        if (closedOuterShortsBlock(finalTop, bottom, outer)) continue;
        if (getFormalitySpread(finalTop, bottom, shoe, outer) > 2) continue;
      }

      const harmSc = colorScore(finalTop, bottom, shoe, outer);
      if (harmSc === 0) continue;

      const occSc = occasionScore(occasion, finalTop, bottom, shoe, gender);
      let balanceSc = 10;
      const finalSpread = outer ? getFormalitySpread(finalTop, bottom, shoe, outer) : spreadNoOuter;
      if (finalSpread <= 1) balanceSc += 8;
      else if (finalSpread === 2) balanceSc += 3;
      if (outer) balanceSc += 4;

      const lowWearBonus = ((finalTop.wear_count ?? 0) < 3 ? 4 : 0) + ((bottom.wear_count ?? 0) < 3 ? 4 : 0) + ((shoe.wear_count ?? 0) < 3 ? 4 : 0);
      const varietyRand = Math.floor(rnd() * 7);
      const varietySc = lowWearBonus + varietyRand;

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

    if (best && candidates.length > 1) {
      const threshold = best.score - 8;
      const topPool = candidates.filter(c => c.score >= threshold).sort((a, b) => b.score - a.score).slice(0, 5);
      if (topPool.length > 1) best = topPool[Math.floor(rnd() * topPool.length)];
    }

    if (!best) {
      const t = validTops[0];
      const b = validBottoms[0];
      const s = validShoes[0];
      const why = buildWhy(occasion, t, b, s, undefined, tempC);
      best = {
        label, occasion, score: 40,
        picks: { top: t, bottom: b, shoes: s },
        breakdown: { occasion: 25, harmony: 15, variety: 0, balance: 5 },
        outfit_hash: hashStr(`${label}:${occasion}:${t.id}:${b.id}:${s.id}`),
        why,
      };
    }
    return best;
  };

  const safe = buildOne("Safe");
  const colorful = buildOne("Colorful", safe.outfit_hash);
  return [safe, colorful];
}