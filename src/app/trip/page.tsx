"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateOutfits } from "@/lib/engine/generate";
import type { Item, Category } from "@/lib/engine/types";
import OutfitCard from "@/components/OutfitCard";

type TripOccasion = "casual" | "work" | "date" | "night_out" | "travel" | "gym";
type DayForecast = { date: string; tempMax: number; tempMin: number; tempAvg: number; isRaining: boolean; weatherCode: number; };
type DayPlan = { day: number; date: string; forecast: DayForecast; occasion: TripOccasion; outfits: any[]; };

function weatherIcon(code: number, isRaining: boolean): string {
  if (isRaining) return "🌧️";
  if (code <= 1) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  return "⛈️";
}

function filterByWeather(items: Item[], tempAvg: number, isRaining: boolean): Item[] {
  return items.filter(item => {
    const t = item.type.toLowerCase();
    if (tempAvg > 26 && (t.includes("hoodie") || t.includes("sweater") || t.includes("jacket"))) return false;
    if (tempAvg < 12 && (t.includes("tank") || t.includes("shorts") || t.includes("sandal"))) return false;
    if (isRaining && t.includes("sandal")) return false;
    return true;
  });
}

const OCCASIONS: TripOccasion[] = ["casual", "work", "date", "night_out", "travel", "gym"];
const OCCASION_LABELS: Record<TripOccasion, string> = {
  casual: "☀️ Casual", work: "💼 Work", date: "🌹 Date",
  night_out: "🌑 Night Out", travel: "✈️ Travel", gym: "💪 Gym",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function todayStr() { return new Date().toISOString().split("T")[0]; }
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
function maxDateStr() { return addDays(todayStr(), 14); }
function getDaysBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const DURATION_OPTIONS = [
  { label: "2 days", value: 2 },
  { label: "3 days", value: 3 },
  { label: "4 days", value: 4 },
  { label: "5 days", value: 5 },
  { label: "1 week", value: 7 },
  { label: "10 days", value: 10 },
  { label: "2 weeks", value: 14 },
];

export default function TripPlannerPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const router = useRouter();
  const [items, setItems] = React.useState<Item[]>([]);
  const [city, setCity] = React.useState("");
  const [startDate, setStartDate] = React.useState(todayStr());
  const [duration, setDuration] = React.useState(5);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<DayPlan[] | null>(null);
  const [cityName, setCityName] = React.useState("");
  const [dayOccasions, setDayOccasions] = React.useState<Record<number, TripOccasion>>({});

  const endDate = addDays(startDate, duration - 1);

  React.useEffect(() => {
    async function loadItems() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("items")
        .select("id, category, type, color_family, image_url").eq("user_id", user.id);
      if (data) setItems(data.map((r: any) => ({
        id: r.id, category: r.category as Category,
        type: r.type, color_family: r.color_family ?? "neutral",
        image_url: r.image_url ?? null,
      })));
    }
    loadItems();
  }, [supabase]);

  async function handleGenerate() {
    if (!city.trim()) { setError("Please enter a destination."); return; }
    if (items.length < 3) { setError("Add at least 3 items to your wardrobe first."); return; }

    setLoading(true); setError(null); setPlan(null);
    try {
      const res = await fetch("/api/trip-weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim(), days: duration, startDate }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setCityName(data.city);

      const dateList = getDaysBetween(startDate, endDate);
      const newPlan: DayPlan[] = data.forecast.slice(0, dateList.length).map((fc: DayForecast, i: number) => {
        const occasion: TripOccasion = dayOccasions[i] ?? "casual";
        const filtered = filterByWeather(items, fc.tempAvg, fc.isRaining);
        const outfits = generateOutfits(filtered, occasion, Date.now() + i * 1000);
        return { day: i + 1, date: dateList[i] ?? fc.date, forecast: fc, occasion, outfits };
      });
      setPlan(newPlan);
    } catch {
      setError("Could not fetch weather. Try again.");
    } finally { setLoading(false); }
  }

  function changeOccasion(dayIndex: number, occasion: TripOccasion) {
    setDayOccasions(prev => ({ ...prev, [dayIndex]: occasion }));
    if (!plan) return;
    setPlan(prev => prev!.map((d, i) => {
      if (i !== dayIndex) return d;
      const filtered = filterByWeather(items, d.forecast.tempAvg, d.forecast.isRaining);
      return { ...d, occasion, outfits: generateOutfits(filtered, occasion, Date.now() + i * 999) };
    }));
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push("/app")}
            className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition active:scale-[0.94] flex-shrink-0">
            ←
          </button>
          <div>
            <h1 className="font-display text-2xl font-black">Trip Planner</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Outfits day by day · real weather</p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-black/8 p-5 flex flex-col gap-5">

          {/* Destination */}
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">
              Where are you going?
            </label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
              placeholder="Paris, Rome, New York..."
              className="w-full rounded-xl border border-black/10 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/8 focus:border-black/25 transition" />
          </div>

          {/* From date */}
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">
              Departure date
            </label>
            <input type="date" value={startDate}
              min={todayStr()} max={maxDateStr()}
              onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/8 transition bg-white" />
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">
              How long?
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setDuration(opt.value)}
                  className={"rounded-full border-2 px-4 py-2 text-sm font-bold transition active:scale-[0.95] " +
                    (duration === opt.value ? "border-black bg-black text-white" : "border-black/10 hover:border-black/25")}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-2 rounded-xl bg-neutral-50 border border-black/6 px-4 py-3">
            <span className="text-lg">📅</span>
            <p className="text-sm font-semibold">
              {duration} {duration === 1 ? "day" : "days"} —{" "}
              <span className="text-neutral-500 font-normal">
                {formatDate(startDate)} → {formatDate(endDate)}
              </span>
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button onClick={handleGenerate}
            disabled={loading || !city.trim()}
            className="rounded-xl bg-black text-white py-4 text-sm font-bold disabled:opacity-40 hover:bg-black/85 transition active:scale-[0.98]">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                Planning your trip...
              </span>
            ) : "✨ Plan My Trip"}
          </button>
        </div>

        {/* Results */}
        {plan && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✈️</span>
              <div>
                <h2 className="font-display font-black text-xl">{cityName}</h2>
                <p className="text-sm text-neutral-400">
                  {plan.length} days · {formatDate(startDate)} – {formatDate(endDate)}
                </p>
              </div>
            </div>

            {plan.map((day, i) => (
              <div key={day.day} className="rounded-2xl border border-black/8 overflow-hidden">
                <div className="bg-black text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{weatherIcon(day.forecast.weatherCode, day.forecast.isRaining)}</span>
                    <div>
                      <p className="font-black">Day {day.day} — {formatDate(day.date)}</p>
                      <p className="text-xs text-white/50 mt-0.5">
                        {day.forecast.tempMin}°C – {day.forecast.tempMax}°C
                        {day.forecast.isRaining ? " · Rain expected" : ""}
                      </p>
                    </div>
                  </div>
                  <p className="font-display text-3xl font-black">{day.forecast.tempAvg}°C</p>
                </div>

                <div className="px-5 py-3 border-b border-black/6 flex gap-2 overflow-x-auto">
                  {OCCASIONS.map(occ => (
                    <button key={occ} type="button" onClick={() => changeOccasion(i, occ)}
                      className={"rounded-full px-3 py-1.5 text-xs font-bold border transition whitespace-nowrap active:scale-[0.95] " +
                        (day.occasion === occ ? "bg-black text-white border-black" : "border-black/10 hover:bg-neutral-50")}>
                      {OCCASION_LABELS[occ]}
                    </button>
                  ))}
                </div>

                <div className="p-5 grid gap-4 sm:grid-cols-2">
                  {day.outfits.map((outfit: any) => (
                    <OutfitCard key={outfit.label} outfit={outfit} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length < 3 && (
          <div className="rounded-2xl border-2 border-dashed border-black/8 p-10 text-center">
            <p className="text-neutral-400 text-sm mb-3">Add at least 3 items to your wardrobe first.</p>
            <button type="button" onClick={() => router.push("/app")}
              className="inline-block rounded-full bg-black text-white px-5 py-2.5 text-sm font-bold hover:bg-black/85 transition">
              Go to Wardrobe →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}