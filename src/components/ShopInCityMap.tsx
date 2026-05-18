"use client";

import * as React from "react";
import { BRAND_INFO, type InditexBrand } from "@/lib/inditex/links";

// ═══════════════════════════════════════════════════════════════════════════
// ShopInCityMap v4 — Google Maps embed me search te 5 brendet
// PUNON për KREJT qytetet e botës — Google Maps ka data komplete
// ═══════════════════════════════════════════════════════════════════════════

type Props = {
  city: string;
  onClose?: () => void;
};

const BRANDS: InditexBrand[] = ["zara", "massimo_dutti", "bershka", "pull_bear", "stradivarius"];

// Ndërto Google Maps search URL për një brand në qytet
function buildBrandSearchUrl(brand: InditexBrand, city: string): string {
  const brandName = BRAND_INFO[brand].name;
  const query = encodeURIComponent(`${brandName} ${city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

// Ndërto Google Maps search URL për KREJT brendet bashkë
function buildAllBrandsSearchUrl(city: string): string {
  const query = encodeURIComponent(`Zara OR Massimo Dutti OR Bershka OR Pull&Bear OR Stradivarius in ${city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

// Ndërto embed URL për një brand në qytet (përdoret te iframe pa key)
function buildEmbedUrl(brand: InditexBrand, city: string): string {
  const brandName = BRAND_INFO[brand].name;
  const query = encodeURIComponent(`${brandName} stores in ${city}`);
  return `https://www.google.com/maps?q=${query}&output=embed`;
}

function buildEmbedAllBrandsUrl(city: string): string {
  const query = encodeURIComponent(`Zara Massimo Dutti Bershka Pull Bear Stradivarius ${city}`);
  return `https://www.google.com/maps?q=${query}&output=embed`;
}

export default function ShopInCityMap({ city, onClose }: Props) {
  const [activeBrand, setActiveBrand] = React.useState<InditexBrand | "all">("all");

  const embedUrl = activeBrand === "all"
    ? buildEmbedAllBrandsUrl(city)
    : buildEmbedUrl(activeBrand, city);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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

        {/* Brand filter chips */}
        <div className="px-5 py-3 border-b border-black/8 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveBrand("all")}
              className={`rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition flex-shrink-0 ${
                activeBrand === "all"
                  ? "bg-black text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              All Brands
            </button>
            {BRANDS.map(brand => {
              const info = BRAND_INFO[brand];
              const active = activeBrand === brand;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setActiveBrand(brand)}
                  className={`rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition flex-shrink-0 active:scale-95 ${
                    active ? "shadow-md" : "hover:opacity-90"
                  }`}
                  style={{
                    background: active ? info.color : "transparent",
                    color: active ? info.textColor : info.color,
                    border: `1.5px solid ${info.color}`,
                  }}
                >
                  {info.name}
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
        <div className="px-5 py-3 border-t border-black/8 flex-shrink-0 flex gap-2">
          <a
            href={activeBrand === "all" ? buildAllBrandsSearchUrl(city) : buildBrandSearchUrl(activeBrand as InditexBrand, city)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl bg-black text-white px-4 py-3 text-sm font-bold text-center hover:bg-black/85 transition active:scale-[0.98]"
          >
            🗺️ Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}