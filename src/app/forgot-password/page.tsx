"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error && /rate limit/i.test(error.message)) {
      setError("Too many requests. Please wait a few minutes and try again.");
      return;
    }
    // Same message whether or not the email has an account, so this page
    // can't be used to find out who is registered.
    setSent(true);
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-up">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-10">Occaswear</p>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-2xl mx-auto mb-6">✉️</div>
            <h1 className="font-display text-3xl font-black mb-3">Check your email.</h1>
            <p className="text-sm text-neutral-500 leading-relaxed mb-2">
              If an account exists for <strong className="text-black">{email}</strong>, we sent a link to set a new password.
            </p>
            <p className="text-xs text-neutral-400 mb-8">Not there after a minute? Check your spam folder.</p>
            <Link href="/login" className="inline-block rounded-xl border border-black/10 px-6 py-3 text-sm font-semibold hover:bg-neutral-50 transition">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-black mb-1">Forgot password?</h1>
            <p className="text-sm text-neutral-500 mb-8">Enter your email and we&apos;ll send you a link to set a new one.</p>

            {error && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-[0.1em] mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com" autoComplete="email"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/8 focus:border-black/25 transition placeholder:text-neutral-300" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-black text-white px-4 py-4 text-sm font-bold hover:bg-black/85 transition-all disabled:opacity-50 btn-press">
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-500">
              Remembered it? <Link href="/login" className="font-bold text-black hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
