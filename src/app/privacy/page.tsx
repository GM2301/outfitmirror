import Link from "next/link";

export const metadata = { title: "Privacy Policy — Occaswear" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-xl font-black mb-3">{title}</h2>
      <div className="text-sm text-neutral-600 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const updated = "September 23, 2026";
  return (
    <main className="min-h-screen bg-white">
      <section className="px-4 pt-16 pb-8 max-w-2xl mx-auto">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 hover:text-black transition">← Occaswear</Link>
        <h1 className="font-display text-4xl font-black mt-6 mb-2">Privacy Policy</h1>
        <p className="text-xs text-neutral-400">Last updated {updated}</p>
      </section>

      <section className="px-4 pb-20 max-w-2xl mx-auto">
        <p className="text-sm text-neutral-600 leading-relaxed mb-10">
          This policy explains what Occaswear ("we", "us") collects when you use the app, why, and who we share it with.
          Occaswear is built and operated by a solo developer — if anything here is unclear, contact us at the address below.
        </p>

        <Section title="What we collect">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Account info:</strong> email address, and name/profile photo if you sign in with Google or Apple.</li>
            <li><strong>Wardrobe data:</strong> photos of your clothing items you upload, plus the category, type, color, and formality tags our AI generates from them.</li>
            <li><strong>Location:</strong> only if you enable weather-aware outfits, or tap "Find Stores" on a Missing Piece suggestion — we request your device's coordinates to fetch a local forecast, or to detect your country/city so we can point you to nearby stores. This is never stored on our servers beyond what's needed for that feature; Trip Planner uses a destination city you type in, not your location.</li>
            <li><strong>Usage & preferences:</strong> your style profile, gender preference, liked/disliked items, saved outfits, and generation history — used to personalize recommendations. Some of this lives only in your browser's local storage, not our servers.</li>
            <li><strong>Payment info (Pro plan):</strong> if you subscribe, payment is processed by our payment provider (e.g. Stripe) directly — we do not receive or store your card details.</li>
          </ul>
        </Section>

        <Section title="How we use it">
          <p>
            To generate outfit recommendations from your actual wardrobe, filter them by real weather, identify gaps in
            your wardrobe, power the AI Style Coach chat, coordinate Couple Mode looks between connected accounts, and
            maintain your account. We do not use your data to train AI models, and we do not sell your personal data.
          </p>
        </Section>

        <Section title="Who we share it with">
          <p>Processing your data requires sending parts of it to these services, only for the purpose of providing the feature:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Supabase</strong> — hosts our database, authentication, and wardrobe photo storage.</li>
            <li><strong>OpenAI</strong> — analyzes a wardrobe photo you upload to detect its category, type, and color.</li>
            <li><strong>Replicate</strong> — removes the background from a wardrobe photo you upload.</li>
            <li><strong>Anthropic</strong> — powers the AI Style Coach and in-app support chat; your messages and wardrobe summary are sent to generate a reply.</li>
            <li><strong>Google</strong> — if you choose to sign in with Google, and to show a map of nearby stores when you tap "Find Stores" on a Missing Piece suggestion.</li>
            <li><strong>Apple</strong> — if you choose to sign in with Apple.</li>
            <li><strong>Open-Meteo</strong> — provides weather forecasts from coordinates or a city name; no account or personal identifier is sent.</li>
            <li><strong>OpenStreetMap (Nominatim)</strong> — converts your device's coordinates into a country/city when you tap "Find Stores," so we can point you to nearby shops.</li>
          </ul>
          <p>
            We do not use advertising or analytics trackers, and we do not share your data with data brokers or for
            advertising purposes.
          </p>
        </Section>

        <Section title="Couple Mode">
          <p>
            If you use Couple Mode, sharing your connection code lets that specific person's account view your
            wardrobe items to generate coordinated outfits. Only someone who has your code can do this.
          </p>
        </Section>

        <Section title="Data retention & deletion">
          <p>
            We keep your data for as long as your account exists. You can permanently delete your account and all
            associated data — wardrobe items, photos, saved outfits, and your profile — at any time from{" "}
            <strong>Settings → Delete Account & All Data</strong>. This is immediate and cannot be undone.
          </p>
        </Section>

        <Section title="Children">
          <p>Occaswear is not directed at children under 13, and we do not knowingly collect data from them.</p>
        </Section>

        <Section title="Your rights">
          <p>
            Depending on where you live, you may have rights to access, correct, export, or delete your personal
            data. Account deletion in-app covers the full deletion request; for access, correction, or export
            requests, contact us at the email below.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we make material changes, we'll update the date at the top of this page and, where required, notify
            you in the app.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy or your data? Email{" "}
            <a href="mailto:privacy@occaswear.app" className="underline hover:text-black">privacy@occaswear.app</a>.
          </p>
        </Section>

        <p className="text-xs text-neutral-300 mt-12 pt-6 border-t border-black/6">
          This policy is provided as a good-faith description of our actual data practices and has not been drafted
          or reviewed by a lawyer. If you need this to satisfy a specific legal requirement (GDPR, CCPA, or similar),
          please have it reviewed before relying on it.
        </p>
      </section>
    </main>
  );
}
