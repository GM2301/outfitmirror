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
    // Temperature ladder — nga research
    if (tempAvg >= 30 && (t.includes("hoodie") || t.includes("sweater") || t.includes("coat") || t.includes("parka"))) return false;
    if (tempAvg >= 25 && t.includes("coat")) return false;
    if (tempAvg < 13 && (t.includes("tank") || t.includes("crop"))) return false;
    if (tempAvg < 10 && (t.includes("shorts") || t.includes("sandal") || t.includes("mini"))) return false;
    if (tempAvg < 5  && (t.includes("shorts") || t.includes("sandal") || t.includes("mule"))) return false;
    if (isRaining && (t.includes("sandal") || t.includes("mule") || t.includes("flip"))) return false;
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


// ── Shop in City Data ─────────────────────────────────────────────────────────
type ShopItem = { name: string; type: string; emoji: string; url: string; };
type CityShops = { flag: string; description: string; shops: ShopItem[] };

const CITY_SHOPS: Record<string, CityShops> = {
  milan: {
    flag: "🇮🇹", description: "The fashion capital of the world. Home to luxury and streetwear icons.",
    shops: [
      { name: "Zara", type: "High Street", emoji: "🛍️", url: "https://www.zara.com" },
      { name: "H&M", type: "High Street", emoji: "🛍️", url: "https://www.hm.com" },
      { name: "Gucci", type: "Luxury", emoji: "👜", url: "https://www.gucci.com" },
      { name: "Prada", type: "Luxury", emoji: "👜", url: "https://www.prada.com" },
      { name: "OVS", type: "Local", emoji: "🇮🇹", url: "https://www.ovs.it" },
      { name: "Rinascente", type: "Department Store", emoji: "🏬", url: "https://www.rinascente.it" },
    ]
  },
  paris: {
    flag: "🇫🇷", description: "Timeless elegance and Parisian chic. The city of haute couture.",
    shops: [
      { name: "Galeries Lafayette", type: "Department Store", emoji: "🏬", url: "https://www.galerieslafayette.com" },
      { name: "Sandro", type: "French Brand", emoji: "🇫🇷", url: "https://www.sandro-paris.com" },
      { name: "A.P.C.", type: "French Brand", emoji: "🇫🇷", url: "https://www.apc.fr" },
      { name: "Zara", type: "High Street", emoji: "🛍️", url: "https://www.zara.com" },
      { name: "Louis Vuitton", type: "Luxury", emoji: "👜", url: "https://www.louisvuitton.com" },
      { name: "Isabel Marant", type: "French Brand", emoji: "🇫🇷", url: "https://www.isabelmarant.com" },
    ]
  },
  london: {
    flag: "🇬🇧", description: "Eclectic, bold, and iconic. From Savile Row to streetwear.",
    shops: [
      { name: "ASOS", type: "Online", emoji: "💻", url: "https://www.asos.com" },
      { name: "Selfridges", type: "Department Store", emoji: "🏬", url: "https://www.selfridges.com" },
      { name: "Burberry", type: "Luxury", emoji: "👜", url: "https://www.burberry.com" },
      { name: "Paul Smith", type: "British Brand", emoji: "🇬🇧", url: "https://www.paulsmith.com" },
      { name: "Reiss", type: "British Brand", emoji: "🇬🇧", url: "https://www.reiss.com" },
      { name: "Cos", type: "Minimalist", emoji: "◻️", url: "https://www.cosstores.com" },
    ]
  },
  "new york": {
    flag: "🇺🇸", description: "Street style meets luxury. The city that never sleeps, never underdresses.",
    shops: [
      { name: "Bloomingdale's", type: "Department Store", emoji: "🏬", url: "https://www.bloomingdales.com" },
      { name: "Ralph Lauren", type: "American Brand", emoji: "🇺🇸", url: "https://www.ralphlauren.com" },
      { name: "Nordstrom", type: "Department Store", emoji: "🏬", url: "https://www.nordstrom.com" },
      { name: "Supreme", type: "Streetwear", emoji: "🔴", url: "https://www.supremenewyork.com" },
      { name: "Theory", type: "American Brand", emoji: "🇺🇸", url: "https://www.theory.com" },
      { name: "Madewell", type: "American Brand", emoji: "🇺🇸", url: "https://www.madewell.com" },
    ]
  },
  barcelona: {
    flag: "🇪🇸", description: "Vibrant, colorful, Mediterranean style. Casual luxury done right.",
    shops: [
      { name: "Zara", type: "Spanish Brand", emoji: "🇪🇸", url: "https://www.zara.com" },
      { name: "Mango", type: "Spanish Brand", emoji: "🇪🇸", url: "https://www.mango.com" },
      { name: "Massimo Dutti", type: "Spanish Brand", emoji: "🇪🇸", url: "https://www.massimodutti.com" },
      { name: "El Corte Inglés", type: "Department Store", emoji: "🏬", url: "https://www.elcorteingles.es" },
      { name: "Pull&Bear", type: "High Street", emoji: "🛍️", url: "https://www.pullandbear.com" },
      { name: "Desigual", type: "Spanish Brand", emoji: "🇪🇸", url: "https://www.desigual.com" },
    ]
  },
  tokyo: {
    flag: "🇯🇵", description: "Where tradition meets avant-garde. The most innovative fashion scene in the world.",
    shops: [
      { name: "Uniqlo", type: "Japanese Brand", emoji: "🇯🇵", url: "https://www.uniqlo.com" },
      { name: "GU", type: "Japanese Brand", emoji: "🇯🇵", url: "https://www.gu-global.com" },
      { name: "Issey Miyake", type: "Japanese Luxury", emoji: "👜", url: "https://www.isseymiyake.com" },
      { name: "Comme des Garçons", type: "Japanese Luxury", emoji: "👜", url: "https://www.comme-des-garcons.com" },
      { name: "Beams", type: "Japanese Brand", emoji: "🇯🇵", url: "https://www.beams.co.jp" },
      { name: "Shibuya 109", type: "Shopping Mall", emoji: "🏬", url: "https://www.shibuya109.jp" },
    ]
  },
  dubai: {
    flag: "🇦🇪", description: "Ultra-luxury meets modern Arabic fashion. Extravagance at every corner.",
    shops: [
      { name: "Dubai Mall", type: "Shopping Mall", emoji: "🏬", url: "https://www.thedubaimall.com" },
      { name: "Zara", type: "High Street", emoji: "🛍️", url: "https://www.zara.com" },
      { name: "Gucci", type: "Luxury", emoji: "👜", url: "https://www.gucci.com" },
      { name: "Namshi", type: "Local Online", emoji: "💻", url: "https://www.namshi.com" },
      { name: "H&M", type: "High Street", emoji: "🛍️", url: "https://www.hm.com" },
      { name: "Cos", type: "Minimalist", emoji: "◻️", url: "https://www.cosstores.com" },
    ]
  },
  amsterdam: {
    flag: "🇳🇱", description: "Minimalist, functional, and effortlessly cool. Dutch design at its finest.",
    shops: [
      { name: "De Bijenkorf", type: "Department Store", emoji: "🏬", url: "https://www.debijenkorf.nl" },
      { name: "Scotch & Soda", type: "Dutch Brand", emoji: "🇳🇱", url: "https://www.scotch-soda.com" },
      { name: "Suitsupply", type: "Dutch Brand", emoji: "🇳🇱", url: "https://www.suitsupply.com" },
      { name: "Cos", type: "Minimalist", emoji: "◻️", url: "https://www.cosstores.com" },
      { name: "Weekday", type: "Streetwear", emoji: "🛍️", url: "https://www.weekday.com" },
      { name: "Zara", type: "High Street", emoji: "🛍️", url: "https://www.zara.com" },
    ]
  },
  berlin: {
    flag: "🇩🇪", description: "Edgy, underground, and avant-garde. The streetwear capital of Europe.",
    shops: [
      { name: "KaDeWe", type: "Department Store", emoji: "🏬", url: "https://www.kadewe.de" },
      { name: "Zalando", type: "Online", emoji: "💻", url: "https://www.zalando.de" },
      { name: "Arket", type: "Scandinavian", emoji: "◻️", url: "https://www.arket.com" },
      { name: "Cos", type: "Minimalist", emoji: "◻️", url: "https://www.cosstores.com" },
      { name: "About You", type: "Online", emoji: "💻", url: "https://www.aboutyou.de" },
      { name: "Voo Store", type: "Concept Store", emoji: "🏪", url: "https://www.vooberlin.com" },
    ]
  },
};

