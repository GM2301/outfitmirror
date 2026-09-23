"use client";

import type { MissingPiece } from "@/lib/engine/missingPiece";

export default function MissingPieceCard({ piece }: { piece: MissingPiece }) {
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
      </div>

      {/* CTA */}
      <div className="p-3 pt-0">
        <a
          href={piece.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl bg-black text-white px-4 py-3 text-xs font-bold text-center hover:bg-black/85 transition active:scale-[0.98]"
        >
          🛒 Shop Online
        </a>
      </div>
    </div>
  );
}
