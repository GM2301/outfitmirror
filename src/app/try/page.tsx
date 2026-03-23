"use client";

import * as React from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import type { Item } from "@/lib/engine/types";

type Occasion = "work" | "date" | "casual" | "night_out" | "travel" | "gym";
type OutfitLabel = "Safe" | "Colorful" | "Bold";

// ─── Mock wardrobe ───────────────────────────────────────────────────────────

const WARDROBE: Item[] = [
  { id: "t1", category: "top", type: "shirt", color_family: "white" },
  { id: "t2", category: "top", type: "polo", color_family: "neutral" },
  { id: "t3", category: "top", type: "tee", color_family: "black" },
  { id: "t4", category: "top", type: "sweater", color_family: "earth" },
  { id: "t5", category: "top", type: "blazer", color_family: "neutral" },
  { id: "t6", category: "top", type: "hoodie", color_family: "black" },
  { id: "t7", category: "top", type: "jacket", color_family: "earth" },
  { id: "b1", category: "bottom", type: "chinos", color_family: "earth" },
  { id: "b2", category: "bottom", type: "jeans", color_family: "blue" },
  { id: "b3", category: "bottom", type: "trousers", color_family: "neutral" },
  { id: "b4", category: "bottom", type: "joggers", color_family: "black" },
  { id: "b5", category: "bottom", type: "shorts", color_family: "neutral" },
  { id: "s1", category: "shoes", type: "chelsea boots", color_family: "black" },
  { id: "s2", category: "shoes", type: "white sneakers", color_family: "white" },
  { id: "s3", category: "shoes", type: "loafers", color_family: "earth" },
  { id: "s4", category: "shoes", type: "dress shoes", color_family: "black" },
  { id: "s5", category: "shoes", type: "running shoes", color_family: "neutral" },
];

// ─── Outfit presets per occasion ─────────────────────────────────────────────

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
    { label: "Safe", score: 94, tagline: "Clean, professional, effortless.", top: WARDROBE[0], bottom: WARDROBE[9], shoes: WARDROBE[15] },
    { label: "Colorful", score: 88, tagline: "Smart with a hint of character.", top: WARDROBE[1], bottom: WARDROBE[7], shoes: WARDROBE[12] },
    { label: "Bold", score: 91, tagline: "Structured. Memorable. Confident.", top: WARDROBE[4], bottom: WARDROBE[9], shoes: WARDROBE[15] },
  ],
  date: [
    { label: "Safe", score: 93, tagline: "Polished without trying too hard.", top: WARDROBE[1], bottom: WARDROBE[7], shoes: WARDROBE[12] },
    { label: "Colorful", score: 89, tagline: "Warm tones that stand out.", top: WARDROBE[3], bottom: WARDROBE[8], shoes: WARDROBE[14] },
    { label: "Bold", score: 95, tagline: "Sharp, dark, and intentional.", top: WARDROBE[2], bottom: WARDROBE[9], shoes: WARDROBE[12] },
  ],
  casual: [
    { label: "Safe", score: 91, tagline: "Goes with everything, always works.", top: WARDROBE[2], bottom: WARDROBE[8], shoes: WARDROBE[13] },
    { label: "Colorful", score: 87, tagline: "Easy color, relaxed mood.", top: WARDROBE[3], bottom: WARDROBE[7], shoes: WARDROBE[13] },
    { label: "Bold", score: 90, tagline: "Casual with an edge.", top: WARDROBE[5], bottom: WARDROBE[8], shoes: WARDROBE[12] },
  ],
  night_out: [
    { label: "Safe", score: 92, tagline: "Classic dark look, never fails.", top: WARDROBE[2], bottom: WARDROBE[9], shoes: WARDROBE[12] },
    { label: "Colorful", score: 88, tagline: "Earth tones under the lights.", top: WARDROBE[3], bottom: WARDROBE[7], shoes: WARDROBE[12] },
    { label: "Bold", score: 97, tagline: "All black. Maximum impact.", top: WARDROBE[5], bottom: WARDROBE[9], shoes: WARDROBE[12] },
  ],
  travel: [
    { label: "Safe", score: 90, tagline: "Comfortable and put-together.", top: WARDROBE[0], bottom: WARDROBE[7], shoes: WARDROBE[13] },
    { label: "Colorful", score: 86, tagline: "Relaxed layers for any climate.", top: WARDROBE[3], bottom: WARDROBE[8], shoes: WARDROBE[13] },
    { label: "Bold", score: 89, tagline: "Utility meets style.", top: WARDROBE[6], bottom: WARDROBE[8], shoes: WARDROBE[13] },
  ],
  gym: [
    { label: "Safe", score: 92, tagline: "Clean, functional, no-fuss.", top: WARDROBE[2], bottom: WARDROBE[11], shoes: WARDROBE[16] },
    { label: "Colorful", score: 88, tagline: "Neutral on top, athletic on bottom.", top: WARDROBE[5], bottom: WARDROBE[11], shoes: WARDROBE[16] },
    { label: "Bold", score: 94, tagline: "All black. Built for performance.", top: WARDROBE[5], bottom: WARDROBE[10], shoes: WARDROBE[16] },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  Safe:     { bg: "bg-white",           pill: "bg-neutral-100 text-neutral-700",   pillText: "Most wearable" },
  Colorful: { bg: "bg-amber-50",        pill: "bg-amber-100 text-amber-800",       pillText: "Color balanced" },
  Bold:     { bg: "bg-neutral-950",     pill: "bg-white/10 text-white",            pillText: "High impact" },
};

