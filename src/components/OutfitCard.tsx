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

const COLOR_BG: Record<string, string> = {
  black:   "bg-neutral-900 text-white",
  white:   "bg-neutral-100 text-black",
  neutral: "bg-stone-200 text-black",
  earth:   "bg-amber-200 text-black",
  blue:    "bg-sky-200 text-black",
  bright:  "bg-violet-200 text-black",
  green:   "bg-emerald-200 text-black",
  red:     "bg-red-200 text-black",
  pink:    "bg-pink-200 text-black",
  purple:  "bg-purple-200 text-black",
  orange:  "bg-orange-200 text-black",
  yellow:  "bg-yellow-200 text-black",
};

const LABEL_CONFIG = {
  Safe: {
    pill: "bg-neutral-100 text-neutral-700",
    description: "Classic · Always works",
  },
  Colorful: {
    pill: "bg-amber-100 text-amber-800",
    description: "Balanced · Color accent",
  },
  Bold: {
    pill: "bg-neutral-900 text-white",
    description: "High impact · Statement",
  },
};

function ItemCard({ label, item }: { label: string; item: Item }) {
  const color = String(item.color_family ?? "neutral").toLowerCase();
  const bg = COLOR_BG[color] ?? "bg-neutral-100 text-black";
  const emoji = label === "Top" ? "👕" : label === "Bottom" ? "👖" : "👟";

  return (
    <div className={`rounded-2xl ${bg} p-4 relative min-h-[90px] flex flex-col justify-between`}>
      <span className="text-xs opacity-60 font-medium">{label}</span>
      <div>
        <div className="font-semibold text-sm leading-tight">{pretty(item.type)}</div>
        <div className="text-xs opacity-60 mt-0.5 capitalize">{item.color_family}</div>
      </div>
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={String(item.type)}
          className="absolute right-2 top-2 h-10 w-10 rounded-lg object-cover border border-black/10"
        />
      ) : (
        <span className="absolute right-2 top-2 text-xl">{emoji}</span>
      )}
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

  if (!picks) {
    return (
      <div className="rounded-2xl border border-black/8 bg-white p-6">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${config.pill}`}>
          {outfit.label}
        </span>
        <p className="mt-4 text-sm text-neutral-400">No outfit available.</p>
      </div>
    );
  }

  const { top, bottom, shoes } = picks;

  return (
    <div className="rounded-2xl border border-black/8 bg-white p-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${config.pill}`}>
            {outfit.label}
          </span>
          <p className="mt-1.5 text-xs text-neutral-400">{config.description}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-black">{outfit.score}</div>
          <div className="text-xs text-neutral-400">/100</div>
        </div>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-3 gap-2">
        <ItemCard label="Top" item={top} />
        <ItemCard label="Bottom" item={bottom} />
        <ItemCard label="Shoes" item={shoes} />
      </div>

      {/* Score bar */}
      <div>
        <div className="h-1 w-full rounded-full bg-neutral-100">
          <div
            className="h-1 rounded-full bg-black transition-all"
            style={{ width: `${outfit.score}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-neutral-400">outfit score</p>
      </div>

    </div>
  );
}