// src/components/MissingPieceCard.tsx
"use client";

import type { MissingPiece } from "@/lib/engine/missingPiece";

type Props = {
  piece: MissingPiece;
};

const categoryEmoji: Record<string, string> = {
  top: "👕",
  bottom: "👖",
  shoes: "👟",
  accessory: "⌚",
};

export default function MissingPieceCard({ piece }: Props) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-black/20 bg-neutral-50 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Missing Piece
            </span>
            <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
              #{piece.priority}/10
            </span>
          </div>
          <h3 className="mt-1 text-xl font-semibold">{piece.title}</h3>
        </div>
        <span className="text-3xl">{categoryEmoji[piece.category] ?? "🛍️"}</span>
      </div>

      {/* Reason */}
      <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
        {piece.reason}
      </p>

      {/* CTA */}
      <a
        href={piece.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm text-white hover:bg-black/90 transition"
      >
        🛍️ Shop {piece.title} on Amazon
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