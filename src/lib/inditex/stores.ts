// src/lib/inditex/stores.ts
// ═══════════════════════════════════════════════════════════════════════════
// INDITEX STORE LOCATOR — OpenStreetMap Overpass API
// FALAS, pa API key, ~85-95% mbulim në EU
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
  distance?: number; // kilometra nga user (kalkulohet kur dihet user location)
};

// ─── BRAND NAMES për OSM query ──────────────────────────────────────────────
// OSM përdor field "brand" për dyqane. Këto janë variantet që duhen kontrolluar.
const BRAND_OSM_PATTERNS: Record<InditexBrand, string[]> = {
  zara: ["Zara"],
  massimo_dutti: ["Massimo Dutti", "Massimo  Dutti"],
  bershka: ["Bershka"],
  pull_bear: ["Pull&Bear", "Pull & Bear", "PULL&BEAR"],
  stradivarius: ["Stradivarius"],
};

// ─── CACHE për të mos thirrur API shumë herë ────────────────────────────────
const STORE_CACHE_KEY = "occaswear_inditex_stores_cache";
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 ditë

type CacheEntry = { timestamp: number; stores: InditexStore[] };

function getCachedStores(cityKey: string): InditexStore[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORE_CACHE_KEY}_${cityKey}`);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_DURATION_MS) return null;
    return entry.stores;
  } catch {
    return null;
  }
}

function setCachedStores(cityKey: string, stores: InditexStore[]): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = { timestamp: Date.now(), stores };
    localStorage.setItem(`${STORE_CACHE_KEY}_${cityKey}`, JSON.stringify(entry));
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN: fetchInditexStoresInCity — merr dyqane nga OSM për një qytet
// ═══════════════════════════════════════════════════════════════════════════
export async function fetchInditexStoresInCity(
  city: string,
  centerLat?: number,
  centerLon?: number
): Promise<InditexStore[]> {
  // Check cache
  const cacheKey = city.toLowerCase().replace(/\s+/g, "_");
  const cached = getCachedStores(cacheKey);
  if (cached) return cached;

  try {
    // Overpass QL query — kërkon brendet brenda qytetit
    // ose brenda 20km nga centerLat/Lon nëse jepen
    const brandRegex = "Zara|Bershka|Pull.*Bear|Massimo.*Dutti|Stradivarius";
    let query: string;

    if (centerLat !== undefined && centerLon !== undefined) {
      // Kërkim me radius (më i shpejtë)
      query = `
        [out:json][timeout:25];
        (
          node["brand"~"${brandRegex}",i](around:20000,${centerLat},${centerLon});
          way["brand"~"${brandRegex}",i](around:20000,${centerLat},${centerLon});
        );
        out center tags;
      `;
    } else {
      // Kërkim me emër qyteti
      query = `
        [out:json][timeout:25];
        area["name"~"^${city}$",i]->.searchArea;
        (
          node["brand"~"${brandRegex}",i](area.searchArea);
          way["brand"~"${brandRegex}",i](area.searchArea);
        );
        out center tags;
      `;
    }

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      console.error("[inditex/stores] Overpass error:", res.status);
      return [];
    }

    const data = await res.json();
    const elements: any[] = data.elements ?? [];

    const stores: InditexStore[] = [];
    for (const el of elements) {
      const brand = detectBrand(el.tags?.brand);
      if (!brand) continue;

      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (typeof lat !== "number" || typeof lon !== "number") continue;

      stores.push({
        id: `osm_${el.type}_${el.id}`,
        brand,
        name: el.tags?.name ?? brand,
        lat,
        lon,
        address: buildAddress(el.tags),
        city: el.tags?.["addr:city"],
      });
    }

    // Deduplicate (OSM ka ndonjë herë node + way për të njejtin dyqan)
    const seen = new Set<string>();
    const unique = stores.filter(s => {
      const key = `${s.brand}_${s.lat.toFixed(4)}_${s.lon.toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Cache rezultatet
    setCachedStores(cacheKey, unique);

    return unique;
  } catch (e) {
    console.error("[inditex/stores] Error:", e);
    return [];
  }
}

// ─── DETECT BRAND nga OSM tag ───────────────────────────────────────────────
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

// ─── BUILD ADDRESS string ───────────────────────────────────────────────────
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
// HAVERSINE DISTANCE — kalkulon distancën në km mes 2 pikave
// ═══════════════════════════════════════════════════════════════════════════
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Merr dyqanin më të afërt për çdo brend nga një listë
// ═══════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════
// GEOCODE CITY — merr lat/lng nga emri i qytetit
// Përdoret kur trip planner ka vetëm emrin e qytetit
// ═══════════════════════════════════════════════════════════════════════════
export async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.results?.[0];
    if (!result) return null;
    return { lat: result.latitude, lon: result.longitude };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Hap dyqanin te Google Maps për drejtime
// ═══════════════════════════════════════════════════════════════════════════
export function openInGoogleMaps(store: InditexStore): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lon}&destination_place_id=${store.brand}`;
}