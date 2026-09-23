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

// IANA timezone -> ISO country code. Covers the timezones people in
// Amazon-marketplace countries actually have their devices set to - the
// old version only had 16 entries (mostly one big US/EU city each), so
// almost everyone outside those exact zones fell through to a language
// guess that usually resolved to the US. A user in Tokyo, Warsaw, or
// Dubai should land on their own local Amazon, not a random one.
const TZ_COUNTRY: Record<string, string> = {
  // North America
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US",
  "America/Los_Angeles": "US", "America/Anchorage": "US", "Pacific/Honolulu": "US",
  "America/Phoenix": "US", "America/Detroit": "US",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Edmonton": "CA",
  "America/Winnipeg": "CA", "America/Halifax": "CA",
  "America/Mexico_City": "MX", "America/Tijuana": "MX", "America/Monterrey": "MX",
  // UK & Ireland
  "Europe/London": "GB", "Europe/Belfast": "GB", "Europe/Dublin": "IE",
  // Western Europe
  "Europe/Berlin": "DE", "Europe/Munich": "DE", "Europe/Hamburg": "DE",
  "Europe/Paris": "FR", "Europe/Rome": "IT", "Europe/Milan": "IT",
  "Europe/Madrid": "ES", "Europe/Barcelona": "ES", "Europe/Lisbon": "PT",
  "Europe/Amsterdam": "NL", "Europe/Brussels": "BE", "Europe/Luxembourg": "LU",
  "Europe/Vienna": "AT", "Europe/Zurich": "CH", "Europe/Geneva": "CH",
  // Northern Europe
  "Europe/Stockholm": "SE", "Europe/Oslo": "NO", "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI", "Atlantic/Reykjavik": "IS",
  // Eastern & Southeastern Europe
  "Europe/Warsaw": "PL", "Europe/Prague": "CZ", "Europe/Bratislava": "SK",
  "Europe/Budapest": "HU", "Europe/Bucharest": "RO", "Europe/Sofia": "BG",
  "Europe/Zagreb": "HR", "Europe/Ljubljana": "SI", "Europe/Athens": "GR",
  "Europe/Istanbul": "TR", "Europe/Belgrade": "RS", "Europe/Tirane": "AL",
  "Europe/Sarajevo": "BA", "Europe/Skopje": "MK", "Europe/Podgorica": "ME",
  // Middle East
  "Asia/Dubai": "AE", "Asia/Riyadh": "SA", "Asia/Qatar": "QA",
  "Asia/Kuwait": "KW", "Asia/Bahrain": "BH", "Asia/Amman": "JO",
  "Asia/Beirut": "LB", "Asia/Jerusalem": "IL", "Africa/Cairo": "EG",
  // Asia
  "Asia/Tokyo": "JP", "Asia/Seoul": "KR", "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK", "Asia/Singapore": "SG", "Asia/Kolkata": "IN",
  "Asia/Bangkok": "TH", "Asia/Jakarta": "ID", "Asia/Manila": "PH",
  "Asia/Kuala_Lumpur": "MY", "Asia/Ho_Chi_Minh": "VN", "Asia/Taipei": "TW",
  // Oceania
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Brisbane": "AU",
  "Australia/Perth": "AU", "Australia/Adelaide": "AU", "Pacific/Auckland": "NZ",
  // South America
  "America/Sao_Paulo": "BR", "America/Buenos_Aires": "AR",
  "America/Santiago": "CL", "America/Bogota": "CO", "America/Lima": "PE",
  // Africa
  "Africa/Johannesburg": "ZA", "Africa/Lagos": "NG", "Africa/Nairobi": "KE",
  "Africa/Casablanca": "MA",
};

// Only the countries Amazon actually runs a local marketplace in. Anything
// else (most of the world, including Kosovo/Albania/most of the Balkans)
// correctly falls back to amazon.com, which ships internationally - that's
// the real answer there, not a bug to paper over with a guess.
const AMAZON_DOMAINS: Record<string, string> = {
  US: "amazon.com", GB: "amazon.co.uk", DE: "amazon.de", FR: "amazon.fr",
  IT: "amazon.it", ES: "amazon.es", CA: "amazon.ca", AU: "amazon.com.au",
  NL: "amazon.nl", JP: "amazon.co.jp", IN: "amazon.in", MX: "amazon.com.mx",
  BR: "amazon.com.br", SE: "amazon.se", PL: "amazon.pl", BE: "amazon.com.be",
  SG: "amazon.sg", AE: "amazon.ae", SA: "amazon.sa", TR: "amazon.com.tr",
  EG: "amazon.eg",
};

function amazonUrl(query: string): string {
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";
  const lang = typeof navigator !== "undefined" ? navigator.language : "en-US";
  const langCountry = lang.split("-")[1]?.toUpperCase();
  const country = TZ_COUNTRY[tz] ?? langCountry ?? "US";

  const domain = AMAZON_DOMAINS[country] ?? "amazon.com";
  // Single Associates tag - per-country tags need their own registered
  // Amazon Associates account for that marketplace, which this app only
  // has for one region right now. Using a made-up tag on a marketplace
  // it isn't registered in wouldn't track commission and could look
  // wrong, so every domain uses the one real tag until more are added.
  return `https://www.${domain}/s?k=${encodeURIComponent(query)}&tag=occaswear-20`;
}

// Sa kombinime të reja hap një item
// _newType: reserved for future per-type impact weighting, currently unused
function calcImpact(items: Item[], newCategory: string, _newType: string): number {
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

  const candidates: MissingPiece[] = [];

  if (gender === "female") {
    const hasBoots    = shoeTypes.some(t => t.includes("boot") || t.includes("ankle") || t.includes("chelsea"));
    const hasHeels    = shoeTypes.some(t => t.includes("heel") || t.includes("pump") || t.includes("mule"));
    const hasBlazer   = topTypes.some(t => t.includes("blazer"));
    const hasKnit     = topTypes.some(t => t.includes("knit") || t.includes("sweater") || t.includes("cardigan"));
    const hasMidi     = bottomTypes.some(t => t.includes("midi") || t.includes("skirt"));
    const hasTrousers = bottomTypes.some(t => t.includes("trouser") || t.includes("wide"));

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
      reason: `${bottoms.filter(b=>["jean","legging","jogger"].some(x=>b.type.includes(x))).length} casual bottoms — a midi skirt adds range for dates, work, and evenings.`,
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
      reason: `${bottoms.filter(b=>["jean","jogger","sweatpant"].some(x=>b.type.includes(x))).length} casual bottoms — chinos bridge casual and smart, most useful bottom in menswear.`,
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