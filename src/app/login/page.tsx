"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/email-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to sign in");
      router.push("/app");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/auth/signin", { method: "POST" });
      if (response.redirected) {
        window.location.href = response.url;
      } else if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to initiate Google sign in");
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google sign in");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex">

      {/* LEFT — Editorial panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">OutfitMirror</p>
        </div>

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-6">Welcome back</p>
          <h1 className="font-display text-5xl font-black leading-[1.05] mb-6">
            Your style.<br />
            Your rules.<br />
            <span className="text-white/25">Every day.</span>
          </h1>
          <p className="text-sm text-white/50 leading-relaxed max-w-xs">
            Your wardrobe is waiting. Sign in and get dressed in seconds.
          </p>
          <div className="mt-10 space-y-3">
            {[
              { icon: "✨", text: "AI generates outfits from your clothes" },
              { icon: "🌤️", text: "Weather-aware every morning" },
              { icon: "✈️", text: "Trip Planner for travel" },
              { icon: "🧩", text: "Missing Piece recommendations" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-sm">{f.icon}</span>
                <p className="text-sm text-white/50">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/15 tracking-widest uppercase">outfitmirror.com</p>
      </div>

      {/* RIGHT — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-fade-up">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">OutfitMirror</p>
            <p className="text-xs text-neutral-400 mt-1">Your AI Personal Stylist</p>
          </div>

          <h2 className="font-display text-3xl font-black mb-1">Welcome back.</h2>
          <p className="text-sm text-neutral-500 mb-8">Sign in to your account.</p>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogleLogin} disabled={loading}
            className="w-full rounded-xl border border-black/10 px-4 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-black/20 transition-all flex items-center justify-center gap-3 mb-5 disabled:opacity-50 btn-press">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
              <div className="w-full border-t border-black/6" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-neutral-400">or with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-[0.1em] mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/8 focus:border-black/25 transition placeholder:text-neutral-300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-[0.1em] mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/8 focus:border-black/25 transition placeholder:text-neutral-300" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-black text-white px-4 py-4 text-sm font-bold hover:bg-black/85 transition-all disabled:opacity-50 btn-press mt-1">
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            No account?{" "}
            <Link href="/signup" className="font-bold text-black hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </main>
  );
}