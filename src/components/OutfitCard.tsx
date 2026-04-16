"use client";

import * as React from "react";
import type { Item } from "@/lib/engine/types";

type OutfitLike = {
  label: "Safe" | "Colorful" | "Bold";
  score: number;
  why?: string;
  breakdown: {
    occasion: number;
    harmony: number;
    variety: number;
    balance: number;
    explanation?: string;
  };
  picks?: { top: Item; bottom: Item; shoes: Item };
  top?: Item;
  bottom?: Item;
  shoes?: Item;
};

function pretty(s?: string) {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

const LABEL_CONFIG = {
  Safe:     { badge: "bg-neutral-100 text-neutral-600",  desc: "Classic · Always works",   bar: "bg-neutral-800" },
  Colorful: { badge: "bg-amber-50 text-amber-700",       desc: "Balanced · Color accent",   bar: "bg-amber-400"   },
  Bold:     { badge: "bg-neutral-900 text-white",        desc: "High impact · Statement",   bar: "bg-white"       },
};

const COLOR_SWATCH: Record<string, string> = {
  black:   "bg-neutral-900",
  white:   "bg-white border border-black/20",
  neutral: "bg-stone-300",
  earth:   "bg-amber-400",
  blue:    "bg-sky-400",
  bright:  "bg-violet-400",
  green:   "bg-emerald-400",
  red:     "bg-red-400",
  pink:    "bg-pink-400",
  purple:  "bg-purple-400",
  orange:  "bg-orange-400",
  yellow:  "bg-yellow-300",
};

const COLOR_BG: Record<string, string> = {
  black:   "bg-neutral-100",
  white:   "bg-neutral-50",
  neutral: "bg-stone-50",
  earth:   "bg-amber-50",
  blue:    "bg-sky-50",
  bright:  "bg-violet-50",
  green:   "bg-emerald-50",
  red:     "bg-red-50",
  pink:    "bg-pink-50",
  purple:  "bg-purple-50",
  orange:  "bg-orange-50",
  yellow:  "bg-yellow-50",
};

const ITEM_EMOJI: Record<string, string> = {
  top: "👕", bottom: "👖", shoes: "👟",
};

function ItemCard({ label, item }: { label: string; item: Item }) {
  const color  = String(item.color_family ?? "neutral").toLowerCase();
  const swatch = COLOR_SWATCH[color] ?? "bg-neutral-300";
  const bg     = COLOR_BG[color] ?? "bg-neutral-50";
  const emoji  = ITEM_EMOJI[item.category] ?? "👕";

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Foto o placeholder */}
      {item.image_url ? (
        <div className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ${bg}`}
          style={{
            boxShadow: "0 4px 12px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
          }}>
          <img
            src={item.image_url}
            alt={String(item.type)}
            className="w-full h-full object-contain p-1.5"
            style={{ transition: "transform 0.3s ease" }}
          />
        </div>
      ) : (
        <div className={`w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl ${bg}`}
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
          {emoji}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-400 leading-none mb-0.5">{label}</p>
        <p className="font-bold text-sm leading-tight truncate">{pretty(item.type)}</p>
        <p className="text-xs text-neutral-400 capitalize mt-0.5">{item.color_family}</p>
      </div>

      {/* Color swatch */}
      <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${swatch}`} />
    </div>
  );
}

export default function OutfitCard({ outfit }: { outfit: OutfitLike }) {
  const [showWhy, setShowWhy] = React.useState(false);

  const picks =
    outfit.picks ??
    (outfit.top && outfit.bottom && outfit.shoes
      ? { top: outfit.top, bottom: outfit.bottom, shoes: outfit.shoes }
      : null);

  const label  = outfit.label as keyof typeof LABEL_CONFIG;
  const config = LABEL_CONFIG[label] ?? LABEL_CONFIG.Safe;
  const dark   = label === "Bold";
  const whyText = outfit.why ?? outfit.breakdown?.explanation;

  const occPct  = Math.round((outfit.breakdown.occasion / 50) * 100);
  const harmPct = Math.round((outfit.breakdown.harmony  / 38) * 100);

  if (!picks) {
    return (
      <div className="rounded-2xl border border-black/8 bg-white p-6">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${config.badge}`}>{outfit.label}</span>
        <p className="mt-4 text-sm text-neutral-400">No outfit available.</p>
      </div>
    );
  }

  const { top, bottom, shoes } = picks;

  return (
    <div
      className={`rounded-2xl overflow-hidden ${dark ? "bg-neutral-950" : "bg-white"}`}
      style={{
        boxShadow: dark
          ? "0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)"
          : "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
        border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
      }}>

      {/* Header */}
      <div className={"px-4 pt-4 pb-3 flex items-center justify-between border-b " +
        (dark ? "border-white/8" : "border-black/5")}>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${config.badge}`}>{outfit.label}</span>
          <span className={"text-xs " + (dark ? "text-white/30" : "text-neutral-400")}>{config.desc}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <span className={"font-display text-2xl font-black " + (dark ? "text-white" : "text-black")}>{outfit.score}</span>
          <span className={"text-xs " + (dark ? "text-white/25" : "text-neutral-400")}>/100</span>
        </div>
      </div>

      {/* Items — 3 rows me foto të mëdha */}
      <div className={"px-4 divide-y " + (dark ? "divide-white/6" : "divide-black/5")}>
        <ItemCard label="Top"    item={top}    />
        <ItemCard label="Bottom" item={bottom} />
        <ItemCard label="Shoes"  item={shoes}  />
      </div>

      {/* Score bar */}
      <div className="px-4 pt-2 pb-1">
        <div className={"h-0.5 w-full rounded-full " + (dark ? "bg-white/10" : "bg-neutral-100")}>
          <div className={`h-0.5 rounded-full transition-all duration-700 ${config.bar}`}
            style={{ width: `${outfit.score}%` }} />
        </div>
      </div>

      {/* Why it works — expandable */}
      <div className={"px-4 pb-3 " + (dark ? "" : "")}>
        <button type="button" onClick={() => setShowWhy(v => !v)}
          className={"w-full text-left py-2 flex items-center justify-between transition text-xs font-medium " +
            (dark ? "text-white/35 hover:text-white/55" : "text-neutral-400 hover:text-neutral-600")}>
          <span>Why it works</span>
          <span className={`transition-transform duration-200 ${showWhy ? "rotate-180" : ""}`}>↓</span>
        </button>

        {showWhy && (
          <div className={"rounded-xl p-3 mb-1 " + (dark ? "bg-white/5" : "bg-neutral-50")}>
            {whyText && (
              <p className={"text-xs leading-relaxed mb-3 " + (dark ? "text-white/55" : "text-neutral-600")}>
                {whyText}
              </p>
            )}
            <div className="space-y-2">
              {[
                { label: "Occasion fit",   pct: occPct  },
                { label: "Color harmony",  pct: harmPct },
              ].map(bar => (
                <div key={bar.label} className="flex items-center gap-2">
                  <span className={"text-xs w-24 flex-shrink-0 " + (dark ? "text-white/35" : "text-neutral-400")}>{bar.label}</span>
                  <div className={"flex-1 h-1 rounded-full " + (dark ? "bg-white/10" : "bg-neutral-100")}>
                    <div className={`h-1 rounded-full transition-all duration-500 ${config.bar}`}
                      style={{ width: `${bar.pct}%` }} />
                  </div>
                  <span className={"text-xs w-8 text-right " + (dark ? "text-white/35" : "text-neutral-400")}>{bar.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}