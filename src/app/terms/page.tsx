import Link from "next/link";

export const metadata = { title: "Terms of Service — Occaswear" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-xl font-black mb-3">{title}</h2>
      <div className="text-sm text-neutral-600 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  const updated = "September 25, 2026";
  return (
    <main className="min-h-screen bg-white">
      <section className="px-4 pt-16 pb-8 max-w-2xl mx-auto">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 hover:text-black transition">← Occaswear</Link>
        <h1 className="font-display text-4xl font-black mt-6 mb-2">Terms of Service</h1>
        <p className="text-xs text-neutral-400">Last updated {updated}</p>
      </section>

      <section className="px-4 pb-20 max-w-2xl mx-auto">
        <p className="text-sm text-neutral-600 leading-relaxed mb-10">
          These terms govern your use of Occaswear. By creating an account, you agree to them. If you don't agree,
          please don't use the app.
        </p>

        <Section title="The service">
          <p>
            Occaswear is an AI-powered wardrobe and outfit-planning app. You upload photos of clothing you own, and
            the app generates outfit suggestions based on occasion, weather, and your style. During early access every
            feature is free — see the <Link href="/pricing" className="underline hover:text-black">Pricing</Link> page.
          </p>
        </Section>

        <Section title="Your account">
          <p>
            You're responsible for the accuracy of the information you provide and for keeping your login credentials
            secure. You must be old enough to legally use this service in your country, and Occaswear is not directed
            at children under 13.
          </p>
        </Section>

        <Section title="Subscriptions & billing">
          <p>
            Occaswear is currently free and has no paid plans. If paid plans are introduced, we'll update these
            terms and tell you before anything is charged — nothing will ever be billed without your explicit consent.
          </p>
        </Section>

        <Section title="Your content">
          <p>
            You own the photos and wardrobe data you upload. By uploading them, you give us permission to process
            them (including sending them to the third-party services listed in our{" "}
            <Link href="/privacy" className="underline hover:text-black">Privacy Policy</Link>) solely to provide
            the app's features to you. We don't claim ownership of your photos and don't use them for anything beyond
            operating the service.
          </p>
        </Section>

        <Section title="AI-generated suggestions">
          <p>
            Outfit recommendations, style advice, and wardrobe-gap suggestions are generated automatically and may
            occasionally be inaccurate, repetitive, or not to your taste — they're a starting point, not a guarantee.
            Weather data comes from a third-party forecast provider and may not always be current or precise for your
            exact location.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Upload photos you don't have the right to use, or content that's illegal, abusive, or infringes someone else's rights.</li>
            <li>Attempt to disrupt, reverse-engineer, or gain unauthorized access to the app or its infrastructure.</li>
            <li>Use the app to harass another user (including through Couple Mode).</li>
          </ul>
          <p>We may suspend or terminate accounts that violate these terms.</p>
        </Section>

        <Section title="Termination">
          <p>
            You can delete your account at any time from Settings — this permanently removes your data as described
            in our Privacy Policy. We may suspend or terminate your access if you violate these terms.
          </p>
        </Section>

        <Section title="Disclaimer & limitation of liability">
          <p>
            Occaswear is provided "as is," without warranties of any kind. We do our best to keep the service
            reliable, but we don't guarantee it will be uninterrupted, error-free, or that outfit suggestions will
            always be accurate or appropriate for every situation. To the maximum extent permitted by law, we aren't
            liable for indirect, incidental, or consequential damages arising from your use of the app.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            We may update these terms as the app evolves. If we make material changes, we'll update the date above
            and, where required, notify you in the app.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms? Email{" "}
            <a href="mailto:support@occaswear.com" className="underline hover:text-black">support@occaswear.com</a>.
          </p>
        </Section>
      </section>
    </main>
  );
}
