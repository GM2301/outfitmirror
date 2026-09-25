"use client";

import * as React from "react";
import type { Gender, Item } from "@/lib/engine/types";
import type { SavedLook } from "@/lib/savedLooks";

function pretty(s?: string) {
  return (s ?? "").replace(/_/g, " ");
}

// Looks the user saved with ♥ - stored on the server (saved_looks), shown
// with the actual pieces. Items deleted from the wardrobe since are skipped.
export default function StyleHistory({ looks, items, gender, onDelete }: {
  looks: SavedLook[];
  items: Item[];
  gender: Gender;
  onDelete: (id: string) => void;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const byId = React.useMemo(() => new Map(items.map(i => [i.id, i])), [items]);
  const withPieces = looks
    .map(l => ({ look: l, pieces: l.item_ids.map(id => byId.get(id)).filter((x): x is Item => !!x) }))
    .filter(x => x.pieces.length >= 2);

  if (withPieces.length === 0) return null;
  const visible = showAll ? withPieces : withPieces.slice(0, 3);

  return (
    <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-black/6">
        <h3 className="font-display font-black text-base">Saved looks</h3>
        <p className="text-xs text-neutral-400 mt-0.5">{withPieces.length} look{withPieces.length === 1 ? "" : "s"} you saved with ♥</p>
      </div>

      <div className="divide-y divide-black/5">
        {visible.map(({ look, pieces }) => (
          <div key={look.id} className="px-5 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold capitalize">{pretty(look.occasion)}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">
                  {new Date(look.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <button type="button" aria-label="Remove saved look"
                  onClick={() => { if (window.confirm("Remove this saved look?")) onDelete(look.id); }}
                  className="text-xs text-neutral-300 hover:text-red-500 transition">✕</button>
              </div>
            </div>
            <div className="flex gap-1.5">
              {pieces.map(p => (
                <div key={p.id} className="w-14 h-14 rounded-xl bg-neutral-50 overflow-hidden flex items-center justify-center flex-shrink-0" title={`${p.color_family} ${pretty(p.type)}`}>
                  {p.image_url
                    ? <img src={p.image_url} alt={pretty(p.type)} loading="lazy" className="w-full h-full object-contain p-1" />
                    : <span className="text-lg opacity-50">{gender === "female" ? "👚" : "👕"}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {withPieces.length > 3 && (
        <button type="button" onClick={() => setShowAll(v => !v)}
          className="w-full px-5 py-3 text-center border-t border-black/5 text-xs text-neutral-500 hover:bg-neutral-50 transition">
          {showAll ? "Show less" : `Show all ${withPieces.length}`}
        </button>
      )}
    </div>
  );
}
