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

  const hasOnlyNeutrals = !allColors.some(c => !["neutral","black","white","earth"].includes(c));
  const hasTooManyCasualTops = topTypes.filter(t => t.includes("tee") || t.includes("hoodie")).length >= 3;
  const hasTooManyCasualBottoms = bottomTypes.filter(t => t.includes("jeans") || t.includes("jogger")).length >= 3;
  const hasTooManySneakers = shoeTypes.filter(t => t.includes("sneaker") || t.includes("running")).length >= 2;

  if (gender === "female") {
    // Bazuar në atë çfarë ka — tregon çfarë mungon
    const hasBoots    = shoeTypes.some(t => t.includes("boot") || t.includes("ankle"));
    const hasHeels    = shoeTypes.some(t => t.includes("heel") || t.includes("pump") || t.includes("mule"));
    const hasFlats    = shoeTypes.some(t => t.includes("flat") || t.includes("ballet") || t.includes("loafer"));
    const hasBlazer   = topTypes.some(t => t.includes("blazer"));
    const hasKnit     = topTypes.some(t => t.includes("knit") || t.includes("sweater") || t.includes("cardigan"));
    const hasMidi     = bottomTypes.some(t => t.includes("midi"));
    const hasTrousers = bottomTypes.some(t => t.includes("trouser") || t.includes("wide"));

    // Nëse ka shumë casual tops por jo blazer
    if (hasTooManyCasualTops && !hasBlazer) return {
      title: "Oversized Blazer",
      reason: `You have ${topTypes.filter(t=>t.includes("tee")||t.includes("crop")||t.includes("tank")).length} casual tops but no blazer. One blazer transforms every outfit you already own.`,
      category: "top", priority: 9,
      searchQuery: "oversized blazer women neutral",
      affiliateUrl: amazonUrl("oversized blazer women beige neutral"),
    };

    // Nëse ka shumë jeans por jo midi
    if (hasTooManyCasualBottoms && !hasMidi) return {
      title: "Midi Skirt",
      reason: `You have ${bottomTypes.filter(t=>t.includes("jean")||t.includes("legging")).length} casual bottoms. A midi skirt instantly adds variety and works for every occasion.`,
      category: "bottom", priority: 9,
      searchQuery: "midi skirt women neutral satin",
      affiliateUrl: amazonUrl("midi skirt women neutral"),
    };

    // Nëse ka vetëm sneakers
    if (hasTooManySneakers && !hasBoots && !hasHeels) return {
      title: "Ankle Boots",
      reason: `Your shoe collection is all sneakers. Ankle boots open up work, date, and evening looks from your existing wardrobe.`,
      category: "shoes", priority: 9,
      searchQuery: "ankle boots women black",
      affiliateUrl: amazonUrl("ankle boots women black"),
    };

    // Nëse nuk ka heels dhe ka dress occasions
    if (!hasHeels && !hasBoots) return {
      title: "Block Heel Mules",
      reason: "No elevated footwear. Mules work for dates, evenings, and office — instantly polishing any look.",
      category: "shoes", priority: 8,
      searchQuery: "block heel mules women",
      affiliateUrl: amazonUrl("block heel mules women beige"),
    };

    // Nëse nuk ka knit/sweater
    if (!hasKnit && tops.length >= 2) return {
      title: "Fitted Knit Top",
      reason: "A neutral knit layers over everything and works year-round. It's the easiest way to add sophistication.",
      category: "top", priority: 7,
      searchQuery: "fitted knit top women neutral",
      affiliateUrl: amazonUrl("knit top women neutral beige"),
    };

    // Nëse nuk ka trousers
    if (!hasTrousers && bottoms.length >= 2) return {
      title: "Wide Leg Trousers",
      reason: "You have no smart bottoms. Wide leg trousers work for work, dates, and casual — the most versatile bottom right now.",
      category: "bottom", priority: 7,
      searchQuery: "wide leg trousers women neutral",
      affiliateUrl: amazonUrl("wide leg trousers women beige neutral"),
    };

    // Nëse krejt neutrale
    if (hasOnlyNeutrals && items.length >= 5) return {
      title: "Satin Slip Skirt",
      reason: "Your wardrobe is all neutrals. A satin skirt in one color accent adds dimension without clashing with anything you own.",
      category: "bottom", priority: 6,
      searchQuery: "satin slip skirt women",
      affiliateUrl: amazonUrl("satin slip skirt women"),
    };

    return {
      title: "Silk Scarf",
      reason: "A silk scarf worn around the neck, bag, or as a headband adds instant elegance to any look.",
      category: "accessory", priority: 5,
      searchQuery: "silk scarf women style",
      affiliateUrl: amazonUrl("silk scarf women"),
    };
  }

  // ── MALE ─────────────────────────────────────────────────────────────────
  const hasSmartShoes  = shoeTypes.some(t => t.includes("dress") || t.includes("loafer") || t.includes("chelsea") || t.includes("boot"));
  const hasSneakers    = shoeTypes.some(t => t.includes("sneaker"));
  const hasBlazer      = topTypes.some(t => t.includes("blazer"));
  const hasShirt       = topTypes.some(t => t.includes("shirt") || t.includes("polo"));
  const hasSweater     = topTypes.some(t => t.includes("sweater") || t.includes("crewneck") || t.includes("henley"));
  const hasChinos      = bottomTypes.some(t => t.includes("chino") || t.includes("trouser"));

  // Shumë casual tops por jo blazer
  if (hasTooManyCasualTops && !hasBlazer) return {
    title: "Navy Blazer",
    reason: `You have ${topTypes.filter(t=>t.includes("tee")||t.includes("hoodie")).length} casual tops but no blazer. One blazer makes every outfit you own look intentional.`,
    category: "top", priority: 9,
    searchQuery: "navy blazer men slim fit",
    affiliateUrl: amazonUrl("navy blazer men slim fit"),
  };

  // Shumë sneakers por jo smart shoes
  if (hasTooManySneakers && !hasSmartShoes) return {
    title: "Chelsea Boots",
    reason: `You have ${shoeTypes.filter(t=>t.includes("sneaker")||t.includes("running")).length} pairs of sneakers but nothing smart. Chelsea boots unlock work, date, and night out looks instantly.`,
    category: "shoes", priority: 9,
    searchQuery: "chelsea boots men black",
    affiliateUrl: amazonUrl("chelsea boots men black"),
  };

  // Shumë jeans por jo chinos
  if (hasTooManyCasualBottoms && !hasChinos) return {
    title: "Slim Chinos",
    reason: `You have ${bottomTypes.filter(t=>t.includes("jean")||t.includes("jogger")).length} casual bottoms but no chinos. Chinos bridge casual and smart — the most useful bottom in menswear.`,
    category: "bottom", priority: 9,
    searchQuery: "slim chinos men khaki beige",
    affiliateUrl: amazonUrl("slim chinos men khaki"),
  };

  // Nuk ka smart shoes
  if (!hasSmartShoes) return {
    title: "Chelsea Boots",
    reason: "No smart footwear in your wardrobe. Chelsea boots work for work, dates, and nights out — the single most versatile shoe in menswear.",
    category: "shoes", priority: 9,
    searchQuery: "chelsea boots men black",
    affiliateUrl: amazonUrl("chelsea boots men black"),
  };

  // Nuk ka blazer
  if (!hasBlazer && tops.length >= 2) return {
    title: "Navy Blazer",
    reason: "A blazer is the one piece that instantly elevates every outfit you already own. Wear it over a tee, polo, or shirt.",
    category: "top", priority: 8,
    searchQuery: "navy blazer men slim fit",
    affiliateUrl: amazonUrl("navy blazer men slim fit"),
  };

  // Nuk ka sneakers
  if (!hasSneakers) return {
    title: "White Leather Sneakers",
    reason: "White sneakers work with literally everything casual — jeans, chinos, shorts. A wardrobe essential.",
    category: "shoes", priority: 8,
    searchQuery: "white leather sneakers men",
    affiliateUrl: amazonUrl("white leather sneakers men clean"),
  };

  // Nuk ka shirt/polo
  if (!hasShirt && tops.length > 0) return {
    title: "White Oxford Shirt",
    reason: "You have no shirts. A white oxford works for every occasion — the single most versatile top in menswear.",
    category: "top", priority: 8,
    searchQuery: "white oxford shirt men slim fit",
    affiliateUrl: amazonUrl("white oxford shirt men slim fit"),
  };

  // Nuk ka chinos
  if (!hasChinos && bottoms.length > 0) return {
    title: "Slim Chinos",
    reason: "No smart bottoms. Chinos give you range that jeans alone cannot — from casual to business casual.",
    category: "bottom", priority: 7,
    searchQuery: "slim chinos men khaki beige",
    affiliateUrl: amazonUrl("slim chinos men khaki"),
  };

  // Nuk ka sweater
  if (!hasSweater && tops.length >= 2) return {
    title: "Neutral Crewneck Sweater",
    reason: "A crewneck in grey, beige, or navy layers over everything and works year-round.",
    category: "top", priority: 6,
    searchQuery: "crewneck sweater men neutral",
    affiliateUrl: amazonUrl("crewneck sweater men neutral beige"),
  };

  // Krejt neutrale
  if (hasOnlyNeutrals && items.length >= 5) return {
    title: "Olive Chinos",
    reason: "Your entire wardrobe is neutrals. Olive is the one earth tone that adds variety without ever clashing.",
    category: "bottom", priority: 6,
    searchQuery: "olive chinos men slim",
    affiliateUrl: amazonUrl("olive chinos men slim"),
  };

  return {
    title: "Minimalist Leather Watch",
    reason: "A clean watch completes every outfit. The one accessory that signals effort without trying.",
    category: "accessory", priority: 5,
    searchQuery: "minimalist watch men leather",
    affiliateUrl: amazonUrl("minimalist watch men leather black"),
  };
}