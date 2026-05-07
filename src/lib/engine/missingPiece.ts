// src/lib/engine/missingPiece.ts
import type { Item } from "./types";

export type MissingPiece = {
  title: string;
  reason: string;
  category: string;
  searchQuery: string;
  affiliateUrl: string;
  priority: number;
  impact: number; // sa outfit të reja hap ky item (0-100)
  tag: "Essential" | "Versatile" | "Upgrade" | "Color";
};

function amazonUrl(query: string, country?: string): string {
  const lang = typeof navigator !== "undefined" ? navigator.language : "en-US";
  const c = country ?? lang.split("-")[1]?.toUpperCase() ?? "US";
  const domains: Record<string, string> = {
    US: "amazon.com", GB: "amazon.co.uk", DE: "amazon.de",
    FR: "amazon.fr", IT: "amazon.it", ES: "amazon.es",
    CA: "amazon.ca", AU: "amazon.com.au", NL: "amazon.nl",
  };
  const domain = domains[c] ?? "amazon.com";
  const tag = c === "GB" ? "occaswear-21" : c === "DE" ? "occaswear-22" : "occaswear-20";
  return `https://www.${domain}/s?k=${encodeURIComponent(query)}&tag=${tag}`;
}

// Sa kombinime të reja hap një item
function calcImpact(items: Item[], newCategory: string, newType: string): number {
  const tops    = items.filter(i => i.category === "top").length;
  const bottoms = items.filter(i => i.category === "bottom").length;
  const shoes   = items.filter(i => i.category === "shoes").length;
  if (newCategory === "top")    return Math.min(99, bottoms * shoes * 2);
  if (newCategory === "bottom") return Math.min(99, tops * shoes * 2);
  if (newCategory === "shoes")  return Math.min(99, tops * bottoms * 2);
  return 20;
}

