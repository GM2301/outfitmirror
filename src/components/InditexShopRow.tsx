"use client";

import * as React from "react";
import {
  buildInditexLink,
  getBrandsForCategory,
  getCountryFromCoords,
  getCountryName,
  BRAND_INFO,
  type InditexBrand,
  type Gender,
} from "@/lib/inditex/links";

// ═══════════════════════════════════════════════════════════════════════════
// InditexShopCard — Kartë e vetme për një brend
// ═══════════════════════════════════════════════════════════════════════════
function SingleBrandCard({
  brand,
  category,
  country,
  gender,
  color,
  compact = false,
}: {
  brand: InditexBrand;
  category: string;
  country: string;
  gender: Gender;
  color?: string;
  compact?: boolean;
}) {
  const info = BRAND_INFO[brand];
  const url = buildInditexLink({ brand, category, country, gender, color });

  if (!url) return null;

  const countryName = getCountryName(country);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex-shrink-0 overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
      style={{
        background: info.color,
        color: info.textColor,
        minWidth: compact ? "140px" : "160px",
        maxWidth: compact ? "140px" : "180px",
      }}
    >
      <div className="p-3 flex flex-col gap-2">
        {/* Logo + Name */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-lg font-bold text-sm flex-shrink-0"
            style={{
              width: "28px",
              height: "28px",
              background: info.textColor,
              color: info.color,
            }}
          >
            {info.logo}
          </div>
          <span className="font-bold text-xs uppercase tracking-wider truncate">
            {info.name}
          </span>
        </div>

        {/* Category */}
        <div className="text-xs opacity-80 capitalize">
          {category.replace(/_/g, " ")}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] uppercase tracking-widest opacity-70">
            Shop in {countryName}
          </span>
          <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </a>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// InditexShopRow — Rresht me karta për të gjitha brendet që e kanë kategorinë
// Përdoret te Missing Piece, For More Outfits
// ═══════════════════════════════════════════════════════════════════════════
export default function InditexShopRow({
  category,
  gender = "male",
  color,
  title = "Shop this piece",
  subtitle,
  compact = false,
}: {
  category: string;
  gender?: Gender;
  color?: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}) {
  const [country, setCountry] = React.useState<string>("ES");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Marrim country code nga geolocation
    async function detectCountry() {
      try {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
          // Provo nga localStorage cache first
          const cached = localStorage.getItem("occaswear_country");
          if (cached) {
            setCountry(cached);
            setLoading(false);
            return;
          }

          // Merr lat/lng
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 60 * 60 * 1000, // cache 1h
            });
          });

          const c = await getCountryFromCoords(pos.coords.latitude, pos.coords.longitude);
          setCountry(c);
          localStorage.setItem("occaswear_country", c);
        }
      } catch {
        // Fallback ES
        setCountry("ES");
      } finally {
        setLoading(false);
      }
    }
    detectCountry();
  }, []);

  // Gjej brendet që e kanë kategorinë
  const brands = getBrandsForCategory(category, gender);

  if (brands.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            🛍️ Inditex
          </span>
          <h3 className="font-display text-base font-black mt-0.5">{title}</h3>
          {subtitle && (
            <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Brand cards — scroll horizontal */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollSnapType: "x mandatory" }}>
        {loading ? (
          <div className="text-xs text-neutral-400 py-4">Loading...</div>
        ) : (
          brands.map(brand => (
            <div key={brand} style={{ scrollSnapAlign: "start" }}>
              <SingleBrandCard
                brand={brand}
                category={category}
                country={country}
                gender={gender}
                color={color}
                compact={compact}
              />
            </div>
          ))
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-neutral-400 mt-3 text-center">
        Klikon → hap dyqanin online te {getCountryName(country)}
      </p>
    </div>
  );
}