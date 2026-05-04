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

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function todayStr() { return new Date().toISOString().split("T")[0]; }
function maxDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d;
}
function dateToStr(d: Date) { return d.toISOString().split("T")[0]; }
function strToDate(s: string) { return new Date(s + "T00:00:00"); }
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function getDaysBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (cur <= last) {
    dates.push(dateToStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// ── Mini Calendar Component ──
function MiniCalendar({ startDate, endDate, onSelect }: {
  startDate: string | null;
  endDate: string | null;
  onSelect: (date: string) => void;
}) {
  const today = new Date();
  const max = maxDate();
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function isInRange(day: number): boolean {
    if (!startDate || !endDate) return false;
    const d = dateToStr(new Date(viewYear, viewMonth, day));
    return d > startDate && d < endDate;
  }
  function isStart(day: number) {
    return startDate === dateToStr(new Date(viewYear, viewMonth, day));
  }
  function isEnd(day: number) {
    return endDate === dateToStr(new Date(viewYear, viewMonth, day));
  }
  function isDisabled(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    return d < today || d > max;
  }
  function isToday(day: number) {
    return today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div className="rounded-2xl border border-black/8 overflow-hidden bg-white">
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/6">
        <button type="button" onClick={prevMonth}
          className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-sm transition">‹</button>
        <span className="font-bold text-sm">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth}
          className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-sm transition">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-xs text-neutral-400 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const disabled = isDisabled(day);
          const start = isStart(day);
          const end = isEnd(day);
          const inRange = isInRange(day);
          const todayMark = isToday(day);

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelect(dateToStr(new Date(viewYear, viewMonth, day)))}
              className={[
                "relative h-9 w-full flex items-center justify-center text-sm font-medium transition",
                disabled ? "opacity-25 cursor-not-allowed" : "cursor-pointer",
                start || end ? "bg-black text-white rounded-full z-10" : "",
                inRange ? "bg-neutral-100" : "",
                !start && !end && !inRange && !disabled ? "hover:bg-neutral-100 rounded-full" : "",
                todayMark && !start && !end ? "font-black" : "",
              ].join(" ")}
            >
              {day}
              {todayMark && !start && !end && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-black" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 pb-3 flex items-center gap-3 text-xs text-neutral-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-black inline-block"/>Start / End</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-neutral-200 inline-block"/>Range</span>
      </div>
    </div>
  );
}

export default function TripPlannerPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const router = useRouter();
  const [items, setItems] = React.useState<Item[]>([]);
  const [city, setCity] = React.useState("");
  const [startDate, setStartDate] = React.useState<string | null>(null);
  const [endDate, setEndDate] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<DayPlan[] | null>(null);
  const [cityName, setCityName] = React.useState("");
  const [dayOccasions, setDayOccasions] = React.useState<Record<number, TripOccasion>>({});

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

  function handleDateSelect(date: string) {
    if (!startDate || (startDate && endDate)) {
      // Fillo nga e para
      setStartDate(date);
      setEndDate(null);
    } else {
      // Zgjidh të dytën
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else if (date === startDate) {
        setStartDate(null);
      } else {
        // Max 14 ditë
        const days = getDaysBetween(startDate, date).length;
        if (days > 14) {
          setError("Maximum 14 days.");
          return;
        }
        setEndDate(date);
        setError(null);
      }
    }
  }

  const duration = startDate && endDate ? getDaysBetween(startDate, endDate).length : 0;

  async function handleGenerate() {
    if (!city.trim()) { setError("Please enter a destination."); return; }
    if (!startDate || !endDate) { setError("Please select dates on the calendar."); return; }
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
      <div className="mx-auto w-full max-w-lg px-4 py-6 flex flex-col gap-6">

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

        {/* Calendar */}
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">
            {!startDate ? "Select departure date" : !endDate ? "Select return date" : `${duration} day${duration !== 1 ? "s" : ""} — ${formatDate(startDate)} → ${formatDate(endDate)}`}
          </label>
          <MiniCalendar
            startDate={startDate}
            endDate={endDate}
            onSelect={handleDateSelect}
          />
          {startDate && !endDate && (
            <p className="text-xs text-neutral-400 mt-2 text-center">Now tap your return date (max 14 days)</p>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button onClick={handleGenerate}
          disabled={loading || !city.trim() || !startDate || !endDate}
          className="rounded-xl bg-black text-white py-4 text-sm font-bold disabled:opacity-40 hover:bg-black/85 transition active:scale-[0.98]">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
              Planning your trip...
            </span>
          ) : "✨ Plan My Trip"}
        </button>

        {/* Results */}
        {plan && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✈️</span>
              <div>
                <h2 className="font-display font-black text-xl">{cityName}</h2>
                <p className="text-sm text-neutral-400">
                  {plan.length} days · {formatDate(startDate!)} – {formatDate(endDate!)}
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