import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <div className="border-b border-black/8 py-20 px-4">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">About</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            We solve the problem most men ignore.
          </h1>
          <p className="mt-6 text-lg text-neutral-600 leading-relaxed max-w-2xl">
            Every morning, millions of men open their wardrobe and freeze. Not because they don't have clothes — but because no one ever taught them how to combine what they own. OutfitMirror fixes that.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-3xl bg-black text-white p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Our Mission</p>
          <p className="mt-4 text-2xl sm:text-3xl font-black leading-snug">
            Make every man look intentional — using only what he already owns.
          </p>
          <p className="mt-4 text-white/60 leading-relaxed">
            We believe looking good shouldn't require a stylist, a big budget, or hours of decision-making. It should take seconds. That's what we're building.
          </p>
        </div>

        {/* Values */}
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {[
            {
              emoji: "⚡",
              title: "Fast",
              body: "Pick an occasion. Get 3 outfits. Done in seconds — not minutes.",
            },
            {
              emoji: "👤",
              title: "Personal",
              body: "Built around your wardrobe, your style, your life. Not generic lookbooks.",
            },
            {
              emoji: "🔄",
              title: "Consistent",
              body: "Safe, Colorful, or Bold — every time. No more 'I have nothing to wear'.",
            },
          ].map((v) => (
            <div key={v.title} className="rounded-2xl border border-black/8 p-6">
              <span className="text-2xl">{v.emoji}</span>
              <h3 className="mt-3 font-bold text-base">{v.title}</h3>
              <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>

        {/* The problem */}
        <div className="mt-16">
          <h2 className="text-2xl font-black">The problem we're solving</h2>
          <div className="mt-6 space-y-4">
            {[
              "Most men own enough clothes but struggle to combine them well.",
              "Getting dressed shouldn't require style knowledge most people were never taught.",
              "Personal stylists are expensive. Generic advice doesn't fit your actual wardrobe.",
              "The result: decision fatigue every morning, wasted clothes, and low confidence.",
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-4 rounded-2xl border border-black/8 p-5">
                <span className="text-lg mt-0.5">{"→"}</span>
                <p className="text-sm text-neutral-700 leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What we built */}
        <div className="mt-16">
          <h2 className="text-2xl font-black">What we built</h2>
          <p className="mt-4 text-neutral-600 leading-relaxed">
            OutfitMirror is a Closet OS — an intelligent system that takes your actual wardrobe, understands the rules of men's style, and generates ready-to-wear outfit combinations in seconds. No fashion knowledge required. No expensive subscriptions. Just open the app, pick an occasion, and get dressed.
          </p>
          <p className="mt-4 text-neutral-600 leading-relaxed">
            We factor in the weather, the occasion, color harmony, and your personal style history — so every suggestion is practical, not just theoretical.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link href="/signup"
            className="rounded-full bg-black text-white px-8 py-3.5 text-sm font-semibold hover:bg-black/85 transition">
            Get Started Free →
          </Link>
          <Link href="/try"
            className="rounded-full border border-black/15 px-8 py-3.5 text-sm font-semibold hover:bg-neutral-50 transition">
            See How It Works
          </Link>
        </div>
      </div>
    </main>
  );
}