const COLOR_BG: Record<string, string> = {
  black:   "bg-neutral-900",
  white:   "bg-neutral-100",
  neutral: "bg-stone-200",
  earth:   "bg-amber-200",
  blue:    "bg-sky-200",
  bright:  "bg-violet-200",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ItemPill({ item, dark }: { item: Item; dark?: boolean }) {
  const bg = COLOR_BG[item.color_family] ?? "bg-neutral-200";
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${dark ? "bg-white/8" : "bg-black/5"}`}>
      <div className={`h-5 w-5 rounded-full border border-black/10 ${bg} flex-shrink-0`} />
      <span className={`text-sm font-medium ${dark ? "text-white" : "text-neutral-800"}`}>
        {pretty(item.type)}
      </span>
      <span className={`ml-auto text-xs ${dark ? "text-white/50" : "text-neutral-400"}`}>
        {item.color_family}
      </span>
    </div>
  );
}

function OutfitShowcard({ preset }: { preset: OutfitPreset }) {
  const style = LABEL_STYLE[preset.label];
  const isDark = preset.label === "Bold";

  return (
    <div className={`rounded-3xl ${style.bg} p-6 flex flex-col gap-5 border ${isDark ? "border-white/10" : "border-black/8"} h-full`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${style.pill}`}>
            {preset.label} · {style.pillText}
          </span>
          <p className={`mt-2 text-sm ${isDark ? "text-white/60" : "text-neutral-500"}`}>
            {preset.tagline}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-black ${isDark ? "text-white" : "text-black"}`}>
            {preset.score}
          </div>
          <div className={`text-xs ${isDark ? "text-white/40" : "text-neutral-400"}`}>/100</div>
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2">
        <ItemPill item={preset.top} dark={isDark} />
        <ItemPill item={preset.bottom} dark={isDark} />
        <ItemPill item={preset.shoes} dark={isDark} />
      </div>

      {/* Score bar */}
      <div className="mt-auto">
        <div className={`h-1 w-full rounded-full ${isDark ? "bg-white/10" : "bg-black/8"}`}>
          <div
            className={`h-1 rounded-full ${isDark ? "bg-white" : "bg-black"} transition-all duration-700`}
            style={{ width: `${preset.score}%` }}
          />
        </div>
        <div className={`mt-1 text-xs ${isDark ? "text-white/30" : "text-neutral-400"}`}>
          outfit score
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TryItPage() {
  const [occasion, setOccasion] = React.useState<Occasion>("work");
  const presets = PRESETS[occasion];
  const cfg = OCCASION_CONFIG[occasion];

  return (
    <AppShell title="Try OutfitMirror">
      {/* Hero */}
      <div className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            OutfitMirror
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
            Your wardrobe.<br />
            <span className="text-neutral-400">3 outfits. Instantly.</span>
          </h1>
          <p className="mt-4 text-lg text-neutral-500 max-w-xl mx-auto">
            Pick an occasion and see exactly what OutfitMirror generates — from your own clothes.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">

        {/* Occasion selector */}
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-500 mb-4">Pick an occasion</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(Object.keys(OCCASION_CONFIG) as Occasion[]).map((o) => {
              const c = OCCASION_CONFIG[o];
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOccasion(o)}
                  className={[
                    "rounded-full px-5 py-2.5 text-sm font-medium border transition",
                    o === occasion
                      ? "bg-black text-white border-black"
                      : "bg-white text-neutral-700 border-black/15 hover:border-black/40",
                  ].join(" ")}
                >
                  {c.emoji} {c.label}
                </button>
              );
            })}
          </div>

          {/* Occasion context */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm text-neutral-600">
            <span className="text-base">{cfg.emoji}</span>
            <span>{cfg.description}</span>
          </div>
        </div>

        {/* Outfit cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {presets.map((preset) => (
            <OutfitShowcard key={preset.label} preset={preset} />
          ))}
        </div>

        {/* How it works */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3 text-center">
          {[
            { step: "01", title: "Upload your wardrobe", body: "Photo or manual — add what you actually own." },
            { step: "02", title: "Pick your occasion", body: "Work, date, casual, night out, travel, or gym." },
            { step: "03", title: "Get 3 outfits instantly", body: "Safe, Colorful, or Bold — scored and ready." },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-black/8 p-6">
              <div className="text-xs font-black text-neutral-300 mb-3">{s.step}</div>
              <div className="font-semibold text-neutral-900">{s.title}</div>
              <div className="mt-1 text-sm text-neutral-500">{s.body}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-3xl bg-black text-white p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
            Ready?
          </p>
          <h2 className="text-3xl font-black">
            Start with your own wardrobe
          </h2>
          <p className="mt-3 text-white/60 max-w-sm mx-auto">
            Free to try. No credit card. Takes 2 minutes to set up.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-white text-black px-8 py-3.5 text-sm font-semibold hover:bg-white/90 transition"
            >
              Get Started Free →
            </Link>
            <Link
              href="/app"
              className="rounded-full border border-white/20 text-white px-8 py-3.5 text-sm font-semibold hover:bg-white/10 transition"
            >
              Open App
            </Link>
          </div>
        </div>

      </div>
    </AppShell>
  );
}