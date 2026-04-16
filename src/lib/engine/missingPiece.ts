// src/lib/engine/missingPiece.ts
import type { Item } from "./types";

export type AffiliateProduct = {
  title: string;
  price: string;
  store: string;
  url: string;
};

export type MissingPiece = {
  title: string;
  reason: string;
  category: string;
  priority: number;
  products: AffiliateProduct[];
};

const TAG = "outfitmirror-20";

function amazon(q: string) { return `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${TAG}`; }
function asos(q: string)   { return `https://www.asos.com/search/?q=${encodeURIComponent(q)}`; }
function zara(q: string)   { return `https://www.zara.com/us/en/search?searchTerm=${encodeURIComponent(q)}`; }

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
      title: "Ankle Boots", category: "shoes", priority: 9,
      reason: "Ankle boots work with everything — jeans, skirts, midi dresses. The most versatile shoe a woman can own.",
      products: [
        { title: "Sam Edelman Laguna Ankle Boot", price: "$80", store: "Amazon", url: amazon("sam edelman ankle boots women black") },
        { title: "ASOS DESIGN Ankle Boot", price: "$45", store: "ASOS", url: asos("ankle boots women black") },
        { title: "Steve Madden Ankle Boot", price: "$100", store: "Amazon", url: amazon("steve madden ankle boots women") },
      ],
    };

    if (!topTypes.some(t => t.includes("blazer")) && tops.length >= 2) return {
      title: "Oversized Blazer", category: "top", priority: 8,
      reason: "An oversized blazer elevates any outfit instantly — over a tee, dress, or with trousers.",
      products: [
        { title: "H&M Oversized Blazer", price: "$35", store: "ASOS", url: asos("oversized blazer women beige") },
        { title: "Zara Structured Blazer", price: "$70", store: "Zara", url: zara("blazer woman") },
        { title: "Amazon Essentials Blazer", price: "$40", store: "Amazon", url: amazon("oversized blazer women beige") },
      ],
    };

    if (!bottomTypes.some(t => t.includes("midi"))) return {
      title: "Midi Skirt", category: "bottom", priority: 8,
      reason: "A midi skirt is the most versatile bottom in womenswear. Dress it up or down.",
      products: [
        { title: "ASOS Satin Midi Skirt", price: "$30", store: "ASOS", url: asos("satin midi skirt women") },
        { title: "Zara Midi Skirt", price: "$50", store: "Zara", url: zara("midi skirt") },
        { title: "Amazon Flowy Midi Skirt", price: "$28", store: "Amazon", url: amazon("midi skirt women neutral") },
      ],
    };

    return {
      title: "Silk Scarf", category: "accessory", priority: 5,
      reason: "A silk scarf adds instant elegance to any look.",
      products: [
        { title: "ASOS Silk Scarf", price: "$20", store: "ASOS", url: asos("silk scarf women") },
        { title: "Amazon Silk Scarf", price: "$15", store: "Amazon", url: amazon("silk scarf women style") },
      ],
    };
  }

  // ── MALE ─────────────────────────────────────────────────────────────────
  if (!shoeTypes.some(t => t.includes("dress") || t.includes("loafer") || t.includes("chelsea") || t.includes("boot"))) return {
    title: "Chelsea Boots", category: "shoes", priority: 9,
    reason: "No smart shoes. Chelsea boots work for work, dates, and night out — the single most versatile shoe in menswear.",
    products: [
      { title: "Thursday Captain Chelsea Boot", price: "$199", store: "Amazon", url: amazon("thursday boot company chelsea men") },
      { title: "ASOS Chelsea Boot", price: "$55", store: "ASOS", url: asos("chelsea boots men black") },
      { title: "Amazon Essentials Chelsea", price: "$40", store: "Amazon", url: amazon("chelsea boots men black affordable") },
    ],
  };

  if (!topTypes.some(t => t.includes("blazer")) && tops.length >= 2) return {
    title: "Navy Blazer", category: "top", priority: 8,
    reason: "A blazer elevates any outfit. Wear over a tee, polo, or shirt — instantly 10x better.",
    products: [
      { title: "Zara Slim Fit Blazer", price: "$90", store: "Zara", url: zara("blazer man navy") },
      { title: "ASOS Slim Blazer", price: "$60", store: "ASOS", url: asos("navy blazer men slim") },
      { title: "Amazon Essentials Blazer", price: "$45", store: "Amazon", url: amazon("navy blazer men slim fit") },
    ],
  };

  if (!shoeTypes.some(t => t.includes("sneaker"))) return {
    title: "White Leather Sneakers", category: "shoes", priority: 8,
    reason: "White sneakers work with jeans, chinos, shorts — literally everything casual.",
    products: [
      { title: "Adidas Stan Smith", price: "$80", store: "Amazon", url: amazon("adidas stan smith white men") },
      { title: "ASOS Clean Sneaker", price: "$40", store: "ASOS", url: asos("white leather sneakers men") },
      { title: "Amazon Basics White Sneaker", price: "$30", store: "Amazon", url: amazon("white sneakers men clean minimal") },
    ],
  };

  if (!bottomTypes.some(t => t.includes("chino") || t.includes("trouser")) && bottoms.length > 0) return {
    title: "Slim Chinos", category: "bottom", priority: 7,
    reason: "Jeans alone limit your range. Chinos bridge casual and smart.",
    products: [
      { title: "Zara Slim Chinos", price: "$40", store: "Zara", url: zara("chinos man beige") },
      { title: "ASOS Slim Chinos", price: "$35", store: "ASOS", url: asos("slim chinos men khaki") },
      { title: "Amazon Essentials Chinos", price: "$25", store: "Amazon", url: amazon("slim chinos men khaki beige") },
    ],
  };

  if (!topTypes.some(t => t.includes("shirt") || t.includes("polo")) && tops.length > 0) return {
    title: "White Oxford Shirt", category: "top", priority: 8,
    reason: "A white shirt is the most versatile top. Works for work, dates, casual.",
    products: [
      { title: "Zara Oxford Shirt", price: "$35", store: "Zara", url: zara("oxford shirt man white") },
      { title: "ASOS Oxford Shirt", price: "$30", store: "ASOS", url: asos("white oxford shirt men slim") },
      { title: "Amazon Essentials Oxford", price: "$22", store: "Amazon", url: amazon("white oxford shirt men slim fit") },
    ],
  };

  if (!allColors.some(c => !["neutral","black","white","earth"].includes(c)) && items.length >= 5) return {
    title: "Earth Tone Chinos", category: "bottom", priority: 7,
    reason: "Your wardrobe is all neutrals. One earth tone adds variety without clashing.",
    products: [
      { title: "Zara Olive Trousers", price: "$40", store: "Zara", url: zara("chinos olive man") },
      { title: "ASOS Olive Slim Chinos", price: "$32", store: "ASOS", url: asos("olive chinos men slim") },
      { title: "Amazon Olive Chinos", price: "$26", store: "Amazon", url: amazon("olive chinos men slim") },
    ],
  };

  return {
    title: "Minimalist Leather Watch", category: "accessory", priority: 5,
    reason: "A clean watch completes every outfit. Signals effort without trying.",
    products: [
      { title: "Mvmt Chrono Watch", price: "$120", store: "Amazon", url: amazon("mvmt watch men minimalist") },
      { title: "Daniel Wellington 36mm", price: "$180", store: "Amazon", url: amazon("daniel wellington watch men") },
      { title: "Amazon Essentials Watch", price: "$28", store: "Amazon", url: amazon("minimalist watch men leather black") },
    ],
  };
}