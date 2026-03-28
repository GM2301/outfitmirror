"use client";

import * as React from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import type { Item } from "@/lib/engine/types";

type Occasion = "work" | "date" | "casual" | "night_out" | "travel" | "gym";
type OutfitLabel = "Safe" | "Colorful";

const WARDROBE: Item[] = [
  { id: "t1", category: "top", type: "shirt", color_family: "white" },
  { id: "t2", category: "top", type: "polo", color_family: "neutral" },
  { id: "t3", category: "top", type: "tee", color_family: "black" },
  { id: "t4", category: "top", type: "sweater", color_family: "earth" },
  { id: "t5", category: "top", type: "blazer", color_family: "neutral" },
  { id: "b1", category: "bottom", type: "chinos", color_family: "earth" },
  { id: "b2", category: "bottom", type: "jeans", color_family: "blue" },
  { id: "b3", category: "bottom", type: "trousers", color_family: "neutral" },
  { id: "s1", category: "shoes", type: "chelsea_boots", color_family: "black" },
  { id: "s2", category: "shoes", type: "sneakers", color_family: "white" },
  { id: "s3", category: "shoes", type: "loafers", color_family: "earth" },
  { id: "s4", category: "shoes", type: "dress_shoes", color_family: "black" },
];

type OutfitPreset = { label: OutfitLabel; score: number; tagline: string; top: Item; bottom: Item; shoes: Item };

const PRESETS: Record<Occasion, OutfitPreset[]> = {
  work:      [ { label: "Safe",     score: 94, tagline: "Clean, professional, effortless.",    top: WARDROBE[0], bottom: WARDROBE[7], shoes: WARDROBE[11] }, { label: "Colorful", score: 88, tagline: "Smart with a hint of character.",     top: WARDROBE[1], bottom: WARDROBE[5], shoes: WARDROBE[9]  } ],
  date:      [ { label: "Safe",     score: 93, tagline: "Polished without trying too hard.",   top: WARDROBE[1], bottom: WARDROBE[5], shoes: WARDROBE[8]  }, { label: "Colorful", score: 89, tagline: "Warm tones that stand out.",          top: WARDROBE[3], bottom: WARDROBE[7], shoes: WARDROBE[10] } ],
  casual:    [ { label: "Safe",     score: 91, tagline: "Goes with everything, always works.", top: WARDROBE[2], bottom: WARDROBE[6], shoes: WARDROBE[9]  }, { label: "Colorful", score: 87, tagline: "Easy color, relaxed mood.",           top: WARDROBE[3], bottom: WARDROBE[5], shoes: WARDROBE[9]  } ],
  night_out: [ { label: "Safe",     score: 92, tagline: "Classic dark look, never fails.",     top: WARDROBE[2], bottom: WARDROBE[7], shoes: WARDROBE[8]  }, { label: "Colorful", score: 88, tagline: "Earth tones under the lights.",       top: WARDROBE[3], bottom: WARDROBE[6], shoes: WARDROBE[8]  } ],
  travel:    [ { label: "Safe",     score: 90, tagline: "Comfortable and put-together.",       top: WARDROBE[0], bottom: WARDROBE[5], shoes: WARDROBE[9]  }, { label: "Colorful", score: 86, tagline: "Relaxed layers for any climate.",     top: WARDROBE[3], bottom: WARDROBE[6], shoes: WARDROBE[9]  } ],
  gym:       [ { label: "Safe",     score: 92, tagline: "Clean, functional, no-fuss.",         top: WARDROBE[2], bottom: WARDROBE[6], shoes: WARDROBE[9]  }, { label: "Colorful", score: 88, tagline: "Athletic and put-together.",          top: WARDROBE[2], bottom: WARDROBE[6], shoes: WARDROBE[9]  } ],
};

function pretty(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

const OCCASIONS: Record<Occasion, { label: string; emoji: string }> = {
  work: { label: "Work", emoji: "💼" }, date: { label: "Date", emoji: "🌹" },
  casual: { label: "Casual", emoji: "☀️" }, night_out: { label: "Night Out", emoji: "🌙" },
  travel: { label: "Travel", emoji: "✈️" }, gym: { label: "Gym", emoji: "💪" },
};

const LABEL_STYLE: Record<OutfitLabel, { bg: string; pill: string }> = {
  Safe:     { bg: "bg-white",    pill: "bg-neutral-100 text-neutral-700" },
  Colorful: { bg: "bg-amber-50", pill: "bg-amber-100 text-amber-800" },
};

const COLOR_BG: Record<string, string> = {
  black: "bg-neutral-900", white: "bg-neutral-100", neutral: "bg-stone-200",
  earth: "bg-amber-200", blue: "bg-sky-200", bright: "bg-violet-200",
};

function ItemPill({ item }: { item: Item }) {
  const bg = COLOR_BG[item.color_family] ?? "bg-neutral-200";
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-black/5">
      <div className={`h-4 w-4 rounded-full border border-black/10 ${bg} flex-shrink-0`} />
      <span className="text-sm font-medium text-neutral-800">{pretty(item.type)}</span>
      <span className="ml-auto text-xs text-neutral-400">{item.color_family}</span>
    </div>
  );
}

function OutfitCard({ preset }: { preset: OutfitPreset }) {
  const style = LABEL_STYLE[preset.label];
  return (
    <div className={`rounded-2xl ${style.bg} p-5 flex flex-col gap-3 border border-black/8`}>
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.pill}`}>{preset.label}</span>
        <div><span className="text-2xl font-black">{preset.score}</span><span className="text-xs text-neutral-400">/100</span></div>
      </div>
      <p className="text-xs text-neutral-500">{preset.tagline}</p>
      <div className="flex flex-col gap-1.5">
        <ItemPill item={preset.top} />
        <ItemPill item={preset.bottom} />
        <ItemPill item={preset.shoes} />
      </div>
      <div className="h-1 w-full rounded-full bg-black/8">
        <div className="h-1 rounded-full bg-black" style={{ width: `${preset.score}%` }} />
      </div>
    </div>
  );
}

export default function TryItPage() {
  const [occasion, setOccasion] = React.useState<Occasion>("work");
  const presets = PRESETS[occasion];

  return (
    <AppShell title="Try OutfitMirror">
      <div className="px-4 pt-10 pb-6 text-center">
        <h1 className="text-3xl font-black tracking-tight">See it in action.</h1>
        <p className="mt-2 text-sm text-neutral-500">Pick an occasion — see 2 outfits instantly.</p>
      </div>

      <div className="px-4 pb-10">
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {(Object.keys(OCCASIONS) as Occasion[]).map((o) => (
            <button key={o} type="button" onClick={() => setOccasion(o)}
              className={["rounded-full px-4 py-2 text-sm font-medium border transition",
                o === occasion ? "bg-black text-white border-black" : "bg-white text-neutral-700 border-black/15"].join(" ")}>
              {OCCASIONS[o].emoji} {OCCASIONS[o].label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto">
          {presets.map((preset) => (
            <OutfitCard key={preset.label} preset={preset} />
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-black text-white p-6 text-center max-w-2xl mx-auto">
          <h2 className="text-xl font-black">Try it with your own wardrobe</h2>
          <p className="mt-1 text-white/60 text-sm">Free. No credit card. 2 minutes.</p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 transition">
              Get Started Free →
            </Link>
            <Link href="/app" className="rounded-full border border-white/20 text-white px-6 py-3 text-sm font-semibold hover:bg-white/10 transition">
              Open App
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}