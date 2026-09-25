"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateOutfits } from "@/lib/engine/generate";
import type { Item, Category, Outfit, OutfitPicks } from "@/lib/engine/types";
import { loadVotedItemIds, saveVotedItemIds } from "@/lib/userPrefs";
import OutfitFlatLay from "@/components/OutfitFlatLay";
import ShareCard from "@/components/ShareCard";
import { saveLook } from "@/lib/savedLooks";

type TripOccasion = "casual" | "work" | "date" | "night_out" | "travel" | "gym";
type DayForecast = { date: string; tempMax: number; tempMin: number; tempAvg: number; isRaining: boolean; weatherCode: number; };
// One look per day: `looks` holds the alternatives (✕ moves to the next),
// `picks` is the look as shown, including any swaps.
type DayPlan = { day: number; date: string; forecast: DayForecast; occasion: TripOccasion; looks: Outfit[]; index: number; picks: OutfitPicks };

function weatherIcon(code: number, isRaining: boolean): string {
  if (isRaining) return "🌧️";
  if (code <= 1) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  return "⛈️";
}

const OCCASIONS: TripOccasion[] = ["casual", "work", "date", "night_out", "travel", "gym"];
const OCCASION_LABELS: Record<TripOccasion, string> = {
  casual: "☀️ Casual", work: "💼 Work", date: "🌹 Date",
  night_out: "🌑 Night Out", travel: "✈️ Travel", gym: "💪 Gym",
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function maxDate() { const d = new Date(); d.setDate(d.getDate() + 14); return d; }
// toISOString() converts to UTC first, so for any timezone ahead of UTC
// (all of Europe included) local midnight rolls back to the previous
// calendar day - a user tapping "24" on the calendar got a trip planned
// for the 23rd. Build the string from local date parts instead.
function dateToStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function getDaysBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (cur <= last) { dates.push(dateToStr(cur)); cur.setDate(cur.getDate() + 1); }
  return dates;
}

