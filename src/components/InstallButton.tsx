"use client";

import * as React from "react";

export default function InstallButton() {
  const [prompt, setPrompt] = React.useState<any>(null);
  const [installed, setInstalled] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [showIOSGuide, setShowIOSGuide] = React.useState(false);

  React.useEffect(() => {
    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = (window.navigator as any).standalone === true;
    setIsIOS(ios);
    if (standalone) setInstalled(true);

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Mos trego nëse është tashmë i instaluar
  if (installed) return null;
  // Mos trego nëse nuk ka asnjë opsion
  if (!prompt && !isIOS) return null;

  async function handleInstall() {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  return (
    <>
      <button
        onClick={handleInstall}
        className="rounded-full bg-black text-white px-4 py-2 text-xs font-semibold hover:bg-black/85 transition flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Install App
      </button>

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
            <h2 className="text-lg font-black mb-2">Install OutfitMirror</h2>
            <p className="text-sm text-neutral-500 mb-5">Add to your home screen in 2 steps:</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
                <div>
                  <p className="text-sm font-semibold">Tap the Share button</p>
                  <p className="text-xs text-neutral-400 mt-0.5">The box with an arrow pointing up at the bottom of Safari</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
                <div>
                  <p className="text-sm font-semibold">Tap "Add to Home Screen"</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Scroll down in the menu and tap it</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full rounded-xl bg-black text-white py-3.5 text-sm font-semibold hover:bg-black/85 transition">
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}