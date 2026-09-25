import Link from "next/link";

// Early access: there is no paid plan yet, so this page says exactly that.
// The old version advertised a $4.99 Pro plan with "Coming Soon", "Payments
// via Stripe & Crypto" (Apple rejects apps that point to outside payment for
// digital features) and "Priority support" that didn't exist.
const INCLUDED = [
  "Unlimited wardrobe items",
  "AI photo tagging + background removal",
  "Outfits for work, dates, casual, nights out, travel and gym",
  "Weather-aware outfits",
  "✈️ Trip Planner with the real forecast",
  "Missing Piece suggestions",
  "💑 Couple Mode",
  "AI Style Coach chat",
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">

      <section className="px-4 pt-16 pb-10 text-center max-w-lg mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4">Pricing</p>
        <h1 className="font-display text-4xl font-black tracking-tight mb-3">Free during early access.</h1>
        <p className="text-sm text-neutral-500">Every feature, no credit card. Paid plans will come later — you&apos;ll always be told before anything changes.</p>
      </section>

      <section className="px-4 pb-12 max-w-sm mx-auto">
        <div className="rounded-2xl p-6 bg-black text-white shadow-2xl shadow-black/20">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/40">Early access</p>
          <div className="mt-3 flex items-end gap-1 mb-1">
            <span className="font-display text-4xl font-black">$0</span>
          </div>
          <p className="text-xs mb-5 text-white/50">Everything included while we&apos;re in early access.</p>
          <div className="h-px mb-5 bg-white/10" />
          <ul className="space-y-2.5 mb-6">
            {INCLUDED.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/75">
                <span className="flex-shrink-0 font-bold text-xs mt-0.5 text-white/40">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Link href="/signup"
            className="block rounded-xl px-4 py-3.5 text-center text-sm font-bold transition btn-press bg-white text-black hover:bg-white/90">
            Create Free Account
          </Link>
        </div>
      </section>

      <section className="border-t border-black/6 bg-neutral-50 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl font-black mb-8 text-center">Questions</h2>
          <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
            {[
              { q: "Is it really free?", a: "Yes. During early access every feature is free and there's no card to enter. If paid plans are added later, you'll be told first." },
              { q: "What is the AI Style Coach?", a: "A chat that knows your wardrobe. Ask it anything about style — it answers based on what you actually own." },
              { q: "What is Trip Planner?", a: "Enter a destination and dates, and get an outfit for each day from your own wardrobe, based on that city's forecast." },
              { q: "Who can see my wardrobe?", a: "Only you — and a partner, if you connect with them in Couple Mode. Photos are processed by our AI providers to tag them and remove backgrounds; see the Privacy Policy for details." },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-black/8 bg-white p-5">
                <p className="font-bold text-sm mb-2">{item.q}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
