"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SettingsPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [weatherEnabled, setWeatherEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      setUser(data.user);
    });
    setWeatherEnabled(localStorage.getItem("om_weather_enabled") === "1");
  }, [supabase, router]);

  function handleWeatherToggle() {
    const v = !weatherEnabled;
    setWeatherEnabled(v);
    localStorage.setItem("om_weather_enabled", v ? "1" : "0");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/"); router.refresh();
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure? This will permanently delete your account, your wardrobe and all your photos. This can't be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "Could not delete account. Please try again or contact contact@occaswear.com.");
        setLoading(false);
        return;
      }
    } catch {
      alert("Could not delete account. Please try again or contact contact@occaswear.com.");
      setLoading(false);
      return;
    }
    // Everything stored on this device belongs to the deleted account.
    try {
      Object.keys(localStorage).filter(k => k.startsWith("om_")).forEach(k => localStorage.removeItem(k));
    } catch {}
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-lg mx-auto px-4 py-10">

        <Link href="/app" className="inline-block text-sm text-neutral-500 hover:text-black transition mb-6">← Back to app</Link>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-2">Account</p>
          <h1 className="font-display text-3xl font-black">Settings</h1>
        </div>

        <div className="space-y-3">

          {/* Profile */}
          <div className="rounded-2xl bg-white border border-black/6 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">Profile</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-display text-lg font-black flex-shrink-0">
                {user?.email?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="font-bold text-sm">{user?.email?.split("@")[0] ?? "—"}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{user?.email ?? "Loading..."}</p>
              </div>
            </div>
            <button onClick={handleSignOut}
              className="mt-4 w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-medium hover:bg-neutral-50 transition text-left">
              Sign out
            </button>
          </div>

          {/* Plan */}
          <div className="rounded-2xl bg-white border border-black/6 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2">Early access</p>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Every feature is free while Occaswear is in early access. Paid plans will come later — you&apos;ll always be told before anything changes.
            </p>
          </div>

          {/* Preferences */}
          <div className="rounded-2xl bg-white border border-black/6 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">Preferences</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Weather-aware outfits</p>
                <p className="text-xs text-neutral-400 mt-0.5">Filter clothes based on current weather</p>
              </div>
              <button onClick={handleWeatherToggle} aria-label="Weather-aware outfits"
                className={`rounded-full w-12 h-6 transition-all relative flex-shrink-0 ${weatherEnabled ? "bg-black" : "bg-neutral-200"}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${weatherEnabled ? "left-7" : "left-1"}`} />
              </button>
            </div>
          </div>

          {/* About */}
          <div className="rounded-2xl bg-white border border-black/6 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">About</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-black/4">
                <span className="text-sm text-neutral-500">Version</span>
                <span className="text-sm font-semibold">1.0.0</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-black/4">
                <span className="text-sm text-neutral-500">Support</span>
                <a href="mailto:contact@occaswear.com" className="text-sm font-semibold hover:underline">contact@occaswear.com</a>
              </div>
              <div className="flex justify-between items-center py-1">
                <Link href="/privacy" className="text-sm text-neutral-500 hover:text-black transition">Privacy Policy</Link>
                <Link href="/terms" className="text-sm text-neutral-500 hover:text-black transition">Terms of Service</Link>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl bg-white border border-red-100 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-red-400 mb-4">Danger Zone</p>
            <p className="text-xs text-neutral-500 mb-3 leading-relaxed">
              Deleting your account is permanent. Your wardrobe, photos and settings will be removed.
            </p>
            <button onClick={handleDeleteAccount} disabled={loading}
              className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition text-left disabled:opacity-40">
              {loading ? "Deleting…" : "Delete Account & All Data"}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
