import Link from "next/link";

// Where /auth/callback sends people when a sign-in or confirmation link
// can't be completed (expired, already used, or opened in another browser).
export default function AuthCodeErrorPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-10">Occaswear</p>
        <h1 className="font-display text-3xl font-black mb-3">That link didn&apos;t work.</h1>
        <p className="text-sm text-neutral-500 leading-relaxed mb-8">
          It may have expired, been used already, or been opened in a different browser than the one you signed up with.
          Try signing in — if your email is already confirmed, it will just work.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/login" className="rounded-xl bg-black text-white px-6 py-3 text-sm font-bold hover:bg-black/85 transition">
            Go to sign in
          </Link>
          <Link href="/forgot-password" className="rounded-xl border border-black/10 px-6 py-3 text-sm font-semibold hover:bg-neutral-50 transition">
            Reset my password
          </Link>
        </div>
      </div>
    </main>
  );
}
