"use client";

import * as React from "react";

type SavedOutfit = {
  id: number;
  date: string;
  occasion: string;
  label: string;
  score: number;
  top: string;
  bottom: string;
  shoes: string;
};

const OCCASION_EMOJI: Record<string, string> = {
  work: "💼", date: "🌹", casual: "☀️", night_out: "🌑", travel: "✈️", gym: "💪",
};

function pretty(s?: string) {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

export default function OutfitOfTheWeek() {
  const [outfits, setOutfits] = React.useState<SavedOutfit[]>([]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const hist = JSON.parse(localStorage.getItem("om_outfit_history") ?? "[]") as SavedOutfit[];
      // Top 3 sipas score-it këtë javë
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const thisWeek = hist.filter(o => o.id > oneWeekAgo);
      // Nëse ska nga kjo javë, merr top 3 të gjitha
      const source = thisWeek.length >= 3 ? thisWeek : hist;
      const top3 = [...source].sort((a, b) => b.score - a.score).slice(0, 3);
      setOutfits(top3);
    } catch { setOutfits([]); }
  }, [open]);

  if (outfits.length === 0) return null;

  return (
    <>
      {/* Entry point — shfaqet te Outfits view */}
      <button type="button" onClick={() => setOpen(true)}
        className="w-full mt-4 rounded-2xl border border-black/8 p-4 text-left hover:bg-neutral-50 transition active:scale-[0.98]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏆</span>
            <div>
              <p className="font-bold text-sm">Outfit of the Week</p>
              <p className="text-xs text-neutral-400 mt-0.5">Your top 3 saved looks</p>
            </div>
          </div>
          <span className="text-neutral-400 text-sm">→</span>
        </div>
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm overlay-enter" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto drawer-enter"
            style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-200" />
            </div>
            <div className="px-5 pb-8 pt-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display font-black text-xl">🏆 Outfit of the Week</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Your highest-scored saved looks</p>
                </div>
                <button type="button" onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition">
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {outfits.map((outfit, i) => (
                  <div key={outfit.id}
                    className="rounded-2xl border border-black/8 p-4 flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-black text-lg flex-shrink-0"
                      style={{ background: i === 0 ? "#000" : i === 1 ? "#333" : "#666", color: "white" }}>
                      {i + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{OCCASION_EMOJI[outfit.occasion] ?? "✨"}</span>
                        <p className="font-bold text-sm capitalize">{outfit.occasion.replace(/_/g, " ")}</p>
                        <span className="ml-auto text-xs font-black">{outfit.score}<span className="text-neutral-300 font-normal">/100</span></span>
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        {pretty(outfit.top)} · {pretty(outfit.bottom)} · {pretty(outfit.shoes)}
                      </p>
                      <p className="text-xs text-neutral-300 mt-1">{outfit.date}</p>
                    </div>
                  </div>
                ))}
              </div>

              {outfits.length < 3 && (
                <p className="text-xs text-neutral-400 text-center mt-4">
                  Save more outfits to fill the top 3 👍
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}