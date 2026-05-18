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
// ShopInCityMap — Hartë me dyqane Inditex në një qytet
// Përdor Leaflet (dinamikisht importuar — Next.js SSR compatibility)
// ═══════════════════════════════════════════════════════════════════════════

type Props = {
  city: string;          // emri i qytetit (p.sh. "Paris")
  countryCode?: string;  // opsional, ndihmon te disambiguation
  onClose?: () => void;
};

export default function ShopInCityMap({ city, countryCode, onClose }: Props) {
  const [stores, setStores] = React.useState<InditexStore[]>([]);
  const [center, setCenter] = React.useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedStore, setSelectedStore] = React.useState<InditexStore | null>(null);
  const mapRef = React.useRef<HTMLDivElement>(null);
  const leafletMapRef = React.useRef<any>(null);

  // ─── FETCH stores ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1. Gjej qendrën e qytetit
        const coords = await geocodeCity(city);
        if (!coords) {
          setError(`S'u gjet qyteti "${city}"`);
          setLoading(false);
          return;
        }
        setCenter(coords);

        // 2. Merr dyqane
        const fetched = await fetchInditexStoresInCity(city, coords.lat, coords.lon);
        setStores(fetched);

        if (fetched.length === 0) {
          setError(`S'ka dyqane Inditex te ${city} ne hartë (mund t'i shtoni manualisht ne OpenStreetMap)`);
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
      // Dynamic import për Next.js SSR
      const L = (await import("leaflet")).default;

      // CSS Leaflet (duhet të jetë importuar te globals.css ose layout)
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current!).setView([center!.lat, center!.lon], 13);

      // OSM tile layer (FALAS)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Shto pin për çdo dyqan
      for (const store of stores) {
        const brandInfo = BRAND_INFO[store.brand];
        const icon = L.divIcon({
          className: "custom-inditex-pin",
          html: `
            <div style="
              background: ${brandInfo.color};
              color: ${brandInfo.textColor};
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              font-size: 10px;
              font-weight: 900;
            "><span style="transform: rotate(45deg);">${brandInfo.logo}</span></div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const marker = L.marker([store.lat, store.lon], { icon }).addTo(map);
        marker.on("click", () => setSelectedStore(store));
        marker.bindTooltip(`${brandInfo.name}${store.name && store.name !== brandInfo.name ? ` - ${store.name}` : ""}`, { direction: "top" });
      }

      leafletMapRef.current = map;
    }

    initMap();

    // Cleanup
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [center, stores]);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              🛍️ Inditex Stores
            </span>
            <h2 className="font-display text-xl font-black mt-0.5">{city}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full w-9 h-9 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 active:scale-95 transition"
          >
            ✕
          </button>
        </div>

        {/* Map + Loading state */}
        <div className="relative flex-1 min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 z-10">
              <div className="text-sm text-neutral-500">Loading dyqane Inditex...</div>
            </div>
          )}
          {error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 p-6 text-center z-10">
              <p className="text-sm text-neutral-500">{error}</p>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: "300px" }} />
        </div>

        {/* Store list (bottom) */}
        {stores.length > 0 && (
          <div className="border-t border-black/8 max-h-[200px] overflow-y-auto flex-shrink-0">
            <div className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 sticky top-0 bg-white">
              {stores.length} dyqan{stores.length > 1 ? "e" : ""} në hartë
            </div>
            {stores
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
                      <div className="text-[10px] text-neutral-400">drejtimet →</div>
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