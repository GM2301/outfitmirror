import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-20 pb-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          OutfitMirror
        </p>
        <h1 className="mt-4 text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none">
          Never wonder
          <br />
          <span className="text-neutral-400">what to wear.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-neutral-500 max-w-lg mx-auto leading-relaxed">
          Upload your wardrobe, pick an occasion, get <strong className="text-black">3 outfits</strong> in seconds — from clothes you already own.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/try"
            className="rounded-full bg-black px-8 py-4 text-sm font-semibold text-white hover:bg-black/85 transition"
          >
            See How It Works →
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-black/15 px-8 py-4 text-sm font-semibold text-black hover:bg-neutral-50 transition"
          >
            Get Started Free
          </Link>
        </div>

        <p className="mt-4 text-xs text-neutral-400">Free to try · No credit card required</p>
      </div>

      {/* How it works */}
      <div className="border-t border-black/8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
          <div className="grid gap-8 sm:grid-cols-3 text-center">
            {[
              { step: "01", title: "Upload your wardrobe", body: "Photo or manual. AI detects type and color automatically." },
              { step: "02", title: "Pick an occasion", body: "Work, date, casual, night out, travel, or gym." },
              { step: "03", title: "Get 3 outfits instantly", body: "Safe, Colorful, or Bold — scored and ready to wear." },
            ].map((s) => (
              <div key={s.step}>
                <p className="text-3xl font-black text-neutral-100">{s.step}</p>
                <h3 className="mt-2 font-bold text-base">{s.title}</h3>
                <p className="mt-1 text-sm text-neutral-500 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Problem statement */}
      <div className="bg-black text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">The problem</p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-black leading-snug">
            Most men own enough clothes.<br />
            <span className="text-white/50">They just don't know how to combine them.</span>
          </h2>
          <p className="mt-6 text-white/60 leading-relaxed max-w-xl mx-auto">
            Decision fatigue every morning. Wasted clothes. Low confidence. OutfitMirror solves this in seconds — using only what you already own.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { emoji: "🎯", title: "Occasion-First", body: "Work, date, casual, night out, travel, gym — every suggestion fits the moment." },
            { emoji: "✨", title: "3 Styles Every Time", body: "Safe, Colorful, or Bold. You always have options, never a blank screen." },
            { emoji: "🤖", title: "AI Style Assistant", body: "Ask anything about your style. It knows your wardrobe and gives real advice." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-black/8 p-6 hover:border-black/20 transition">
              <span className="text-2xl">{f.emoji}</span>
              <h3 className="mt-3 font-bold text-sm">{f.title}</h3>
              <p className="mt-1 text-sm text-neutral-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof placeholder */}
      <div className="border-t border-black/8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-10">
            Built for men who want to look good without thinking about it
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { quote: "Finally an app that works with what I already have. Not another shopping app.", name: "Alex, 28" },
              { quote: "Takes 10 seconds. I open it every morning before work.", name: "Marcus, 31" },
              { quote: "The AI assistant actually knows what it's talking about. Impressed.", name: "James, 26" },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl bg-neutral-50 p-6">
                <p className="text-sm text-neutral-700 leading-relaxed">"{t.quote}"</p>
                <p className="mt-3 text-xs font-semibold text-neutral-400">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="border-t border-black/8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-black">
            Start dressing better today.
          </h2>
          <p className="mt-3 text-neutral-500">Free. No credit card. 2 minutes to set up.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="rounded-full bg-black px-8 py-4 text-sm font-semibold text-white hover:bg-black/85 transition"
            >
              Create Free Account →
            </Link>
            <Link
              href="/try"
              className="rounded-full border border-black/15 px-8 py-4 text-sm font-semibold hover:bg-neutral-50 transition"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </div>

    </main>
  );
}