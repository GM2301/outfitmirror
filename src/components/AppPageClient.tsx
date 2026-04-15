"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { Item, Category, ItemType, Gender } from "@/lib/engine/types";
import { generateOutfits } from "@/lib/engine/generate";
import { getBrowserLocation, fetchWeather } from "@/lib/weather";
import type { WeatherContext } from "@/lib/weather";
import OutfitCard from "@/components/OutfitCard";
import MissingPieceCard from "@/components/MissingPieceCard";
import { getMissingPiece } from "@/lib/engine/missingPiece";
import ShareCard from "@/components/ShareCard";
import AIStyleAssistant from "@/components/AIStyleAssistant";
import PhotoUpload, { type AIAnalysis } from "@/components/PhotoUpload";
import LocationModal from "@/components/LocationModal";
import BulkUpload, { type BulkItem } from "@/components/BulkUpload";
import OnboardingFlow from "@/components/OnboardingFlow";

type Occasion = "work" | "date" | "casual" | "night_out" | "travel" | "gym";
type Props = { initialItems?: Item[] };

const MALE_OCCASIONS: Occasion[] = ["work", "date", "casual", "night_out", "travel", "gym"];
const FEMALE_OCCASIONS: Occasion[] = ["work", "date", "casual", "night_out", "travel", "gym"];
const CATEGORIES: Category[] = ["top", "bottom", "shoes"];

const COLOR_FAMILIES = [
  "neutral", "earth", "black", "white", "blue", "bright",
  "green", "red", "pink", "purple", "orange", "yellow",
];

const TYPE_OPTIONS_MALE: Record<string, string[]> = {
  top:    ["tee", "polo", "shirt", "sweater", "hoodie", "jacket", "blazer", "tank", "henley", "crewneck"],
  bottom: ["jeans", "chinos", "trousers", "shorts", "joggers", "sweatpants", "cargo"],
  shoes:  ["sneakers", "running_shoes", "boots", "dress_shoes", "loafers", "sandals", "chelsea_boots"],
};

const TYPE_OPTIONS_FEMALE: Record<string, string[]> = {
  top:    ["blouse", "tee", "crop_top", "shirt", "knit", "blazer", "tank", "cardigan", "bodysuit"],
  bottom: ["jeans", "trousers", "midi_skirt", "mini_skirt", "leggings", "shorts", "wide_leg_pants"],
  shoes:  ["sneakers", "heels", "boots", "ankle_boots", "ballet_flats", "loafers", "mules", "sandals"],
};

const OCCASION_CONFIG: Record<string, { emoji: string; label: string; desc: string }> = {
  work:      { emoji: "💼", label: "Work",      desc: "Professional" },
  date:      { emoji: "🌹", label: "Date",      desc: "Stylish" },
  casual:    { emoji: "☀️", label: "Casual",    desc: "Relaxed" },
  night_out: { emoji: "🌙", label: "Night Out", desc: "Sharp" },
  travel:    { emoji: "✈️", label: "Travel",    desc: "Versatile" },
  gym:       { emoji: "💪", label: "Gym",       desc: "Athletic" },
};

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "_");
}

function weatherLabel(tempC: number, isRaining: boolean): string {
  if (isRaining) return "🌧️ Raining";
  if (tempC <= 5)  return "🥶 Very Cold";
  if (tempC <= 12) return "🧥 Cold";
  if (tempC <= 20) return "🌤️ Mild";
  if (tempC <= 28) return "☀️ Warm";
  return "🔥 Hot";
}

function filterItemsByWeather(items: Item[], weather: WeatherContext): Item[] {
  return items.filter((item) => {
    const type = String(item.type).toLowerCase();
    const tempC = weather.tempC;
    if (tempC > 28 && (type.includes("hoodie") || type.includes("sweater") || type.includes("jacket"))) return false;
    if (tempC < 12 && (type.includes("tank") || type.includes("shorts") || type.includes("sandal"))) return false;
    if (weather.isRaining && type.includes("sandal")) return false;
    return true;
  });
}

