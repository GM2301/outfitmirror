import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Start building your digital wardrobe.",
    cta: "Get Started",
    ctaHref: "/signup",
    ctaStyle: "border",
    dark: false,
    badge: null,
    features: [
      "Up to 10 wardrobe items",
      "3 outfit generations per day",
      "Safe / Colorful / Bold styles",
      "Occasion selector (6 occasions)",
      "Missing Piece suggestions",
      "Basic AI style tips",
    ],
  },
  {
    name: "Pro",
    price: "$7",
    period: "per month",
    description: "Everything you need to dress well, every day.",
    cta: "Coming Soon",
    ctaHref: "/signup",
    ctaStyle: "dark",
    dark: true,
    badge: "Most Popular",
    features: [
      "Unlimited wardrobe items",
      "Unlimited outfit generations",
      "Safe / Colorful / Bold styles",
      "Occasion selector (6 occasions)",
      "Weather-aware outfit filtering",
      "Missing Piece + affiliate links",
      "Share card for social media",
      "Priority support",
    ],
  },
  {
    name: "Premium",
    price: "$14",
    period: "per month",
    description: "Your personal AI stylist, always available.",
    cta: "Coming Soon",
    ctaHref: "/signup",
    ctaStyle: "border",
    dark: false,
    badge: null,
    features: [
      "Everything in Pro",
      "Live AI Style Assistant",
      "Personalized style coaching",
      "Wardrobe analysis & feedback",
      "Men's Style Guide PDF (bonus)",
      "Early access to new features",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <div className="py-16 text-center px-4 border-b border-black/8">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Pricing</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
          Simple, honest pricing.
        </h1>
        <p className="mt-4 text-neutral-500 max-w-sm mx-auto">
          Start free. Upgrade when you're ready. Cancel anytime.
        </p>
      </div>

      {/* Plans */}
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-5 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-7 flex flex-col ${
                plan.dark
                  ? "bg-black text-white border-2 border-black"
                  : "border border-black/10"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-black text-white px-4 py-1 text-xs font-semibold whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <p className={`text-xs font-semibold uppercase tracking-widest ${plan.dark ? "text-white/50" : "text-neutral-400"}`}>
                {plan.name}
              </p>

              {/* Price */}
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className={`mb-1 text-sm ${plan.dark ? "text-white/50" : "text-neutral-400"}`}>
                  /{plan.period}
                </span>
              </div>

              {/* Description */}
              <p className={`mt-2 text-sm leading-relaxed ${plan.dark ? "text-white/60" : "text-neutral-500"}`}>
                {plan.description}
              </p>

              {/* Divider */}
              <div className={`my-6 h-px ${plan.dark ? "bg-white/10" : "bg-black/8"}`} />

              {/* Features */}
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.dark ? "text-white/80" : "text-neutral-700"}`}>
                    <span className={`mt-0.5 font-bold flex-shrink-0 ${plan.dark ? "text-white" : "text-black"}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.ctaHref}
                className={`mt-8 block rounded-xl px-6 py-3.5 text-center text-sm font-semibold transition ${
                  plan.ctaStyle === "dark"
                    ? "bg-white text-black hover:bg-white/90"
                    : plan.dark
                    ? "border border-white/20 text-white hover:bg-white/10"
                    : "border border-black/15 text-black hover:bg-neutral-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Payment note */}
        <p className="mt-8 text-center text-xs text-neutral-400">
          Payments via Stripe (card) and Crypto — coming soon
        </p>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-black text-center mb-8">Questions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes. No questions asked. You keep access until the end of your billing period.",
              },
              {
                q: "What is the AI Style Assistant?",
                a: "A live AI coach inside the app. Ask it anything about your style, wardrobe, or outfits — it knows your closet.",
              },
              {
                q: "What payment methods?",
                a: "Credit/debit cards via Stripe, and major cryptocurrencies. Both coming soon.",
              },
              {
                q: "Is my wardrobe data private?",
                a: "Yes. Your photos and data are encrypted and never shared with anyone.",
              },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-black/8 p-5">
                <p className="font-semibold text-sm">{item.q}</p>
                <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-3xl bg-black text-white p-10 text-center">
          <h2 className="text-2xl font-black">Start free today</h2>
          <p className="mt-2 text-white/60 text-sm">No credit card. 2 minutes to set up.</p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-full bg-white text-black px-8 py-3.5 text-sm font-semibold hover:bg-white/90 transition"
          >
            Create Free Account →
          </Link>
        </div>
      </div>
    </main>
  );
}