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
  const encoded = encodeURIComponent(query);
  return `https://www.amazon.com/s?k=${encoded}&tag=outfitmirror-20`;
}

export function getMissingPiece(items: Item[]): MissingPiece | null {
  if (items.length < 3) return null;

  const tops = items.filter(i => i.category === "top");
  const bottoms = items.filter(i => i.category === "bottom");
  const shoes = items.filter(i => i.category === "shoes");

  const topTypes = tops.map(i => String(i.type).toLowerCase());
  const bottomTypes = bottoms.map(i => String(i.type).toLowerCase());
  const shoeTypes = shoes.map(i => String(i.type).toLowerCase());
  const allColors = items.map(i => String(i.color_family).toLowerCase());

  // 1. Nuk ka këpucë formale (chelsea/boots/loafers/dress)
  const hasFormalShoes = shoeTypes.some(t =>
    t.includes("dress") || t.includes("loafer") ||
    t.includes("chelsea") || t.includes("boot")
  );
  if (!hasFormalShoes) {
    return {
      title: "Chelsea Boots",
      reason: "You have no smart shoes. Chelsea boots work for work, dates, and night out — the single most versatile shoe a man can own.",
      category: "shoes",
      searchQuery: "chelsea boots men black",
      affiliateUrl: amazonUrl("chelsea boots men black"),
      priority: 9,
    };
  }

  // 2. Nuk ka blazer
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

  // 3. Nuk ka sneakers
  const hasSneakers = shoeTypes.some(t => t.includes("sneaker"));
  if (!hasSneakers) {
    return {
      title: "White Leather Sneakers",
      reason: "White sneakers are the most worn shoe in any wardrobe. They work with jeans, chinos, shorts — literally everything casual.",
      category: "shoes",
      searchQuery: "white leather sneakers men",
      affiliateUrl: amazonUrl("white leather sneakers men clean"),
      priority: 8,
    };
  }

  // 4. Nuk ka chinos/trousers - vetëm jeans
  const hasSmartBottom = bottomTypes.some(t =>
    t.includes("chino") || t.includes("trouser")
  );
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

  // 5. Nuk ka shirt/polo - vetëm tee/hoodie
  const hasSmartTop = topTypes.some(t =>
    t.includes("shirt") || t.includes("polo")
  );
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

  // 6. Garderoba totalisht neutrale - mungon ngjyra
  const hasColor = allColors.some(c =>
    !["neutral", "black", "white", "earth"].includes(c)
  );
  if (!hasColor && items.length >= 5) {
    return {
      title: "Earth Tone Chinos",
      reason: "Your entire wardrobe is neutrals. One earth tone piece — olive, tan, or camel — adds variety without ever clashing.",
      category: "bottom",
      searchQuery: "olive chinos men slim",
      affiliateUrl: amazonUrl("olive chinos men slim"),
      priority: 7,
    };
  }

  // 7. Nuk ka sweater/crewneck
  const hasSweater = topTypes.some(t =>
    t.includes("sweater") || t.includes("crewneck")
  );
  if (!hasSweater && tops.length >= 2) {
    return {
      title: "Neutral Crewneck Sweater",
      reason: "A crewneck in beige, grey, or navy works for every occasion. Wear it alone or layered — one of the most useful pieces in menswear.",
      category: "top",
      searchQuery: "crewneck sweater men neutral beige",
      affiliateUrl: amazonUrl("crewneck sweater men neutral"),
      priority: 6,
    };
  }

  // 8. Default - garderoba e mirë, sugjero aksesori
  return {
    title: "Minimalist Leather Watch",
    reason: "A clean watch completes every outfit. It signals effort without trying — the one accessory that works everywhere.",
    category: "accessory",
    searchQuery: "minimalist watch men leather black",
    affiliateUrl: amazonUrl("minimalist watch men leather"),
    priority: 5,
  };
}