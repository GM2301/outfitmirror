"use client";

import * as React from "react";
import type { MissingPiece } from "@/lib/engine/missingPiece";

const STORE_STYLE: Record<string, string> = {
  Amazon: "bg-amber-50 text-amber-800 border-amber-200",
  ASOS:   "bg-sky-50 text-sky-800 border-sky-200",
  Zara:   "bg-neutral-100 text-neutral-700 border-neutral-200",
};

type Props = {
  piece: MissingPiece;
  onDismiss?: () => void;    // "Not interested"
  onHaveIt?: () => void;     // "Already have it"
};

export default function MissingPieceCard({ piece, onDismiss, onHaveIt }: Props) {
  const [dismissed, setDismissed] = React.useState(false);
  const [hadIt, setHadIt] = React.useState(false);

  // Kontrollo nëse ky sugjerim është fshehur
  React.useEffect(() => {
    const dismissed = JSON.parse(localStorage.getItem("om_mp_dismissed") ?? "[]");
    if (dismissed.includes(piece.title)) setDismissed(true);
    const hadItems = JSON.parse(localStorage.getItem("om_mp_have") ?? "[]");
    if (hadItems.includes(piece.title)) setHadIt(true);
  }, [piece.title]);

  function handleDismiss() {
    const list = JSON.parse(localStorage.getItem("om_mp_dismissed") ?? "[]");
    if (!list.includes(piece.title)) {
      list.push(piece.title);
      localStorage.setItem("om_mp_dismissed", JSON.stringify(list));
    }
    setDismissed(true);
    onDismiss?.();
  }

  function handleHaveIt() {
    const list = JSON.parse(localStorage.getItem("om_mp_have") ?? "[]");
    if (!list.includes(piece.title)) {
      list.push(piece.title);
      localStorage.setItem("om_mp_have", JSON.stringify(list));
    }
    setHadIt(true);
    onHaveIt?.();
  }

  if (dismissed || hadIt) return null;

  return (
    <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-black/6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Missing Piece</span>
              <span className="rounded-full bg-black text-white px-2 py-0.5 text-xs font-bold">
                {piece.priority}/10
              </span>
            </div>
            <h3 className="font-display text-xl font-black">{piece.title}</h3>
          </div>
          <span className="text-2xl flex-shrink-0">🧩</span>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed mt-2">{piece.reason}</p>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={handleHaveIt}
            className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition active:scale-[0.96]">
            ✓ Already have it
          </button>
          <button type="button" onClick={handleDismiss}
            className="rounded-xl border border-black/10 px-3 py-2 text-xs font-semibold text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition active:scale-[0.96]">
            Not interested
          </button>
        </div>
      </div>

      {/* Products */}
      <div className="px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">
          Shop similar — {piece.products.length} options
        </p>
        <div className="flex flex-col gap-2">
          {piece.products.map((p, i) => (
            <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-black/8 px-4 py-3 hover:border-black/20 hover:bg-neutral-50 transition group active:scale-[0.98]">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`rounded-lg border px-2 py-0.5 text-xs font-bold flex-shrink-0 ${STORE_STYLE[p.store] ?? "bg-neutral-100 text-neutral-600 border-neutral-200"}`}>
                  {p.store}
                </span>
                <p className="text-sm font-medium truncate">{p.title}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-sm font-bold">{p.price}</span>
                <span className="text-neutral-300 group-hover:text-black transition text-sm">→</span>
              </div>
            </a>
          ))}
        </div>
        <p className="text-xs text-neutral-300 mt-3 text-center">
          Affiliate links — we may earn a small commission
        </p>
      </div>
    </div>
  );
}