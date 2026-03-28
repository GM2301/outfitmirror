import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <div className="px-4 pt-14 pb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">About</p>
        <h1 className="text-4xl font-black tracking-tight leading-[1.1]">
          We fix the problem<br />
          <span className="text-neutral-400">most men ignore.</span>
        </h1>
        <p className="mt-4 text-base text-neutral-500 leading-relaxed">
          Most men own enough clothes. They just don't know how to combine them. OutfitMirror fixes that — in seconds.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-black text-white px-4 py-8 mx-4 rounded-2xl mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">Mission</p>
        <p className="text-xl font-black leading-snug">
          Make every man look intentional — using only what he already owns.
        </p>
      </div>

      {/* Problems */}
      <div className="px-4 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">The Problem</p>
        <div className="space-y-3">
          {[
            { n: "01", title: "Too many clothes, zero outfits", body: "Combining clothes is a skill nobody teaches." },
            { n: "02", title: "Generic advice is useless", body: "Blogs don't know what's in your wardrobe." },
            { n: "03", title: "Stylists cost hundreds", body: "Not a real solution for most people." },
            { n: "04", title: "18 minutes wasted daily", body: "Decision fatigue, same 3 outfits, low confidence." },
          ].map((p) => (
            <div key={p.n} className="flex gap-4 py-4 border-b border-black/6 last:border-0">
              <span className="text-lg font-black text-neutral-200 flex-shrink-0">{p.n}</span>
              <div>
                <p className="font-bold text-sm">{p.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What we built */}
      <div className="bg-neutral-50 border-y border-black/6 px-4 py-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">What We Built</p>
        <p className="font-black text-lg mb-4">A Closet OS for men.</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { emoji: "📷", text: "AI reads clothes from photo" },
            { emoji: "🌤️", text: "Weather-aware filtering" },
            { emoji: "🎯", text: "Occasion-based rules" },
            { emoji: "✅", text: "Color harmony check" },
            { emoji: "🤖", text: "AI style assistant" },
            { emoji: "🛍️", text: "Missing Piece finder" },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-2 rounded-xl bg-white border border-black/8 px-3 py-2.5">
              <span>{f.emoji}</span>
              <p className="text-xs text-neutral-700">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 py-12 text-center">
        <h2 className="text-2xl font-black">Ready to stop guessing?</h2>
        <p className="mt-2 text-sm text-neutral-500">Free. 2 minutes to set up.</p>
        <div className="mt-6 flex flex-col gap-3 max-w-xs mx-auto">
          <Link href="/signup"
            className="rounded-full bg-black text-white px-6 py-3.5 text-sm font-semibold hover:bg-black/85 transition text-center">
            Get Started Free →
          </Link>
          <Link href="/try"
            className="rounded-full border border-black/15 px-6 py-3.5 text-sm font-semibold hover:bg-neutral-50 transition text-center">
            See How It Works
          </Link>
        </div>
      </div>

    </main>
  );
}