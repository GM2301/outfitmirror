import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero - full impact */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-neutral-50 px-4 py-1.5 text-xs font-semibold text-neutral-500 mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
              Now available · Free to try
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05]">
              Stop guessing.<br />
              Start dressing.
            </h1>
            <p className="mt-6 text-xl text-neutral-500 max-w-xl leading-relaxed">
              OutfitMirror turns your wardrobe into a personal stylist. Upload your clothes, pick an occasion — get outfits in seconds.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link href="/signup"
                className="rounded-full bg-black px-8 py-4 text-sm font-semibold text-white hover:bg-black/85 transition text-center">
                Get Started Free →
              </Link>
              <Link href="/try"
                className="rounded-full border border-black/15 px-8 py-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition text-center">
                See How It Works
              </Link>
            </div>
            <p className="mt-4 text-xs text-neutral-400">No credit card · 2 minutes to set up · Works with clothes you already own</p>
          </div>
        </div>

        {/* Decoration */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-neutral-50 to-transparent hidden lg:block" />
      </div>

      {/* Social proof bar */}
      <div className="border-y border-black/6 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-medium text-neutral-400 uppercase tracking-widest">
            <span>Built for men</span>
            <span className="h-1 w-1 rounded-full bg-neutral-300"></span>
            <span>US Market</span>
            <span className="h-1 w-1 rounded-full bg-neutral-300"></span>
            <span>Weather-aware</span>
            <span className="h-1 w-1 rounded-full bg-neutral-300"></span>
            <span>AI-powered</span>
            <span className="h-1 w-1 rounded-full bg-neutral-300"></span>
            <span>Free to start</span>
          </div>
        </div>
      </div>

      {/* The problem */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">The Problem</p>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              You have enough clothes.<br />
              You just don't know<br />how to combine them.
            </h2>
            <p className="mt-6 text-neutral-500 leading-relaxed">
              Every morning, millions of men stand in front of their wardrobe and freeze. Not because they lack options — but because no one taught them how to put outfits together.
            </p>
            <p className="mt-3 text-neutral-500 leading-relaxed">
              The result: decision fatigue, late starts, and the same 3 outfits on rotation.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              { n: "73%", label: "of men wear the same 5 outfits repeatedly" },
              { n: "18 min", label: "average time wasted deciding what to wear" },
              { n: "40%", label: "of wardrobe items never worn after purchase" },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-black/8 p-6 flex items-center gap-5">
                <span className="text-3xl font-black text-black flex-shrink-0">{s.n}</span>
                <p className="text-sm text-neutral-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">How It Works</p>
          <h2 className="text-3xl font-black mb-12">Three steps. Under a minute.</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: "01", title: "Upload your wardrobe", body: "Take a photo of each item. AI detects type and color automatically — no manual entry needed." },
              { step: "02", title: "Pick your occasion", body: "Work, date, casual, night out, travel, or gym. The engine knows the rules for each." },
              { step: "03", title: "Get dressed", body: "Two outfits appear instantly — Safe and Colorful. Both are scored, practical, and ready to wear." },
            ].map((s) => (
              <div key={s.step}>
                <p className="text-4xl font-black text-white/10 mb-4">{s.step}</p>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">Features</p>
        <h2 className="text-3xl font-black mb-12">Everything you need. Nothing you don't.</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { emoji: "🌤️", title: "Weather-aware", body: "Checks the weather at your location and filters out inappropriate clothes automatically." },
            { emoji: "📍", title: "Occasion-first", body: "Work, date, casual, night out, travel, gym. Strict rules for each — no hoodie at work." },
            { emoji: "🤖", title: "AI Style Assistant", body: "Chat with an AI that knows your wardrobe. Ask anything, get personalized advice." },
            { emoji: "🔒", title: "Pin system", body: "Lock a piece you want to wear. The engine builds the rest of the outfit around it." },
            { emoji: "🛍️", title: "Missing Piece", body: "Identifies the one item that would unlock the most outfit combinations in your wardrobe." },
            { emoji: "📤", title: "Share card", body: "Generate a story-ready card to share your outfit on Instagram or TikTok." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-black/8 p-6 hover:border-black/20 transition">
              <span className="text-2xl">{f.emoji}</span>
              <h3 className="mt-4 font-bold text-sm">{f.title}</h3>
              <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="border-t border-black/8 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-12 text-center">
            What people are saying
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { quote: "Finally an app that works with what I already have. Not another shopping app.", name: "Alex", age: "28, New York" },
              { quote: "Takes 10 seconds. I open it every morning before work. Game changer.", name: "Marcus", age: "31, Chicago" },
              { quote: "The AI assistant actually knows what it's talking about. I'm genuinely impressed.", name: "James", age: "26, LA" },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl bg-white border border-black/8 p-6">
                <p className="text-sm text-neutral-700 leading-relaxed">"{t.quote}"</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-500">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-800">{t.name}</p>
                    <p className="text-xs text-neutral-400">{t.age}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-24 text-center">
        <h2 className="text-4xl sm:text-5xl font-black leading-tight">
          Your wardrobe is waiting.<br />
          <span className="text-neutral-400">Are you?</span>
        </h2>
        <p className="mt-5 text-neutral-500 text-lg">Free to start. No credit card. Your first outfit in under 2 minutes.</p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup"
            className="rounded-full bg-black px-10 py-4 text-sm font-semibold text-white hover:bg-black/85 transition">
            Create Free Account →
          </Link>
          <Link href="/pricing"
            className="rounded-full border border-black/15 px-10 py-4 text-sm font-semibold hover:bg-neutral-50 transition">
            View Pricing
          </Link>
        </div>
      </div>

    </main>
  );
}