"use client";

// ═══════════════════════════════════════════════════════════════════════════
// MissingPieceCard v3 — VETËM brendet (Zara, Massimo, Bershka, Pull&Bear, Stradivarius)
// Pa Amazon. Pa "Inditex" mention. Pa shqip.
// ═══════════════════════════════════════════════════════════════════════════

import type { MissingPiece } from "@/lib/engine/missingPiece";
import InditexShopRow from "@/components/InditexShopRow";

// Mapping: piece title/type → category që e njeh inditex/links.ts
function pieceToCategory(piece: MissingPiece): string {
  const title = piece.title.toLowerCase();

  // Shoes
  if (title.includes("chelsea") || title.includes("ankle boot")) return "chelsea_boots";
  if (title.includes("loafer")) return "loafers";
  if (title.includes("oxford")) return "oxford";
  if (title.includes("derby")) return "derby";
  if (title.includes("boot")) return "boots";
  if (title.includes("sneaker")) return "sneakers";

  // Bottoms
  if (title.includes("chino")) return "chinos";
  if (title.includes("trouser") || title.includes("dress pant")) return "trousers";
  if (title.includes("jean")) return "jeans";
  if (title.includes("short")) return "shorts";
  if (title.includes("jogger") || title.includes("sweatpant")) return "joggers";

  // Tops
  if (title.includes("blazer")) return "blazer";
  if (title.includes("coat")) return "coat";
  if (title.includes("jacket")) return "jacket";
  if (title.includes("sweater") || title.includes("knit")) return "sweater";
  if (title.includes("hoodie")) return "hoodie";
  if (title.includes("sweatshirt")) return "sweatshirt";
  if (title.includes("shirt")) return "shirt";
  if (title.includes("polo")) return "polo";
  if (title.includes("tee") || title.includes("t-shirt")) return "tee";

  // Accessories
  if (title.includes("watch")) return "watch";
  if (title.includes("belt")) return "belt";
  if (title.includes("sunglass")) return "sunglasses";

  // Default fallback
  return "tee";
}

export default function MissingPieceCard({
  piece,
  gender = "male",
}: {
  piece: MissingPiece;
  gender?: "male" | "female";
}) {
  const category = pieceToCategory(piece);

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
        <p className="text-xs text-neutral-500 leading-relaxed">{piece.reason}</p>
      </div>

      {/* Brand cards — pa Amazon */}
      <div className="px-5 pb-5">
        <InditexShopRow
          category={category}
          gender={gender}
          title="Shop this piece"
          subtitle="Choose from these brands"
          compact={true}
        />
      </div>
    </div>
  );
}