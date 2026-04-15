import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">

      {/* HERO */}
      <section className="relative px-4 pt-16 pb-14 text-center">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-500 mb-8 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Free to try · No credit card
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
            Your wardrobe.<br />
            <span className="relative inline-block">
              Reimagined.
              <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M0 5 Q50 0 100 5 Q150 10 200 5" stroke="black" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          <p className="text-base text-neutral-500 max-w-xs mx-auto leading-relaxed mb-8">
            Upload your clothes, pick an occasion, get styled by AI in seconds. Works with what you already own.
          </p>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link href="/signup"
              className="rounded-full bg-black px-6 py-4 text-sm font-bold text-white hover:bg-black/85 transition-all hover:scale-[1.02] active:scale-[0.98] text-center shadow-lg shadow-black/20">
              Get Started Free →
            </Link>
            <Link href="/try"
              className="rounded-full border-2 border-black/10 px-6 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-black/20 transition text-center">
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* STATS — EDITORIAL STYLE */}
      <section className="bg-black text-white px-4 py-10">
        <div className="max-w-sm mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-6 text-center">The Reality</p>
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { n: "73%", label: "of men wear the same 5 outfits on repeat" },
              { n: "18", label: "minutes wasted every morning choosing what to wear" },
              { n: "40%", label: "of clothes in your wardrobe are never worn" },
            ].map((s) => (
              <div key={s.n}>
                <p className="text-3xl font-black">{s.n}<span className="text-white/30 text-lg">%</span></p>
                <p className="text-xs text-white/40 mt-1.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-sm text-white/60 font-medium">
            OutfitMirror fixes all three.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-14">
        <div className="max-w-sm mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2 text-center">How It Works</p>
          <h2 className="text-2xl font-black text-center mb-10">3 steps. 60 seconds.</h2>
          <div className="space-y-4">
            {[
              { step: "01", title: "Upload your wardrobe", body: "Take photos of your clothes. AI reads category, type, and color automatically.", icon: "📸" },
              { step: "02", title: "Pick your occasion", body: "Work meeting, date night, casual Sunday, gym — 6 occasions, each with its own rules.", icon: "🎯" },
              { step: "03", title: "Wear with confidence", body: "Two complete outfits, generated in seconds. Weather-aware. Styled by AI.", icon: "✨" },
            ].map((s) => (
              <div key={s.step} className="flex gap-4 items-start p-4 rounded-2xl border border-black/8 hover:border-black/20 transition">
                <div className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-neutral-300">{s.step}</span>
                    <p className="font-bold text-sm">{s.title}</p>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — PREMIUM GRID */}
      <section className="bg-neutral-50 border-y border-black/6 px-4 py-14">
        <div className="max-w-sm mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2 text-center">Features</p>
          <h2 className="text-2xl font-black text-center mb-8">Everything you need.<br/>Nothing you don't.</h2>
          <div className="grid grid-cols-1 gap-3">
            {/* Trip Planner — highlighted */}
            <div className="rounded-2xl bg-black text-white p-5">
              <div className="flex items-start gap-4">
                <span className="text-2xl">✈️</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-sm">Trip Planner</p>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">Premium</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">Going somewhere for 4 days? We plan your outfits day by day — based on the weather forecast at your destination.</p>
                </div>
              </div>
            </div>
            {/* Missing Piece — highlighted */}
            <div className="rounded-2xl border-2 border-black p-5">
              <div className="flex items-start gap-4">
                <span className="text-2xl">🧩</span>
                <div>
                  <p className="font-bold text-sm mb-1">Missing Piece</p>
                  <p className="text-xs text-neutral-500 leading-relaxed">AI identifies the one item that would unlock the most new combinations from your wardrobe.</p>
                </div>
              </div>
            </div>
            {/* Other features — 2x2 grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: "🌤️", title: "Weather-aware", body: "Outfits filtered by real weather" },
                { emoji: "🔒", title: "Pin System", body: "Lock a piece, AI does the rest" },
                { emoji: "🤖", title: "AI Assistant", body: "Chat that knows your wardrobe" },
                { emoji: "📤", title: "Share Card", body: "Story-ready outfit cards" },
              ].map((f) => (
                <div key={f.title} className="rounded-xl border border-black/8 p-4">
                  <span className="text-xl">{f.emoji}</span>
                  <p className="font-bold text-xs mt-2">{f.title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-tight">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="px-4 py-14">
        <div className="max-w-sm mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2 text-center">Early Users</p>
          <h2 className="text-2xl font-black text-center mb-8">Real people.<br/>Real wardrobes.</h2>
          <div className="space-y-3">
            {[
              { quote: "Finally an app that works with what I already have. Not what I should buy.", name: "Alex", age: 28, tag: "Casual dresser" },
              { quote: "I open it every morning before work. Takes 10 seconds and I always look put together.", name: "Marcus", age: 31, tag: "Office professional" },
              { quote: "The Trip Planner alone is worth it. Packed perfectly for a 5-day trip to Rome.", name: "James", age: 26, tag: "Frequent traveler" },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl bg-neutral-50 border border-black/6 p-5">
                <p className="text-sm text-neutral-700 leading-relaxed mb-3">"{t.quote}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                      {t.name[0]}
                    </div>
                    <p className="text-xs font-bold">{t.name}, {t.age}</p>
                  </div>
                  <span className="text-xs text-neutral-400">{t.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-black text-white px-4 py-16 text-center">
        <div className="max-w-sm mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Ready?</p>
          <h2 className="text-3xl font-black mb-3">Your wardrobe is waiting.</h2>
          <p className="text-sm text-white/50 mb-8">Free to start. 2 minutes to set up. No credit card.</p>
          <Link href="/signup"
            className="inline-block rounded-full bg-white text-black px-10 py-4 text-sm font-bold hover:bg-white/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10">
            Create Free Account →
          </Link>
          <p className="mt-4 text-xs text-white/30">Join the waitlist. Be the first.</p>
        </div>
      </section>

    </main>
  );
}