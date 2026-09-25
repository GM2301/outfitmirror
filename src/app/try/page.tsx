"use client";

import * as React from "react";
import Link from "next/link";
import type { Item } from "@/lib/engine/types";
import { generateOutfits, isDress } from "@/lib/engine/generate";

type Occasion = "work" | "date" | "casual" | "night_out" | "travel" | "gym";
const w = (id: string, category: Item["category"], type: string, color_family: string): Item => ({ id, category, type, color_family });

// Sample wardrobes run through the real outfit engine - the demo shows exactly
// what the app does with a wardrobe, not hand-picked results.
const WARDROBES: Record<"male" | "female", Item[]> = {
  male: [
    w("t1", "top", "shirt", "white"), w("t2", "top", "polo", "navy"), w("t3", "top", "tee", "black"), w("t4", "top", "tee", "white"),
    w("t5", "top", "sweater", "beige"), w("t6", "top", "hoodie", "grey"),
    w("b1", "bottom", "chinos", "beige"), w("b2", "bottom", "jeans", "blue"), w("b3", "bottom", "trousers", "grey"), w("b4", "bottom", "shorts", "navy"),
    w("b5", "bottom", "joggers", "black"),
    w("s1", "shoes", "chelsea_boots", "brown"), w("s2", "shoes", "sneakers", "white"), w("s3", "shoes", "loafers", "brown"), w("s4", "shoes", "running_shoes", "black"),
    w("o1", "outerwear", "bomber", "black"), w("o2", "outerwear", "blazer", "navy"), w("o3", "outerwear", "coat", "grey"),
  ],
  female: [
    w("f1", "top", "blouse", "white"), w("f2", "top", "tee", "black"), w("f3", "top", "knit", "beige"), w("f4", "top", "dress", "black"),
    w("f5", "top", "midi_dress", "green"), w("f6", "top", "tank", "white"),
    w("f7", "bottom", "jeans", "blue"), w("f8", "bottom", "midi_skirt", "beige"), w("f9", "bottom", "trousers", "black"), w("f10", "bottom", "leggings", "black"),
    w("f11", "shoes", "sneakers", "white"), w("f12", "shoes", "heels", "black"), w("f13", "shoes", "ankle_boots", "brown"), w("f14", "shoes", "running_shoes", "grey"),
    w("f15", "outerwear", "trench", "beige"), w("f16", "outerwear", "denim_jacket", "blue"), w("f17", "outerwear", "coat", "black"),
  ],
};

const TEMPS = [{ t: 6, label: "6°C" }, { t: 16, label: "16°C" }, { t: 27, label: "27°C" }];

const OCCASIONS: Record<Occasion, { label: string; emoji: string; desc: string }> = {
  work:      { label: "Work",      emoji: "💼", desc: "Professional" },
  date:      { label: "Date",      emoji: "🌹", desc: "Stylish"      },
  casual:    { label: "Casual",    emoji: "☀️", desc: "Relaxed"      },
  night_out: { label: "Night Out", emoji: "🌙", desc: "Sharp"        },
  travel:    { label: "Travel",    emoji: "✈️", desc: "Versatile"    },
  gym:       { label: "Gym",       emoji: "💪", desc: "Athletic"     },
};

const COLOR_BG: Record<string, string> = {
  black: "bg-neutral-900 text-white", white: "bg-neutral-50 text-black border border-black/8",
  neutral: "bg-stone-200 text-black", earth: "bg-amber-100 text-black",
  blue: "bg-sky-100 text-black", bright: "bg-violet-100 text-black",
  navy: "bg-blue-900 text-white", grey: "bg-neutral-300 text-black", beige: "bg-amber-50 text-black",
  brown: "bg-amber-800 text-white", green: "bg-emerald-100 text-black",
};

