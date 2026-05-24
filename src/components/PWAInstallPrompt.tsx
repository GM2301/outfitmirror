"use client";

import * as React from "react";
import { Download, X, Share } from "lucide-react";

const DISMISS_KEY = "om_pwa_install_dismissed";
const DISMISS_DAYS = 7;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const daysAgo = (Date.now() - parseInt(dismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysAgo < DISMISS_DAYS) return;
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 8000);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (ios && !standalone) {
      const timer = setTimeout(() => setShowPrompt(true), 10000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowPrompt(false);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
  }

  if (!showPrompt || isStandalone) return null;

  return (
    <>
      <div
        onClick={handleDismiss}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(26, 26, 26, 0.5)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 99,
        }}
      />
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          zIndex: 100,
          background: "#FDFDFB",
          borderTopLeftRadius: "32px",
          borderTopRightRadius: "32px",
          padding: "8px 24px 32px",
          boxShadow: "0 -16px 48px rgba(0,0,0,0.18)",
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        <div className="flex justify-center mb-4">
          <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "#E5E2DC" }} />
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            position: "absolute", top: "16px", right: "16px",
            width: "32px", height: "32px", borderRadius: "50%",
            background: "rgba(0,0,0,0.04)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={14} strokeWidth={1.5} style={{ color: "#9A958C" }} />
        </button>

        <div className="flex justify-center mb-5">
          <div
            style={{
              width: "72px", height: "72px", borderRadius: "20px",
              background: "#FAF8F5",
              border: "1px solid rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Cormorant', Georgia, serif",
              fontSize: "44px", fontWeight: 300,
              color: "#1A1A1A", lineHeight: 1,
            }}
          >
            O
          </div>
        </div>

        <h2
          style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontSize: "26px", fontWeight: 400,
            color: "#1A1A1A", textAlign: "center",
            marginBottom: "6px", letterSpacing: "-0.01em",
          }}
        >
          Add Occaswear to Home
        </h2>

        <p
          style={{
            fontSize: "13px", color: "#8A8580",
            textAlign: "center", marginBottom: "24px", lineHeight: 1.5,
          }}
        >
          Open instantly, no browser bar. Get styled in seconds.
        </p>

        {isIOS ? (
          <div>
            <div style={{ background: "#F7F5F0", borderRadius: "16px", padding: "16px 18px", marginBottom: "16px" }}>
              <div className="flex items-start gap-3 mb-4">
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#1A1A1A", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>1</div>
                <div className="flex-1">
                  <p style={{ fontSize: "13px", color: "#1A1A1A", marginBottom: "2px", fontWeight: 600 }}>Tap the Share button</p>
                  <div className="flex items-center gap-1.5">
                    <Share size={14} strokeWidth={1.5} style={{ color: "#9A958C" }} />
                    <span style={{ fontSize: "11px", color: "#9A958C" }}>(square with arrow up)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 mb-4">
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#1A1A1A", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>2</div>
                <p style={{ fontSize: "13px", color: "#1A1A1A", fontWeight: 600 }}>Scroll and tap "Add to Home Screen"</p>
              </div>
              <div className="flex items-start gap-3">
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#1A1A1A", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>3</div>
                <p style={{ fontSize: "13px", color: "#1A1A1A", fontWeight: 600 }}>Tap "Add" — done!</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              style={{ width: "100%", padding: "14px", borderRadius: "14px", background: "transparent", border: "1px solid rgba(0,0,0,0.1)", color: "#6B6B6B", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              Maybe later
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleInstall}
              style={{
                width: "100%", padding: "16px", borderRadius: "14px",
                background: "#1A1A1A", color: "white", border: "none",
                fontSize: "14px", fontWeight: 700, letterSpacing: "0.02em",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              }}
            >
              <Download size={16} strokeWidth={2} />
              Install App
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              style={{ width: "100%", padding: "12px", borderRadius: "14px", background: "transparent", border: "none", color: "#9A958C", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </>
  );
}
