// src/lib/engine/missingPiece.ts
import type { Item } from "./types";

export type MissingPiece = {
  title: string;          // "Black Chelsea Boots"
  reason: string;         // "You have great tops but no versatile shoes"
  category: string;       // "shoes"
  searchQuery: string;    // për Amazon search
  affiliateUrl: string;   // Amazon link
  priority: number;       // 1-10, sa i rëndësishëm është
};

// Amazon search URL helper
function amazonUrl(query: string): string {
  const encoded = encodeURIComponent(query);
  // Placeholder - kur të kesh Amazon Associates tag, zëvendëso &tag=outfitmirror-20
  return `https://www.amazon.com/s?k=${encoded}&tag=outfitmirror-20`;
}

export function getMissingPiece(items: Item[]): MissingPiece | null {
  if (items.length === 0) return null;

  const tops = items.filter((i) => i.category === "top");
  const bottoms = items.filter((i) => i.category === "bottom");
  const shoes = items.filter((i) => i.category === "shoes");

  const topTypes = tops.map((i) => String(i.type).toLowerCase());
  const bottomTypes = bottoms.map((i) => String(i.type).toLowerCase());
  const shoeTypes = shoes.map((i) => String(i.type).toLowerCase());
  const allColors = items.map((i) => String(i.color_family).toLowerCase());

  // --- RREGULLAT E PRIORITETIT ---

  // 1. Nëse nuk ka asnjë këpucë formale/smartcasual
  const hasFormalShoes = shoeTypes.some(
    (t) => t.includes("dress") || t.includes("loafers") || t.includes("chelsea") || t.includes("boots")
  );
  if (!hasFormalShoes && shoes.length > 0) {
    return {
      title: "Chelsea Boots",
      reason: "A pair of chelsea boots works for work, dates, and night out — the most versatile shoe you can own.",
      category: "shoes",
      searchQuery: "chelsea boots men black",
      affiliateUrl: amazonUrl("chelsea boots men black"),
      priority: 9,
    };
  }

  // 2. Nëse nuk ka blazer/jacket
  const hasOuterLayer = topTypes.some(
    (t) => t.includes("blazer") || t.includes("jacket")
  );
  if (!hasOuterLayer && tops.length >= 2) {
    return {
      title: "Navy Blazer",
      reason: "A navy blazer instantly elevates any outfit — works over a tee, shirt, or polo.",
      category: "top",
      searchQuery: "navy blazer men slim fit",
      affiliateUrl: amazonUrl("navy blazer men slim fit"),
      priority: 8,
    };
  }

  // 3. Nëse të gjitha rrobat janë neutral - i mungon një colored piece
  const hasColor = allColors.some(
    (c) => !["neutral", "black", "white", "earth"].includes(c)
  );
  if (!hasColor && items.length >= 4) {
    return {
      title: "Earth Tone Chinos",
      reason: "Your wardrobe is all neutrals — one earth tone piece (olive, tan, camel) adds variety without clashing.",
      category: "bottom",
      searchQuery: "olive chinos men slim",
      affiliateUrl: amazonUrl("olive chinos men slim fit"),
      priority: 7,
    };
  }

  // 4. Nëse nuk ka chinos/trousers (vetëm jeans)
  const hasSmartBottom = bottomTypes.some(
    (t) => t.includes("chinos") || t.includes("trousers")
  );
  if (!hasSmartBottom && bottoms.length > 0) {
    return {
      title: "Slim Chinos",
      reason: "Chinos bridge the gap between casual and smart — jeans alone limit your outfit range.",
      category: "bottom",
      searchQuery: "slim chinos men khaki",
      affiliateUrl: amazonUrl("slim chinos men khaki"),
      priority: 7,
    };
  }

  // 5. Nëse nuk ka polo ose shirt (vetëm tee/hoodie)
  const hasSmartTop = topTypes.some(
    (t) => t.includes("polo") || t.includes("shirt") || t.includes("blazer")
  );
  if (!hasSmartTop && tops.length > 0) {
    return {
      title: "White Oxford Shirt",
      reason: "A white oxford shirt is the single most versatile top — works casual, work, and date night.",
      category: "top",
      searchQuery: "white oxford shirt men slim fit",
      affiliateUrl: amazonUrl("white oxford shirt men slim fit"),
      priority: 8,
    };
  }

  // 6. Nëse nuk ka sneakers të bardha
  const hasWhiteSneakers = shoeTypes.some(
    (t) => t.includes("sneaker")
  );
  if (!hasWhiteSneakers) {
    return {
      title: "White Sneakers",
      reason: "White sneakers go with literally everything — the most worn shoe in any wardrobe.",
      category: "shoes",
      searchQuery: "white sneakers men leather",
      affiliateUrl: amazonUrl("white sneakers men clean leather"),
      priority: 6,
    };
  }

  // 7. Default - nëse garderoba është e plotë por mund të ketë watch/belt
  return {
    title: "Minimalist Watch",
    reason: "A clean watch ties together any outfit and adds a polished touch without effort.",
    category: "accessory",
    searchQuery: "minimalist watch men black",
    affiliateUrl: amazonUrl("minimalist watch men black leather"),
    priority: 5,
  };
}