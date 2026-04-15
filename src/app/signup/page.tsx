"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to sign up");
      router.push("/app");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/auth/signin?next=/app", { method: "POST" });
      if (response.redirected) {
        window.location.href = response.url;
      } else if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to initiate Google sign up");
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google sign up");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex">

      {/* LEFT — Branding panel, i fshehur në mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white flex-col justify-between p-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">OutfitMirror</p>
        </div>
        <div>
          <h1 className="text-5xl font-black leading-[1.05] mb-6">
            Your clothes.<br />
            Your style.<br />
            <span className="text-white/30">Effortless.</span>
          </h1>
          <p className="text-sm text-white/50 leading-relaxed max-w-xs">
            Join thousands of people who stopped guessing what to wear every morning.
          </p>
          <div className="mt-10 space-y-3">
            {[
              "AI reads your clothes automatically",
              "Weather-aware outfit suggestions",
              "Trip Planner for travel",
              "Missing Piece recommendations",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-white/60">{f}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/20">outfitmirror.com</p>
      </div>

      {/* RIGHT — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">OutfitMirror</p>
            <p className="text-xs text-neutral-400 mt-1">Your AI Fashion Advisor</p>
          </div>

          <h2 className="text-2xl font-black mb-1">Create account</h2>
          <p className="text-sm text-neutral-500 mb-8">Free to start. No credit card required.</p>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full rounded-xl border-2 border-black/10 px-4 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-black/20 transition flex items-center justify-center gap-3 mb-5 disabled:opacity-50">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? "Loading..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/8" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-neutral-400">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wide mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Doe"
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition placeholder:text-neutral-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition placeholder:text-neutral-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wide mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition placeholder:text-neutral-300"
              />
              <p className="mt-1.5 text-xs text-neutral-400">At least 6 characters</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black text-white px-4 py-4 text-sm font-bold hover:bg-black/85 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-black/20 mt-2">
              {loading ? "Creating account..." : "Create Free Account →"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-black hover:underline">Sign in</Link>
          </p>

          <p className="mt-4 text-center text-xs text-neutral-300 leading-relaxed">
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </main>
  );
}