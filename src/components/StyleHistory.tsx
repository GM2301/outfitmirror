"use client";

import * as React from "react";

type HistoryEntry = {
  id: number;
  date: string;
  occasion: string;
  label: string;
  top?: string;
  bottom?: string;
  shoes?: string;
};

function pretty(s?: string) {
  return (s ?? "").replace(/_/g, " ");
}

// Looks the user tapped ♥ on. (Used to show an average "score" and a trend
// chart - the score was an internal ranking number, not something that meant
// anything to a person, so it's gone.)
export default function StyleHistory() {
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [showAll, setShowAll] = React.useState(false);

  React.useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem("om_outfit_history") ?? "[]");
      setHistory(Array.isArray(h) ? h : []);
    } catch {}
  }, []);

  if (history.length === 0) return null;

  const visible = showAll ? history : history.slice(0, 5);

  return (
    <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-black/6 flex items-center justify-between">
        <div>
          <h3 className="font-display font-black text-base">Saved looks</h3>
          <p className="text-xs text-neutral-400 mt-0.5">{history.length} look{history.length === 1 ? "" : "s"} you liked</p>
        </div>
        <button type="button"
          onClick={() => {
            if (!window.confirm("Clear all saved looks?")) return;
            setHistory([]); localStorage.removeItem("om_outfit_history");
          }}
          className="text-xs text-neutral-400 hover:text-red-500 transition">
          Clear
        </button>
      </div>

      <div className="divide-y divide-black/5">
        {visible.map((h) => (
          <div key={h.id} className="flex items-center gap-3 px-5 py-3">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold capitalize">{pretty(h.occasion)}</span>
              <p className="text-xs text-neutral-400 mt-0.5 truncate capitalize">
                {pretty(h.top)} · {pretty(h.bottom)} · {pretty(h.shoes)}
              </p>
            </div>
            <p className="text-xs text-neutral-400 flex-shrink-0">{h.date}</p>
          </div>
        ))}
      </div>

      {history.length > 5 && (
        <button type="button" onClick={() => setShowAll(v => !v)}
          className="w-full px-5 py-3 text-center border-t border-black/5 text-xs text-neutral-500 hover:bg-neutral-50 transition">
          {showAll ? "Show less" : `Show all ${history.length}`}
        </button>
      )}
    </div>
  );
}
