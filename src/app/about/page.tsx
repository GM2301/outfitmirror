import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <div className="border-b border-black/8 py-20 px-4">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">About</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            We solve the problem<br />most men ignore.
          </h1>
          <p className="mt-6 text-lg text-neutral-500 leading-relaxed max-w-xl">
            Every morning, millions of men open their wardrobe and freeze — not because they lack clothes, but because no one taught them how to combine what they own.
          </p>
          <p className="mt-3 text-sm font-semibold text-black">
            OutfitMirror fixes that.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-16 space-y-20">

        {/* Mission - inline, elegante */}
        <div className="flex gap-6 items-start">
          <div className="w-1 rounded-full bg-black flex-shrink-0 self-stretch" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-3">Our Mission</p>
            <p className="text-2xl sm:text-3xl font-black leading-snug">
              Make every man look intentional — using only what he already owns.
            </p>
            <p className="mt-4 text-neutral-500 leading-relaxed">
              Looking good shouldn't require a stylist, a big budget, or hours of decision-making. It should take seconds.
            </p>
          </div>
        </div>

        {/* 3 Values */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { emoji: "⚡", title: "Fast", body: "Pick an occasion. Get 3 outfits. Done in seconds." },
            { emoji: "👤", title: "Personal", body: "Built around your wardrobe, your style, your life." },
            { emoji: "🔄", title: "Consistent", body: "Safe, Colorful, or Bold — every single time." },
          ].map((v) => (
            <div key={v.title} className="rounded-2xl border border-black/8 p-6 hover:border-black/20 transition">
              <span className="text-xl">{v.emoji}</span>
              <h3 className="mt-3 font-bold text-sm">{v.title}</h3>
              <p className="mt-1 text-sm text-neutral-500 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>

        {/* Problem */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-6">The Problem</p>
          <div className="space-y-3">
            {[
              "Most men own enough clothes but don't know how to combine them.",
              "Getting dressed shouldn't require knowledge most people were never taught.",
              "Personal stylists are expensive. Generic advice ignores your actual wardrobe.",
              "The result: decision fatigue every morning, wasted clothes, and low confidence.",
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-4 py-4 border-b border-black/6 last:border-0">
                <span className="text-neutral-300 font-mono text-sm flex-shrink-0 mt-0.5">0{i + 1}</span>
                <p className="text-sm text-neutral-700 leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What we built */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">What We Built</p>
          <p className="text-neutral-700 leading-relaxed">
            OutfitMirror is a Closet OS — an intelligent system that takes your actual wardrobe and generates ready-to-wear outfit combinations in seconds. No fashion knowledge required.
          </p>
          <p className="mt-3 text-neutral-700 leading-relaxed">
            We factor in weather, occasion, color harmony, and your personal style history — so every suggestion is practical, not just theoretical.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link href="/signup"
            className="rounded-full bg-black text-white px-8 py-3.5 text-sm font-semibold hover:bg-black/85 transition text-center">
            Get Started Free →
          </Link>
          <Link href="/try"
            className="rounded-full border border-black/15 px-8 py-3.5 text-sm font-semibold hover:bg-neutral-50 transition text-center">
            See How It Works
          </Link>
        </div>

      </div>
    </main>
  );
}