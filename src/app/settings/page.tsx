"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const OCCASIONS = [
  { value: "work",      label: "Work",      emoji: "💼" },
  { value: "casual",    label: "Casual",    emoji: "☀️" },
  { value: "date",      label: "Date",      emoji: "🌹" },
  { value: "night_out", label: "Night Out", emoji: "🌑" },
  { value: "travel",    label: "Travel",    emoji: "✈️" },
  { value: "gym",       label: "Gym",       emoji: "💪" },
];

const PLANS = ["free", "pro", "premium"] as const;

export default function SettingsPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [weatherEnabled, setWeatherEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [currentPlan, setCurrentPlan] = React.useState("free");

  const [scheduleEnabled, setScheduleEnabled] = React.useState(false);
  const [scheduleTime, setScheduleTime] = React.useState("07:30");
  const [scheduleOccasion, setScheduleOccasion] = React.useState("work");
  const [notifPermission, setNotifPermission] = React.useState<string>("default");
  const [scheduleSaved, setScheduleSaved] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    setWeatherEnabled(localStorage.getItem("om_weather_enabled") === "1");
    setScheduleEnabled(localStorage.getItem("om_schedule_enabled") === "1");
    setScheduleTime(localStorage.getItem("om_schedule_time") || "07:30");
    setScheduleOccasion(localStorage.getItem("om_schedule_occasion") || "work");
    setCurrentPlan(localStorage.getItem("om_plan") || "free");
    if ("Notification" in window) setNotifPermission(Notification.permission);
  }, []);

  function handleWeatherToggle() {
    const v = !weatherEnabled;
    setWeatherEnabled(v);
    localStorage.setItem("om_weather_enabled", v ? "1" : "0");
  }

  function handlePlanSwitch(plan: string) {
    localStorage.setItem("om_plan", plan);
    setCurrentPlan(plan);
    window.location.reload();
  }

  async function handleSaveSchedule() {
    if ("Notification" in window && Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm !== "granted") return;
    }
    localStorage.setItem("om_schedule_enabled", "1");
    localStorage.setItem("om_schedule_time", scheduleTime);
    localStorage.setItem("om_schedule_occasion", scheduleOccasion);
    setScheduleEnabled(true);
    const occ = OCCASIONS.find(o => o.value === scheduleOccasion);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("OutfitMirror ✨", {
        body: `You'll get your ${occ?.label} outfit every day at ${scheduleTime}.`,
        icon: "/icon-192.png",
      });
    }
    setScheduleSaved(true);
    setTimeout(() => setScheduleSaved(false), 2000);
  }

  function handleDisableSchedule() {
    setScheduleEnabled(false);
    localStorage.setItem("om_schedule_enabled", "0");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/"); router.refresh();
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure? This will permanently delete your account and all wardrobe data.")) return;
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/");
  }

  const selectedOccasion = OCCASIONS.find(o => o.value === scheduleOccasion);

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-lg mx-auto px-4 py-10">

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

          {/* Subscription */}
          <div className="rounded-2xl bg-white border border-black/6 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">Subscription</p>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm capitalize">{currentPlan} Plan</p>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 font-medium">Active</span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {currentPlan === "free" ? "10 items · 3 generations/day" :
                   currentPlan === "pro"  ? "Unlimited items · Weather-aware" :
                   "Everything · Trip Planner · AI Assistant"}
                </p>
              </div>
              {currentPlan !== "premium" && (
                <Link href="/pricing"
                  className="rounded-full bg-black text-white px-4 py-2 text-xs font-bold hover:bg-black/85 transition">
                  Upgrade →
                </Link>
              )}
            </div>
            <div className="rounded-xl bg-neutral-50 border border-black/6 p-3">
              <p className="text-xs text-neutral-500 leading-relaxed">
                <span className="font-semibold text-black">Pro $7/mo</span> — Unlimited items, weather-aware.{" "}
                <span className="font-semibold text-black">Premium $14/mo</span> — Trip Planner + AI Assistant.
              </p>
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-2xl bg-white border border-black/6 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">Preferences</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Weather-aware outfits</p>
                <p className="text-xs text-neutral-400 mt-0.5">Filter clothes based on current weather</p>
              </div>
              <button onClick={handleWeatherToggle}
                className={`rounded-full w-12 h-6 transition-all relative flex-shrink-0 ${weatherEnabled ? "bg-black" : "bg-neutral-200"}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${weatherEnabled ? "left-7" : "left-1"}`} />
              </button>
            </div>
          </div>

          {/* Daily Outfit */}
          <div className="rounded-2xl bg-white border border-black/6 overflow-hidden">
            <div className="p-5 border-b border-black/6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-1">Daily Outfit</p>
                  <p className="font-semibold text-sm">Schedule a daily outfit</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Get a notification every day at a time you choose</p>
                </div>
                {scheduleEnabled && (
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-green-600 font-semibold">On</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400 mb-2 block">Time</label>
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/8 bg-white font-semibold" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400 mb-2 block">Occasion</label>
                <div className="grid grid-cols-3 gap-2">
                  {OCCASIONS.map(o => (
                    <button key={o.value} type="button" onClick={() => setScheduleOccasion(o.value)}
                      className={"rounded-xl border-2 py-2.5 text-xs font-bold transition active:scale-[0.95] " +
                        (scheduleOccasion === o.value ? "border-black bg-black text-white" : "border-black/10 hover:border-black/20")}>
                      <span className="block text-base mb-0.5">{o.emoji}</span>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-neutral-50 border border-black/6 px-4 py-3">
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Every day at <strong className="text-black">{scheduleTime}</strong>, OutfitMirror will send you a{" "}
                  <strong className="text-black">{selectedOccasion?.emoji} {selectedOccasion?.label}</strong> outfit.
                </p>
              </div>
              {!scheduleEnabled ? (
                <button type="button" onClick={handleSaveSchedule}
                  className="w-full rounded-xl bg-black text-white py-3.5 text-sm font-bold hover:bg-black/85 transition active:scale-[0.98]">
                  {scheduleSaved ? "✓ Saved!" : "Enable Daily Outfit"}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={handleSaveSchedule}
                    className="w-full rounded-xl bg-black text-white py-3.5 text-sm font-bold hover:bg-black/85 transition active:scale-[0.98]">
                    {scheduleSaved ? "✓ Saved!" : "Update Schedule"}
                  </button>
                  <button type="button" onClick={handleDisableSchedule}
                    className="w-full rounded-xl border border-black/10 py-3 text-sm font-medium text-neutral-500 hover:bg-neutral-50 transition">
                    Disable
                  </button>
                </div>
              )}
              {notifPermission === "denied" && (
                <p className="text-xs text-red-500 text-center">Notifications are blocked in browser settings.</p>
              )}
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
                <span className="text-sm text-neutral-500">Platform</span>
                <span className="text-sm font-semibold">Web (PWA)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <Link href="/privacy" className="text-sm text-neutral-500 hover:text-black transition">Privacy Policy</Link>
                <Link href="/terms" className="text-sm text-neutral-500 hover:text-black transition">Terms of Service</Link>
              </div>
            </div>
          </div>

          {/* ── PLAN SWITCHER (testing) ── */}
          <div className="rounded-2xl bg-white border border-black/6 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-1">Plan Preview</p>
            <p className="text-xs text-neutral-400 mb-3">Test how the app looks with each plan</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { plan: "free",    icon: "🔓", label: "Free"    },
                { plan: "pro",     icon: "⚡", label: "Pro"     },
                { plan: "premium", icon: "👑", label: "Premium" },
              ].map(p => (
                <button key={p.plan} type="button" onClick={() => handlePlanSwitch(p.plan)}
                  className={"rounded-xl border-2 py-3 text-xs font-bold transition active:scale-[0.95] " +
                    (currentPlan === p.plan
                      ? "border-black bg-black text-white"
                      : "border-black/10 hover:border-black/20")}>
                  <span className="block text-lg mb-0.5">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl bg-white border border-red-100 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-red-400 mb-4">Danger Zone</p>
            <p className="text-xs text-neutral-500 mb-3 leading-relaxed">
              Deleting your account is permanent. All wardrobe data and settings will be lost.
            </p>
            <button onClick={handleDeleteAccount} disabled={loading}
              className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition text-left disabled:opacity-40">
              Delete Account & All Data
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}