export function getMissingPieces(items: Item[], gender: "male" | "female" = "male"): MissingPiece[] {
  if (items.length < 3) return [];

  const tops    = items.filter(i => i.category === "top");
  const bottoms = items.filter(i => i.category === "bottom");
  const shoes   = items.filter(i => i.category === "shoes");

  const topTypes    = tops.map(i => String(i.type).toLowerCase());
  const bottomTypes = bottoms.map(i => String(i.type).toLowerCase());
  const shoeTypes   = shoes.map(i => String(i.type).toLowerCase());
  const allColors   = items.map(i => String(i.color_family).toLowerCase());

  const hasOnlyNeutrals     = !allColors.some(c => !["neutral","black","white","earth"].includes(c));
  const tooManyCasualTops   = topTypes.filter(t => t.includes("tee") || t.includes("hoodie") || t.includes("tank")).length >= 3;
  const tooManyCasualBot    = bottomTypes.filter(t => t.includes("jean") || t.includes("jogger") || t.includes("sweat")).length >= 3;
  const tooManySneakers     = shoeTypes.filter(t => t.includes("sneaker") || t.includes("running")).length >= 2;

  const candidates: MissingPiece[] = [];

  if (gender === "female") {
    const hasBoots    = shoeTypes.some(t => t.includes("boot") || t.includes("ankle") || t.includes("chelsea"));
    const hasHeels    = shoeTypes.some(t => t.includes("heel") || t.includes("pump") || t.includes("mule"));
    const hasBlazer   = topTypes.some(t => t.includes("blazer"));
    const hasKnit     = topTypes.some(t => t.includes("knit") || t.includes("sweater") || t.includes("cardigan"));
    const hasMidi     = bottomTypes.some(t => t.includes("midi") || t.includes("skirt"));
    const hasTrousers = bottomTypes.some(t => t.includes("trouser") || t.includes("wide"));
    const hasLoafer   = shoeTypes.some(t => t.includes("loafer") || t.includes("flat") || t.includes("ballet"));

    if (tooManyCasualTops && !hasBlazer) candidates.push({
      title: "Oversized Blazer", category: "top",
      reason: `${tops.filter(t=>["tee","crop_top","tank","hoodie"].some(x=>t.type.includes(x))).length} casual tops but no blazer — transforms every outfit you already own instantly.`,
      tag: "Essential", priority: 9, impact: calcImpact(items, "top", "blazer"),
      searchQuery: "oversized blazer women neutral",
      affiliateUrl: amazonUrl("oversized blazer women beige neutral"),
    });

    if (!hasBoots) candidates.push({
      title: "Ankle Boots", category: "shoes",
      reason: "Works with jeans, skirts, midi dresses — the single most versatile shoe in womenswear.",
      tag: "Essential", priority: 9, impact: calcImpact(items, "shoes", "ankle_boots"),
      searchQuery: "ankle boots women black",
      affiliateUrl: amazonUrl("ankle boots women black"),
    });

    if (tooManyCasualBot && !hasMidi) candidates.push({
      title: "Midi Skirt", category: "bottom",
      reason: `${bottoms.filter(b=>["jeans","leggings","joggers"].some(x=>b.type.includes(x))).length} casual bottoms — a midi skirt adds range for dates, work, and evenings.`,
      tag: "Versatile", priority: 8, impact: calcImpact(items, "bottom", "midi_skirt"),
      searchQuery: "midi skirt women neutral satin",
      affiliateUrl: amazonUrl("midi skirt women neutral"),
    });

    if (!hasHeels && !hasMidi) candidates.push({
      title: "Block Heel Mules", category: "shoes",
      reason: "No elevated footwear. Mules work for dates, evenings, and office — polish any look effortlessly.",
      tag: "Upgrade", priority: 7, impact: calcImpact(items, "shoes", "mules"),
      searchQuery: "block heel mules women beige",
      affiliateUrl: amazonUrl("block heel mules women beige"),
    });

    if (!hasKnit && tops.length >= 2) candidates.push({
      title: "Fitted Knit Top", category: "top",
      reason: "Layers over everything, works year-round. The easiest way to add sophistication.",
      tag: "Versatile", priority: 7, impact: calcImpact(items, "top", "knit"),
      searchQuery: "fitted knit top women neutral",
      affiliateUrl: amazonUrl("knit top women neutral beige"),
    });

    if (!hasTrousers && bottoms.length >= 2) candidates.push({
      title: "Wide Leg Trousers", category: "bottom",
      reason: "No smart bottoms. Wide leg trousers work for work, dates, and casual — most versatile bottom right now.",
      tag: "Versatile", priority: 7, impact: calcImpact(items, "bottom", "trousers"),
      searchQuery: "wide leg trousers women neutral",
      affiliateUrl: amazonUrl("wide leg trousers women beige neutral"),
    });

    if (hasOnlyNeutrals && items.length >= 5) candidates.push({
      title: "Satin Slip Skirt", category: "bottom",
      reason: "Your wardrobe is all neutrals — a satin skirt in one accent color adds dimension without clashing.",
      tag: "Color", priority: 5, impact: calcImpact(items, "bottom", "midi_skirt"),
      searchQuery: "satin slip skirt women",
      affiliateUrl: amazonUrl("satin slip skirt women"),
    });

  } else {
    // MALE
    const hasSmartShoes = shoeTypes.some(t => t.includes("dress") || t.includes("loafer") || t.includes("chelsea") || t.includes("boot"));
    const hasSneakers   = shoeTypes.some(t => t.includes("sneaker"));
    const hasBlazer     = topTypes.some(t => t.includes("blazer"));
    const hasShirt      = topTypes.some(t => t.includes("shirt") || t.includes("polo"));
    const hasSweater    = topTypes.some(t => t.includes("sweater") || t.includes("crewneck") || t.includes("henley"));
    const hasChinos     = bottomTypes.some(t => t.includes("chino") || t.includes("trouser"));

    if (!hasSmartShoes) candidates.push({
      title: "Chelsea Boots", category: "shoes",
      reason: "No smart footwear. Chelsea boots unlock work, date, and night out looks — most versatile shoe in menswear.",
      tag: "Essential", priority: 9, impact: calcImpact(items, "shoes", "chelsea_boots"),
      searchQuery: "chelsea boots men black",
      affiliateUrl: amazonUrl("chelsea boots men black"),
    });

    if (tooManyCasualTops && !hasBlazer) candidates.push({
      title: "Navy Blazer", category: "top",
      reason: `${tops.filter(t=>["tee","hoodie","tank"].some(x=>t.type.includes(x))).length} casual tops but no blazer — makes every outfit you own look intentional.`,
      tag: "Essential", priority: 9, impact: calcImpact(items, "top", "blazer"),
      searchQuery: "navy blazer men slim fit",
      affiliateUrl: amazonUrl("navy blazer men slim fit"),
    });

    if (tooManyCasualBot && !hasChinos) candidates.push({
      title: "Slim Chinos", category: "bottom",
      reason: `${bottoms.filter(b=>["jeans","joggers","sweatpants"].some(x=>b.type.includes(x))).length} casual bottoms — chinos bridge casual and smart, most useful bottom in menswear.`,
      tag: "Essential", priority: 9, impact: calcImpact(items, "bottom", "chinos"),
      searchQuery: "slim chinos men khaki beige",
      affiliateUrl: amazonUrl("slim chinos men khaki"),
    });

    if (!hasBlazer && tops.length >= 2) candidates.push({
      title: "Navy Blazer", category: "top",
      reason: "Elevates every outfit instantly. Wear over tee, polo, or shirt — works for every non-gym occasion.",
      tag: "Upgrade", priority: 8, impact: calcImpact(items, "top", "blazer"),
      searchQuery: "navy blazer men slim fit",
      affiliateUrl: amazonUrl("navy blazer men slim fit"),
    });

    if (!hasShirt && tops.length > 0) candidates.push({
      title: "White Oxford Shirt", category: "top",
      reason: "No shirts. A white oxford is the single most versatile top in menswear — works for everything.",
      tag: "Essential", priority: 8, impact: calcImpact(items, "top", "shirt"),
      searchQuery: "white oxford shirt men slim fit",
      affiliateUrl: amazonUrl("white oxford shirt men slim fit"),
    });

    if (!hasSneakers) candidates.push({
      title: "White Leather Sneakers", category: "shoes",
      reason: "White sneakers work with literally everything casual — jeans, chinos, shorts. A wardrobe essential.",
      tag: "Essential", priority: 8, impact: calcImpact(items, "shoes", "sneakers"),
      searchQuery: "white leather sneakers men",
      affiliateUrl: amazonUrl("white leather sneakers men clean"),
    });

    if (!hasChinos && bottoms.length > 0) candidates.push({
      title: "Slim Chinos", category: "bottom",
      reason: "No smart bottoms. Chinos give you range that jeans alone cannot — from casual to business casual.",
      tag: "Versatile", priority: 7, impact: calcImpact(items, "bottom", "chinos"),
      searchQuery: "slim chinos men khaki beige",
      affiliateUrl: amazonUrl("slim chinos men khaki"),
    });

    if (!hasSweater && tops.length >= 2) candidates.push({
      title: "Neutral Crewneck Sweater", category: "top",
      reason: "A crewneck in grey, beige, or navy layers over everything and works year-round.",
      tag: "Versatile", priority: 6, impact: calcImpact(items, "top", "crewneck"),
      searchQuery: "crewneck sweater men neutral",
      affiliateUrl: amazonUrl("crewneck sweater men neutral beige"),
    });

    if (hasOnlyNeutrals && items.length >= 5) candidates.push({
      title: "Olive Chinos", category: "bottom",
      reason: "Entire wardrobe is neutrals — olive is the one earth tone that adds variety without ever clashing.",
      tag: "Color", priority: 5, impact: calcImpact(items, "bottom", "chinos"),
      searchQuery: "olive chinos men slim",
      affiliateUrl: amazonUrl("olive chinos men slim"),
    });
  }

  // Rendi sipas priority, pastaj impact — kthe top 3
  return candidates
    .sort((a, b) => b.priority !== a.priority ? b.priority - a.priority : b.impact - a.impact)
    .slice(0, 3);
}

// Backward compat — e mbajmë getMissingPiece për kodin ekzistues
export function getMissingPiece(items: Item[], gender: "male" | "female" = "male") {
  const pieces = getMissingPieces(items, gender);
  return pieces[0] ?? null;
}