import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">

      {/* HERO */}
      <section className="relative px-4 pt-16 pb-14 max-w-2xl mx-auto">
        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-500 mb-8 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Free to try · No credit card
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-5">
            Stop guessing.<br />
            <span className="text-neutral-300">Start dressing.</span>
          </h1>
          <p className="text-base text-neutral-500 max-w-sm leading-relaxed mb-8">
            Upload your clothes, pick an occasion, and OutfitMirror generates 2 complete outfits in seconds — using what you already own.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/signup"
              className="rounded-full bg-black text-white px-7 py-4 text-sm font-bold hover:bg-black/85 transition-all btn-press text-center shadow-lg shadow-black/15">
              Get Started Free →
            </Link>
            <Link href="/try"
              className="rounded-full border-2 border-black/10 px-7 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-black/20 transition text-center">
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-black text-white px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/25 mb-8 text-center">The Reality</p>
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { n: "73%", label: "of men wear the same 5 outfits on repeat" },
              { n: "18m", label: "wasted every morning deciding what to wear" },
              { n: "40%", label: "of clothes in your wardrobe are never worn" },
            ].map((s) => (
              <div key={s.n}>
                <p className="font-display text-4xl font-black mb-2">{s.n}</p>
                <p className="text-xs text-white/35 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t border-white/8 text-center">
            <p className="text-sm text-white/50 font-medium">OutfitMirror fixes all three.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-14 max-w-2xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3 text-center">How It Works</p>
        <h2 className="font-display text-3xl font-black text-center mb-10">3 steps. 60 seconds.</h2>
        <div className="space-y-3">
          {[
            { n: "01", icon: "📷", title: "Upload your wardrobe", body: "Take photos of your clothes. AI reads the category, type, and color automatically. No manual entry." },
            { n: "02", icon: "🎯", title: "Pick your occasion",   body: "Work meeting, date night, casual Sunday, gym session — 6 occasions, each with its own rules." },
            { n: "03", icon: "✨", title: "Wear with confidence", body: "Two complete outfits, styled by AI, in seconds. Weather-aware. Explained. Ready to wear." },
          ].map((s) => (
            <div key={s.n} className="flex gap-4 p-5 rounded-2xl border border-black/8 hover:border-black/15 transition group">
              <div className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-display text-sm font-black text-neutral-200">{s.n}</span>
                  <p className="font-bold text-sm">{s.title}</p>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-neutral-50 border-y border-black/6 px-4 py-14">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3 text-center">Features</p>
          <h2 className="font-display text-3xl font-black text-center mb-8">Everything you need.<br/>Nothing you don't.</h2>

          {/* Trip Planner — hero feature */}
          <div className="rounded-2xl bg-black text-white p-6 mb-3 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
            <div className="relative flex items-start gap-4">
              <span className="text-3xl flex-shrink-0">✈️</span>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="font-bold text-sm">Trip Planner</p>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">Premium</span>
                </div>
                <p className="text-xs text-white/55 leading-relaxed">
                  Going somewhere for 4 days? Enter destination + dates. We plan your outfits day by day — from your wardrobe — based on the weather forecast there.
                </p>
              </div>
            </div>
          </div>

          {/* Missing Piece */}
          <div className="rounded-2xl border-2 border-black p-5 mb-3">
            <div className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">🧩</span>
              <div>
                <p className="font-bold text-sm mb-1">Missing Piece</p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  AI identifies the one item that would unlock the most new outfit combinations in your wardrobe. Smart shopping, not more shopping.
                </p>
              </div>
            </div>
          </div>

          {/* Grid 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: "🌤️", title: "Weather-aware",   body: "Outfits filtered by real-time weather at your location" },
              { emoji: "🔒", title: "Pin System",       body: "Lock a piece you want to wear — AI builds the rest around it" },
              { emoji: "🤖", title: "AI Assistant",     body: "Chat that knows your wardrobe and gives real advice" },
              { emoji: "📤", title: "Share Card",       body: "Export story-ready outfit cards for Instagram" },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-black/8 p-4 hover:border-black/15 transition">
                <span className="text-xl">{f.emoji}</span>
                <p className="font-bold text-xs mt-2 mb-1">{f.title}</p>
                <p className="text-xs text-neutral-400 leading-tight">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-4 py-14 max-w-2xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3 text-center">Early Users</p>
        <h2 className="font-display text-3xl font-black text-center mb-8">Real wardrobes.<br/>Real results.</h2>
        <div className="space-y-3">
          {[
            { quote: "Finally an app that works with what I already have — not what I should buy next.", name: "Alex",   age: 28, tag: "Casual dresser" },
            { quote: "I open it every morning before work. 10 seconds and I always look put together.", name: "Marcus", age: 31, tag: "Office professional" },
            { quote: "Trip Planner alone is worth it. Packed perfectly for 5 days in Rome.", name: "James",  age: 26, tag: "Frequent traveler" },
          ].map((t) => (
            <div key={t.name} className="rounded-2xl border border-black/8 p-5 hover:border-black/12 transition">
              <p className="text-sm text-neutral-700 leading-relaxed mb-4">"{t.quote}"</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center font-display">
                    {t.name[0]}
                  </div>
                  <p className="text-xs font-bold">{t.name}, {t.age}</p>
                </div>
                <span className="text-xs text-neutral-400">{t.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-black text-white px-4 py-16 text-center">
        <div className="max-w-sm mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/25 mb-5">Ready?</p>
          <h2 className="font-display text-4xl font-black mb-3">Your wardrobe<br/>is waiting.</h2>
          <p className="text-sm text-white/45 mb-8">Free to start. 2 minutes to set up. No credit card.</p>
          <Link href="/signup"
            className="inline-block rounded-full bg-white text-black px-10 py-4 text-sm font-bold hover:bg-white/90 transition btn-press shadow-lg shadow-white/10">
            Create Free Account →
          </Link>
          <p className="mt-4 text-xs text-white/20">Join the waitlist. Be the first.</p>
        </div>
      </section>

    </main>
  );
}