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
  { id: "s1", category: "shoes", type: "chelsea boots", color_family: "black" },
  { id: "s2", category: "shoes", type: "white sneakers", color_family: "white" },
  { id: "s3", category: "shoes", type: "loafers", color_family: "earth" },
  { id: "s4", category: "shoes", type: "dress shoes", color_family: "black" },
];

type OutfitPreset = {
  label: OutfitLabel;
  score: number;
  tagline: string;
  top: Item;
  bottom: Item;
  shoes: Item;
};

const PRESETS: Record<Occasion, OutfitPreset[]> = {
  work: [
    { label: "Safe", score: 94, tagline: "Clean, professional, effortless.", top: WARDROBE[0], bottom: WARDROBE[7], shoes: WARDROBE[11] },
    { label: "Colorful", score: 88, tagline: "Smart with a hint of character.", top: WARDROBE[1], bottom: WARDROBE[5], shoes: WARDROBE[9] },
  ],
  date: [
    { label: "Safe", score: 93, tagline: "Polished without trying too hard.", top: WARDROBE[1], bottom: WARDROBE[5], shoes: WARDROBE[8] },
    { label: "Colorful", score: 89, tagline: "Warm tones that stand out.", top: WARDROBE[3], bottom: WARDROBE[7], shoes: WARDROBE[10] },
  ],
  casual: [
    { label: "Safe", score: 91, tagline: "Goes with everything, always works.", top: WARDROBE[2], bottom: WARDROBE[6], shoes: WARDROBE[9] },
    { label: "Colorful", score: 87, tagline: "Easy color, relaxed mood.", top: WARDROBE[3], bottom: WARDROBE[5], shoes: WARDROBE[9] },
  ],
  night_out: [
    { label: "Safe", score: 92, tagline: "Classic dark look, never fails.", top: WARDROBE[2], bottom: WARDROBE[7], shoes: WARDROBE[8] },
    { label: "Colorful", score: 88, tagline: "Earth tones under the lights.", top: WARDROBE[3], bottom: WARDROBE[6], shoes: WARDROBE[8] },
  ],
  travel: [
    { label: "Safe", score: 90, tagline: "Comfortable and put-together.", top: WARDROBE[0], bottom: WARDROBE[5], shoes: WARDROBE[9] },
    { label: "Colorful", score: 86, tagline: "Relaxed layers for any climate.", top: WARDROBE[3], bottom: WARDROBE[6], shoes: WARDROBE[9] },
  ],
  gym: [
    { label: "Safe", score: 92, tagline: "Clean, functional, no-fuss.", top: WARDROBE[2], bottom: WARDROBE[6], shoes: WARDROBE[9] },
    { label: "Colorful", score: 88, tagline: "Neutral on top, athletic on bottom.", top: WARDROBE[2], bottom: WARDROBE[6], shoes: WARDROBE[9] },
  ],
};

function pretty(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

const OCCASION_CONFIG: Record<Occasion, { label: string; emoji: string; description: string }> = {
  work:      { label: "Work",      emoji: "💼", description: "Office-ready looks" },
  date:      { label: "Date",      emoji: "🌹", description: "Polished & attractive" },
  casual:    { label: "Casual",    emoji: "☀️", description: "Relaxed everyday style" },
  night_out: { label: "Night Out", emoji: "🌙", description: "Dark, sharp, confident" },
  travel:    { label: "Travel",    emoji: "✈️", description: "Comfortable & versatile" },
  gym:       { label: "Gym",       emoji: "💪", description: "Performance & clean" },
};

const LABEL_STYLE: Record<OutfitLabel, { bg: string; pill: string; pillText: string }> = {
  Safe:     { bg: "bg-white",    pill: "bg-neutral-100 text-neutral-700", pillText: "Most wearable" },
  Colorful: { bg: "bg-amber-50", pill: "bg-amber-100 text-amber-800",     pillText: "Color balanced" },
};

const COLOR_BG: Record<string, string> = {
  black:   "bg-neutral-900",
  white:   "bg-neutral-100",
  neutral: "bg-stone-200",
  earth:   "bg-amber-200",
  blue:    "bg-sky-200",
  bright:  "bg-violet-200",
};

function ItemPill({ item }: { item: Item }) {
  const bg = COLOR_BG[item.color_family] ?? "bg-neutral-200";
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-black/5">
      <div className={`h-5 w-5 rounded-full border border-black/10 ${bg} flex-shrink-0`} />
      <span className="text-sm font-medium text-neutral-800">{pretty(item.type)}</span>
      <span className="ml-auto text-xs text-neutral-400">{item.color_family}</span>
    </div>
  );
}