function getCityShops(cityName: string): CityShops {
  const lower = cityName.toLowerCase();
  for (const [key, val] of Object.entries(CITY_SHOPS)) {
    if (lower.includes(key)) return val;
  }
  return {
    flag: "🌍", description: "Explore local fashion and shopping in " + cityName,
    shops: [
      { name: "Zara", type: "High Street", emoji: "🛍️", url: "https://www.zara.com" },
      { name: "H&M", type: "High Street", emoji: "🛍️", url: "https://www.hm.com" },
      { name: "Mango", type: "High Street", emoji: "🛍️", url: "https://www.mango.com" },
      { name: "Uniqlo", type: "Minimalist", emoji: "◻️", url: "https://www.uniqlo.com" },
    ]
  };
}

function ShopInCity({ cityName }: { cityName: string }) {
  const [open, setOpen] = React.useState(false);
  const data = getCityShops(cityName);

  return (
    <div className="rounded-2xl border border-black/8 overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{data.flag}</span>
          <div className="text-left">
            <p className="font-bold text-sm">Shop in {cityName}</p>
            <p className="text-xs text-neutral-400 mt-0.5">Best stores for your wardrobe</p>
          </div>
        </div>
        <span className="text-neutral-400 text-sm" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .2s", display: "inline-block" }}>→</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-black/6">
          <p className="text-xs text-neutral-500 mt-4 mb-4 leading-relaxed">{data.description}</p>
          <div className="flex flex-col gap-2">
            {data.shops.map(shop => (
              <a key={shop.name} href={shop.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-black/8 px-4 py-3 hover:bg-neutral-50 transition active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{shop.emoji}</span>
                  <div>
                    <p className="font-bold text-sm">{shop.name}</p>
                    <p className="text-xs text-neutral-400">{shop.type}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-400">→</span>
              </a>
            ))}
          </div>
          <p className="text-xs text-neutral-300 text-center mt-3">Tap any store to visit their website</p>
        </div>
      )}
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
  const [localStyle, setLocalStyle] = React.useState(false);

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
        // Local style — favor neutrals dhe smart items kur është aktiv
        const localSeed = localStyle ? Date.now() + i * 777 : Date.now() + i * 1000;
        const outfits = generateOutfits(filtered, occasion, localSeed, {
          tempC: fc.tempAvg,
          gender: (typeof window !== "undefined" ? (localStorage.getItem("om_gender") as any) ?? "male" : "male"),
          style: (typeof window !== "undefined" ? localStorage.getItem("om_style") ?? "minimal" : "minimal"),
        });
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
      return { ...d, occasion, outfits: generateOutfits(filtered, occasion, localStyle ? Date.now() + i * 888 : Date.now() + i * 999, {
          tempC: d.forecast.tempAvg,
          gender: (typeof window !== "undefined" ? (localStorage.getItem("om_gender") as any) ?? "male" : "male"),
          style: (typeof window !== "undefined" ? localStorage.getItem("om_style") ?? "minimal" : "minimal"),
        }) };
    }));
  }

  return (
    <main className="min-h-screen" style={{background:"#FAF8F5"}}>
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

        {/* Local Style Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-black/8 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">🗺️</span>
            <div>
              <p className="font-semibold text-sm">Local Style</p>
              <p className="text-xs text-neutral-400 mt-0.5">Dress like locals at your destination</p>
            </div>
          </div>
          <button type="button" onClick={() => setLocalStyle(v => !v)}
            className={`rounded-full w-12 h-6 transition-all relative flex-shrink-0 ${localStyle ? "bg-black" : "bg-neutral-200"}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${localStyle ? "left-7" : "left-1"}`} />
          </button>
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

            <ShopInCity cityName={cityName} />

            {localStyle && city && (
              <div className="rounded-xl bg-neutral-50 border border-black/6 px-4 py-3 flex items-center gap-3">
                <span className="text-lg">🗺️</span>
                <p className="text-xs text-neutral-600">
                  <strong>Local Style ON</strong> — outfits adapted to how people dress in {cityName || city}
                </p>
              </div>
            )}

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