function pretty(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

function ItemRow({ label, item }: { label: string; item: Item }) {
  const bg = COLOR_BG[item.color_family] ?? "bg-neutral-100 text-black";
  const emoji = ({ Jacket: "🧥", Top: isDress(item) ? "👗" : "👕", Under: "👕", Bottom: "👖", Shoes: "👟" } as Record<string, string>)[label] ?? "👕";
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
  const [gender, setGender] = React.useState<"male" | "female">("male");
  const [temp, setTemp] = React.useState(16);
  const [index, setIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);

  const looks = React.useMemo(
    () => generateOutfits(WARDROBES[gender], occasion, 7, { tempC: temp, gender, style: "minimal" }),
    [occasion, gender, temp]
  );
  const look = looks[index % looks.length];

  function reveal(update: () => void) {
    update(); setIndex(0); setRevealed(false);
    setTimeout(() => setRevealed(true), 50);
  }

  React.useEffect(() => { setTimeout(() => setRevealed(true), 300); }, []);

  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="px-4 pt-14 pb-8 text-center max-w-lg mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4">Interactive Demo</p>
        <h1 className="font-display text-4xl font-black tracking-tight mb-3">See it in action.</h1>
        <p className="text-sm text-neutral-500">Pick an occasion and the weather. Occaswear picks the best look from a sample wardrobe — and explains why it works.</p>
      </section>

      {/* Occasion selector */}
      <section className="px-4 pb-6 max-w-2xl mx-auto">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(Object.keys(OCCASIONS) as Occasion[]).map((o) => {
            const cfg = OCCASIONS[o];
            const active = o === occasion;
            return (
              <button key={o} type="button" onClick={() => reveal(() => setOccasion(o))}
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

      {/* Wardrobe + weather */}
      <section className="px-4 pb-6 max-w-2xl mx-auto flex flex-wrap gap-2 justify-center">
        {(["male", "female"] as const).map(g => (
          <button key={g} type="button" onClick={() => reveal(() => setGender(g))}
            className={"rounded-full px-4 py-2 text-xs font-bold border transition " + (gender === g ? "bg-black text-white border-black" : "border-black/10 hover:bg-neutral-50")}>
            {g === "male" ? "👔 Menswear" : "👗 Womenswear"}
          </button>
        ))}
        <span className="w-px bg-black/10 mx-1" />
        {TEMPS.map(x => (
          <button key={x.t} type="button" onClick={() => reveal(() => setTemp(x.t))}
            className={"rounded-full px-4 py-2 text-xs font-bold border transition " + (temp === x.t ? "bg-black text-white border-black" : "border-black/10 hover:bg-neutral-50")}>
            {x.label}
          </button>
        ))}
      </section>

      {/* The look */}
      <section className="px-4 pb-10 max-w-md mx-auto">
        <div className={"rounded-2xl border border-black/8 overflow-hidden transition-all " + (revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
          style={{ transitionDuration: "400ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div className="px-5 py-4 flex items-center justify-between border-b border-black/6 bg-white">
            <span className="rounded-full px-2.5 py-1 text-xs font-bold bg-neutral-100 text-neutral-700">
              {OCCASIONS[occasion].label} look
            </span>
            <span className="text-xs text-neutral-400">{(index % looks.length) + 1} of {looks.length}</span>
          </div>
          <div className="p-4 space-y-3">
            {look.picks.outer && <ItemRow label="Jacket" item={look.picks.outer} />}
            <ItemRow label="Top" item={look.picks.top} />
            {look.picks.inner && <ItemRow label="Under" item={look.picks.inner} />}
            {look.picks.bottom && <ItemRow label="Bottom" item={look.picks.bottom} />}
            <ItemRow label="Shoes" item={look.picks.shoes} />
          </div>
          <div className="px-4 pb-4">
            <div className="rounded-xl bg-neutral-50 border border-black/6 px-3 py-2.5">
              <p className="text-xs text-neutral-400 font-medium mb-0.5">Why it works</p>
              <p className="text-xs text-neutral-600 leading-relaxed">{look.why}</p>
            </div>
          </div>
        </div>
        <button type="button" onClick={() => setIndex(i => i + 1)}
          className="mt-3 w-full rounded-2xl border border-black/10 bg-white py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition">
          ↻ Another look
        </button>

        <p className="text-center text-xs text-neutral-400 mt-5">
          Demo uses a sample wardrobe. With your clothes, results are personalized to what you actually own.
        </p>
      </section>

      {/* What you get */}
      <section className="px-4 pb-8 max-w-lg mx-auto">
        <div className="rounded-2xl border-2 border-black p-5">
          <p className="font-bold text-sm mb-4">With your own wardrobe you get</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
            {["📷 Upload your wardrobe", "✨ Outfits in seconds", "🌤️ Weather-aware outfits", "✈️ Trip Planner", "🧩 Missing Piece", "💑 Couple Mode"].map(f => (
              <div key={f} className="flex items-center gap-1.5">{f}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white px-4 py-14 text-center">
        <div className="max-w-sm mx-auto">
          <h2 className="font-display text-3xl font-black mb-2">Try it with your wardrobe.</h2>
          <p className="text-sm text-white/50 mb-8">Free during early access. No credit card.</p>
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