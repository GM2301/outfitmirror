"use client";

import * as React from "react";
import {
  buildInditexLink,
  getBrandsForCategory,
  getCountryFromCoords,
  getCountryName,
  getManualCountry,
  setManualCountry,
  SUPPORTED_COUNTRIES,
  BRAND_INFO,
  type InditexBrand,
  type Gender,
} from "@/lib/inditex/links";

// ═══════════════════════════════════════════════════════════════════════════
// CountryPicker — Modal për të zgjedhur vendin manualisht
// ═══════════════════════════════════════════════════════════════════════════
function CountryPicker({
  currentCountry,
  onClose,
  onSelect,
}: {
  currentCountry: string;
  onClose: () => void;
  onSelect: (code: string) => void;
}) {
  const [search, setSearch] = React.useState("");

  const filtered = SUPPORTED_COUNTRIES.filter(code => {
    const name = getCountryName(code).toLowerCase();
    return name.includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between">
          <h3 className="font-display text-lg font-black">Choose your country</h3>
          <button onClick={onClose}
            className="rounded-full w-8 h-8 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 transition">
            ✕
          </button>
        </div>
        <div className="px-5 py-3 border-b border-black/4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search country..."
            autoFocus
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/8"
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.map(code => (
            <button
              key={code}
              onClick={() => { onSelect(code); onClose(); }}
              className={`w-full text-left px-5 py-3 hover:bg-neutral-50 transition flex items-center justify-between border-b border-black/4 ${
                code === currentCountry ? "bg-black/5 font-bold" : ""
              }`}
            >
              <span className="text-sm">{getCountryName(code)}</span>
              <span className="text-xs text-neutral-400">{code}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-neutral-400">No countries found</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SingleBrandCard — Kartë e vetme për një brend
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

        <div className="text-xs opacity-80 capitalize">
          {category.replace(/_/g, " ")}
        </div>

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
  const [showPicker, setShowPicker] = React.useState(false);

  React.useEffect(() => {
    async function detectCountry() {
      try {
        // 1. Manual override (user-i e ka zgjedhur)
        const manual = getManualCountry();
        if (manual) {
          console.log("[Inditex] Manual country:", manual);
          setCountry(manual);
          setLoading(false);
          return;
        }

        // 2. Cache
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem("occaswear_country");
          if (cached) {
            console.log("[Inditex] Cached country:", cached);
            setCountry(cached);
            setLoading(false);
            return;
          }
        }

        // 3. Geolocation
        if (typeof window !== "undefined" && "geolocation" in navigator) {
          console.log("[Inditex] Requesting geolocation...");
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 8000,
              maximumAge: 60 * 60 * 1000,
            });
          });

          console.log("[Inditex] Got position:", pos.coords.latitude, pos.coords.longitude);
          const c = await getCountryFromCoords(pos.coords.latitude, pos.coords.longitude);
          console.log("[Inditex] Final country:", c);
          setCountry(c);
          localStorage.setItem("occaswear_country", c);
        } else {
          console.warn("[Inditex] No geolocation");
        }
      } catch (e) {
        console.error("[Inditex] Error:", e);
      } finally {
        setLoading(false);
      }
    }
    detectCountry();
  }, []);

  function handleCountryChange(code: string) {
    setManualCountry(code);
    setCountry(code);
  }

  const brands = getBrandsForCategory(category, gender);

  if (brands.length === 0) return null;

  return (
    <>
      <div className="rounded-2xl border border-black/8 bg-white p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              🛍️ Shop
            </span>
            <h3 className="font-display text-base font-black mt-0.5">{title}</h3>
            {subtitle && (
              <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
            )}
          </div>

          {/* Country selector — KEY FEATURE */}
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold hover:bg-neutral-50 transition flex items-center gap-1.5 flex-shrink-0"
          >
            <span>📍</span>
            <span>{getCountryName(country)}</span>
            <span className="text-neutral-400">▾</span>
          </button>
        </div>

        {/* Brand cards */}
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

        <p className="text-[10px] text-neutral-400 mt-3 text-center">
          Opens store in {getCountryName(country)}
        </p>
      </div>

      {showPicker && (
        <CountryPicker
          currentCountry={country}
          onClose={() => setShowPicker(false)}
          onSelect={handleCountryChange}
        />
      )}
    </>
  );
}