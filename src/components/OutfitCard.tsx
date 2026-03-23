"use client";

import * as React from "react";
import type { Item } from "@/lib/engine/types";

type Breakdown = {
  occasion: number;
  harmony: number;
  variety: number;
  balance: number;
  weather: number;
};

type OutfitLike = {
  label: "Safe" | "Colorful" | "Bold";
  score: number;
  breakdown: Breakdown;

  // new preferred shape
  picks?: {
    top: Item;
    bottom: Item;
    shoes: Item;
  };

  // fallback shapes (nëse diku e ki ndryshe)
  top?: Item;
  bottom?: Item;
  shoes?: Item;
};

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-sm text-neutral-600">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-neutral-200">
        <div className="h-2 rounded-full bg-black" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MiniPickCard({
  title,
  item,
}: {
  title: "Top" | "Bottom" | "Shoes";
  item: Item;
}) {
  const color = item.color_family ?? "neutral";

  // ngjyra e “fake photo card”
  const bg =
    color === "black"
      ? "bg-neutral-900 text-white"
      : color === "blue"
      ? "bg-sky-200 text-black"
      : color === "earth"
      ? "bg-amber-200 text-black"
      : "bg-neutral-100 text-black";

  const emoji = title === "Top" ? "👕" : title === "Bottom" ? "👖" : "👟";

  return (
    <div className={`relative h-24 rounded-2xl border border-neutral-200 ${bg} p-4 shadow-sm`}>
      <div className="text-xs opacity-70">{title}</div>
      <div className="mt-1 text-lg font-semibold leading-tight">
        {pretty(item.type)}
      </div>
      <div className="text-sm opacity-80">{color}</div>
      <div className="absolute right-3 top-3 text-2xl">{emoji}</div>
    </div>
  );
}

function pretty(s?: string) {
  if (!s) return "";
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function OutfitCard({ outfit }: { outfit: OutfitLike }) {
  const picks =
    outfit.picks ??
    (outfit.top && outfit.bottom && outfit.shoes
      ? { top: outfit.top, bottom: outfit.bottom, shoes: outfit.shoes }
      : null);

  if (!picks) {
    // mos u rrëzu kurr – veç trego mesazh
    return (
      <div className="rounded-[28px] border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between">
          <span className="rounded-full border border-neutral-300 px-4 py-2 text-sm">
            {outfit.label}
          </span>
          <div className="text-right">
            <div className="text-4xl font-semibold">{outfit.score}</div>
            <div className="text-sm text-neutral-500">/100</div>
          </div>
        </div>
        <div className="mt-6 text-sm text-neutral-600">
          Outfit missing picks (top/bottom/shoes).
        </div>
      </div>
    );
  }

  const { top, bottom, shoes } = picks;

  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="flex items-start justify-between">
        <span className="rounded-full border border-neutral-300 px-4 py-2 text-sm">
          {outfit.label}
        </span>
        <div className="text-right">
          <div className="text-4xl font-semibold">{outfit.score}</div>
          <div className="text-sm text-neutral-500">/100</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <MiniPickCard title="Top" item={top} />
        <MiniPickCard title="Bottom" item={bottom} />
        <MiniPickCard title="Shoes" item={shoes} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <div className="text-neutral-500">
          <div className="py-1">Top</div>
          <div className="py-1">Bottom</div>
          <div className="py-1">Shoes</div>
        </div>
        <div className="text-right">
          <div className="py-1">
            {pretty(top.type)} <span className="text-neutral-500">({top.color_family})</span>
          </div>
          <div className="py-1">
            {pretty(bottom.type)} <span className="text-neutral-500">({bottom.color_family})</span>
          </div>
          <div className="py-1">
            {pretty(shoes.type)} <span className="text-neutral-500">({shoes.color_family})</span>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-neutral-200 pt-6">
        <div className="text-sm font-medium">Breakdown</div>
        <Bar label="Occasion" value={outfit.breakdown.occasion} max={40} />
        <Bar label="Harmony" value={outfit.breakdown.harmony} max={30} />
        <Bar label="Variety" value={outfit.breakdown.variety} max={20} />
        <Bar label="Balance" value={outfit.breakdown.balance} max={10} />
        <Bar label="Weather" value={outfit.breakdown.weather} max={20} />
      </div>
    </div>
  );
}
