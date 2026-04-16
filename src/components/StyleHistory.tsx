"use client";

import * as React from "react";

type HistoryEntry = {
  id: number;
  date: string;
  occasion: string;
  label: string;
  score: number;
  top?: string;
  bottom?: string;
  shoes?: string;
};

export default function StyleHistory() {
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);

  React.useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem("om_outfit_history") ?? "[]");
      setHistory(h);
    } catch {}
  }, []);

  if (history.length === 0) return null;

  const avgScore = Math.round(history.reduce((a, b) => a + b.score, 0) / history.length);
  const best = history.reduce((a, b) => a.score > b.score ? a : b);
  const maxScore = Math.max(...history.map(h => h.score));
  const minScore = Math.min(...history.map(h => h.score));

  // Grafik — max 10 entries
  const chartData = history.slice(0, 10).reverse();

  return (
    <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-black/6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-base">Style History</h3>
            <p className="text-xs text-neutral-400 mt-0.5">{history.length} outfits saved</p>
          </div>
          <button type="button"
            onClick={() => { setHistory([]); localStorage.removeItem("om_outfit_history"); }}
            className="text-xs text-neutral-400 hover:text-red-500 transition">
            Clear
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Avg Score", value: avgScore },
            { label: "Best",      value: maxScore },
            { label: "Outfits",   value: history.length },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-neutral-50 px-3 py-2.5 text-center">
              <p className="font-display font-black text-xl">{s.value}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-5 py-4 border-b border-black/6">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Score Trend</p>
        <div className="flex items-end gap-1.5 h-16">
          {chartData.map((entry, i) => {
            const pct = ((entry.score - minScore) / (maxScore - minScore || 1)) * 100;
            const heightPct = 20 + (pct * 0.8); // min 20%, max 100%
            const isLast = i === chartData.length - 1;
            return (
              <div key={entry.id} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={"rounded-t-lg transition-all duration-500 w-full " +
                    (isLast ? "bg-black" : "bg-neutral-200")}
                  style={{ height: `${heightPct}%` }}
                />
                <span className="text-[9px] text-neutral-400">{entry.score}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-black/5">
        {history.slice(0, 5).map((h) => (
          <div key={h.id} className="flex items-center gap-3 px-5 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold capitalize">{h.occasion.replace(/_/g, " ")}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  h.label === "Colorful" ? "bg-amber-50 text-amber-700" : "bg-neutral-100 text-neutral-600"
                }`}>{h.label}</span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 truncate capitalize">
                {h.top?.replace(/_/g, " ")} · {h.bottom?.replace(/_/g, " ")} · {h.shoes?.replace(/_/g, " ")}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-display font-black text-sm">{h.score}</p>
              <p className="text-xs text-neutral-400">{h.date}</p>
            </div>
          </div>
        ))}
      </div>

      {history.length > 5 && (
        <div className="px-5 py-3 text-center border-t border-black/5">
          <p className="text-xs text-neutral-400">+{history.length - 5} more outfits</p>
        </div>
      )}
    </div>
  );
}