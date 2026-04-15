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
  Safe: {
    badge: "bg-neutral-100 text-neutral-600",
    description: "Classic · Always works",
    barColor: "bg-neutral-800",
    accent: "border-black/6",
  },
  Colorful: {
    badge: "bg-amber-50 text-amber-700",
    description: "Balanced · Color accent",
    barColor: "bg-amber-400",
    accent: "border-amber-100",
  },
  Bold: {
    badge: "bg-neutral-900 text-white",
    description: "High impact · Statement",
    barColor: "bg-white",
    accent: "border-white/10",
  },
};

const COLOR_SWATCH: Record<string, string> = {
  black:   "bg-neutral-900",
  white:   "bg-white border border-black/15",
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

function ItemRow({ label, item, dark }: { label: string; item: Item; dark?: boolean }) {
  const swatch = COLOR_SWATCH[String(item.color_family ?? "neutral").toLowerCase()] ?? "bg-neutral-300";
  const emoji  = label === "Top" ? "👕" : label === "Bottom" ? "👖" : "👟";

  return (
    <div className={"flex items-center gap-3 rounded-xl p-3 " + (dark ? "bg-white/5" : "bg-neutral-50/80")}>
      {item.image_url ? (
        <img src={item.image_url} alt={String(item.type)}
          className="h-11 w-11 rounded-lg object-cover flex-shrink-0 border border-black/8" />
      ) : (
        <div className={"h-11 w-11 rounded-lg flex items-center justify-center text-lg flex-shrink-0 " + (dark ? "bg-white/10" : "bg-neutral-100")}>
          {emoji}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={"text-xs mb-0.5 " + (dark ? "text-white/35" : "text-neutral-400")}>{label}</p>
        <p className={"font-bold text-sm truncate " + (dark ? "text-white" : "text-black")}>{pretty(item.type)}</p>
      </div>
      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${swatch}`} />
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

  if (!picks) {
    return (
      <div className="rounded-2xl border border-black/8 bg-white p-6">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${config.badge}`}>{outfit.label}</span>
        <p className="mt-4 text-sm text-neutral-400">No outfit available.</p>
      </div>
    );
  }

  const { top, bottom, shoes } = picks;

  // Style Score breakdown
  const occPct  = Math.round((outfit.breakdown.occasion / 50) * 100);
  const harmPct = Math.round((outfit.breakdown.harmony  / 38) * 100);

  return (
    <div className={`rounded-2xl overflow-hidden border ${dark ? "border-neutral-800 bg-neutral-950" : "border-black/8 bg-white"}`}>

      {/* Header */}
      <div className={"px-4 pt-4 pb-3 flex items-center justify-between border-b " + (dark ? "border-white/8" : "border-black/6")}>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${config.badge}`}>{outfit.label}</span>
          <span className={"text-xs " + (dark ? "text-white/30" : "text-neutral-400")}>{config.description}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={"font-display text-2xl font-black " + (dark ? "text-white" : "text-black")}>{outfit.score}</span>
          <span className={"text-xs " + (dark ? "text-white/25" : "text-neutral-400")}>/100</span>
        </div>
      </div>

      {/* Items */}
      <div className="p-3 flex flex-col gap-1.5">
        <ItemRow label="Top"    item={top}    dark={dark} />
        <ItemRow label="Bottom" item={bottom} dark={dark} />
        <ItemRow label="Shoes"  item={shoes}  dark={dark} />
      </div>

      {/* Score bar */}
      <div className="px-4 pb-3">
        <div className={"h-0.5 w-full rounded-full " + (dark ? "bg-white/10" : "bg-neutral-100")}>
          <div className={`h-0.5 rounded-full transition-all duration-700 ${config.barColor}`}
            style={{ width: `${outfit.score}%` }} />
        </div>
        <p className={"text-xs mt-1.5 " + (dark ? "text-white/25" : "text-neutral-400")}>outfit score</p>
      </div>

      {/* Style Score breakdown */}
      <div className={"px-4 pb-3 border-t " + (dark ? "border-white/6" : "border-black/5")}>
        <button
          type="button"
          onClick={() => setShowWhy(v => !v)}
          className={"w-full text-left py-2.5 flex items-center justify-between " + (dark ? "text-white/40 hover:text-white/60" : "text-neutral-400 hover:text-neutral-600") + " transition text-xs font-medium"}>
          <span>Why it works</span>
          <span className={`transition-transform ${showWhy ? "rotate-180" : ""}`}>↓</span>
        </button>

        {showWhy && (
          <div className={"rounded-xl p-3 mb-2 " + (dark ? "bg-white/5" : "bg-neutral-50")}>
            {/* Text explanation */}
            {whyText && (
              <p className={"text-xs leading-relaxed mb-3 " + (dark ? "text-white/55" : "text-neutral-600")}>
                {whyText}
              </p>
            )}
            {/* Mini bars */}
            <div className="space-y-2">
              {[
                { label: "Occasion fit", pct: occPct },
                { label: "Color harmony", pct: harmPct },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-2">
                  <span className={"text-xs w-24 flex-shrink-0 " + (dark ? "text-white/35" : "text-neutral-400")}>{bar.label}</span>
                  <div className={"flex-1 h-1 rounded-full " + (dark ? "bg-white/10" : "bg-neutral-100")}>
                    <div className={`h-1 rounded-full ${config.barColor} transition-all duration-500`}
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