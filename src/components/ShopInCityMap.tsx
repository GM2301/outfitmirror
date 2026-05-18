"use client";

import * as React from "react";
import {
    fetchInditexStoresInCity,
    geocodeCity,
    distanceKm,
    openInGoogleMaps,
    type InditexStore,
  } from "@/lib/inditex/stores";
  import { BRAND_INFO, type InditexBrand } from "@/lib/inditex/links";
// ═══════════════════════════════════════════════════════════════════════════
// ShopInCityMap v5 — Leaflet me PIN ME NGJYRA për 5 brendet + LEGJENDË
// ═══════════════════════════════════════════════════════════════════════════

type Props = {
  city: string;
  onClose?: () => void;
};

const BRANDS: InditexBrand[] = ["zara", "massimo_dutti", "bershka", "pull_bear", "stradivarius"];

export default function ShopInCityMap({ city, onClose }: Props) {
  const [stores, setStores] = React.useState<InditexStore[]>([]);
  const [center, setCenter] = React.useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<InditexBrand | "all">("all");
  const mapRef = React.useRef<HTMLDivElement>(null);
  const leafletMapRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);

  // ─── FETCH stores ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const coords = await geocodeCity(city);
        if (!coords) {
          setError(`City "${city}" not found`);
          setLoading(false);
          return;
        }
        setCenter(coords);
        const fetched = await fetchInditexStoresInCity(city, coords.lat, coords.lon);
        setStores(fetched);
        if (fetched.length === 0) {
          setError("No stores found in OpenStreetMap. Use Google Maps buttons below.");
        }
      } catch (e: any) {
        setError(e.message ?? "Error loading map");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [city]);

  // ─── INIT Leaflet map ─────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!center || !mapRef.current || leafletMapRef.current) return;

    async function initMap() {
      const L = (await import("leaflet")).default;

      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current!).setView([center!.lat, center!.lon], 13);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
    }

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [center]);

  // ─── UPDATE markers when stores or filter change ──────────────────────────
  React.useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    async function updateMarkers() {
      const L = (await import("leaflet")).default;

      // Clear existing markers
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];

      // Filter stores
      const filtered = activeFilter === "all"
        ? stores
        : stores.filter(s => s.brand === activeFilter);

      // Add new markers
      for (const store of filtered) {
        const info = BRAND_INFO[store.brand];
        const borderColor = store.brand === "pull_bear" ? "#000000" : "#FFFFFF";

        const icon = L.divIcon({
          className: "custom-inditex-pin",
          html: `
            <div style="
              background: ${info.color};
              color: ${info.textColor};
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid ${borderColor};
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              font-size: 11px;
              font-weight: 900;
            "><span style="transform: rotate(45deg);">${info.logo}</span></div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        const marker = L.marker([store.lat, store.lon], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="min-width: 180px;">
            <div style="background: ${info.color}; color: ${info.textColor}; padding: 6px 10px; border-radius: 6px; font-weight: 700; font-size: 13px; margin-bottom: 6px; text-align: center;">
              ${info.name}
            </div>
            ${store.address ? `<div style="font-size: 11px; color: #666; margin-bottom: 8px;">${store.address}</div>` : ""}
            <a href="${openInGoogleMaps(store)}" target="_blank" rel="noopener noreferrer" style="display: block; background: #000; color: #fff; padding: 6px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: 700; text-align: center;">
              🗺️ Get Directions
            </a>
          </div>
        `);
        markersRef.current.push(marker);
      }

      // Fit bounds if we have markers
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        try {
          map.fitBounds(group.getBounds().pad(0.15));
        } catch {}
      }
    }

    updateMarkers();
  }, [stores, activeFilter]);

  const filteredStores = activeFilter === "all"
    ? stores
    : stores.filter(s => s.brand === activeFilter);

  // Count per brand
  const counts: Record<InditexBrand, number> = {
    zara: 0, massimo_dutti: 0, bershka: 0, pull_bear: 0, stradivarius: 0,
  };
  stores.forEach(s => { counts[s.brand]++; });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              🛍️ Shop in
            </span>
            <h2 className="font-display text-xl font-black mt-0.5">{city}</h2>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-full w-9 h-9 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 active:scale-95 transition">
            ✕
          </button>
        </div>

        {/* LEGEND + Filter chips */}
        <div className="px-5 py-3 border-b border-black/8 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`rounded-full px-3 py-2 text-xs font-bold whitespace-nowrap transition flex-shrink-0 active:scale-95 ${
                activeFilter === "all" ? "bg-black text-white shadow-md" : "bg-neutral-100 text-neutral-700"
              }`}
            >
              All ({stores.length})
            </button>
            {BRANDS.map(brand => {
              const info = BRAND_INFO[brand];
              const active = activeFilter === brand;
              const count = counts[brand];
              const borderColor = brand === "pull_bear" ? "#000000" : info.color;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setActiveFilter(brand)}
                  className="rounded-full px-3 py-2 text-xs font-bold whitespace-nowrap transition flex-shrink-0 active:scale-95 flex items-center gap-1.5"
                  style={{
                    background: active ? info.color : "transparent",
                    color: active ? info.textColor : "#1A1A1A",
                    border: `1.5px solid ${borderColor}`,
                    opacity: count === 0 ? 0.4 : 1,
                  }}
                >
                  {/* Color dot */}
                  <span
                    style={{
                      display: "inline-block",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: info.color,
                      border: brand === "pull_bear" ? "1px solid #000" : "none",
                    }}
                  />
                  <span>{info.name}</span>
                  <span style={{ opacity: 0.7 }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div className="relative flex-1 min-h-[320px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 z-10">
              <div className="text-sm text-neutral-500">Loading stores in {city}...</div>
            </div>
          )}
          {error && !loading && stores.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 p-6 text-center z-10">
              <div>
                <p className="text-sm text-neutral-500 mb-4">{error}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Zara Massimo Dutti Bershka Pull Bear Stradivarius ${city}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-xl bg-black text-white px-5 py-3 text-xs font-bold hover:bg-black/85 transition"
                >
                  🗺️ Open in Google Maps
                </a>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: "320px" }} />
        </div>

        {/* Store list */}
        {filteredStores.length > 0 && (
          <div className="border-t border-black/8 max-h-[180px] overflow-y-auto flex-shrink-0">
            <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 sticky top-0 bg-white">
              {filteredStores.length} {filteredStores.length === 1 ? "store" : "stores"}
            </div>
            {filteredStores
              .slice()
              .sort((a, b) => {
                if (!center) return 0;
                const dA = distanceKm(center.lat, center.lon, a.lat, a.lon);
                const dB = distanceKm(center.lat, center.lon, b.lat, b.lon);
                return dA - dB;
              })
              .map(store => {
                const info = BRAND_INFO[store.brand];
                const dist = center ? distanceKm(center.lat, center.lon, store.lat, store.lon) : 0;
                return (
                  <a
                    key={store.id}
                    href={openInGoogleMaps(store)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 active:bg-neutral-100 transition border-b border-black/4"
                  >
                    <div
                      className="flex items-center justify-center rounded-lg font-bold text-xs flex-shrink-0"
                      style={{
                        width: "36px",
                        height: "36px",
                        background: info.color,
                        color: info.textColor,
                        border: store.brand === "pull_bear" ? "1px solid #000" : "none",
                      }}
                    >
                      {info.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{info.name}</div>
                      {store.address && (
                        <div className="text-[11px] text-neutral-500 truncate">{store.address}</div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold">{dist.toFixed(1)} km</div>
                      <div className="text-[10px] text-neutral-400">directions →</div>
                    </div>
                  </a>
                );
              })}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-2 text-[10px] text-neutral-400 text-center border-t border-black/4 flex-shrink-0">
          © OpenStreetMap contributors
        </div>
      </div>
    </div>
  );
}