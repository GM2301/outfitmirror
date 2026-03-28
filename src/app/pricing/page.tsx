import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <div className="px-4 pt-14 pb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-500 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Free to try · No credit card
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1]">
          Stop guessing.<br />Start dressing.
        </h1>
        <p className="mt-4 text-base text-neutral-500 max-w-xs mx-auto leading-relaxed">
          Upload your clothes, pick an occasion, get 2 outfits in seconds.
        </p>
        <div className="mt-7 flex flex-col gap-3 max-w-xs mx-auto">
          <Link href="/signup"
            className="rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white hover:bg-black/85 transition text-center">
            Get Started Free →
          </Link>
          <Link href="/try"
            className="rounded-full border border-black/15 px-6 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition text-center">
            See How It Works
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="border-y border-black/6 bg-neutral-50 px-4 py-5">
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
          {[
            { n: "73%", label: "wear same 5 outfits" },
            { n: "18min", label: "wasted every morning" },
            { n: "40%", label: "clothes never worn" },
          ].map((s) => (
            <div key={s.n}>
              <p className="text-xl font-black">{s.n}</p>
              <p className="text-xs text-neutral-400 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-black text-white px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-6 text-center">How It Works</p>
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
          {[
            { step: "01", title: "Upload", body: "AI reads your clothes automatically" },
            { step: "02", title: "Pick", body: "Choose work, date, casual, gym..." },
            { step: "03", title: "Wear", body: "2 outfits, ready in seconds" },
          ].map((s) => (
            <div key={s.step}>
              <p className="text-2xl font-black text-white/10">{s.step}</p>
              <p className="font-bold text-sm text-white mt-1">{s.title}</p>
              <p className="text-xs text-white/40 mt-1 leading-tight">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="px-4 py-10">
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          {[
            { emoji: "🌤️", title: "Weather-aware" },
            { emoji: "📍", title: "Occasion-first" },
            { emoji: "🤖", title: "AI Assistant" },
            { emoji: "🔒", title: "Pin system" },
            { emoji: "🛍️", title: "Missing Piece" },
            { emoji: "📤", title: "Share card" },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-black/8 px-4 py-3 flex items-center gap-3">
              <span className="text-lg">{f.emoji}</span>
              <p className="text-sm font-medium">{f.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="border-t border-black/6 bg-neutral-50 px-4 py-10">
        <div className="space-y-3 max-w-sm mx-auto">
          {[
            { quote: "Finally an app that works with what I already have.", name: "Alex, 28" },
            { quote: "I open it every morning before work. Game changer.", name: "Marcus, 31" },
            { quote: "The AI assistant actually knows what it's talking about.", name: "James, 26" },
          ].map((t) => (
            <div key={t.name} className="rounded-xl bg-white border border-black/8 p-4">
              <p className="text-sm text-neutral-700">"{t.quote}"</p>
              <p className="text-xs text-neutral-400 mt-2 font-semibold">{t.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 py-12 text-center">
        <h2 className="text-2xl font-black">Your wardrobe is waiting.</h2>
        <p className="mt-2 text-sm text-neutral-500">Free. 2 minutes to set up.</p>
        <Link href="/signup"
          className="mt-6 inline-block rounded-full bg-black px-8 py-3.5 text-sm font-semibold text-white hover:bg-black/85 transition">
          Create Free Account →
        </Link>
      </div>

    </main>
  );
}