"use client";

import * as React from "react";
import type { Item } from "@/lib/engine/types";

type Props = { items: Item[] };

function getSeasonScore(items: Item[]): { season: string; score: number; missing: string[] } {
  const month = new Date().getMonth();
  const isSummer = month >= 4 && month <= 8;
  const isWinter = month <= 1 || month >= 10;

  const types = items.map(i => String(i.type).toLowerCase());
  const missing: string[] = [];
  let score = 0;
  let total = 0;

  if (isSummer) {
    const checks = [
      { has: types.some(t => t.includes("tee") || t.includes("tank") || t.includes("polo")), label: "Light tops" },
      { has: types.some(t => t.includes("short") || t.includes("chino")), label: "Shorts or chinos" },
      { has: types.some(t => t.includes("sneaker") || t.includes("sandal") || t.includes("loafer")), label: "Light shoes" },
    ];
    checks.forEach(c => { total++; if (c.has) score++; else missing.push(c.label); });
    return { season: "Summer ☀️", score: Math.round((score / total) * 100), missing };
  }

  if (isWinter) {
    const checks = [
      { has: types.some(t => t.includes("sweater") || t.includes("hoodie") || t.includes("jacket")), label: "Warm layers" },
      { has: types.some(t => t.includes("trouser") || t.includes("jean") || t.includes("chino")), label: "Full-length bottoms" },
      { has: types.some(t => t.includes("boot") || t.includes("chelsea")), label: "Boots" },
    ];
    checks.forEach(c => { total++; if (c.has) score++; else missing.push(c.label); });
    return { season: "Winter 🧥", score: Math.round((score / total) * 100), missing };
  }

  // Spring/Fall
  const checks = [
    { has: types.some(t => t.includes("shirt") || t.includes("polo") || t.includes("sweater")), label: "Mid-layer tops" },
    { has: types.some(t => t.includes("jean") || t.includes("chino") || t.includes("trouser")), label: "Versatile bottoms" },
    { has: types.some(t => t.includes("sneaker") || t.includes("boot") || t.includes("loafer")), label: "Seasonal shoes" },
  ];
  checks.forEach(c => { total++; if (c.has) score++; else missing.push(c.label); });
  return { season: "Spring/Fall 🍂", score: Math.round((score / total) * 100), missing };
}

export default function WardrobeAnalytics({ items }: Props) {
  if (items.length < 3) return null;

  const total = items.length;
  const history: any[] = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("om_outfit_history") ?? "[]"); } catch { return []; }
  }, []);

  // Llogarit items të veshura (gjenden në history)
  const wornIds = new Set<string>();
  history.forEach((h: any) => {
    // Matching by type since we store types not ids
  });
  const wornTypes = new Set(
    history.flatMap((h: any) => [h.top, h.bottom, h.shoes].filter(Boolean))
  );
  const wornItems = items.filter(i => wornTypes.has(i.type));
  const unwornItems = items.filter(i => !wornTypes.has(i.type));
  const wornPct = total > 0 ? Math.round((wornItems.length / total) * 100) : 0;

  // Items me foto
  const withPhoto = items.filter(i => i.image_url).length;
  const photoPct  = Math.round((withPhoto / total) * 100);

  // Kategoritë
  const tops    = items.filter(i => i.category === "top").length;
  const bottoms = items.filter(i => i.category === "bottom").length;
  const shoes   = items.filter(i => i.category === "shoes").length;

  // Seasonal score
  const seasonal = getSeasonScore(items);

  return (
    <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-black/6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-base">Wardrobe Analytics</h3>
            <p className="text-xs text-neutral-400 mt-0.5">{total} items total</p>
          </div>
          <span className="text-xl">📊</span>
        </div>
      </div>

      {/* Seasonal Score */}
      <div className="px-5 py-4 border-b border-black/6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">{seasonal.season} Readiness</p>
          <span className="font-display font-black text-lg">{seasonal.score}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 mb-2">
          <div className={`h-2 rounded-full transition-all duration-700 ${
            seasonal.score >= 80 ? "bg-green-500" :
            seasonal.score >= 50 ? "bg-amber-400" : "bg-red-400"
          }`} style={{ width: `${seasonal.score}%` }} />
        </div>
        {seasonal.missing.length > 0 ? (
          <p className="text-xs text-neutral-500">
            Missing: <span className="font-semibold text-black">{seasonal.missing.join(" · ")}</span>
          </p>
        ) : (
          <p className="text-xs text-green-600 font-semibold">✓ Your wardrobe is ready for {seasonal.season.split(" ")[0]}!</p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-black/5">
        {[
          {
            label: "Active items",
            value: `${wornPct}%`,
            sub: `${wornItems.length} of ${total} worn`,
            color: wornPct >= 60 ? "text-green-600" : wornPct >= 30 ? "text-amber-600" : "text-red-500",
          },
          {
            label: "With photo",
            value: `${photoPct}%`,
            sub: `${withPhoto} of ${total} items`,
            color: photoPct >= 70 ? "text-green-600" : "text-neutral-600",
          },
          {
            label: "Category split",
            value: `${tops}T`,
            sub: `${bottoms}B · ${shoes}S`,
            color: "text-black",
          },
          {
            label: "Unused items",
            value: unwornItems.length.toString(),
            sub: unwornItems.length > 0 ? unwornItems.slice(0, 2).map(i => i.type.replace(/_/g, " ")).join(", ") : "Great job!",
            color: unwornItems.length > 5 ? "text-amber-600" : "text-green-600",
          },
        ].map(s => (
          <div key={s.label} className="px-4 py-3.5">
            <p className="text-xs text-neutral-400 mb-1">{s.label}</p>
            <p className={`font-display font-black text-xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-400 mt-0.5 truncate">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Unworn items list */}
      {unwornItems.length > 0 && (
        <div className="px-5 py-4 border-t border-black/6">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
            Unworn items · {unwornItems.length}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unwornItems.slice(0, 8).map((it, i) => (
              <span key={i} className="rounded-full bg-neutral-100 text-neutral-600 px-2.5 py-1 text-xs font-medium capitalize">
                {it.type.replace(/_/g, " ")}
              </span>
            ))}
            {unwornItems.length > 8 && (
              <span className="rounded-full bg-neutral-100 text-neutral-400 px-2.5 py-1 text-xs">
                +{unwornItems.length - 8} more
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Try including these in your next outfit generation.
          </p>
        </div>
      )}
    </div>
  );
}