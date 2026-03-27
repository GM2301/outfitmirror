// src/components/MissingPieceCard.tsx
"use client";

import type { MissingPiece } from "@/lib/engine/missingPiece";

type Props = { piece: MissingPiece };

const categoryEmoji: Record<string, string> = {
  top: "👕", bottom: "👖", shoes: "👟", accessory: "⌚",
};

export default function MissingPieceCard({ piece }: Props) {
  return (
    <div className="rounded-2xl border border-black/10 bg-neutral-50 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Missing Piece
            </p>
            <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white font-bold">
              {piece.priority}/10
            </span>
          </div>
          <h3 className="text-lg font-bold text-black">{piece.title}</h3>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{piece.reason}</p>
        </div>
        <span className="text-3xl flex-shrink-0">{categoryEmoji[piece.category] ?? "🛍️"}</span>
      </div>

      <a
        href={piece.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-sm font-semibold text-white hover:bg-black/85 transition"
      >
        Shop {piece.title} on Amazon
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
      <p className="mt-2 text-center text-xs text-neutral-400">
        Affiliate link — we may earn a small commission
      </p>
    </div>
  );
}