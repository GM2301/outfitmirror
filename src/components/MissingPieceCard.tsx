"use client";

import type { MissingPiece } from "@/lib/engine/missingPiece";

export default function MissingPieceCard({ piece }: { piece: MissingPiece }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Missing Piece</span>
          <h3 className="font-display text-lg font-black mt-0.5">{piece.title}</h3>
        </div>
        <span className="text-2xl flex-shrink-0">🧩</span>
      </div>
      <p className="text-xs text-neutral-500 leading-relaxed mb-4">{piece.reason}</p>
      <a href={piece.affiliateUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-between rounded-xl bg-black text-white px-4 py-3 hover:bg-black/85 transition active:scale-[0.98]">
        <span className="text-sm font-bold">Shop on Amazon</span>
        <span className="text-sm">→</span>
      </a>
    </div>
  );
}