function MiniCalendar({ startDate, endDate, onSelect }: {
  startDate: string | null; endDate: string | null; onSelect: (date: string) => void;
}) {
  const today = new Date();
  const max = maxDate();
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prevMonth() { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); }
  function nextMonth() { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); }
  function isInRange(day: number) { if (!startDate || !endDate) return false; const d = dateToStr(new Date(viewYear, viewMonth, day)); return d > startDate && d < endDate; }
  function isStart(day: number) { return startDate === dateToStr(new Date(viewYear, viewMonth, day)); }
  function isEnd(day: number) { return endDate === dateToStr(new Date(viewYear, viewMonth, day)); }
  function isDisabled(day: number) { const d = new Date(viewYear, viewMonth, day); return d < today || d > max; }
  function isToday(day: number) { return today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear; }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div className="rounded-2xl border border-black/8 overflow-hidden bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/6">
        <button type="button" onClick={prevMonth} className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-sm transition">‹</button>
        <span className="font-bold text-sm">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-sm transition">›</button>
      </div>
      <div className="grid grid-cols-7 px-2 pt-2">
        {DAYS_SHORT.map(d => <div key={d} className="text-center text-xs text-neutral-400 font-medium py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const disabled = isDisabled(day);
          const start = isStart(day);
          const end = isEnd(day);
          const inRange = isInRange(day);
          const todayMark = isToday(day);
          return (
            <button key={day} type="button" disabled={disabled}
              onClick={() => !disabled && onSelect(dateToStr(new Date(viewYear, viewMonth, day)))}
              className={[
                "relative h-9 w-full flex items-center justify-center text-sm font-medium transition",
                disabled ? "opacity-25 cursor-not-allowed" : "cursor-pointer",
                start || end ? "bg-black text-white rounded-full z-10" : "",
                inRange ? "bg-neutral-100" : "",
                !start && !end && !inRange && !disabled ? "hover:bg-neutral-100 rounded-full" : "",
                todayMark && !start && !end ? "font-black" : "",
              ].join(" ")}>
              {day}
              {todayMark && !start && !end && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-black" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const LAST_TRIP_KEY = "om_last_trip";

type SavedTrip = { city: string; cityName: string; startDate: string; endDate: string; plan: DayPlan[] };

function pieceIds(p: OutfitPicks): string[] {
  return [p.top, p.bottom, p.shoes, p.inner, p.outer].filter(Boolean).map(it => it!.id);
}

// Everything to pack: each distinct piece from the looks chosen for the trip,
// grouped by kind, with the days it's worn.
function PackingList({ plan }: { plan: DayPlan[] }) {
  const byId = new Map<string, { item: Item; days: number[] }>();
  for (const d of plan) {
    const p = d.picks;
    for (const it of [p.outer, p.top, p.inner, p.bottom, p.shoes, ...(p.accessories ?? [])]) {
      if (!it) continue;
      const e = byId.get(it.id) ?? { item: it, days: [] };
      if (!e.days.includes(d.day)) e.days.push(d.day);
      byId.set(it.id, e);
    }
  }
  const groups: { label: string; match: (it: Item) => boolean }[] = [
    { label: "Jackets & coats", match: it => it.category === "outerwear" },
    { label: "Tops & dresses", match: it => it.category === "top" },
    { label: "Bottoms", match: it => it.category === "bottom" },
    { label: "Shoes", match: it => it.category === "shoes" },
    { label: "Accessories", match: it => it.category === "accessory" },
  ];
  const entries = [...byId.values()];
  return (
    <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-black/6">
        <h3 className="font-display font-black text-lg">🧳 Packing list</h3>
        <p className="text-xs text-neutral-400 mt-0.5">{entries.length} pieces for {plan.length} day{plan.length === 1 ? "" : "s"}</p>
      </div>
      <div className="px-5 py-3 flex flex-col gap-4">
        {groups.map(g => {
          const list = entries.filter(e => g.match(e.item));
          if (!list.length) return null;
          return (
            <div key={g.label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2">{g.label}</p>
              <div className="flex flex-col gap-2">
                {list.map(({ item, days }) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.image_url
                        ? <img src={item.image_url} alt="" loading="lazy" className="w-full h-full object-contain p-0.5" />
                        : <span className="text-lg opacity-50">👕</span>}
                    </div>
                    <p className="flex-1 text-sm capitalize">{item.color_family} {String(item.type).replace(/_/g, " ")}</p>
                    <p className="text-xs text-neutral-400">Day {days.sort((a, b) => a - b).join(", ")}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TripPlannerPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const router = useRouter();
  const [items, setItems] = React.useState<Item[]>([]);
  const [itemsLoaded, setItemsLoaded] = React.useState(false);
  const [city, setCity] = React.useState("");
  const [startDate, setStartDate] = React.useState<string | null>(null);
  const [endDate, setEndDate] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<DayPlan[] | null>(null);
  const [cityName, setCityName] = React.useState("");
  const [shareLook, setShareLook] = React.useState<Outfit | null>(null);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadItems() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data } = await supabase.from("items").select("*").eq("user_id", user.id);
      if (data) setItems(data.map((r: any) => ({
        id: r.id, category: r.category as Category,
        type: r.type, color_family: r.color_family ?? "neutral",
        image_url: r.image_url ?? null,
        formality_tier: r.formality_tier,
        is_layer: r.is_layer,
        is_inner: r.is_inner,
        min_temp: r.min_temp,
        max_temp: r.max_temp,
        style_tags: r.style_tags,
      })));
      setItemsLoaded(true);
    }
    loadItems();
    // The last planned trip survives closing the page.
    try {
      const saved = JSON.parse(localStorage.getItem(LAST_TRIP_KEY) ?? "null") as SavedTrip | null;
      if (saved?.plan?.length) {
        setCity(saved.city); setCityName(saved.cityName);
        setStartDate(saved.startDate); setEndDate(saved.endDate); setPlan(saved.plan);
      }
    } catch {}
  }, [supabase, router]);

  React.useEffect(() => {
    if (!plan || !startDate || !endDate) return;
    try {
      localStorage.setItem(LAST_TRIP_KEY, JSON.stringify({ city, cityName, startDate, endDate, plan } satisfies SavedTrip));
    } catch {}
  }, [plan, city, cityName, startDate, endDate]);

  function handleDateSelect(date: string) {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date); setEndDate(null);
    } else {
      if (date < startDate) { setEndDate(startDate); setStartDate(date); }
      else if (date === startDate) { setStartDate(null); }
      else {
        const days = getDaysBetween(startDate, date).length;
        if (days > 14) { setError("Maximum 14 days."); return; }
        setEndDate(date); setError(null);
      }
    }
  }

  const duration = startDate && endDate ? getDaysBetween(startDate, endDate).length : 0;
  const gender = (typeof window !== "undefined" ? (localStorage.getItem("om_gender") as any) ?? "male" : "male");
  const style = (typeof window !== "undefined" ? localStorage.getItem("om_style") ?? "minimal" : "minimal");

  function looksFor(forecast: DayForecast, occasion: TripOccasion, seed: number, avoid: string[]): Outfit[] {
    return generateOutfits(items, occasion, seed, {
      tempC: forecast.tempAvg,
      isRaining: forecast.isRaining,
      gender,
      style,
      votedItemIds: loadVotedItemIds(),
      recentItemIds: avoid,
    });
  }

  async function handleGenerate() {
    if (!city.trim()) { setError("Please enter a destination."); return; }
    if (!startDate || !endDate) { setError("Please select dates on the calendar."); return; }
    if (items.length < 3) { setError("Add at least 3 items to your wardrobe first."); return; }

    setLoading(true); setError(null); setPlan(null);
    try {
      const res = await fetch("/api/trip-weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim(), days: duration, startDate, endDate }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setCityName(data.city);

      const dateList = getDaysBetween(startDate, endDate);
      // Each day avoids the pieces chosen for the days before it, so shirts
      // don't repeat across the trip (only the look actually shown counts).
      const used: string[] = [];
      const newPlan: DayPlan[] = data.forecast.slice(0, dateList.length).map((fc: DayForecast, i: number) => {
        const occasion: TripOccasion = "casual";
        const looks = looksFor(fc, occasion, Date.now() + i * 1000, [...used]);
        used.push(...pieceIds(looks[0].picks));
        return { day: i + 1, date: dateList[i] ?? fc.date, forecast: fc, occasion, looks, index: 0, picks: looks[0].picks };
      });
      setPlan(newPlan);
    } catch {
      setError("Could not fetch weather. Try again.");
    } finally { setLoading(false); }
  }

  function otherDaysIds(dayIndex: number): string[] {
    return (plan ?? []).filter((_, i) => i !== dayIndex).flatMap(d => pieceIds(d.picks));
  }

  function changeOccasion(dayIndex: number, occasion: TripOccasion) {
    if (!plan) return;
    setPlan(prev => prev!.map((d, i) => {
      if (i !== dayIndex) return d;
      const looks = looksFor(d.forecast, occasion, Date.now() + i * 999, otherDaysIds(dayIndex));
      return { ...d, occasion, looks, index: 0, picks: looks[0].picks };
    }));
  }

  // ✕ on a day: the next alternative for that day (fresh set when used up).
  function nextLook(dayIndex: number) {
    setPlan(prev => prev!.map((d, i) => {
      if (i !== dayIndex) return d;
      if (d.index + 1 < d.looks.length) return { ...d, index: d.index + 1, picks: d.looks[d.index + 1].picks };
      const looks = looksFor(d.forecast, d.occasion, Date.now() + i * 777, [...otherDaysIds(dayIndex), ...pieceIds(d.picks)]);
      return { ...d, looks, index: 0, picks: looks[0].picks };
    }));
  }

  function setDayPicks(dayIndex: number, picks: OutfitPicks) {
    setPlan(prev => prev!.map((d, i) => (i === dayIndex ? { ...d, picks } : d)));
  }

  async function saveTripLook(day: DayPlan, picks: OutfitPicks) {
    const saved = await saveLook(supabase, day.occasion, picks);
    const voted = loadVotedItemIds();
    const ids = pieceIds(picks);
    saveVotedItemIds({ liked: Array.from(new Set([...voted.liked, ...ids])), disliked: voted.disliked.filter(id => !ids.includes(id)) });
    setSavedMsg(saved ? `Day ${day.day} look saved ♥` : "Couldn't save this look. Please try again.");
    setTimeout(() => setSavedMsg(null), 2000);
  }

  function clearTrip() {
    setPlan(null); setCity(""); setCityName(""); setStartDate(null); setEndDate(null);
    try { localStorage.removeItem(LAST_TRIP_KEY); } catch {}
  }

  return (
    <main className="min-h-screen" style={{background:"#FAF8F5"}}>
      <div className="mx-auto w-full max-w-lg px-4 py-6 flex flex-col gap-6">

        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push("/app")} aria-label="Back"
            className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition active:scale-[0.94] flex-shrink-0">
            ←
          </button>
          <div>
            <h1 className="font-display text-2xl font-black">Trip Planner</h1>
            <p className="text-xs text-neutral-400 mt-0.5">A look for every day · real forecast · packing list</p>
          </div>
        </div>

        {!plan && (
          <>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">
                Where are you going?
              </label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
                placeholder="Paris, Rome, New York..."
                className="w-full rounded-xl border border-black/10 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/8 focus:border-black/25 transition" />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">
                {!startDate ? "Select departure date" : !endDate ? "Select return date" : `${duration} day${duration !== 1 ? "s" : ""} — ${formatDate(startDate)} → ${formatDate(endDate)}`}
              </label>
              <MiniCalendar startDate={startDate} endDate={endDate} onSelect={handleDateSelect} />
              {startDate && !endDate && (
                <p className="text-xs text-neutral-400 mt-2 text-center">Now tap your return date (max 14 days)</p>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button onClick={handleGenerate}
              disabled={loading || !city.trim() || !startDate || !endDate || !itemsLoaded}
              className="rounded-xl bg-black text-white py-4 text-sm font-bold disabled:opacity-40 hover:bg-black/85 transition active:scale-[0.98]">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  Planning your trip...
                </span>
              ) : "✨ Plan My Trip"}
            </button>
          </>
        )}

        {plan && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✈️</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-black text-xl truncate">{cityName}</h2>
                <p className="text-sm text-neutral-400">
                  {plan.length} days · {formatDate(startDate!)} – {formatDate(endDate!)}
                </p>
              </div>
              <button type="button" onClick={clearTrip}
                className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 transition">
                New trip
              </button>
            </div>

            {savedMsg && <p className="rounded-xl bg-green-50 text-green-700 text-sm px-4 py-3">{savedMsg}</p>}

            <PackingList plan={plan} />

            {plan.map((day, i) => (
              <div key={day.day} className="rounded-2xl border border-black/8 overflow-hidden bg-white">
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

                <div className="p-3">
                  <OutfitFlatLay
                    outfit={day.looks[day.index]}
                    context={{ occasion: day.occasion, tempC: day.forecast.tempAvg, isRaining: day.forecast.isRaining }}
                    allItems={items}
                    gender={gender}
                    votedItemIds={loadVotedItemIds()}
                    onLike={picks => saveTripLook(day, picks)}
                    onSkip={() => nextLook(i)}
                    onShare={picks => setShareLook({ ...day.looks[day.index], picks })}
                    onPicksChange={picks => setDayPicks(i, picks)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {itemsLoaded && items.length < 3 && (
          <div className="rounded-2xl border-2 border-dashed border-black/8 p-10 text-center">
            <p className="text-neutral-400 text-sm mb-3">Add at least 3 items to your wardrobe first.</p>
            <button type="button" onClick={() => router.push("/app")}
              className="inline-block rounded-full bg-black text-white px-5 py-2.5 text-sm font-bold hover:bg-black/85 transition">
              Go to Wardrobe →
            </button>
          </div>
        )}
      </div>
      {shareLook && <ShareCard outfit={shareLook} onClose={() => setShareLook(null)} gender={gender} />}
    </main>
  );
}
