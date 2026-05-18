"use client";

import * as React from "react";
import type { MissingPiece } from "@/lib/engine/missingPiece";
import {
  buildInditexLink,
  getBrandsForCategory,
  getCountryFromCoords,
  getCountryName,
  getManualCountry,
  BRAND_INFO,
  type Gender,
  type InditexBrand,
} from "@/lib/inditex/links";
import ShopInCityMap from "@/components/ShopInCityMap";

// ═══════════════════════════════════════════════════════════════════════════
// MissingPieceCard v5 — Hartë me pin me ngjyra + 1 button shop online
// ═══════════════════════════════════════════════════════════════════════════

function pieceToCategory(piece: MissingPiece): string {
  const title = piece.title.toLowerCase();
  if (title.includes("chelsea") || title.includes("ankle boot")) return "chelsea_boots";
  if (title.includes("loafer")) return "loafers";
  if (title.includes("oxford")) return "oxford";
  if (title.includes("derby")) return "derby";
  if (title.includes("boot")) return "boots";
  if (title.includes("sneaker")) return "sneakers";
  if (title.includes("chino")) return "chinos";
  if (title.includes("trouser") || title.includes("dress pant")) return "trousers";
  if (title.includes("jean")) return "jeans";
  if (title.includes("short")) return "shorts";
  if (title.includes("jogger") || title.includes("sweatpant")) return "joggers";
  if (title.includes("blazer")) return "blazer";
  if (title.includes("coat")) return "coat";
  if (title.includes("jacket")) return "jacket";
  if (title.includes("sweater") || title.includes("knit")) return "sweater";
  if (title.includes("hoodie")) return "hoodie";
  if (title.includes("sweatshirt")) return "sweatshirt";
  if (title.includes("shirt")) return "shirt";
  if (title.includes("polo")) return "polo";
  if (title.includes("tee") || title.includes("t-shirt")) return "tee";
  if (title.includes("watch")) return "watch";
  if (title.includes("belt")) return "belt";
  if (title.includes("sunglass")) return "sunglasses";
  return "tee";
}

export default function MissingPieceCard({
  piece,
  gender = "male",
}: {
  piece: MissingPiece;
  gender?: Gender;
}) {
  const category = pieceToCategory(piece);
  const [country, setCountry] = React.useState<string>("ES");
  const [userCity, setUserCity] = React.useState<string>("");
  const [showMap, setShowMap] = React.useState(false);

  // Detect country + city
  React.useEffect(() => {
    async function detect() {
      try {
        const manual = getManualCountry();
        if (manual) {
          setCountry(manual);
          setUserCity(getCountryName(manual));
          return;
        }

        const cached = typeof window !== "undefined" ? localStorage.getItem("occaswear_country") : null;
        const cachedCity = typeof window !== "undefined" ? localStorage.getItem("occaswear_city") : null;

        if (cached) setCountry(cached);
        if (cachedCity) {
          setUserCity(cachedCity);
          return;
        }

        if (typeof window !== "undefined" && "geolocation" in navigator) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 8000,
              maximumAge: 60 * 60 * 1000,
            });
          });

          const c = await getCountryFromCoords(pos.coords.latitude, pos.coords.longitude);
          setCountry(c);
          localStorage.setItem("occaswear_country", c);

          // Provo edhe qytetin
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=en&zoom=10`,
              { headers: { "Accept": "application/json" } }
            );
            if (res.ok) {
              const data = await res.json();
              const cityName = data?.address?.city || data?.address?.town || data?.address?.village || getCountryName(c);
              setUserCity(cityName);
              localStorage.setItem("occaswear_city", cityName);
            } else {
              setUserCity(getCountryName(c));
            }
          } catch {
            setUserCity(getCountryName(c));
          }
        }
      } catch {
        setUserCity("Spain");
      }
    }
    detect();
  }, []);

  const brands = getBrandsForCategory(category, gender);
  const primaryBrand: InditexBrand = brands[0] ?? "zara";
  const onlineUrl = buildInditexLink({ brand: primaryBrand, category, country, gender });

  return (
    <>
      <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Missing Piece
              </span>
              <h3 className="font-display text-lg font-black mt-0.5">{piece.title}</h3>
            </div>
            <span className="text-2xl flex-shrink-0">🧩</span>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed mb-3">{piece.reason}</p>

          {/* Brand chips me ngjyra */}
          {brands.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold py-1">Available at:</span>
              {brands.map(brand => {
                const info = BRAND_INFO[brand];
                return (
                  <span
                    key={brand}
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold flex items-center gap-1.5"
                    style={{
                      background: info.color,
                      color: info.textColor,
                      border: brand === "pull_bear" ? "1px solid #000" : "none",
                    }}
                  >
                    {info.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="p-3 pt-0 flex gap-2">
          {onlineUrl && (
            <a
              href={onlineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-xl bg-black text-white px-4 py-3 text-xs font-bold text-center hover:bg-black/85 transition active:scale-[0.98]"
            >
              🛒 Shop Online
            </a>
          )}
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="flex-1 rounded-xl border-2 border-black/10 px-4 py-3 text-xs font-bold text-center hover:bg-neutral-50 transition active:scale-[0.98]"
          >
            🗺️ Find Stores
          </button>
        </div>
      </div>

      {/* Hartë modal me pin me ngjyra */}
      {showMap && userCity && (
        <ShopInCityMap
          city={userCity}
          onClose={() => setShowMap(false)}
        />
      )}
    </>
  );
}