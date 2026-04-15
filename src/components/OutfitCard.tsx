"use client";

import * as React from "react";
import type { Item } from "@/lib/engine/types";

type OutfitLike = {
  label: "Safe" | "Colorful" | "Bold";
  score: number;
  breakdown: {
    occasion: number;
    harmony: number;
    variety: number;
    balance: number;
    weather?: number;
  };
  picks?: { top: Item; bottom: Item; shoes: Item };
  top?: Item;
  bottom?: Item;
  shoes?: Item;
};

function pretty(s?: string) {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

const LABEL_CONFIG = {
  Safe: {
    bg: "bg-white",
    badge: "bg-neutral-100 text-neutral-600",
    description: "Classic · Always works",
    accent: "bg-neutral-900",
  },
  Colorful: {
    bg: "bg-white",
    badge: "bg-amber-50 text-amber-700",
    description: "Balanced · Color accent",
    accent: "bg-amber-400",
  },
  Bold: {
    bg: "bg-neutral-950",
    badge: "bg-white/10 text-white",
    description: "High impact · Statement",
    accent: "bg-white",
  },
};

const COLOR_SWATCH: Record<string, string> = {
  black: "bg-neutral-900",
  white: "bg-white border border-black/15",
  neutral: "bg-stone-300",
  earth: "bg-amber-400",
  blue: "bg-sky-400",
  bright: "bg-violet-400",
  green: "bg-emerald-400",
  red: "bg-red-400",
  pink: "bg-pink-400",
  purple: "bg-purple-400",
  orange: "bg-orange-400",
  yellow: "bg-yellow-300",
};

function ItemRow({ label, item, dark }: { label: string; item: Item; dark?: boolean }) {
  const swatch = COLOR_SWATCH[String(item.color_family ?? "neutral").toLowerCase()] ?? "bg-neutral-300";
  const emoji = label === "Top" ? "👕" : label === "Bottom" ? "👖" : "👟";

  return (
    <div className={"flex items-center gap-3 rounded-xl p-3 " + (dark ? "bg-white/5" : "bg-neutral-50")}>
      {/* Foto o emoji */}
      {item.image_url ? (
        <img src={item.image_url} alt={String(item.type)}
          className="h-12 w-12 rounded-lg object-cover flex-shrink-0 border border-black/8" />
      ) : (
        <div className={"h-12 w-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0 " + (dark ? "bg-white/10" : "bg-neutral-100")}>
          {emoji}
        </div>
      )}
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={"text-xs font-medium mb-0.5 " + (dark ? "text-white/40" : "text-neutral-400")}>{label}</p>
        <p className={"font-bold text-sm truncate " + (dark ? "text-white" : "text-black")}>{pretty(item.type)}</p>
      </div>
      {/* Color swatch */}
      <div className={`w-4 h-4 rounded-full flex-shrink-0 ${swatch}`} />
    </div>
  );
}

export default function OutfitCard({ outfit }: { outfit: OutfitLike }) {
  const picks =
    outfit.picks ??
    (outfit.top && outfit.bottom && outfit.shoes
      ? { top: outfit.top, bottom: outfit.bottom, shoes: outfit.shoes }
      : null);

  const label = outfit.label as keyof typeof LABEL_CONFIG;
  const config = LABEL_CONFIG[label] ?? LABEL_CONFIG.Safe;
  const dark = label === "Bold";

  if (!picks) {
    return (
      <div className="rounded-2xl border border-black/8 bg-white p-6">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${config.badge}`}>
          {outfit.label}
        </span>
        <p className="mt-4 text-sm text-neutral-400">No outfit available.</p>
      </div>
    );
  }

  const { top, bottom, shoes } = picks;

  return (
    <div className={`rounded-2xl overflow-hidden border ${dark ? "border-neutral-800 bg-neutral-950" : "border-black/8 bg-white"}`}>

      {/* Header */}
      <div className={"px-4 pt-4 pb-3 flex items-center justify-between " + (dark ? "border-b border-white/8" : "border-b border-black/6")}>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${config.badge}`}>
            {outfit.label}
          </span>
          <span className={"text-xs " + (dark ? "text-white/30" : "text-neutral-400")}>
            {config.description}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={"text-2xl font-black " + (dark ? "text-white" : "text-black")}>{outfit.score}</span>
          <span className={"text-xs " + (dark ? "text-white/30" : "text-neutral-400")}>/100</span>
        </div>
      </div>

      {/* Items */}
      <div className="p-3 flex flex-col gap-2">
        <ItemRow label="Top" item={top} dark={dark} />
        <ItemRow label="Bottom" item={bottom} dark={dark} />
        <ItemRow label="Shoes" item={shoes} dark={dark} />
      </div>

      {/* Score bar */}
      <div className={"px-4 pb-4"}>
        <div className={"h-0.5 w-full rounded-full " + (dark ? "bg-white/10" : "bg-neutral-100")}>
          <div className={"h-0.5 rounded-full transition-all " + config.accent}
            style={{ width: `${outfit.score}%` }} />
        </div>
      </div>
    </div>
  );
}