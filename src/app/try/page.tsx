"use client";

import * as React from "react";
import Link from "next/link";
import type { Item } from "@/lib/engine/types";

type Occasion = "work" | "date" | "casual" | "night_out" | "travel" | "gym";
type OutfitLabel = "Safe" | "Colorful";

const WARDROBE: Item[] = [
  { id: "t1", category: "top",    type: "shirt",        color_family: "white"   },
  { id: "t2", category: "top",    type: "polo",         color_family: "neutral" },
  { id: "t3", category: "top",    type: "tee",          color_family: "black"   },
  { id: "t4", category: "top",    type: "sweater",      color_family: "earth"   },
  { id: "t5", category: "top",    type: "blazer",       color_family: "neutral" },
  { id: "b1", category: "bottom", type: "chinos",       color_family: "earth"   },
  { id: "b2", category: "bottom", type: "jeans",        color_family: "blue"    },
  { id: "b3", category: "bottom", type: "trousers",     color_family: "neutral" },
  { id: "s1", category: "shoes",  type: "chelsea_boots",color_family: "black"   },
  { id: "s2", category: "shoes",  type: "sneakers",     color_family: "white"   },
  { id: "s3", category: "shoes",  type: "loafers",      color_family: "earth"   },
  { id: "s4", category: "shoes",  type: "dress_shoes",  color_family: "black"   },
];

type OutfitPreset = {
  label: OutfitLabel;
  score: number;
  tagline: string;
  why: string;
  top: Item; bottom: Item; shoes: Item;
};

const PRESETS: Record<Occasion, OutfitPreset[]> = {
  work:      [
    { label: "Safe",     score: 94, tagline: "Clean, professional, effortless.",  why: "White shirt + neutral trousers = zero guesswork.",  top: WARDROBE[0], bottom: WARDROBE[7], shoes: WARDROBE[11] },
    { label: "Colorful", score: 88, tagline: "Smart with a hint of character.",   why: "Earth tones + polo = polished but approachable.",    top: WARDROBE[1], bottom: WARDROBE[5], shoes: WARDROBE[9]  },
  ],
  date:      [
    { label: "Safe",     score: 93, tagline: "Polished without trying too hard.", why: "Chelsea boots elevate any date night look.",         top: WARDROBE[1], bottom: WARDROBE[5], shoes: WARDROBE[8]  },
    { label: "Colorful", score: 89, tagline: "Warm tones that stand out.",        why: "Earthy sweater = interesting, not trying too hard.", top: WARDROBE[3], bottom: WARDROBE[7], shoes: WARDROBE[10] },
  ],
  casual:    [
    { label: "Safe",     score: 91, tagline: "Goes with everything, always.",     why: "Black tee + jeans — the formula that never fails.",   top: WARDROBE[2], bottom: WARDROBE[6], shoes: WARDROBE[9]  },
    { label: "Colorful", score: 87, tagline: "Easy color, relaxed mood.",         why: "Earth sweater keeps the color count at 1.",           top: WARDROBE[3], bottom: WARDROBE[5], shoes: WARDROBE[9]  },
  ],
  night_out: [
    { label: "Safe",     score: 92, tagline: "Classic dark look, never fails.",   why: "Black tee + dark trousers = sharp without effort.",  top: WARDROBE[2], bottom: WARDROBE[7], shoes: WARDROBE[8]  },
    { label: "Colorful", score: 88, tagline: "Earth tones under the lights.",     why: "Sweater adds texture and warmth to a night look.",   top: WARDROBE[3], bottom: WARDROBE[6], shoes: WARDROBE[8]  },
  ],
  travel:    [
    { label: "Safe",     score: 90, tagline: "Comfortable and put-together.",     why: "White shirt + chinos = smart on any continent.",     top: WARDROBE[0], bottom: WARDROBE[5], shoes: WARDROBE[9]  },
    { label: "Colorful", score: 86, tagline: "Relaxed layers for any climate.",   why: "Earth sweater + sneakers = versatile traveler.",      top: WARDROBE[3], bottom: WARDROBE[6], shoes: WARDROBE[9]  },
  ],
  gym:       [
    { label: "Safe",     score: 92, tagline: "Clean, functional, no-fuss.",       why: "Black + white = always looks intentional at the gym.", top: WARDROBE[2], bottom: WARDROBE[6], shoes: WARDROBE[9] },
    { label: "Colorful", score: 88, tagline: "Athletic and put-together.",        why: "Coordinated athletic set = professional gym presence.", top: WARDROBE[2], bottom: WARDROBE[6], shoes: WARDROBE[9] },
  ],
};

const OCCASIONS: Record<Occasion, { label: string; emoji: string; desc: string }> = {
  work:      { label: "Work",      emoji: "💼", desc: "Professional" },
  date:      { label: "Date",      emoji: "🌹", desc: "Stylish" },
  casual:    { label: "Casual",    emoji: "☀️", desc: "Relaxed" },
  night_out: { label: "Night Out", emoji: "🌙", desc: "Sharp" },
  travel:    { label: "Travel",    emoji: "✈️", desc: "Versatile" },
  gym:       { label: "Gym",       emoji: "💪", desc: "Athletic" },
};

