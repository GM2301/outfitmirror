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
  const updated = "September 25, 2026";
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
            <li><strong>Wardrobe data:</strong> photos of your clothing items you upload, plus the category, type, color, and formality tags our AI generates from them. Photos are stored at long, unguessable web addresses that only the app knows; anyone given the exact link to a photo could open it.</li>
            <li><strong>Location:</strong> only if you enable weather-aware outfits — your device's approximate coordinates are sent to our weather provider to get the current forecast. We never store your location. Trip Planner uses a destination city you type in, not your location.</li>
            <li><strong>Usage & preferences:</strong> your style profile, gender preference, liked/disliked items, saved outfits, and generation history — used to personalize recommendations. Some of this lives only in your browser's local storage, not our servers.</li>
            <li><strong>Payments:</strong> none. Occaswear is free during early access and collects no payment details.</li>
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
            <li><strong>OpenAI</strong> — analyzes a wardrobe photo you upload to detect its category, type, and color, and powers the Style Coach and support chat (your messages and a text list of your wardrobe items are sent to generate a reply).</li>
            <li><strong>Replicate</strong> — removes the background from a wardrobe photo you upload.</li>
            <li><strong>Google</strong> — if you choose to sign in with Google.</li>
            <li><strong>Apple</strong> — if you choose to sign in with Apple.</li>
            <li><strong>Open-Meteo</strong> — provides weather forecasts from coordinates or a city name; no account or personal identifier is sent.</li>
            <li><strong>Photon (Komoot, OpenStreetMap data)</strong> — turns the destination city you type in Trip Planner into map coordinates; only the city name is sent.</li>
            <li><strong>Amazon</strong> — Missing Piece suggestions link to a product search on Amazon; nothing is sent until you tap a link.</li>
          </ul>
          <p>
            We do not use advertising or analytics trackers, and we do not share your data with data brokers or for
            advertising purposes.
          </p>
        </Section>

        <Section title="Couple Mode">
          <p>
            If you use Couple Mode, sharing your connection code lets that specific person's account view your
            wardrobe items to generate coordinated outfits. Only a signed-in user who has your code can do this.
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
            <a href="mailto:privacy@occaswear.com" className="underline hover:text-black">privacy@occaswear.com</a>.
          </p>
        </Section>

      </section>
    </main>
  );
}