const COLOR_DOT: Record<string, string> = {
  black:   "bg-neutral-900",
  white:   "bg-white border border-black/15",
  neutral: "bg-stone-300",
  earth:   "bg-amber-300",
  blue:    "bg-sky-400",
  bright:  "bg-violet-400",
  green:   "bg-emerald-400",
  red:     "bg-red-400",
  pink:    "bg-pink-400",
  purple:  "bg-purple-400",
  orange:  "bg-orange-400",
  yellow:  "bg-yellow-300",
};

// Cost per wear calculation
function getCostPerWear(item: Item): string | null {
  if (!item.price || !item.wear_count || item.wear_count === 0) return null;
  const cpw = item.price / item.wear_count;
  return cpw < 1 ? `$${cpw.toFixed(2)}` : `$${Math.round(cpw)}`;
}

export default function AppPageClient({ initialItems }: Props) {
  const supabase = React.useMemo(() => createClient(), []);

  // Gender + onboarding
  const [gender, setGender] = React.useState<Gender>(() => {
    if (typeof window === "undefined") return "male";
    return (localStorage.getItem("om_gender") as Gender) ?? "male";
  });
  const [showOnboarding, setShowOnboarding] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("om_onboarding_done") !== "1";
  });

  const [items, setItems] = React.useState<Item[]>(initialItems ?? []);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const [occasion, setOccasion] = React.useState<Occasion>("casual");
  const [generated, setGenerated] = React.useState(false);
  const [seed, setSeed] = React.useState<number | null>(null);
  const [view, setView] = React.useState<"outfits" | "wardrobe" | "add">("outfits");

  const [pinnedTopId, setPinnedTopId] = React.useState<string | null>(null);
  const [pinnedBottomId, setPinnedBottomId] = React.useState<string | null>(null);
  const [pinnedShoesId, setPinnedShoesId] = React.useState<string | null>(null);

  const [weather, setWeather] = React.useState<WeatherContext | null>(null);
  const [weatherLoading, setWeatherLoading] = React.useState(false);
  const [weatherError, setWeatherError] = React.useState<string | null>(null);
  const [weatherEnabled, setWeatherEnabled] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("om_weather_enabled") === "1";
  });

  const [category, setCategory] = React.useState<Category>("top");
  const [type, setType] = React.useState<string>("");
  const [colorFamily, setColorFamily] = React.useState<string>("neutral");
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [shareOutfit, setShareOutfit] = React.useState<any>(null);
  const [showLocationModal, setShowLocationModal] = React.useState(false);
  const [showBulkUpload, setShowBulkUpload] = React.useState(false);
  const [bulkSaving, setBulkSaving] = React.useState(false);

  // Outfit history (localStorage)
  const [outfitHistory, setOutfitHistory] = React.useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("om_outfit_history") ?? "[]"); }
    catch { return []; }
  });

  const OCCASIONS = gender === "female" ? FEMALE_OCCASIONS : MALE_OCCASIONS;
  const TYPE_OPTIONS = gender === "female" ? TYPE_OPTIONS_FEMALE : TYPE_OPTIONS_MALE;

  React.useEffect(() => {
    const denied = localStorage.getItem("om_location_denied");
    const wasEnabled = localStorage.getItem("om_weather_enabled") === "1";
    if (wasEnabled) fetchWeatherData();
    else if (!denied) setShowLocationModal(true);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("om_weather_enabled", weatherEnabled ? "1" : "0");
  }, [weatherEnabled]);

  const fetchWeatherData = React.useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const { lat, lon } = await getBrowserLocation();
      const ctx = await fetchWeather(lat, lon);
      setWeather(ctx);
      setWeatherEnabled(true);
    } catch (e: any) {
      setWeatherError(e?.message ?? "Location denied");
      setWeatherEnabled(false);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  function handleLocationAllow() {
    setShowLocationModal(false);
    localStorage.removeItem("om_location_denied");
    fetchWeatherData();
  }

  function handleLocationDeny() {
    setShowLocationModal(false);
    localStorage.setItem("om_location_denied", "1");
  }

  function handleWeatherToggle() {
    const newVal = !weatherEnabled;
    setWeatherEnabled(newVal);
    setGenerated(false);
    setSeed(null);
    if (newVal && !weather) fetchWeatherData();
  }

  function handleOnboardingComplete(g: Gender) {
    setGender(g);
    setShowOnboarding(false);
  }

  const filteredItems = React.useMemo(() => {
    if (!weatherEnabled || !weather) return items;
    return filterItemsByWeather(items, weather);
  }, [items, weather, weatherEnabled]);

  const counts = React.useMemo(() => ({
    tops:    filteredItems.filter(x => x.category === "top").length,
    bottoms: filteredItems.filter(x => x.category === "bottom").length,
    shoes:   filteredItems.filter(x => x.category === "shoes").length,
  }), [filteredItems]);

  const canGenerate = counts.tops > 0 && counts.bottoms > 0 && counts.shoes > 0;

  const pinnedTop    = React.useMemo(() => pinnedTopId    ? items.find(x => x.id === pinnedTopId)    : null, [items, pinnedTopId]);
  const pinnedBottom = React.useMemo(() => pinnedBottomId ? items.find(x => x.id === pinnedBottomId) : null, [items, pinnedBottomId]);
  const pinnedShoes  = React.useMemo(() => pinnedShoesId  ? items.find(x => x.id === pinnedShoesId)  : null, [items, pinnedShoesId]);

  const outfits = React.useMemo(() => {
    if (!generated || seed === null || !canGenerate) return null;
    return generateOutfits(filteredItems, occasion as any, seed, { pinnedTopId, pinnedBottomId, pinnedShoesId, gender });
  }, [filteredItems, occasion, generated, seed, canGenerate, pinnedTopId, pinnedBottomId, pinnedShoesId, gender]);

  const missingPiece = React.useMemo(() => getMissingPiece(items), [items]);

  function handleRegenerate() {
    if (!canGenerate) { setStatus("Add at least 1 top, 1 bottom, and 1 shoes first."); return; }
    const newSeed = Date.now();
    setSeed(newSeed);
    setGenerated(true);
    setStatus(null);
  }

  // Save outfit to history
  function saveToHistory(outfit: any) {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      occasion,
      label: outfit.label,
      score: outfit.score,
      top: outfit.picks?.top?.type,
      bottom: outfit.picks?.bottom?.type,
      shoes: outfit.picks?.shoes?.type,
    };
    const updated = [entry, ...outfitHistory].slice(0, 30); // max 30
    setOutfitHistory(updated);
    localStorage.setItem("om_outfit_history", JSON.stringify(updated));
  }

  const refresh = React.useCallback(async () => {
    setLoading(true);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) { setLoading(false); return; }
    const { data } = await supabase
      .from("items").select("id, category, type, color_family, image_url")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setItems(data.map((r: any) => ({
      id: r.id, category: r.category as Category, type: r.type as ItemType,
      color_family: (r.color_family ?? "neutral") as any, image_url: r.image_url ?? null,
    })));
    setLoading(false);
  }, [supabase]);

  const uploadPhotoIfAny = React.useCallback(async (userId: string): Promise<string | null> => {
    if (!photoFile) return null;
    const safeName = norm(photoFile.name).replace(/[^a-z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from("wardrobe").upload(path, photoFile, { upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("wardrobe").getPublicUrl(path);
    return data?.publicUrl ?? null;
  }, [supabase, photoFile]);

  const onSaveItem = React.useCallback(async () => {
    setStatus(null);
    if (!type) { setStatus("Please select a type."); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); setStatus("Not logged in."); return; }
    let uploadedUrl: string | null = null;
    try { uploadedUrl = await uploadPhotoIfAny(user.id); }
    catch (e: any) { setLoading(false); setStatus(e.message ?? "Upload failed."); return; }
    const { data, error } = await supabase.from("items").insert({
      user_id: user.id, category, type: norm(type),
      color_family: norm(colorFamily || "neutral"), image_url: uploadedUrl,
    }).select("id").single();
    if (error) { setLoading(false); setStatus(error.message); return; }
    setItems(prev => [{ id: data.id, category, type: norm(type) as ItemType, color_family: norm(colorFamily || "neutral") as any, image_url: uploadedUrl }, ...prev]);
    setType(""); setColorFamily("neutral"); setPhotoFile(null);
    setGenerated(false); setSeed(null);
    setLoading(false); setStatus("Saved ✅");
    setView("wardrobe");
  }, [supabase, category, type, colorFamily, uploadPhotoIfAny]);

  const onDeleteItem = React.useCallback(async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) { setLoading(false); return; }
    setItems(prev => prev.filter(x => x.id !== id));
    setPinnedTopId(v => v === id ? null : v);
    setPinnedBottomId(v => v === id ? null : v);
    setPinnedShoesId(v => v === id ? null : v);
    setGenerated(false); setSeed(null); setLoading(false);
  }, [supabase]);

  const onVote = React.useCallback(async (outfit: any, vote: "up" | "down") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (vote === "up") saveToHistory(outfit);
    await supabase.from("feedback").insert({
      user_id: user.id, occasion, outfit_hash: outfit?.outfit_hash ?? null, vote,
      top_id: outfit?.picks?.top?.id ?? null,
      bottom_id: outfit?.picks?.bottom?.id ?? null,
      shoes_id: outfit?.picks?.shoes?.id ?? null,
    });
    setStatus(vote === "up" ? "Saved to history 👍" : "Noted 👎");
  }, [supabase, occasion]);

  const handleBulkComplete = React.useCallback(async (bulkItems: BulkItem[]) => {
    setShowBulkUpload(false);
    if (bulkItems.length === 0) return;
    setBulkSaving(true);
    setStatus(`Saving ${bulkItems.length} items...`);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBulkSaving(false); return; }
    const saved: any[] = [];
    for (const bulkItem of bulkItems) {
      if (!bulkItem.analysis) continue;
      try {
        const safeName = bulkItem.file.name.replace(/[^a-z0-9._-]/gi, "_").toLowerCase();
        const path = `${user.id}/${Date.now()}_${safeName}`;
        await supabase.storage.from("wardrobe").upload(path, bulkItem.file, { upsert: true });
        const { data: urlData } = supabase.storage.from("wardrobe").getPublicUrl(path);
        const { data } = await supabase.from("items").insert({
          user_id: user.id,
          category: bulkItem.analysis.category,
          type: norm(bulkItem.analysis.type),
          color_family: norm(bulkItem.analysis.color_family),
          image_url: urlData?.publicUrl ?? null,
        }).select("id").single();
        if (data) saved.push({ id: data.id, category: bulkItem.analysis.category, type: norm(bulkItem.analysis.type) as ItemType, color_family: norm(bulkItem.analysis.color_family) as any, image_url: urlData?.publicUrl ?? null });
      } catch { }
    }
    setItems(prev => [...saved, ...prev]);
    setBulkSaving(false);
    setStatus(`✅ Added ${saved.length} items!`);
  }, [supabase]);

  return (
    <div className="min-h-screen bg-white">

      {/* ONBOARDING */}
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}

      <div className="mx-auto w-full max-w-2xl px-4 pb-24">

        {/* WEATHER STRIP */}
        <div className="pt-3 pb-1">
          {weather ? (
            <div className="flex items-center justify-between rounded-2xl bg-neutral-50 border border-black/6 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{weatherLabel(weather.tempC, weather.isRaining).split(" ")[0]}</span>
                <span className="text-xs font-semibold text-neutral-600">
                  {Math.round(weather.tempC)}°C · {weatherLabel(weather.tempC, weather.isRaining).split(" ").slice(1).join(" ")}
                </span>
                {weatherEnabled && <span className="text-xs text-neutral-400">· filter on</span>}
              </div>
              <button type="button" onClick={handleWeatherToggle}
                className={"rounded-full px-3 py-1 text-xs font-bold transition-all " +
                  (weatherEnabled ? "bg-black text-white" : "bg-neutral-200 text-neutral-500")}>
                {weatherEnabled ? "On" : "Off"}
              </button>
            </div>
          ) : weatherLoading ? (
            <div className="flex items-center gap-2 px-1 py-2">
              <div className="w-3 h-3 border border-black/20 border-t-black rounded-full animate-spin" />
              <span className="text-xs text-neutral-400">Getting weather...</span>
            </div>
          ) : weatherError ? (
            <div className="flex items-center justify-between px-1 py-2">
              <span className="text-xs text-neutral-400">Weather off</span>
              <button type="button" onClick={() => setShowLocationModal(true)}
                className="text-xs font-bold text-black underline">Enable</button>
            </div>
          ) : null}
        </div>

        {/* ── OUTFITS VIEW ── */}
        {view === "outfits" && (
          <div className="mt-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="font-display text-2xl font-black">Your Closet</h1>
                <p className="text-xs text-neutral-400 mt-0.5">{items.length} items · {gender === "female" ? "Womenswear" : "Menswear"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowBulkUpload(true)}
                  className="text-xs font-bold border border-black/15 rounded-full px-3 py-1.5 hover:bg-neutral-50 transition">
                  📷 Bulk
                </button>
                <button type="button" onClick={() => setShowOnboarding(true)}
                  className="text-xs text-neutral-400 hover:text-black transition">
                  {gender === "female" ? "👗" : "👔"}
                </button>
              </div>
            </div>

            {/* Occasion Cards */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {OCCASIONS.map((o) => {
                const cfg = OCCASION_CONFIG[o];
                const active = o === occasion;
                return (
                  <button key={o} type="button"
                    onClick={() => { setOccasion(o); setGenerated(false); setSeed(null); }}
                    className={"rounded-2xl border-2 p-3 text-left transition-all btn-press " +
                      (active ? "border-black bg-black text-white" : "border-black/8 bg-white hover:border-black/20")}>
                    <span className="text-xl block mb-1">{cfg.emoji}</span>
                    <p className={"text-xs font-bold " + (active ? "text-white" : "text-black")}>{cfg.label}</p>
                    <p className={"text-xs mt-0.5 " + (active ? "text-white/55" : "text-neutral-400")}>{cfg.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Generate */}
            <button type="button" onClick={handleRegenerate} disabled={loading || !canGenerate}
              className="w-full rounded-2xl bg-black text-white py-4 text-sm font-bold disabled:opacity-30 hover:bg-black/85 transition-all btn-press">
              {!canGenerate ? "Add top, bottom & shoes to start" : "✨ Generate Outfits"}
            </button>

            {/* Pins */}
            {(pinnedTopId || pinnedBottomId || pinnedShoesId) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-neutral-400">Locked:</span>
                {(["top", "bottom", "shoes"] as const).map((cat) => {
                  const pinned = cat === "top" ? pinnedTop : cat === "bottom" ? pinnedBottom : pinnedShoes;
                  if (!pinned) return null;
                  return (
                    <span key={cat} className="rounded-full bg-black text-white px-3 py-1 flex items-center gap-1 text-xs">
                      🔒 {String(pinned.type).replace(/_/g, " ")}
                      <button type="button" className="ml-1 opacity-60 hover:opacity-100"
                        onClick={() => {
                          if (cat === "top") setPinnedTopId(null);
                          if (cat === "bottom") setPinnedBottomId(null);
                          if (cat === "shoes") setPinnedShoesId(null);
                        }}>×</button>
                    </span>
                  );
                })}
                <button type="button" className="text-xs text-neutral-400 underline"
                  onClick={() => { setPinnedTopId(null); setPinnedBottomId(null); setPinnedShoesId(null); }}>
                  Clear
                </button>
              </div>
            )}

            {/* Status */}
            {status && (
              <div className={`mt-3 rounded-xl px-4 py-3 text-sm transition-all ${
                status.includes("✅") || status.includes("👍") || status.includes("history")
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-neutral-50 border border-black/6 text-neutral-600"
              }`}>{status}</div>
            )}

            {/* Outfits */}
            {generated && outfits && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {outfits.map((o: any) => (
                  <div key={o.label} className="flex flex-col gap-2">
                    <OutfitCard outfit={o} />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => onVote(o, "up")}
                        className="flex-1 rounded-xl border border-black/10 px-3 py-2.5 text-sm hover:bg-neutral-50 transition">
                        👍 Save
                      </button>
                      <button type="button" onClick={() => onVote(o, "down")}
                        className="flex-1 rounded-xl border border-black/10 px-3 py-2.5 text-sm hover:bg-neutral-50 transition">
                        👎 Skip
                      </button>
                      <button type="button" onClick={() => setShareOutfit(o)}
                        className="flex-1 rounded-xl bg-black text-white px-3 py-2.5 text-sm hover:bg-black/85 transition">
                        📤
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!canGenerate && items.length === 0 && (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-black/8 p-8 text-center">
                <p className="text-2xl mb-3">👗</p>
                <p className="font-bold text-sm mb-1">Your wardrobe is empty</p>
                <p className="text-xs text-neutral-400 mb-5">Add at least 1 top, 1 bottom, and 1 shoes</p>
                <div className="flex gap-2 justify-center">
                  <button type="button" onClick={() => setView("add")}
                    className="rounded-full bg-black text-white px-4 py-2.5 text-xs font-bold btn-press">
                    Add Item
                  </button>
                  <button type="button" onClick={() => setShowBulkUpload(true)}
                    className="rounded-full border border-black/15 px-4 py-2.5 text-xs font-semibold hover:bg-neutral-50 transition">
                    📷 Bulk Upload
                  </button>
                </div>
              </div>
            )}

            {/* Missing Piece */}
            {missingPiece && items.length >= 3 && (
              <div className="mt-4"><MissingPieceCard piece={missingPiece} /></div>
            )}

            {/* Outfit History */}
            {outfitHistory.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display font-black text-sm mb-3 flex items-center justify-between">
                  Outfit History
                  <button type="button" onClick={() => { setOutfitHistory([]); localStorage.removeItem("om_outfit_history"); }}
                    className="text-xs text-neutral-400 font-normal hover:text-red-500 transition">Clear</button>
                </h3>
                <div className="space-y-2">
                  {outfitHistory.slice(0, 5).map((h: any) => (
                    <div key={h.id} className="flex items-center gap-3 rounded-xl border border-black/8 px-3 py-2.5">
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
              </div>
            )}
          </div>
        )}

        {/* ── WARDROBE VIEW ── */}
        {view === "wardrobe" && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-black text-xl">Wardrobe</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {counts.tops}T · {counts.bottoms}B · {counts.shoes}S
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowBulkUpload(true)}
                  className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-bold hover:bg-neutral-50 transition">
                  📷 Bulk
                </button>
                <button type="button" onClick={() => setView("add")}
                  className="rounded-full bg-black text-white px-3 py-1.5 text-xs font-bold hover:bg-black/85 transition">
                  + Add
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-black/8 p-10 text-center">
                <p className="text-3xl mb-3">👗</p>
                <p className="font-bold text-sm mb-1">No items yet</p>
                <p className="text-xs text-neutral-400">Start by adding your clothes</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {items.map((it: any) => {
                  const isPinnedTop    = pinnedTopId    === it.id;
                  const isPinnedBottom = pinnedBottomId === it.id;
                  const isPinnedShoes  = pinnedShoesId  === it.id;
                  const isPinned       = isPinnedTop || isPinnedBottom || isPinnedShoes;
                  const isFilteredOut  = weatherEnabled && weather && !filteredItems.find(f => f.id === it.id);
                  const colorDot       = COLOR_DOT[it.color_family] ?? "bg-neutral-300";
                  const emoji          = it.category === "top" ? "👕" : it.category === "bottom" ? "👖" : "👟";
                  const cpw            = getCostPerWear(it);

                  return (
                    <div key={it.id}
                      className={`relative rounded-2xl border-2 overflow-hidden transition ${
                        isPinned ? "border-black" : "border-black/8 hover:border-black/18"
                      } ${isFilteredOut ? "opacity-40" : ""}`}>
                      {it.image_url ? (
                        <div className="aspect-square bg-neutral-50">
                          <img src={it.image_url} alt={String(it.type)} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-square bg-neutral-50 flex items-center justify-center text-4xl">
                          {emoji}
                        </div>
                      )}
                      {/* Weather filtered badge */}
                      {isFilteredOut && (
                        <div className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium">
                          🌡️ Filtered
                        </div>
                      )}
                      {/* Pin badge */}
                      {isPinned && (
                        <div className="absolute top-2 right-2 rounded-full bg-black text-white px-2 py-0.5 text-xs">
                          🔒
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorDot}`} />
                          <p className="font-bold text-xs capitalize truncate flex-1">
                            {String(it.type).replace(/_/g, " ")}
                          </p>
                        </div>
                        <p className="text-xs text-neutral-400 capitalize">{it.category}</p>
                        {/* Cost per wear */}
                        {cpw && (
                          <p className="text-xs text-neutral-400 mt-0.5">{cpw}/wear</p>
                        )}
                        <div className="flex gap-1.5 mt-2.5">
                          <button type="button"
                            className={"flex-1 rounded-lg py-1.5 text-xs font-bold transition border btn-press " +
                              (isPinned ? "bg-black text-white border-black" : "border-black/10 hover:bg-neutral-50")}
                            onClick={() => {
                              if (it.category === "top")    setPinnedTopId(isPinnedTop    ? null : it.id);
                              if (it.category === "bottom") setPinnedBottomId(isPinnedBottom ? null : it.id);
                              if (it.category === "shoes")  setPinnedShoesId(isPinnedShoes  ? null : it.id);
                            }}>
                            {isPinned ? "Pinned" : "Pin"}
                          </button>
                          <button type="button" onClick={() => onDeleteItem(it.id)}
                            className="rounded-lg px-2 py-1.5 text-xs text-neutral-400 hover:text-red-500 hover:bg-red-50 transition border border-black/8">
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ADD ITEM VIEW ── */}
        {view === "add" && (
          <div className="mt-4">
            <h2 className="font-display font-black text-xl mb-1">Add Item</h2>
            <p className="text-xs text-neutral-400 mb-6">Add a piece from your wardrobe</p>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c} type="button"
                      className={"rounded-xl border-2 py-4 text-sm font-bold transition btn-press " +
                        (category === c ? "bg-black text-white border-black" : "border-black/10 hover:border-black/20")}
                      onClick={() => { setCategory(c); setType(""); }}>
                      {c === "top" ? "👕 Top" : c === "bottom" ? "👖 Bottom" : "👟 Shoes"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">Type</label>
                <select className="w-full rounded-xl border-2 border-black/10 px-4 py-3.5 bg-white text-sm focus:outline-none focus:border-black/25 transition"
                  value={type} onChange={e => setType(e.target.value)}>
                  <option value="">— select type —</option>
                  {(TYPE_OPTIONS[category] ?? []).map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_FAMILIES.map(c => (
                    <button key={c} type="button"
                      className={"rounded-full border-2 px-3 py-1.5 text-xs font-medium transition capitalize btn-press " +
                        (colorFamily === c ? "bg-black text-white border-black" : "border-black/10 hover:border-black/20")}
                      onClick={() => setColorFamily(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">Photo (optional)</label>
                <PhotoUpload file={photoFile} onChange={setPhotoFile}
                  onAnalysis={(r: AIAnalysis) => { setCategory(r.category); setType(r.type); setColorFamily(r.color_family); }} />
              </div>

              {status && (
                <div className={`rounded-xl px-4 py-3 text-sm ${
                  status.includes("✅") ? "bg-green-50 text-green-700 border border-green-100" : "bg-neutral-50 border border-black/8 text-neutral-600"
                }`}>{status}</div>
              )}

              <button type="button" onClick={onSaveItem} disabled={loading || !type}
                className="rounded-xl bg-black text-white py-4 text-sm font-bold disabled:opacity-40 hover:bg-black/85 transition btn-press">
                {loading ? "Saving..." : "Add to Wardrobe"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-black/8 px-4 py-3 z-30">
        <div className="mx-auto max-w-2xl grid grid-cols-3 gap-1">
          {[
            { id: "outfits",  label: "Outfits",  icon: "✨" },
            { id: "wardrobe", label: "Wardrobe", icon: "👗" },
            { id: "add",      label: "Add",      icon: "+" },
          ].map(tab => (
            <button key={tab.id} type="button" onClick={() => setView(tab.id as any)}
              className={"rounded-xl py-2.5 flex flex-col items-center gap-0.5 transition btn-press " +
                (view === tab.id ? "bg-black text-white" : "text-neutral-400 hover:bg-neutral-50")}>
              <span className="text-base">{tab.icon}</span>
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {shareOutfit    && <ShareCard outfit={shareOutfit} onClose={() => setShareOutfit(null)} />}
      {showBulkUpload && <BulkUpload onComplete={handleBulkComplete} onClose={() => setShowBulkUpload(false)} />}
      {showLocationModal && <LocationModal onAllow={handleLocationAllow} onDeny={handleLocationDeny} />}
      <AIStyleAssistant items={items} />
    </div>
  );
}