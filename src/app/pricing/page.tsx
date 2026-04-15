import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Start building your digital wardrobe.",
    cta: "Get Started",
    ctaHref: "/signup",
    dark: false,
    badge: null,
    features: [
      "Up to 10 wardrobe items",
      "3 outfit generations per day",
      "Safe & Colorful styles",
      "6 occasions",
      "Missing Piece suggestions",
    ],
  },
  {
    name: "Pro",
    price: "$7",
    period: "/month",
    description: "Everything you need to dress well, every day.",
    cta: "Coming Soon",
    ctaHref: "/signup",
    dark: true,
    badge: "Most Popular",
    features: [
      "Unlimited wardrobe items",
      "Unlimited outfit generations",
      "Safe & Colorful styles",
      "Weather-aware filtering",
      "Missing Piece + affiliate links",
      "Share card for social media",
      "Priority support",
    ],
  },
  {
    name: "Premium",
    price: "$14",
    period: "/month",
    description: "Your personal AI stylist, always available.",
    cta: "Coming Soon",
    ctaHref: "/signup",
    dark: false,
    badge: null,
    features: [
      "Everything in Pro",
      "✈️ Trip Planner",
      "Live AI Style Assistant",
      "Personalized style coaching",
      "Wardrobe analysis & feedback",
      "Men's Style Guide PDF",
      "Early access to new features",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="px-4 pt-16 pb-10 text-center max-w-lg mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4">Pricing</p>
        <h1 className="font-display text-4xl font-black tracking-tight mb-3">Simple, honest pricing.</h1>
        <p className="text-sm text-neutral-500">Start free. Upgrade when you're ready. Cancel anytime.</p>
      </section>

      {/* Plans */}
      <section className="px-4 pb-10 max-w-5xl mx-auto">
        <div className="flex flex-col gap-4 max-w-sm mx-auto sm:max-w-5xl sm:grid sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col transition-all hover:-translate-y-0.5 ${
                plan.dark ? "bg-black text-white shadow-2xl shadow-black/20" : "border border-black/10 hover:border-black/20"
              }`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-black text-white px-3 py-1 text-xs font-bold whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}
              <p className={`text-xs font-bold uppercase tracking-[0.15em] ${plan.dark ? "text-white/40" : "text-neutral-400"}`}>
                {plan.name}
              </p>
              <div className="mt-3 flex items-end gap-1 mb-1">
                <span className="font-display text-4xl font-black">{plan.price}</span>
                <span className={`mb-1 text-sm ${plan.dark ? "text-white/40" : "text-neutral-400"}`}>{plan.period}</span>
              </div>
              <p className={`text-xs mb-5 ${plan.dark ? "text-white/50" : "text-neutral-500"}`}>{plan.description}</p>
              <div className={`h-px mb-5 ${plan.dark ? "bg-white/10" : "bg-black/6"}`} />
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.dark ? "text-white/75" : "text-neutral-700"}`}>
                    <span className={`flex-shrink-0 font-bold text-xs mt-0.5 ${plan.dark ? "text-white/40" : "text-neutral-300"}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.ctaHref}
                className={`block rounded-xl px-4 py-3.5 text-center text-sm font-bold transition btn-press ${
                  plan.dark ? "bg-white text-black hover:bg-white/90" : "border-2 border-black/10 text-black hover:border-black/25 hover:bg-neutral-50"
                }`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-neutral-400">Payments via Stripe & Crypto — coming soon</p>
      </section>

      {/* Trip Planner highlight */}
      <section className="mx-4 rounded-3xl bg-black text-white px-6 py-10 mb-8 max-w-5xl sm:mx-auto relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <span className="text-3xl">✈️</span>
          <h2 className="font-display text-2xl font-black mt-3 mb-3">Trip Planner — Premium</h2>
          <p className="text-sm text-white/55 leading-relaxed mb-6">
            Going somewhere for 4 days? Tell OutfitMirror where. It plans your outfits day by day — from your own wardrobe — based on the real weather forecast at your destination.
          </p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { emoji: "📍", label: "Set destination" },
              { emoji: "📅", label: "Pick dates" },
              { emoji: "👕", label: "Get daily outfits" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/8 border border-white/10 p-3">
                <span className="text-xl">{s.emoji}</span>
                <p className="text-xs text-white/60 mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
          <Link href="/signup"
            className="inline-block rounded-full bg-white text-black px-6 py-3 text-sm font-bold hover:bg-white/90 transition btn-press">
            Get Premium →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-black/6 bg-neutral-50 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl font-black mb-8 text-center">Questions</h2>
          <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
            {[
              { q: "Can I cancel anytime?",            a: "Yes. No questions asked. You keep access until the end of your billing period." },
              { q: "What is the AI Style Assistant?",  a: "A live AI chat that knows your wardrobe. Ask it anything — it gives advice based on what you actually own." },
              { q: "What is Trip Planner?",            a: "Premium feature: enter a destination and trip length, get outfit plans for each day based on the weather forecast there." },
              { q: "Is my wardrobe data private?",     a: "Yes. Your data is encrypted and never shared with anyone. Ever." },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-black/8 bg-white p-5">
                <p className="font-bold text-sm mb-2">{item.q}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-14 text-center">
        <div className="max-w-sm mx-auto">
          <h2 className="font-display text-3xl font-black mb-2">Start free today.</h2>
          <p className="text-sm text-neutral-500 mb-7">No credit card. 2 minutes to set up.</p>
          <Link href="/signup"
            className="inline-block rounded-full bg-black text-white px-10 py-4 text-sm font-bold hover:bg-black/85 transition btn-press shadow-lg shadow-black/15">
            Create Free Account →
          </Link>
        </div>
      </section>

    </main>
  );
}