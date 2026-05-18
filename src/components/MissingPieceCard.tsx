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

// ═══════════════════════════════════════════════════════════════════════════
// MissingPieceCard v4 — Thjeshtësuar:
//   - Hartë e vogël Google Maps me 5 brendet (lokacioni i user-it)
//   - 1 button "Shop Online" për website zyrtar (auto-country)
//   - 1 button "Open Map" për Google Maps full
// ═══════════════════════════════════════════════════════════════════════════

// Mapping piece title → category
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
  const [userLocation, setUserLocation] = React.useState<string>("near you");
  const [loadingLocation, setLoadingLocation] = React.useState(true);

  // Detect location për lokacionin e hartës dhe country për website
  React.useEffect(() => {
    async function detect() {
      try {
        // 1. Manual override
        const manual = getManualCountry();
        if (manual) {
          setCountry(manual);
          setUserLocation(getCountryName(manual));
          setLoadingLocation(false);
          return;
        }

        // 2. Cache
        const cached = typeof window !== "undefined"
          ? localStorage.getItem("occaswear_country") : null;
        if (cached) {
          setCountry(cached);
          setUserLocation(getCountryName(cached));
          setLoadingLocation(false);
          return;
        }

        // 3. Geolocation
        if (typeof window !== "undefined" && "geolocation" in navigator) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 8000,
              maximumAge: 60 * 60 * 1000,
            });
          });

          const c = await getCountryFromCoords(pos.coords.latitude, pos.coords.longitude);
          setCountry(c);
          setUserLocation(getCountryName(c));
          localStorage.setItem("occaswear_country", c);
        }
      } catch {
        setUserLocation("Spain");
      } finally {
        setLoadingLocation(false);
      }
    }
    detect();
  }, []);

  // Brendet që e kanë kategorinë
  const brands = getBrandsForCategory(category, gender);

  // Google Maps embed me search "Zara Massimo Bershka..." te vendi i user-it
  const mapQuery = encodeURIComponent(
    `Zara Massimo Dutti Bershka Pull Bear Stradivarius ${userLocation}`
  );
  const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapFullUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  // Website online — provo brendin e parë që e ka kategorinë
  const primaryBrand: InditexBrand = brands[0] ?? "zara";
  const onlineUrl = buildInditexLink({
    brand: primaryBrand,
    category,
    country,
    gender,
  });

  return (
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

        {/* Brand chips që shesin këtë cope */}
        {brands.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold py-1">Available at:</span>
            {brands.map(brand => {
              const info = BRAND_INFO[brand];
              return (
                <span
                  key={brand}
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{
                    background: info.color,
                    color: info.textColor,
                  }}
                >
                  {info.name}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Google Maps mini embed */}
      <div className="relative" style={{ height: "200px" }}>
        {loadingLocation ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-50">
            <span className="text-xs text-neutral-400">Finding stores near you...</span>
          </div>
        ) : (
          <iframe
            src={mapEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Inditex stores in ${userLocation}`}
          />
        )}
      </div>

      {/* CTAs */}
      <div className="p-3 flex gap-2">
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
        <a
          href={mapFullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-xl border-2 border-black/10 px-4 py-3 text-xs font-bold text-center hover:bg-neutral-50 transition active:scale-[0.98]"
        >
          🗺️ Open Map
        </a>
      </div>
    </div>
  );
}