const COLOR_BG: Record<string, string> = {
  black: "bg-neutral-900 text-white", white: "bg-neutral-50 text-black border border-black/8",
  neutral: "bg-stone-200 text-black", earth: "bg-amber-100 text-black",
  blue: "bg-sky-100 text-black", bright: "bg-violet-100 text-black",
};

function pretty(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

function ItemRow({ label, item }: { label: string; item: Item }) {
  const bg = COLOR_BG[item.color_family] ?? "bg-neutral-100 text-black";
  const emoji = label === "Top" ? "👕" : label === "Bottom" ? "👖" : "👟";
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${bg}`}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-400 leading-none mb-0.5">{label}</p>
        <p className="font-semibold text-sm leading-tight">{pretty(item.type)}</p>
      </div>
      <span className="text-xs text-neutral-400 capitalize">{item.color_family}</span>
    </div>
  );
}

export default function TryItPage() {
  const [occasion, setOccasion] = React.useState<Occasion>("casual");
  const [revealed, setRevealed] = React.useState(false);
  const presets = PRESETS[occasion];

  function handleOccasionChange(o: Occasion) {
    setOccasion(o);
    setRevealed(false);
    setTimeout(() => setRevealed(true), 50);
  }

  React.useEffect(() => {
    setTimeout(() => setRevealed(true), 300);
  }, []);

  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="px-4 pt-14 pb-8 text-center max-w-lg mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4">Interactive Demo</p>
        <h1 className="font-display text-4xl font-black tracking-tight mb-3">See it in action.</h1>
        <p className="text-sm text-neutral-500">Pick an occasion below. OutfitMirror generates 2 complete outfits instantly — with a reason why each one works.</p>
      </section>

      {/* Occasion selector */}
      <section className="px-4 pb-6 max-w-2xl mx-auto">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(Object.keys(OCCASIONS) as Occasion[]).map((o) => {
            const cfg = OCCASIONS[o];
            const active = o === occasion;
            return (
              <button key={o} type="button" onClick={() => handleOccasionChange(o)}
                className={`rounded-2xl border-2 p-3 text-left transition-all btn-press ${
                  active ? "border-black bg-black text-white" : "border-black/8 hover:border-black/20 bg-white"
                }`}>
                <span className="text-xl block mb-1">{cfg.emoji}</span>
                <p className={`text-xs font-bold ${active ? "text-white" : "text-black"}`}>{cfg.label}</p>
                <p className={`text-xs mt-0.5 ${active ? "text-white/60" : "text-neutral-400"}`}>{cfg.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Outfits */}
      <section className="px-4 pb-10 max-w-2xl mx-auto">
        <div className="grid gap-4 sm:grid-cols-2">
          {presets.map((preset, i) => (
            <div key={`${occasion}-${preset.label}`}
              className={`rounded-2xl border border-black/8 overflow-hidden transition-all ${
                revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${i * 80}ms`, transitionDuration: "400ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}>

              {/* Header */}
              <div className={`px-5 py-4 flex items-center justify-between border-b border-black/6 ${
                preset.label === "Colorful" ? "bg-amber-50" : "bg-white"
              }`}>
                <div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    preset.label === "Colorful" ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-700"
                  }`}>{preset.label}</span>
                  <p className="text-xs text-neutral-500 mt-1.5">{preset.tagline}</p>
                </div>
                <div className="text-right">
                  <span className="font-display text-3xl font-black">{preset.score}</span>
                  <span className="text-xs text-neutral-400">/100</span>
                </div>
              </div>

              {/* Items */}
              <div className="p-4 space-y-3">
                <ItemRow label="Top"    item={preset.top}    />
                <ItemRow label="Bottom" item={preset.bottom} />
                <ItemRow label="Shoes"  item={preset.shoes}  />
              </div>

              {/* Why it works */}
              <div className="px-4 pb-4">
                <div className="rounded-xl bg-neutral-50 border border-black/6 px-3 py-2.5">
                  <p className="text-xs text-neutral-400 font-medium mb-0.5">Why it works</p>
                  <p className="text-xs text-neutral-600 leading-relaxed">{preset.why}</p>
                </div>
              </div>

              {/* Score bar */}
              <div className="px-4 pb-4">
                <div className="h-0.5 w-full rounded-full bg-neutral-100">
                  <div className={`h-0.5 rounded-full transition-all duration-1000 ${
                    preset.label === "Colorful" ? "bg-amber-400" : "bg-black"
                  }`} style={{ width: revealed ? `${preset.score}%` : "0%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-xs text-neutral-400 mt-5">
          Demo uses a sample wardrobe. With your clothes, results are personalized to what you actually own.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-black text-white px-4 py-14 text-center">
        <div className="max-w-sm mx-auto">
          <h2 className="font-display text-3xl font-black mb-2">Try it with your wardrobe.</h2>
          <p className="text-sm text-white/50 mb-8">Free. 2 minutes. No credit card.</p>
          <div className="flex flex-col gap-3">
            <Link href="/signup"
              className="rounded-full bg-white text-black px-8 py-4 text-sm font-bold hover:bg-white/90 transition btn-press">
              Get Started Free →
            </Link>
            <Link href="/app"
              className="rounded-full border border-white/15 px-8 py-3.5 text-sm font-medium text-white/60 hover:bg-white/5 transition">
              Open App
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}