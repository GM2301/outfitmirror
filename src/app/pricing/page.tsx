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
      "Live AI Style Assistant",
      "Personalized style coaching",
      "Wardrobe analysis & feedback",
      "✈️ Trip Planner (new)",
      "Men's Style Guide PDF",
      "Early access to new features",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <div className="px-4 pt-14 pb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Pricing</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Simple, honest pricing.</h1>
        <p className="mt-2 text-sm text-neutral-500">Start free. Upgrade when ready. Cancel anytime.</p>
      </div>

      {/* Plans */}
      <div className="px-4 pb-10">
        <div className="flex flex-col gap-4 max-w-sm mx-auto sm:max-w-5xl sm:grid sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.dark ? "bg-black text-white" : "border border-black/10"
              }`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-black text-white px-3 py-1 text-xs font-semibold whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}
              <p className={`text-xs font-semibold uppercase tracking-widest ${plan.dark ? "text-white/50" : "text-neutral-400"}`}>
                {plan.name}
              </p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-3xl font-black">{plan.price}</span>
                <span className={`mb-0.5 text-sm ${plan.dark ? "text-white/50" : "text-neutral-400"}`}>{plan.period}</span>
              </div>
              <p className={`mt-1.5 text-xs ${plan.dark ? "text-white/60" : "text-neutral-500"}`}>{plan.description}</p>
              <div className={`my-4 h-px ${plan.dark ? "bg-white/10" : "bg-black/8"}`} />
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${plan.dark ? "text-white/80" : "text-neutral-700"}`}>
                    <span className={`flex-shrink-0 font-bold ${plan.dark ? "text-white" : "text-black"}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.ctaHref}
                className={`mt-6 block rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                  plan.dark ? "bg-white text-black hover:bg-white/90" : "border border-black/15 text-black hover:bg-neutral-50"
                }`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-neutral-400">Payments via Stripe & Crypto — coming soon</p>
      </div>

      {/* Trip Planner highlight */}
      <div className="bg-black text-white px-4 py-10 mx-4 rounded-3xl mb-10 max-w-5xl sm:mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-3xl">✈️</span>
          <h2 className="mt-3 text-2xl font-black">Trip Planner — Premium Feature</h2>
          <p className="mt-3 text-white/60 text-sm leading-relaxed">
            Going on a trip? Tell OutfitMirror where you're going and for how many days.
            It plans your outfits day by day — from your own wardrobe — based on the weather forecast at your destination.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { emoji: "📍", label: "Set destination" },
              { emoji: "📅", label: "Pick dates" },
              { emoji: "👕", label: "Get daily outfits" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/10 p-3">
                <span className="text-xl">{s.emoji}</span>
                <p className="text-xs text-white/70 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <Link href="/signup"
            className="mt-6 inline-block rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 transition">
            Get Premium →
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-black/6 bg-neutral-50 px-4 py-10">
        <h2 className="text-lg font-black mb-5 text-center">Questions</h2>
        <div className="flex flex-col gap-3 max-w-sm mx-auto sm:max-w-2xl sm:grid sm:grid-cols-2">
          {[
            { q: "Can I cancel anytime?", a: "Yes. No questions asked. Access until end of billing period." },
            { q: "What is the AI Style Assistant?", a: "A live AI coach that knows your wardrobe. Ask anything about your style." },
            { q: "What is Trip Planner?", a: "Premium feature: plan outfits for a multi-day trip based on weather + your wardrobe." },
            { q: "Is my data private?", a: "Yes. Encrypted and never shared with anyone." },
          ].map((item) => (
            <div key={item.q} className="rounded-xl border border-black/8 bg-white p-4">
              <p className="font-semibold text-sm">{item.q}</p>
              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 py-12 text-center">
        <h2 className="text-2xl font-black">Start free today.</h2>
        <p className="mt-1 text-sm text-neutral-500">No credit card. 2 minutes.</p>
        <Link href="/signup"
          className="mt-5 inline-block rounded-full bg-black px-8 py-3.5 text-sm font-semibold text-white hover:bg-black/85 transition">
          Create Free Account →
        </Link>
      </div>

    </main>
  );
}