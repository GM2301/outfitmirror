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
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    setWeatherEnabled(localStorage.getItem("om_weather_enabled") === "1");
  }, []);

  function handleWeatherToggle() {
    const newVal = !weatherEnabled;
    setWeatherEnabled(newVal);
    localStorage.setItem("om_weather_enabled", newVal ? "1" : "0");
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure? This will permanently delete your account and all wardrobe data. This cannot be undone.")) return;
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Header */}
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
              className="mt-4 w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-medium hover:bg-neutral-50 transition text-left btn-press">
              Sign out
            </button>
          </div>

          {/* Subscription */}
          <div className="rounded-2xl bg-white border border-black/6 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">Subscription</p>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">Free Plan</p>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 font-medium">Active</span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">10 items · 3 generations/day</p>
              </div>
              <Link href="/pricing"
                className="rounded-full bg-black text-white px-4 py-2 text-xs font-bold hover:bg-black/85 transition btn-press">
                Upgrade →
              </Link>
            </div>
            <div className="rounded-xl bg-neutral-50 border border-black/6 p-3">
              <p className="text-xs text-neutral-500 leading-relaxed">
                <span className="font-semibold text-black">Pro $7/mo</span> — Unlimited items, weather-aware, share cards.{" "}
                <span className="font-semibold text-black">Premium $14/mo</span> — Trip Planner + AI Style Assistant.
              </p>
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-2xl bg-white border border-black/6 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">Preferences</p>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-semibold text-sm">Weather-aware outfits</p>
                <p className="text-xs text-neutral-400 mt-0.5">Filter clothes based on current weather</p>
              </div>
              <button onClick={handleWeatherToggle}
                className={`rounded-full w-12 h-6 transition-all relative flex-shrink-0 ${
                  weatherEnabled ? "bg-black" : "bg-neutral-200"
                }`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  weatherEnabled ? "left-7" : "left-1"
                }`} />
              </button>
            </div>
          </div>

          {/* App info */}
          <div className="rounded-2xl bg-white border border-black/6 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">About</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-black/4">
                <span className="text-sm text-neutral-500">Version</span>
                <span className="text-sm font-semibold">1.0.0</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-black/4">
                <span className="text-sm text-neutral-500">Platform</span>
                <span className="text-sm font-semibold">Web (PWA)</span>
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
              Deleting your account is permanent and cannot be undone. All wardrobe data, outfits, and settings will be lost.
            </p>
            <button onClick={handleDeleteAccount} disabled={loading}
              className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition text-left disabled:opacity-40 btn-press">
              Delete Account & All Data
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}