"use client";

// ═══════════════════════════════════════════════════════════════════════════
// MissingPieceCard v2 — me Inditex integration
// V2: shton InditexShopRow poshtë kartës ekzistuese
// ═══════════════════════════════════════════════════════════════════════════

import type { MissingPiece } from "@/lib/engine/missingPiece";
import InditexShopRow from "@/components/InditexShopRow";

// Mapping: piece title/type → category që e njeh inditex/links.ts
function pieceToCategory(piece: MissingPiece): string {
  const title = piece.title.toLowerCase();

  // Tops
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
    <div className="space-y-3">
      {/* Original missing piece card */}
      <div className="rounded-2xl border border-black/8 bg-white p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Missing Piece</span>
            <h3 className="font-display text-lg font-black mt-0.5">{piece.title}</h3>
          </div>
          <span className="text-2xl flex-shrink-0">🧩</span>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed mb-4">{piece.reason}</p>

        {/* Original Amazon link (fallback) */}
        {piece.affiliateUrl && (
          <a
            href={piece.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl bg-black text-white px-4 py-3 hover:bg-black/85 transition active:scale-[0.98]"
          >
            <span className="text-sm font-bold">Shop on Amazon</span>
            <span className="text-sm">→</span>
          </a>
        )}
      </div>

      {/* NEW: Inditex brand options */}
      <InditexShopRow
        category={category}
        gender={gender}
        title={`${piece.title} te Inditex`}
        subtitle="Zgjidh nga brendet që e kanë këtë"
        compact={true}
      />
    </div>
  );
}