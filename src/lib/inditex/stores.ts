// src/lib/inditex/stores.ts
// ═══════════════════════════════════════════════════════════════════════════
// INDITEX STORE LOCATOR — Universal për krejt qytetet e botës
// Strategjia:
//   1. Nominatim: gjen qytetin + bounding box
//   2. Overpass: kërkon brendet brenda bbox (më e shpejtë se around)
//   3. Nëse 0 rezultate, ekspandon radius progresivisht (10→30→80→200 km)
//   4. Përdor disa selectors: brand, name, operator
//   5. Cache 7 ditë te localStorage
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

// ─── CACHE ──────────────────────────────────────────────────────────────────
const STORE_CACHE_KEY = "occaswear_inditex_stores_cache";
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 ditë

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
// GEOCODE CITY — kthen lat/lon + bounding box
// ═══════════════════════════════════════════════════════════════════════════
export async function geocodeCity(city: string): Promise<{
  lat: number;
  lon: number;
  bbox?: [number, number, number, number]; // [south, north, west, east]
} | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&accept-language=en`;
    console.log("[Inditex Stores] Geocoding:", url);

    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) {
      console.warn("[Inditex Stores] Geocode HTTP error:", res.status);
      return null;
    }

    const data = await res.json();
    const result = data?.[0];
    if (!result) {
      console.warn("[Inditex Stores] City not found:", city);
      return null;
    }

    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    // Nominatim kthen boundingbox si [south, north, west, east] me string
    let bbox: [number, number, number, number] | undefined;
    if (Array.isArray(result.boundingbox) && result.boundingbox.length === 4) {
      bbox = [
        parseFloat(result.boundingbox[0]),
        parseFloat(result.boundingbox[1]),
        parseFloat(result.boundingbox[2]),
        parseFloat(result.boundingbox[3]),
      ];
    }

    console.log("[Inditex Stores] Geocoded:", { lat, lon, bbox });
    return { lat, lon, bbox };
  } catch (e) {
    console.error("[Inditex Stores] Geocode error:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERPASS QUERY BUILDERS
// ═══════════════════════════════════════════════════════════════════════════
const BRAND_REGEX = "Zara|Bershka|Pull.*Bear|Pull&Bear|Massimo.*Dutti|Stradivarius";

function buildBboxQuery(bbox: [number, number, number, number]): string {
  const [s, n, w, e] = bbox;
  // Overpass bbox format: south,west,north,east
  return `[out:json][timeout:30];
  (
    node["brand"~"${BRAND_REGEX}",i](${s},${w},${n},${e});
    way["brand"~"${BRAND_REGEX}",i](${s},${w},${n},${e});
    node["name"~"${BRAND_REGEX}",i](${s},${w},${n},${e});
    way["name"~"${BRAND_REGEX}",i](${s},${w},${n},${e});
    node["operator"~"${BRAND_REGEX}",i](${s},${w},${n},${e});
    way["operator"~"${BRAND_REGEX}",i](${s},${w},${n},${e});
  );
  out center tags;`;
}

function buildRadiusQuery(lat: number, lon: number, radiusMeters: number): string {
  return `[out:json][timeout:30];
  (
    node["brand"~"${BRAND_REGEX}",i](around:${radiusMeters},${lat},${lon});
    way["brand"~"${BRAND_REGEX}",i](around:${radiusMeters},${lat},${lon});
    node["name"~"${BRAND_REGEX}",i](around:${radiusMeters},${lat},${lon});
    way["name"~"${BRAND_REGEX}",i](around:${radiusMeters},${lat},${lon});
    node["operator"~"${BRAND_REGEX}",i](around:${radiusMeters},${lat},${lon});
    way["operator"~"${BRAND_REGEX}",i](around:${radiusMeters},${lat},${lon});
  );
  out center tags;`;
}

async function executeOverpassQuery(query: string): Promise<any[]> {
  // Provo 2 Overpass endpoint-e për redundancy
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  for (const endpoint of endpoints) {
    try {
      console.log("[Inditex Stores] Querying:", endpoint);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!res.ok) {
        console.warn(`[Inditex Stores] ${endpoint} returned ${res.status}`);
        continue;
      }

      const data = await res.json();
      return data?.elements ?? [];
    } catch (e) {
      console.warn(`[Inditex Stores] ${endpoint} failed:`, e);
    }
  }

  return [];
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN: Universal store fetcher për KREJT qytetet e botës
// Strategjia progressive:
//   1. Cache hit → return immediately
//   2. Geocode → get bbox + lat/lon
//   3. Try bbox query first (më e saktë për qytete)
//   4. Nëse 0 rezultate, provo radius 30km (suburb-i)
//   5. Nëse 0 rezultate, provo radius 80km (metropolitan area)
//   6. Nëse 0 rezultate, provo radius 200km (regjion)
// ═══════════════════════════════════════════════════════════════════════════
export async function fetchInditexStoresInCity(
  city: string,
  centerLat?: number,
  centerLon?: number
): Promise<InditexStore[]> {
  console.log("[Inditex Stores] === FETCHING for:", city, "===");

  // 1. Cache
  const cached = getCachedStores(city);
  if (cached && cached.length > 0) {
    console.log("[Inditex Stores] ✓ Cache hit:", cached.length, "stores");
    return cached;
  }

  // 2. Get center + bbox
  let lat = centerLat;
  let lon = centerLon;
  let bbox: [number, number, number, number] | undefined;

  if (lat === undefined || lon === undefined) {
    const geo = await geocodeCity(city);
    if (!geo) {
      console.warn("[Inditex Stores] Could not geocode city");
      return [];
    }
    lat = geo.lat;
    lon = geo.lon;
    bbox = geo.bbox;
  }

  // 3. Strategy 1: BBOX query (më e shpejtë dhe e saktë për qytete)
  let elements: any[] = [];

  if (bbox) {
    console.log("[Inditex Stores] Strategy 1: bbox query");
    elements = await executeOverpassQuery(buildBboxQuery(bbox));
    console.log("[Inditex Stores] BBOX returned:", elements.length, "elements");
  }

  // 4. Strategy 2: Progressive radius nëse bbox dështoi
  if (elements.length === 0) {
    const radii = [30000, 80000, 200000]; // 30km, 80km, 200km
    for (const radius of radii) {
      console.log(`[Inditex Stores] Strategy 2: radius ${radius/1000}km`);
      elements = await executeOverpassQuery(buildRadiusQuery(lat, lon, radius));
      console.log(`[Inditex Stores] Radius ${radius/1000}km returned:`, elements.length, "elements");
      if (elements.length > 0) break;
    }
  }

  // 5. Parse rezultate
  const stores: InditexStore[] = [];
  for (const el of elements) {
    const brand = detectBrand(el.tags?.brand || el.tags?.name || el.tags?.operator);
    if (!brand) continue;

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

  // 6. Dedupe me lat/lon
  const seen = new Set<string>();
  const unique = stores.filter(s => {
    const key = `${s.brand}_${s.lat.toFixed(4)}_${s.lon.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log("[Inditex Stores] === FINAL:", unique.length, "unique stores ===");

  // 7. Cache (edhe nëse 0 — që mos i bëjmë API call përsëri pas 1 ore)
  if (unique.length > 0) {
    setCachedStores(city, unique);
  }

  return unique;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────
function detectBrand(osmBrand?: string): InditexBrand | null {
  if (!osmBrand) return null;
  const lower = osmBrand.toLowerCase();
  if (lower.includes("zara")) return "zara";
  if (lower.includes("massimo")) return "massimo_dutti";
  if (lower.includes("bershka")) return "bershka";
  if (lower.includes("pull") && lower.includes("bear")) return "pull_bear";
  if (lower.includes("stradivarius")) return "stradivarius";
  return null;
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
  const parts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:postcode"],
    tags["addr:city"],
  ].filter(Boolean);
  return parts.join(", ");
}

// ═══════════════════════════════════════════════════════════════════════════
// DISTANCE & NEAREST STORE
// ═══════════════════════════════════════════════════════════════════════════
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function getNearestStorePerBrand(
  stores: InditexStore[],
  userLat: number,
  userLon: number
): Partial<Record<InditexBrand, InditexStore>> {
  const result: Partial<Record<InditexBrand, InditexStore>> = {};
  for (const store of stores) {
    const dist = distanceKm(userLat, userLon, store.lat, store.lon);
    const existing = result[store.brand];
    if (!existing || (existing.distance ?? Infinity) > dist) {
      result[store.brand] = { ...store, distance: dist };
    }
  }
  return result;
}

export function openInGoogleMaps(store: InditexStore): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lon}`;
}