// src/lib/engine/missingPiece.ts
import type { Item } from "./types";

export type MissingPiece = {
  title: string;
  reason: string;
  category: string;
  searchQuery: string;
  affiliateUrl: string;
  priority: number;
};

function amazonUrl(query: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=outfitmirror-20`;
}

export function getMissingPiece(items: Item[], gender: "male" | "female" = "male"): MissingPiece | null {
  if (items.length < 3) return null;

  const tops    = items.filter(i => i.category === "top");
  const bottoms = items.filter(i => i.category === "bottom");
  const shoes   = items.filter(i => i.category === "shoes");

  const topTypes    = tops.map(i => String(i.type).toLowerCase());
  const bottomTypes = bottoms.map(i => String(i.type).toLowerCase());
  const shoeTypes   = shoes.map(i => String(i.type).toLowerCase());
  const allColors   = items.map(i => String(i.color_family).toLowerCase());

  if (gender === "female") {
    if (!shoeTypes.some(t => t.includes("boot"))) return {
      title: "Ankle Boots",
      reason: "Ankle boots work with everything — jeans, skirts, midi dresses. The most versatile shoe a woman can own.",
      category: "shoes", priority: 9,
      searchQuery: "ankle boots women black",
      affiliateUrl: amazonUrl("ankle boots women black"),
    };
    if (!topTypes.some(t => t.includes("blazer")) && tops.length >= 2) return {
      title: "Oversized Blazer",
      reason: "An oversized blazer elevates any outfit instantly — over a tee, dress, or with trousers.",
      category: "top", priority: 8,
      searchQuery: "oversized blazer women beige",
      affiliateUrl: amazonUrl("oversized blazer women beige"),
    };
    if (!bottomTypes.some(t => t.includes("midi"))) return {
      title: "Midi Skirt",
      reason: "A midi skirt is the most versatile bottom in womenswear. Dress it up or down for every occasion.",
      category: "bottom", priority: 8,
      searchQuery: "midi skirt women neutral",
      affiliateUrl: amazonUrl("midi skirt women neutral satin"),
    };
    if (!shoeTypes.some(t => t.includes("heel") || t.includes("mule"))) return {
      title: "Block Heel Mules",
      reason: "A pair of mules elevates any outfit without the discomfort of stilettos.",
      category: "shoes", priority: 7,
      searchQuery: "block heel mules women",
      affiliateUrl: amazonUrl("block heel mules women beige"),
    };
    return {
      title: "Silk Scarf",
      reason: "A silk scarf worn around the neck or bag adds instant elegance to any look.",
      category: "accessory", priority: 5,
      searchQuery: "silk scarf women style",
      affiliateUrl: amazonUrl("silk scarf women"),
    };
  }

  // ── MALE ─────────────────────────────────────────────────────────────────
  if (!shoeTypes.some(t => t.includes("dress") || t.includes("loafer") || t.includes("chelsea") || t.includes("boot"))) return {
    title: "Chelsea Boots",
    reason: "You have no smart shoes. Chelsea boots work for work, dates, and night out — the single most versatile shoe in menswear.",
    category: "shoes", priority: 9,
    searchQuery: "chelsea boots men black",
    affiliateUrl: amazonUrl("chelsea boots men black"),
  };
  if (!topTypes.some(t => t.includes("blazer")) && tops.length >= 2) return {
    title: "Navy Blazer",
    reason: "A blazer elevates any outfit. Wear over a tee, polo, or shirt — instantly 10x better.",
    category: "top", priority: 8,
    searchQuery: "navy blazer men slim fit",
    affiliateUrl: amazonUrl("navy blazer men slim fit"),
  };
  if (!shoeTypes.some(t => t.includes("sneaker"))) return {
    title: "White Leather Sneakers",
    reason: "White sneakers work with jeans, chinos, shorts — literally everything casual.",
    category: "shoes", priority: 8,
    searchQuery: "white leather sneakers men",
    affiliateUrl: amazonUrl("white leather sneakers men clean"),
  };
  if (!bottomTypes.some(t => t.includes("chino") || t.includes("trouser")) && bottoms.length > 0) return {
    title: "Slim Chinos",
    reason: "Jeans alone limit your range. Chinos bridge casual and smart effortlessly.",
    category: "bottom", priority: 7,
    searchQuery: "slim chinos men khaki beige",
    affiliateUrl: amazonUrl("slim chinos men khaki"),
  };
  if (!topTypes.some(t => t.includes("shirt") || t.includes("polo")) && tops.length > 0) return {
    title: "White Oxford Shirt",
    reason: "A white shirt is the most versatile top. Works for work, dates, casual — nothing replaces it.",
    category: "top", priority: 8,
    searchQuery: "white oxford shirt men slim fit",
    affiliateUrl: amazonUrl("white oxford shirt men slim fit"),
  };
  if (!allColors.some(c => !["neutral","black","white","earth"].includes(c)) && items.length >= 5) return {
    title: "Earth Tone Chinos",
    reason: "Your wardrobe is all neutrals. One earth tone adds variety without ever clashing.",
    category: "bottom", priority: 7,
    searchQuery: "olive chinos men slim",
    affiliateUrl: amazonUrl("olive chinos men slim"),
  };
  if (!topTypes.some(t => t.includes("sweater") || t.includes("crewneck")) && tops.length >= 2) return {
    title: "Neutral Crewneck Sweater",
    reason: "A crewneck in beige, grey, or navy works for every occasion. Wear alone or layered.",
    category: "top", priority: 6,
    searchQuery: "crewneck sweater men neutral beige",
    affiliateUrl: amazonUrl("crewneck sweater men neutral"),
  };
  return {
    title: "Minimalist Leather Watch",
    reason: "A clean watch completes every outfit. Signals effort without trying.",
    category: "accessory", priority: 5,
    searchQuery: "minimalist watch men leather black",
    affiliateUrl: amazonUrl("minimalist watch men leather"),
  };
}