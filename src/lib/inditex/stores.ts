// src/lib/inditex/stores.ts
// ═══════════════════════════════════════════════════════════════════════════
// INDITEX STORE LOCATOR — Universal v4
// Strategjia: kërko çdo brand veçmas (më shumë rezultate)
// + Bbox + progressive radius + 2 endpoints
// ═══════════════════════════════════════════════════════════════════════════

import type { InditexBrand } from "./links";

export type InditexStore = {
  id: string;
  brand: InditexBrand;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  city?: string;
  distance?: number;
};

const STORE_CACHE_KEY = "occaswear_inditex_stores_cache_v4";
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type CacheEntry = { timestamp: number; stores: InditexStore[] };

function cacheKey(city: string): string {
  return city.toLowerCase().trim().replace(/\s+/g, "_");
}

function getCachedStores(city: string): InditexStore[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORE_CACHE_KEY}_${cacheKey(city)}`);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_DURATION_MS) return null;
    return entry.stores;
  } catch { return null; }
}

function setCachedStores(city: string, stores: InditexStore[]): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = { timestamp: Date.now(), stores };
    localStorage.setItem(`${STORE_CACHE_KEY}_${cacheKey(city)}`, JSON.stringify(entry));
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════
// GEOCODE
// ═══════════════════════════════════════════════════════════════════════════
export async function geocodeCity(city: string): Promise<{
  lat: number;
  lon: number;
  bbox?: [number, number, number, number];
} | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&accept-language=en`;
    console.log("[Stores] Geocoding:", city);

    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.[0];
    if (!result) return null;

    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    let bbox: [number, number, number, number] | undefined;
    if (Array.isArray(result.boundingbox) && result.boundingbox.length === 4) {
      bbox = [
        parseFloat(result.boundingbox[0]),
        parseFloat(result.boundingbox[1]),
        parseFloat(result.boundingbox[2]),
        parseFloat(result.boundingbox[3]),
      ];
    }

    console.log("[Stores] Geocoded:", lat, lon, bbox);
    return { lat, lon, bbox };
  } catch (e) {
    console.error("[Stores] Geocode error:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PER-BRAND QUERY — kërkon ÇDO brand veçmas (më shumë rezultate)
// ═══════════════════════════════════════════════════════════════════════════
const BRAND_QUERIES: Record<InditexBrand, string> = {
  zara: "Zara",
  massimo_dutti: "Massimo Dutti",
  bershka: "Bershka",
  pull_bear: "Pull.?Bear|Pull and Bear|Pull&Bear|Pullbear",
  stradivarius: "Stradivarius",
};

function buildSingleBrandQuery(
  brand: InditexBrand,
  spec: { type: "bbox"; bbox: [number, number, number, number] } | { type: "radius"; lat: number; lon: number; radius: number }
): string {
  const pattern = BRAND_QUERIES[brand];
  const filter = spec.type === "bbox"
    ? `(${spec.bbox[0]},${spec.bbox[2]},${spec.bbox[1]},${spec.bbox[3]})`
    : `(around:${spec.radius},${spec.lat},${spec.lon})`;

  return `[out:json][timeout:25];
  (
    node["brand"~"${pattern}",i]${filter};
    way["brand"~"${pattern}",i]${filter};
    node["name"~"${pattern}",i]${filter};
    way["name"~"${pattern}",i]${filter};
    node["operator"~"${pattern}",i]${filter};
    way["operator"~"${pattern}",i]${filter};
  );
  out center tags;`;
}

async function executeOverpass(query: string): Promise<any[]> {
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) continue;
      const data = await res.json();
      return data?.elements ?? [];
    } catch {}
  }
  return [];
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN: Fetch krejt 5 brendet veçmas, kombinoji
// ═══════════════════════════════════════════════════════════════════════════
export async function fetchInditexStoresInCity(
  city: string,
  centerLat?: number,
  centerLon?: number
): Promise<InditexStore[]> {
  console.log("[Stores] === FETCHING:", city, "===");

  const cached = getCachedStores(city);
  if (cached && cached.length > 0) {
    console.log("[Stores] ✓ Cache:", cached.length);
    return cached;
  }

  // Get center
  let lat = centerLat;
  let lon = centerLon;
  let bbox: [number, number, number, number] | undefined;

  if (lat === undefined || lon === undefined) {
    const geo = await geocodeCity(city);
    if (!geo) return [];
    lat = geo.lat;
    lon = geo.lon;
    bbox = geo.bbox;
  }

  // Strategy: ekzekuto 5 query paralele (një për brand)
  // Pastaj progressive radius nëse 0 për ndonjë
  const allBrands: InditexBrand[] = ["zara", "massimo_dutti", "bershka", "pull_bear", "stradivarius"];

  console.log("[Stores] Querying 5 brands in parallel...");

  // 1. Provo BBOX
  let allResults: { brand: InditexBrand; elements: any[] }[] = [];

  if (bbox) {
    const promises = allBrands.map(async brand => {
      const elements = await executeOverpass(buildSingleBrandQuery(brand, { type: "bbox", bbox: bbox! }));
      console.log(`[Stores] BBOX ${brand}: ${elements.length}`);
      return { brand, elements };
    });
    allResults = await Promise.all(promises);
  }

  // 2. Nëse total është i vogël (<3), provo radius
  const totalFromBbox = allResults.reduce((sum, r) => sum + r.elements.length, 0);
  if (totalFromBbox < 3) {
    console.log("[Stores] Few results, trying radius...");

    const radii = [30000, 80000, 200000];
    for (const radius of radii) {
      const promises = allBrands.map(async brand => {
        const elements = await executeOverpass(buildSingleBrandQuery(brand, { type: "radius", lat: lat!, lon: lon!, radius }));
        console.log(`[Stores] ${radius / 1000}km ${brand}: ${elements.length}`);
        return { brand, elements };
      });
      const results = await Promise.all(promises);
      const total = results.reduce((sum, r) => sum + r.elements.length, 0);
      if (total > totalFromBbox) {
        allResults = results;
      }
      if (total >= 5) break;
    }
  }

  // Parse + kombinoj
  const stores: InditexStore[] = [];
  for (const { brand, elements } of allResults) {
    for (const el of elements) {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (typeof elLat !== "number" || typeof elLon !== "number") continue;

      stores.push({
        id: `osm_${el.type}_${el.id}`,
        brand,
        name: el.tags?.name ?? brandDisplayName(brand),
        lat: elLat,
        lon: elLon,
        address: buildAddress(el.tags),
        city: el.tags?.["addr:city"],
      });
    }
  }

  // Dedupe
  const seen = new Set<string>();
  const unique = stores.filter(s => {
    const key = `${s.brand}_${s.lat.toFixed(4)}_${s.lon.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log("[Stores] === FINAL:", unique.length, "stores ===");

  if (unique.length > 0) {
    setCachedStores(city, unique);
  }

  return unique;
}

function brandDisplayName(brand: InditexBrand): string {
  switch (brand) {
    case "zara": return "Zara";
    case "massimo_dutti": return "Massimo Dutti";
    case "bershka": return "Bershka";
    case "pull_bear": return "Pull&Bear";
    case "stradivarius": return "Stradivarius";
  }
}

function buildAddress(tags: any): string {
  if (!tags) return "";
  const parts = [tags["addr:street"], tags["addr:housenumber"], tags["addr:postcode"], tags["addr:city"]].filter(Boolean);
  return parts.join(", ");
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function openInGoogleMaps(store: InditexStore): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lon}`;
}

// Hap Google Maps search (kërkim me emër + qytet, jo coords) - fallback
export function openInGoogleMapsSearch(brand: InditexBrand, city?: string): string {
  const name = brandDisplayName(brand);
  const query = city ? `${name} ${city}` : name;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}