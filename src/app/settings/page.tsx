"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";

export default function SettingsPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [weatherEnabled, setWeatherEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);

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
    if (!confirm("Are you sure? This will permanently delete your account and all wardrobe data.")) return;
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
    <AppShell title="Settings">
      <div className="mx-auto w-full max-w-lg px-4 py-8 flex flex-col gap-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black">Settings</h1>
          <p className="mt-1 text-sm text-neutral-400">Manage your account and preferences.</p>
        </div>

        {/* Account */}
        <div className="rounded-2xl border border-black/8 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">Account</p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-sm">{user?.email?.split("@")[0]}</p>
              <p className="text-xs text-neutral-400">{user?.email}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={handleSignOut}
              className="rounded-xl border border-black/10 px-4 py-3 text-sm font-medium hover:bg-neutral-50 transition text-left">
              Sign out
            </button>
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-2xl border border-black/8 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">Subscription</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Free Plan</p>
              <p className="text-xs text-neutral-400 mt-0.5">10 items · 3 generations/day</p>
            </div>
            <a href="/pricing"
              className="rounded-full bg-black text-white px-4 py-2 text-xs font-semibold hover:bg-black/85 transition">
              Upgrade →
            </a>
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-2xl border border-black/8 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">Preferences</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Weather-aware outfits</p>
              <p className="text-xs text-neutral-400 mt-0.5">Filter clothes based on current weather</p>
            </div>
            <button onClick={handleWeatherToggle}
              className={["rounded-full px-4 py-2 text-xs font-semibold transition border",
                weatherEnabled ? "bg-black text-white border-black" : "border-black/15 text-neutral-600 hover:bg-neutral-50"].join(" ")}>
              {weatherEnabled ? "✓ On" : "Off"}
            </button>
          </div>
        </div>

        {/* App info */}
        <div className="rounded-2xl border border-black/8 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">About</p>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Platform</span>
              <span className="font-medium">Web (PWA)</span>
            </div>
            <div className="flex justify-between text-sm">
              <a href="/privacy" className="text-neutral-500 hover:text-black transition">Privacy Policy</a>
              <a href="/terms" className="text-neutral-500 hover:text-black transition">Terms of Service</a>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-4">Danger Zone</p>
          <button onClick={handleDeleteAccount} disabled={loading}
            className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition w-full text-left disabled:opacity-40">
            Delete Account & All Data
          </button>
        </div>

      </div>
    </AppShell>
  );
}