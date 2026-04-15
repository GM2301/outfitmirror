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
    // 1. Nuk ka boots/ankle boots
    const hasBoots = shoeTypes.some(t => t.includes("boot"));
    if (!hasBoots) {
      return {
        title: "Ankle Boots",
        reason: "Ankle boots work with everything — jeans, skirts, midi dresses. The most versatile shoe a woman can own.",
        category: "shoes",
        searchQuery: "ankle boots women black",
        affiliateUrl: amazonUrl("ankle boots women black"),
        priority: 9,
      };
    }

    // 2. Nuk ka blazer
    const hasBlazer = topTypes.some(t => t.includes("blazer"));
    if (!hasBlazer && tops.length >= 2) {
      return {
        title: "Oversized Blazer",
        reason: "An oversized blazer elevates any outfit instantly — over a tee, dress, or with trousers. The ultimate layering piece.",
        category: "top",
        searchQuery: "oversized blazer women beige",
        affiliateUrl: amazonUrl("oversized blazer women beige"),
        priority: 8,
      };
    }

    // 3. Nuk ka midi skirt
    const hasMidi = bottomTypes.some(t => t.includes("midi"));
    if (!hasMidi && bottoms.length > 0) {
      return {
        title: "Midi Skirt",
        reason: "A midi skirt is the most versatile bottom in womenswear. Dress it up or down — it works for every occasion.",
        category: "bottom",
        searchQuery: "midi skirt women neutral",
        affiliateUrl: amazonUrl("midi skirt women neutral satin"),
        priority: 8,
      };
    }

    // 4. Nuk ka heels
    const hasHeels = shoeTypes.some(t => t.includes("heel") || t.includes("pump") || t.includes("mule"));
    if (!hasHeels) {
      return {
        title: "Block Heel Mules",
        reason: "A pair of mules elevates any outfit without the discomfort of stilettos. Perfect for date nights and dinners.",
        category: "shoes",
        searchQuery: "block heel mules women",
        affiliateUrl: amazonUrl("block heel mules women beige"),
        priority: 7,
      };
    }

    // 5. Garderoba totalisht neutrale
    const hasColor = allColors.some(c => !["neutral","black","white","earth"].includes(c));
    if (!hasColor && items.length >= 5) {
      return {
        title: "Camel Coat",
        reason: "A camel coat is the one outerwear piece that works over everything and never goes out of style.",
        category: "top",
        searchQuery: "camel coat women long",
        affiliateUrl: amazonUrl("camel coat women long"),
        priority: 7,
      };
    }

    return {
      title: "Silk Scarf",
      reason: "A silk scarf worn around the neck, bag, or hair adds instant elegance to any look.",
      category: "accessory",
      searchQuery: "silk scarf women style",
      affiliateUrl: amazonUrl("silk scarf women"),
      priority: 5,
    };
  }

  // ── MALE ──────────────────────────────────────────────────────────────────
  const hasFormalShoes = shoeTypes.some(t =>
    t.includes("dress") || t.includes("loafer") || t.includes("chelsea") || t.includes("boot")
  );
  if (!hasFormalShoes) {
    return {
      title: "Chelsea Boots",
      reason: "You have no smart shoes. Chelsea boots work for work, dates, and night out — the single most versatile shoe in menswear.",
      category: "shoes",
      searchQuery: "chelsea boots men black",
      affiliateUrl: amazonUrl("chelsea boots men black"),
      priority: 9,
    };
  }

  const hasBlazer = topTypes.some(t => t.includes("blazer"));
  if (!hasBlazer && tops.length >= 2) {
    return {
      title: "Navy Blazer",
      reason: "A blazer is the single item that elevates any outfit. Wear it over a tee, polo, or shirt — instantly 10x better.",
      category: "top",
      searchQuery: "navy blazer men slim fit",
      affiliateUrl: amazonUrl("navy blazer men slim fit"),
      priority: 8,
    };
  }

  const hasSneakers = shoeTypes.some(t => t.includes("sneaker"));
  if (!hasSneakers) {
    return {
      title: "White Leather Sneakers",
      reason: "White sneakers work with jeans, chinos, shorts — literally everything casual. The most worn shoe in any wardrobe.",
      category: "shoes",
      searchQuery: "white leather sneakers men",
      affiliateUrl: amazonUrl("white leather sneakers men clean"),
      priority: 8,
    };
  }

  const hasSmartBottom = bottomTypes.some(t => t.includes("chino") || t.includes("trouser"));
  if (!hasSmartBottom && bottoms.length > 0) {
    return {
      title: "Slim Chinos",
      reason: "Jeans alone limit your range. Chinos let you dress up or down — the bridge between casual and smart.",
      category: "bottom",
      searchQuery: "slim chinos men khaki beige",
      affiliateUrl: amazonUrl("slim chinos men khaki"),
      priority: 7,
    };
  }

  const hasSmartTop = topTypes.some(t => t.includes("shirt") || t.includes("polo"));
  if (!hasSmartTop && tops.length > 0) {
    return {
      title: "White Oxford Shirt",
      reason: "A white shirt is the most versatile top you can own. Works for work, dates, casual — nothing replaces it.",
      category: "top",
      searchQuery: "white oxford shirt men slim fit",
      affiliateUrl: amazonUrl("white oxford shirt men slim fit"),
      priority: 8,
    };
  }

  const hasColor = allColors.some(c => !["neutral","black","white","earth"].includes(c));
  if (!hasColor && items.length >= 5) {
    return {
      title: "Earth Tone Chinos",
      reason: "Your entire wardrobe is neutrals. One earth tone — olive, tan, or camel — adds variety without ever clashing.",
      category: "bottom",
      searchQuery: "olive chinos men slim",
      affiliateUrl: amazonUrl("olive chinos men slim"),
      priority: 7,
    };
  }

  const hasSweater = topTypes.some(t => t.includes("sweater") || t.includes("crewneck"));
  if (!hasSweater && tops.length >= 2) {
    return {
      title: "Neutral Crewneck Sweater",
      reason: "A crewneck in beige, grey, or navy works for every occasion. Wear alone or layered — one of the most useful pieces in menswear.",
      category: "top",
      searchQuery: "crewneck sweater men neutral beige",
      affiliateUrl: amazonUrl("crewneck sweater men neutral"),
      priority: 6,
    };
  }

  return {
    title: "Minimalist Leather Watch",
    reason: "A clean watch completes every outfit. It signals effort without trying — the one accessory that works everywhere.",
    category: "accessory",
    searchQuery: "minimalist watch men leather black",
    affiliateUrl: amazonUrl("minimalist watch men leather"),
    priority: 5,
  };
}