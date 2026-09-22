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
  const [permissionState, setPermissionState] = React.useState<NotificationPermission | "unsupported">("default");
  const [showSettings, setShowSettings] = React.useState(false);

  const hour = new Date().getHours();
  const occasion = getOccasionByHour(hour);
  const greeting = getGreeting(hour);

  React.useEffect(() => {
    const saved = localStorage.getItem("om_notif_enabled");
    const savedTime = localStorage.getItem("om_notif_time");
    if (saved === "1") setNotifEnabled(true);
    if (savedTime) setNotifTime(savedTime);

    if ("Notification" in window) {
      setPermissionState(Notification.permission);
    } else {
      setPermissionState("unsupported");
    }
  }, []);

  async function handleEnableNotifications() {
    if (!("Notification" in window)) {
      setPermissionState("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setPermissionState(permission);

    if (permission === "granted") {
      setNotifEnabled(true);
      localStorage.setItem("om_notif_enabled", "1");
      localStorage.setItem("om_notif_time", notifTime);
      // Marks "already reminded today" so AppPageClient's daily check (which
      // fires the actual reminder on app open, since there's no push-notification
      // backend yet) doesn't immediately re-fire right after this confirmation one.
      localStorage.setItem("om_notif_last_fired", new Date().toDateString());

      new Notification("Occaswear ✨", {
        body: `Reminders on. ${greeting}! Your ${occasion.label} outfit is ready.`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      });
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
    <div className="rounded-3xl overflow-hidden mb-5"
      style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)" }}>

      {/* Main CTA */}
      <div className="px-5 pt-5 pb-4" style={{ background: "#FAF8F5" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#9A958C", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              {greeting}
            </p>
            <h3 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: "24px", fontWeight: 400, color: "#1A1A1A", lineHeight: 1.15, marginTop: "2px" }}>
              {occasion.emoji} {occasion.label} outfit, ready
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            {occasion.emoji}
          </div>
        </div>

        <button type="button"
          onClick={() => onGetDressed(occasion.occasion)}
          className="mt-4 w-full rounded-xl py-3.5 text-sm font-bold transition active:scale-[0.98]"
          style={{ background: "#1A1A1A", color: "white", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}>
          ✨ Get Dressed Now
        </button>
      </div>

      {/* Notification settings */}
      <div className="px-5 py-3.5 bg-white border-t" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
        {permissionState === "denied" ? (
          <div className="flex items-center gap-2.5">
            <span className="text-base flex-shrink-0">🔕</span>
            <p className="text-xs" style={{ color: "#9A958C" }}>
              Notifications blocked — enable them for this site in your browser settings to get daily reminders.
            </p>
          </div>
        ) : permissionState === "unsupported" ? null : !notifEnabled ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Daily outfit reminder</p>
              <p className="text-xs mt-0.5" style={{ color: "#9A958C" }}>We'll nudge you while the app's open</p>
            </div>
            <button type="button" onClick={handleEnableNotifications}
              className="rounded-full px-4 py-2 text-xs font-bold transition active:scale-[0.95]"
              style={{ background: "#1A1A1A", color: "white" }}>
              Enable
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Daily reminder on</p>
              </div>
              <button type="button" onClick={() => setShowSettings(v => !v)}
                className="text-xs transition" style={{ color: "#9A958C" }}>
                {showSettings ? "Done" : "Edit"}
              </button>
            </div>

            {showSettings && (
              <div className="mt-3 flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: "#9A958C" }}>
                    Notification time
                  </label>
                  <input type="time" value={notifTime}
                    onChange={e => handleTimeChange(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white"
                    style={{ borderColor: "rgba(0,0,0,0.1)" }} />
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: "#FAF8F5" }}>
                  <p className="text-xs leading-relaxed" style={{ color: "#8A8580" }}>
                    Opening Occaswear after <strong>{notifTime}</strong> will remind you to get dressed, once per day.
                    Background push notifications aren't available yet — this only fires while the app is open.
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