function OutfitShowcard({ preset }: { preset: OutfitPreset }) {
  const style = LABEL_STYLE[preset.label];
  return (
    <div className={`rounded-3xl ${style.bg} p-6 flex flex-col gap-5 border border-black/8 h-full`}>
      <div className="flex items-start justify-between">
        <div>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${style.pill}`}>
            {preset.label} · {style.pillText}
          </span>
          <p className="mt-2 text-sm text-neutral-500">{preset.tagline}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-black">{preset.score}</div>
          <div className="text-xs text-neutral-400">/100</div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <ItemPill item={preset.top} />
        <ItemPill item={preset.bottom} />
        <ItemPill item={preset.shoes} />
      </div>
      <div className="mt-auto">
        <div className="h-1 w-full rounded-full bg-black/8">
          <div className="h-1 rounded-full bg-black transition-all duration-700"
            style={{ width: `${preset.score}%` }} />
        </div>
        <div className="mt-1 text-xs text-neutral-400">outfit score</div>
      </div>
    </div>
  );
}

export default function TryItPage() {
  const [occasion, setOccasion] = React.useState<Occasion>("work");
  const presets = PRESETS[occasion];
  const cfg = OCCASION_CONFIG[occasion];

  return (
    <AppShell title="Try OutfitMirror">
      <div className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">OutfitMirror</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
            Your wardrobe.<br />
            <span className="text-neutral-400">2 outfits. Instantly.</span>
          </h1>
          <p className="mt-4 text-lg text-neutral-500 max-w-xl mx-auto">
            Pick an occasion and see exactly what OutfitMirror generates — from your own clothes.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-500 mb-4">Pick an occasion</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(Object.keys(OCCASION_CONFIG) as Occasion[]).map((o) => {
              const c = OCCASION_CONFIG[o];
              return (
                <button key={o} type="button" onClick={() => setOccasion(o)}
                  className={["rounded-full px-5 py-2.5 text-sm font-medium border transition",
                    o === occasion ? "bg-black text-white border-black" : "bg-white text-neutral-700 border-black/15 hover:border-black/40"].join(" ")}>
                  {c.emoji} {c.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm text-neutral-600">
            <span className="text-base">{cfg.emoji}</span>
            <span>{cfg.description}</span>
          </div>
        </div>

        {/* 2 outfit cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {presets.map((preset) => (
            <OutfitShowcard key={preset.label} preset={preset} />
          ))}
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3 text-center">
          {[
            { step: "01", title: "Upload your wardrobe", body: "Photo or manual — add what you actually own." },
            { step: "02", title: "Pick your occasion", body: "Work, date, casual, night out, travel, or gym." },
            { step: "03", title: "Get 2 outfits instantly", body: "Safe or Colorful — scored and ready to wear." },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-black/8 p-6">
              <div className="text-xs font-black text-neutral-300 mb-3">{s.step}</div>
              <div className="font-semibold text-neutral-900">{s.title}</div>
              <div className="mt-1 text-sm text-neutral-500">{s.body}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-black text-white p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">Ready?</p>
          <h2 className="text-3xl font-black">Start with your own wardrobe</h2>
          <p className="mt-3 text-white/60 max-w-sm mx-auto">Free to try. No credit card. Takes 2 minutes to set up.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="rounded-full bg-white text-black px-8 py-3.5 text-sm font-semibold hover:bg-white/90 transition">
              Get Started Free →
            </Link>
            <Link href="/app" className="rounded-full border border-white/20 text-white px-8 py-3.5 text-sm font-semibold hover:bg-white/10 transition">
              Open App
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}