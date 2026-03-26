import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-24 pb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-6">About OutfitMirror</p>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05]">
          We believe every man<br />
          deserves to look good<br />
          <span className="text-neutral-400">without the effort.</span>
        </h1>
        <p className="mt-8 text-xl text-neutral-500 max-w-2xl leading-relaxed">
          OutfitMirror was built for one reason: most men have perfectly good clothes and no idea how to use them. We fix that.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-black text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
          <div className="flex gap-8 items-start">
            <div className="w-1 bg-white/20 flex-shrink-0 self-stretch rounded-full hidden sm:block" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Our Mission</p>
              <p className="text-2xl sm:text-3xl font-black leading-snug">
                Make every man look intentional — using only what he already owns.
              </p>
              <p className="mt-6 text-white/60 leading-relaxed max-w-2xl">
                Looking good shouldn't require a personal stylist, expensive clothes, or hours of decision-making. It should take seconds. That's what we built.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The problem we solve */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-8">The Problem We Solve</p>
        <div className="space-y-0">
          {[
            { n: "01", title: "Too many clothes, not enough outfits", body: "Most men own more than enough to dress well. The issue is combining them correctly — a skill that was never taught." },
            { n: "02", title: "Generic advice doesn't work", body: "YouTube videos and style blogs give generic tips. None of them know what's actually in your wardrobe." },
            { n: "03", title: "Personal stylists are expensive", body: "A good stylist costs hundreds per session. That's not a solution for most people." },
            { n: "04", title: "Decision fatigue is real", body: "18 minutes wasted every morning. Low confidence. The same 3 outfits on rotation. We've all been there." },
          ].map((p) => (
            <div key={p.n} className="flex gap-8 py-8 border-b border-black/6 last:border-0">
              <span className="text-2xl font-black text-neutral-100 flex-shrink-0 w-8">{p.n}</span>
              <div>
                <h3 className="font-bold text-base mb-1.5">{p.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What we built */}
      <div className="bg-neutral-50 border-y border-black/6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-8">What We Built</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-2xl font-black mb-4">A Closet OS for men.</h2>
              <p className="text-neutral-600 leading-relaxed">
                OutfitMirror is not a shopping app. It's an intelligent system that takes your actual wardrobe and turns it into ready-to-wear outfit combinations — instantly.
              </p>
              <p className="mt-3 text-neutral-600 leading-relaxed">
                We factor in your occasion, the weather, color harmony, and the rules of men's style — so every suggestion is practical, not just theoretical.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                { emoji: "📷", text: "AI reads your clothes from a photo" },
                { emoji: "🌤️", text: "Weather filter removes wrong clothes" },
                { emoji: "🎯", text: "Occasion rules ensure every outfit fits" },
                { emoji: "✅", text: "Color harmony checked automatically" },
                { emoji: "🤖", text: "AI assistant for personalized advice" },
                { emoji: "🛍️", text: "Missing Piece to complete your wardrobe" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3 rounded-xl bg-white border border-black/8 px-4 py-3">
                  <span className="text-lg">{f.emoji}</span>
                  <p className="text-sm text-neutral-700">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-8">Our Values</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { emoji: "⚡", title: "Speed first", body: "Every decision in the product is made with speed in mind. No unnecessary steps." },
            { emoji: "👤", title: "Personal always", body: "Generic advice is worthless. Everything is built around your specific wardrobe." },
            { emoji: "🎯", title: "Practical over perfect", body: "We give you outfits you can actually wear today, not aspirational looks." },
          ].map((v) => (
            <div key={v.title} className="rounded-2xl border border-black/8 p-6 hover:border-black/20 transition">
              <span className="text-2xl">{v.emoji}</span>
              <h3 className="mt-4 font-bold text-sm">{v.title}</h3>
              <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-black/8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20 text-center">
          <h2 className="text-3xl font-black">Ready to stop guessing?</h2>
          <p className="mt-3 text-neutral-500">Start free. Your first outfit in under 2 minutes.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup"
              className="rounded-full bg-black text-white px-8 py-4 text-sm font-semibold hover:bg-black/85 transition text-center">
              Get Started Free →
            </Link>
            <Link href="/try"
              className="rounded-full border border-black/15 px-8 py-4 text-sm font-semibold hover:bg-neutral-50 transition text-center">
              See How It Works
            </Link>
          </div>
        </div>
      </div>

    </main>
  );
}