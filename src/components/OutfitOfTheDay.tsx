"use client";

import * as React from "react";

type Props = {
  onGetDressed: (occasion: string) => void;
};

// Occasion automatik sipas orës
function getOccasionByHour(hour: number): { occasion: string; label: string; emoji: string } {
  if (hour >= 6  && hour < 9)  return { occasion: "work",      label: "Work",      emoji: "💼" };
  if (hour >= 9  && hour < 12) return { occasion: "casual",    label: "Casual",    emoji: "☀️" };
  if (hour >= 12 && hour < 14) return { occasion: "casual",    label: "Lunch",     emoji: "🥗" };
  if (hour >= 14 && hour < 17) return { occasion: "casual",    label: "Afternoon", emoji: "☀️" };
  if (hour >= 17 && hour < 20) return { occasion: "date",      label: "Evening",   emoji: "🌹" };
  if (hour >= 20 && hour < 23) return { occasion: "night_out", label: "Night Out", emoji: "🌑" };
  return { occasion: "casual", label: "Casual", emoji: "✨" };
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function OutfitOfTheDay({ onGetDressed }: Props) {
  const [notifEnabled, setNotifEnabled] = React.useState(false);
  const [notifTime, setNotifTime] = React.useState("07:30");
  const [permissionState, setPermissionState] = React.useState<string>("default");
  const [showSettings, setShowSettings] = React.useState(false);

  const hour = new Date().getHours();
  const occasion = getOccasionByHour(hour);
  const greeting = getGreeting(hour);

  React.useEffect(() => {
    // Lexo settings
    const saved = localStorage.getItem("om_notif_enabled");
    const savedTime = localStorage.getItem("om_notif_time");
    if (saved === "1") setNotifEnabled(true);
    if (savedTime) setNotifTime(savedTime);

    // Shiko permission state
    if ("Notification" in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  async function handleEnableNotifications() {
    if (!("Notification" in window)) {
      alert("Your browser doesn't support notifications.");
      return;
    }

    const permission = await Notification.requestPermission();
    setPermissionState(permission);

    if (permission === "granted") {
      setNotifEnabled(true);
      localStorage.setItem("om_notif_enabled", "1");
      localStorage.setItem("om_notif_time", notifTime);

      // Test notification
      new Notification("OutfitMirror ✨", {
        body: `${greeting}! Your ${occasion.label} outfit is ready.`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      });

      // Regjistro service worker për scheduled notifications
      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          // Scheduled notifications via service worker
          localStorage.setItem("om_notif_time", notifTime);
        } catch {}
      }
    }
  }

  function handleTimeChange(time: string) {
    setNotifTime(time);
    localStorage.setItem("om_notif_time", time);
  }

  function handleDisable() {
    setNotifEnabled(false);
    localStorage.setItem("om_notif_enabled", "0");
    setShowSettings(false);
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-black/8">

      {/* Main CTA */}
      <div className="bg-black text-white px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">
              {greeting}
            </p>
            <h3 className="font-display text-xl font-black leading-tight">
              Ready to get dressed?
            </h3>
            <p className="text-sm text-white/50 mt-1">
              {occasion.emoji} {occasion.label} outfit · based on time & weather
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
            {occasion.emoji}
          </div>
        </div>

        <button type="button"
          onClick={() => onGetDressed(occasion.occasion)}
          className="mt-4 w-full rounded-xl bg-white text-black py-3.5 text-sm font-bold hover:bg-white/90 transition active:scale-[0.98]">
          ✨ Get Dressed Now
        </button>
      </div>

      {/* Notification settings */}
      <div className="px-5 py-4 bg-white">
        {!notifEnabled ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Daily outfit reminder</p>
              <p className="text-xs text-neutral-400 mt-0.5">Get your outfit every morning</p>
            </div>
            <button type="button" onClick={handleEnableNotifications}
              className="rounded-full bg-black text-white px-4 py-2 text-xs font-bold hover:bg-black/85 transition active:scale-[0.95]">
              Enable
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm font-semibold">Daily reminder on</p>
              </div>
              <button type="button" onClick={() => setShowSettings(v => !v)}
                className="text-xs text-neutral-400 hover:text-black transition">
                {showSettings ? "Done" : "Edit"}
              </button>
            </div>

            {showSettings && (
              <div className="mt-3 flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 block">
                    Notification time
                  </label>
                  <input type="time" value={notifTime}
                    onChange={e => handleTimeChange(e.target.value)}
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/8 bg-white" />
                </div>
                <div className="rounded-xl bg-neutral-50 px-4 py-3">
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Every day at <strong>{notifTime}</strong>, OutfitMirror will check the weather and suggest the perfect outfit for the day.
                  </p>
                </div>
                <button type="button" onClick={handleDisable}
                  className="rounded-xl border border-red-200 text-red-500 py-2.5 text-xs font-medium hover:bg-red-50 transition">
                  Disable notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}