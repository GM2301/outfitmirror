"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { generateOutfits } from "@/lib/engine/generate";
import type { Item, Category, ItemType, Occasion } from "@/lib/engine/types";
import AppShell from "@/components/AppShell";
import OutfitCard from "@/components/OutfitCard";

type DayForecast = {
  date: string;
  tempMax: number;
  tempMin: number;
  tempAvg: number;
  isRaining: boolean;
  weatherCode: number;
};

type DayPlan = {
  day: number;
  date: string;
  forecast: DayForecast;
  occasion: Occasion;
  outfits: any[];
};

function weatherIcon(code: number, isRaining: boolean): string {
  if (isRaining) return "🌧️";
  if (code <= 1) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  return "⛈️";
}

function tempToOccasion(tempAvg: number, isRaining: boolean): Occasion {
  if (isRaining) return "casual";
  if (tempAvg >= 24) return "casual";
  if (tempAvg >= 18) return "casual";
  return "casual";
}

function filterByWeather(items: Item[], tempAvg: number, isRaining: boolean): Item[] {
  return items.filter(item => {
    const type = item.type.toLowerCase();
    if (tempAvg > 26 && (type.includes("hoodie") || type.includes("sweater") || type.includes("jacket"))) return false;
    if (tempAvg < 12 && (type.includes("tank") || type.includes("shorts") || type.includes("sandal"))) return false;
    if (isRaining && type.includes("sandal")) return false;
    return true;
  });
}

const OCCASIONS: Occasion[] = ["casual", "work", "date", "night_out", "travel", "gym"];
const OCCASION_LABELS: Record<Occasion, string> = {
  casual: "☀️ Casual", work: "💼 Work", date: "🌹 Date",
  night_out: "🌙 Night Out", travel: "✈️ Travel", gym: "💪 Gym",
};

export default function TripPlannerPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const [items, setItems] = React.useState<Item[]>([]);
  const [city, setCity] = React.useState("");
  const [days, setDays] = React.useState(4);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<DayPlan[] | null>(null);
  const [cityName, setCityName] = React.useState("");
  const [dayOccasions, setDayOccasions] = React.useState<Record<number, Occasion>>({});

  // Merr wardrobe-n e userit
  React.useEffect(() => {
    async function loadItems() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("items").select("id, category, type, color_family, image_url")
        .eq("user_id", user.id);
      if (data) {
        setItems(data.map((r: any) => ({
          id: r.id, category: r.category as Category,
          type: r.type as string, color_family: r.color_family ?? "neutral",
          image_url: r.image_url ?? null,
        })));
      }
    }
    loadItems();
  }, [supabase]);

  async function handleGenerate() {
    if (!city.trim()) { setError("Please enter a destination."); return; }
    if (items.length < 3) { setError("Add at least 3 items to your wardrobe first."); return; }

    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const res = await fetch("/api/trip-weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim(), days }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }

      setCityName(data.city);

      // Gjenero outfit për çdo ditë
      const newPlan: DayPlan[] = data.forecast.map((fc: DayForecast, i: number) => {
        const occasion = dayOccasions[i] ?? "casual";
        const filteredItems = filterByWeather(items, fc.tempAvg, fc.isRaining);
        const outfits = generateOutfits(filteredItems, occasion, Date.now() + i * 1000);
        return { day: i + 1, date: fc.date, forecast: fc, occasion, outfits };
      });

      setPlan(newPlan);
    } catch {
      setError("Could not fetch weather. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function changeOccasion(dayIndex: number, occasion: Occasion) {
    setDayOccasions(prev => ({ ...prev, [dayIndex]: occasion }));
    if (!plan) return;
    setPlan(prev => prev!.map((d, i) => {
      if (i !== dayIndex) return d;
      const filteredItems = filterByWeather(items, d.forecast.tempAvg, d.forecast.isRaining);
      const outfits = generateOutfits(filteredItems, occasion, Date.now() + i * 999);
      return { ...d, occasion, outfits };
    }));
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <AppShell title="Trip Planner">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 flex flex-col gap-6">

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-black text-white px-3 py-1 text-xs font-semibold mb-3">
            ✈️ Premium Feature
          </div>
          <h1 className="text-2xl font-black">Trip Planner</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Tell us where you're going — we'll plan your outfits day by day from your wardrobe.
          </p>
        </div>

        {/* Input form */}
        <div className="rounded-2xl border border-black/8 p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Destination</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
              placeholder="e.g. Paris, Rome, New York..."
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
              Number of Days: {days}
            </label>
            <div className="mt-2 flex gap-2">
              {[2, 3, 4, 5, 6, 7].map(n => (
                <button key={n} type="button"
                  onClick={() => setDays(n)}
                  className={"rounded-xl border px-4 py-2 text-sm font-medium transition " +
                    (days === n ? "bg-black text-white border-black" : "border-black/10 hover:bg-neutral-50")}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={loading || !city.trim()}
            className="rounded-xl bg-black text-white py-3.5 text-sm font-semibold disabled:opacity-40 hover:bg-black/85 transition">
            {loading ? "Planning your trip..." : "✨ Plan My Trip"}
          </button>
        </div>

        {/* Results */}
        {plan && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✈️</span>
              <div>
                <h2 className="font-black text-lg">{cityName}</h2>
                <p className="text-sm text-neutral-400">{days}-day wardrobe plan</p>
              </div>
            </div>

            {plan.map((day, i) => (
              <div key={day.day} className="rounded-2xl border border-black/8 overflow-hidden">

                {/* Day header */}
                <div className="bg-black text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{weatherIcon(day.forecast.weatherCode, day.forecast.isRaining)}</span>
                    <div>
                      <p className="font-black">Day {day.day} — {formatDate(day.date)}</p>
                      <p className="text-xs text-white/60 mt-0.5">
                        {day.forecast.tempMin}°C – {day.forecast.tempMax}°C
                        {day.forecast.isRaining ? " · Rain expected" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">{day.forecast.tempAvg}°C</p>
                  </div>
                </div>

                {/* Occasion selector */}
                <div className="px-5 py-3 border-b border-black/8 flex gap-2 overflow-x-auto">
                  {OCCASIONS.map(occ => (
                    <button key={occ} type="button"
                      onClick={() => changeOccasion(i, occ)}
                      className={"rounded-full px-3 py-1.5 text-xs font-medium border transition whitespace-nowrap " +
                        (day.occasion === occ ? "bg-black text-white border-black" : "border-black/10 hover:bg-neutral-50")}>
                      {OCCASION_LABELS[occ]}
                    </button>
                  ))}
                </div>

                {/* Outfits */}
                <div className="p-5 grid gap-4 sm:grid-cols-2">
                  {day.outfits.map((outfit: any) => (
                    <OutfitCard key={outfit.label} outfit={outfit} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state - no wardrobe */}
        {items.length < 3 && (
          <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center">
            <p className="text-neutral-400 text-sm">Add at least 3 items to your wardrobe to use Trip Planner.</p>
            <a href="/app" className="mt-3 inline-block rounded-full bg-black text-white px-5 py-2.5 text-sm font-semibold hover:bg-black/85 transition">
              Go to Wardrobe →
            </a>
          </div>
        )}

      </div>
    </AppShell>
  );
}