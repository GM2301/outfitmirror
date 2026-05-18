"use client";

import * as React from "react";
import { BRAND_INFO, type InditexBrand } from "@/lib/inditex/links";

// ═══════════════════════════════════════════════════════════════════════════
// ShopInCityMap v6 — Google Maps embed me filter chips me ngjyra
// PUNON për KREJT qytetet e botës — Google Maps ka data komplete
// ═══════════════════════════════════════════════════════════════════════════

type Props = {
  city: string;
  onClose?: () => void;
};

const BRANDS: InditexBrand[] = ["zara", "massimo_dutti", "bershka", "pull_bear", "stradivarius"];

// Google Maps embed URL — search për një brand në qytet
function buildEmbedUrl(brand: InditexBrand | "all", city: string): string {
  const cleanCity = city.split(",")[0].trim();

  if (brand === "all") {
    // Search për krejt brendet bashkë
    const query = encodeURIComponent(`Zara Massimo Dutti Bershka Pull Bear Stradivarius ${cleanCity}`);
    return `https://www.google.com/maps?q=${query}&output=embed`;
  }

  const brandName = BRAND_INFO[brand].name;
  const query = encodeURIComponent(`${brandName} ${cleanCity}`);
  return `https://www.google.com/maps?q=${query}&output=embed`;
}

// Open in Google Maps (full screen, jashtë app)
function buildOpenUrl(brand: InditexBrand | "all", city: string): string {
  const cleanCity = city.split(",")[0].trim();

  if (brand === "all") {
    const query = encodeURIComponent(`Zara Massimo Dutti Bershka Pull Bear Stradivarius ${cleanCity}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  const brandName = BRAND_INFO[brand].name;
  const query = encodeURIComponent(`${brandName} ${cleanCity}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export default function ShopInCityMap({ city, onClose }: Props) {
  const [activeBrand, setActiveBrand] = React.useState<InditexBrand | "all">("all");

  const embedUrl = buildEmbedUrl(activeBrand, city);
  const openUrl = buildOpenUrl(activeBrand, city);

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
          <button
            type="button"
            onClick={onClose}
            className="rounded-full w-9 h-9 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 active:scale-95 transition"
          >
            ✕
          </button>
        </div>

        {/* Brand filter chips me NGJYRA */}
        <div className="px-5 py-3 border-b border-black/8 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-2">
            {/* "All Brands" chip */}
            <button
              type="button"
              onClick={() => setActiveBrand("all")}
              className={`rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition flex-shrink-0 active:scale-95 ${
                activeBrand === "all"
                  ? "bg-black text-white shadow-md"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              All Brands
            </button>

            {/* Individual brand chips me ngjyrë unike */}
            {BRANDS.map(brand => {
              const info = BRAND_INFO[brand];
              const active = activeBrand === brand;
              const borderColor = brand === "pull_bear" ? "#000000" : info.color;

              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setActiveBrand(brand)}
                  className="rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition flex-shrink-0 active:scale-95 flex items-center gap-1.5"
                  style={{
                    background: active ? info.color : "transparent",
                    color: active ? info.textColor : "#1A1A1A",
                    border: `1.5px solid ${borderColor}`,
                    boxShadow: active ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
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
                      flexShrink: 0,
                    }}
                  />
                  <span>{info.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Google Maps embed iframe */}
        <div className="flex-1 relative min-h-[400px]">
          <iframe
            key={`${activeBrand}-${city}`}
            src={embedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            title={`${activeBrand === "all" ? "All Inditex brands" : BRAND_INFO[activeBrand as InditexBrand].name} in ${city}`}
          />
        </div>

        {/* CTA bar */}
        <div className="px-5 py-3 border-t border-black/8 flex-shrink-0">
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-xl bg-black text-white px-4 py-3 text-sm font-bold text-center hover:bg-black/85 transition active:scale-[0.98]"
          >
            🗺️ Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}