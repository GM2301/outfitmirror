import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* HERO — Editorial */}
      <section className="px-4 pt-16 pb-12 max-w-2xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-6 animate-fade-up reveal">About</p>
        <h1 className="font-display text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight animate-fade-up delay-100 reveal">
          We fix the<br />
          problem most<br />
          <em className="text-neutral-300 not-italic">men ignore.</em>
        </h1>
        <p className="mt-6 text-base text-neutral-500 leading-relaxed max-w-md animate-fade-up delay-200 reveal">
          Most men own enough clothes. They just don't know how to combine them.
          OutfitMirror is the AI stylist you never had — built around what you already own.
        </p>
      </section>

      {/* MISSION — Black block */}
      <section className="mx-4 rounded-3xl bg-black text-white px-8 py-10 mb-4 max-w-5xl sm:mx-auto relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">Mission</p>
          <p className="font-display text-3xl sm:text-4xl font-black leading-tight max-w-xl">
            Make every man look intentional — using only what he already owns.
          </p>
        </div>
      </section>

      {/* PROBLEMS — Editorial list */}
      <section className="px-4 py-12 max-w-2xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-8">The Problem</p>
        <div className="space-y-0">
          {[
            {
              n: "01",
              title: "Too many clothes, zero outfits",
              body: "Combining clothes is a skill nobody teaches. Most men wear the same 5 combinations on repeat — not because they don't have options, but because they don't know what works."
            },
            {
              n: "02",
              title: "Generic advice is useless",
              body: "Style blogs tell you what to buy. OutfitMirror tells you what to wear — from your actual wardrobe, not a wishlist."
            },
            {
              n: "03",
              title: "Real stylists cost hundreds",
              body: "A personal stylist consultation starts at $150/hour. Most people can't justify that for everyday dressing."
            },
            {
              n: "04",
              title: "18 minutes wasted every morning",
              body: "Decision fatigue is real. Standing in front of your wardrobe costs more than time — it costs confidence."
            },
          ].map((p, i) => (
            <div key={p.n} className="flex gap-6 py-7 border-b border-black/6 last:border-0">
              <span className="font-display text-3xl font-black text-neutral-100 flex-shrink-0 w-10">{p.n}</span>
              <div>
                <p className="font-bold text-base mb-1.5">{p.title}</p>
                <p className="text-sm text-neutral-500 leading-relaxed">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT WE BUILT */}
      <section className="bg-neutral-50 border-y border-black/6 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3">What We Built</p>
          <h2 className="font-display text-3xl font-black mb-2">A Closet OS for men.</h2>
          <p className="text-sm text-neutral-500 mb-8">Not an app. An operating system for your wardrobe.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { emoji: "📷", title: "AI Photo Analysis", body: "Upload a photo. AI reads category, type, and color automatically. No manual entry." },
              { emoji: "🎯", title: "Occasion-first Engine", body: "Work, date, casual, gym — different rules for each. No more mismatched formality." },
              { emoji: "🌤️", title: "Weather Intelligence", body: "Real-time weather filtering. No more putting on a hoodie when it's 30°C." },
              { emoji: "🧩", title: "Missing Piece", body: "One item that unlocks 20+ new combinations. The smartest shopping suggestion you'll ever get." },
              { emoji: "✈️", title: "Trip Planner", body: "4 days in Rome? We pack your outfits day by day — based on the weather forecast there." },
              { emoji: "🤖", title: "AI Style Assistant", body: "A chat that knows your wardrobe. Ask it anything. Get advice that's actually about your clothes." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-white border border-black/8 p-5 hover:border-black/15 transition">
                <span className="text-2xl">{f.emoji}</span>
                <p className="font-bold text-sm mt-3 mb-1.5">{f.title}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="px-4 py-12 max-w-2xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-8">What We Believe</p>
        <div className="space-y-6">
          {[
            { title: "You have enough clothes.", body: "You just need help using them. We never push shopping — we optimize what you have." },
            { title: "Style is confidence.", body: "Looking intentional changes how you carry yourself. It's not vanity — it's self-respect." },
            { title: "Simplicity wins.", body: "The best outfit decision takes 10 seconds. We built OutfitMirror to get you there." },
          ].map((v) => (
            <div key={v.title} className="flex gap-4">
              <div className="w-px bg-black flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-sm mb-1">{v.title}</p>
                <p className="text-sm text-neutral-500 leading-relaxed">{v.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white px-4 py-16 text-center">
        <div className="max-w-sm mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">Ready?</p>
          <h2 className="font-display text-3xl font-black mb-3">Stop guessing.<br />Start dressing.</h2>
          <p className="text-sm text-white/50 mb-8">Free. 2 minutes. No credit card.</p>
          <div className="flex flex-col gap-3">
            <Link href="/signup"
              className="rounded-full bg-white text-black px-8 py-4 text-sm font-bold hover:bg-white/90 transition btn-press">
              Create Free Account →
            </Link>
            <Link href="/try"
              className="rounded-full border border-white/20 px-8 py-3.5 text-sm font-medium text-white/70 hover:bg-white/5 transition">
              See How It Works
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}