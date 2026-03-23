"use client";

import * as React from "react";

import { createClient } from "@/lib/supabase/client";
import type { Item, Category, ItemType } from "@/lib/engine/types";
import { generateOutfits } from "@/lib/engine/generate";
import { getBrowserLocation, fetchWeather } from "@/lib/weather";
import type { WeatherContext } from "@/lib/weather";

import AppShell from "@/components/AppShell";
import OutfitCard from "@/components/OutfitCard";
import MissingPieceCard from "@/components/MissingPieceCard";
import { getMissingPiece } from "@/lib/engine/missingPiece";
import OnboardingBanner from "@/components/OnboardingBanner";
import ShareCard from "@/components/ShareCard";
import AIStyleAssistant from "@/components/AIStyleAssistant";
import PhotoUpload from "@/components/PhotoUpload";

type Occasion = "work" | "date" | "casual" | "night_out" | "travel" | "gym";

type Props = {
  initialItems?: Item[];
};

const OCCASIONS: Occasion[] = ["work", "date", "casual", "night_out", "travel", "gym"];
const CATEGORIES: Category[] = ["top", "bottom", "shoes"];

const COLOR_FAMILIES = [
  "neutral", "earth", "black", "white", "blue", "bright",
  "green", "red", "pink", "purple", "orange", "yellow",
];

const TYPE_OPTIONS: Record<Category, string[]> = {
  top: ["tee", "polo", "shirt", "sweater", "hoodie", "jacket", "blazer", "tank", "henley", "crewneck"],
  bottom: ["jeans", "chinos", "trousers", "shorts", "joggers", "sweatpants", "cargo"],
  shoes: ["sneakers", "running_shoes", "boots", "dress_shoes", "loafers", "sandals", "chelsea_boots"],
};

const OCCASION_EMOJI: Record<Occasion, string> = {
  work: "💼", date: "🌹", casual: "☀️", night_out: "🌙", travel: "✈️", gym: "💪",
};

function occasionLabel(o: Occasion) {
  if (o === "work") return "Work";
  if (o === "date") return "Date";
  if (o === "casual") return "Casual";
  if (o === "night_out") return "Night Out";
  if (o === "travel") return "Travel";
  return "Gym";
}

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "_");
}

function weatherLabel(tempC: number, isRaining: boolean): string {
  if (isRaining) return "🌧️ Raining";
  if (tempC <= 5) return "🥶 Very Cold";
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
    if (tempC < 12 && (type.includes("tank") || type.includes("shorts") || type.includes("sandals"))) return false;
    if (weather.isRaining && type.includes("sandals")) return false;
    return true;
  });
}

export default function AppPageClient({ initialItems }: Props) {
  const supabase = React.useMemo(() => createClient(), []);

  const [items, setItems] = React.useState<Item[]>(initialItems ?? []);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const [occasion, setOccasion] = React.useState<Occasion>("casual");
  const [generated, setGenerated] = React.useState(false);
  const [seed, setSeed] = React.useState<number | null>(null);

  const [pinnedTopId, setPinnedTopId] = React.useState<string | null>(null);
  const [pinnedBottomId, setPinnedBottomId] = React.useState<string | null>(null);
  const [pinnedShoesId, setPinnedShoesId] = React.useState<string | null>(null);

  const [weather, setWeather] = React.useState<WeatherContext | null>(null);
  const [weatherLoading, setWeatherLoading] = React.useState(false);
  const [weatherError, setWeatherError] = React.useState<string | null>(null);
  const [weatherEnabled, setWeatherEnabled] = React.useState(false);

  const [category, setCategory] = React.useState<Category>("top");
  const [type, setType] = React.useState<string>("");
  const [colorFamily, setColorFamily] = React.useState<string>("neutral");
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [shareOutfit, setShareOutfit] = React.useState<any>(null);

  const fetchWeatherData = React.useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const { lat, lon } = await getBrowserLocation();
      const ctx = await fetchWeather(lat, lon);
      setWeather(ctx);
      setWeatherEnabled(true);
    } catch (e: any) {
      setWeatherError(e?.message ?? "Could not get weather.");
      setWeatherEnabled(false);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const filteredItems = React.useMemo(() => {
    if (!weatherEnabled || !weather) return items;
    return filterItemsByWeather(items, weather);
  }, [items, weather, weatherEnabled]);

  const counts = React.useMemo(() => ({
    tops: filteredItems.filter((x) => x.category === "top").length,
    bottoms: filteredItems.filter((x) => x.category === "bottom").length,
    shoes: filteredItems.filter((x) => x.category === "shoes").length,
  }), [filteredItems]);

  const canGenerate = counts.tops > 0 && counts.bottoms > 0 && counts.shoes > 0;

  const pinnedTop = React.useMemo(() => pinnedTopId ? items.find((x) => x.id === pinnedTopId) : null, [items, pinnedTopId]);
  const pinnedBottom = React.useMemo(() => pinnedBottomId ? items.find((x) => x.id === pinnedBottomId) : null, [items, pinnedBottomId]);
  const pinnedShoes = React.useMemo(() => pinnedShoesId ? items.find((x) => x.id === pinnedShoesId) : null, [items, pinnedShoesId]);

  const outfits = React.useMemo(() => {
    if (!generated || seed === null || !canGenerate) return null;
    return generateOutfits(filteredItems, occasion, seed, { pinnedTopId, pinnedBottomId, pinnedShoesId });
  }, [filteredItems, occasion, generated, seed, canGenerate, pinnedTopId, pinnedBottomId, pinnedShoesId]);

  const missingPiece = React.useMemo(() => getMissingPiece(items), [items]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setStatus(null);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) { setLoading(false); setStatus("Not logged in."); return; }
    const { data, error } = await supabase
      .from("items")
      .select("id, category, type, color_family, image_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) { setLoading(false); setStatus(error.message); return; }
    setItems((data ?? []).map((r: any) => ({
      id: r.id, category: r.category as Category, type: r.type as ItemType,
      color_family: (r.color_family ?? "neutral") as any, image_url: r.image_url ?? null,
    })));
    setLoading(false);
  }, [supabase]);

  const uploadPhotoIfAny = React.useCallback(async (userId: string): Promise<string | null> => {
    if (!photoFile) return null;
    if (!photoFile.type.startsWith("image/")) throw new Error("File must be an image.");
    const safeName = norm(photoFile.name).replace(/[^a-z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}_${safeName}`;
    const { error: upErr } = await supabase.storage.from("wardrobe").upload(path, photoFile, { upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data } = supabase.storage.from("wardrobe").getPublicUrl(path);
    return data?.publicUrl ?? null;
  }, [supabase, photoFile]);

  const onSaveItem = React.useCallback(async () => {
    setStatus(null);
    if (!type) { setStatus("Please select a type."); return; }
    setLoading(true);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) { setLoading(false); setStatus("Not logged in."); return; }
    let uploadedUrl: string | null = null;
    try { uploadedUrl = await uploadPhotoIfAny(user.id); }
    catch (e: any) { setLoading(false); setStatus(e?.message ?? "Upload failed."); return; }
    const { data, error } = await supabase.from("items").insert({
      user_id: user.id, category, type: norm(type),
      color_family: norm(colorFamily || "neutral"), image_url: uploadedUrl,
    }).select("id").single();
    if (error) { setLoading(false); setStatus(error.message); return; }
    setItems((prev) => [{ id: data.id, category, type: norm(type) as ItemType, color_family: norm(colorFamily || "neutral") as any, image_url: uploadedUrl }, ...prev]);
    setType(""); setColorFamily("neutral"); setPhotoFile(null);
    setGenerated(false); setSeed(null);
    setLoading(false); setStatus("Saved ✅");
  }, [supabase, category, type, colorFamily, uploadPhotoIfAny]);

  const onDeleteItem = React.useCallback(async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) { setLoading(false); setStatus(error.message); return; }
    setItems((prev) => prev.filter((x) => x.id !== id));
    setPinnedTopId((v) => v === id ? null : v);
    setPinnedBottomId((v) => v === id ? null : v);
    setPinnedShoesId((v) => v === id ? null : v);
    setGenerated(false); setSeed(null); setLoading(false);
  }, [supabase]);

  const onVote = React.useCallback(async (outfit: any, vote: "up" | "down") => {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) { setStatus("Not logged in."); return; }
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id, occasion, outfit_hash: outfit?.outfit_hash ?? null, vote,
      top_id: outfit?.picks?.top?.id ?? null,
      bottom_id: outfit?.picks?.bottom?.id ?? null,
      shoes_id: outfit?.picks?.shoes?.id ?? null,
    });
    if (error) { setStatus(error.message); return; }
    setStatus(vote === "up" ? "Liked 👍" : "Noted 👎");
  }, [supabase, occasion]);

  function handleRegenerate() {
    if (!canGenerate) { setStatus("Add at least 1 top, 1 bottom, and 1 shoes first."); return; }
    setSeed(Date.now()); setGenerated(true); setStatus(null);
  }

  return (
    <AppShell title="OutfitMirror">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Closet</h1>
              <p className="mt-1 text-sm text-neutral-500">Pick an occasion → generate outfits from your wardrobe.</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {OCCASIONS.map((o) => (
                  <button key={o} type="button"
                    className={"rounded-full border px-4 py-2 text-sm font-medium transition " +
                      (o === occasion ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-50 border-black/15")}
                    onClick={() => { setOccasion(o); setGenerated(false); setSeed(null); }}>
                    {OCCASION_EMOJI[o]} {occasionLabel(o)}
                  </button>
                ))}
              </div>

              {(pinnedTopId || pinnedBottomId || pinnedShoesId) && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-neutral-400">Locked:</span>
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
                  <button type="button" className="text-neutral-400 hover:text-black text-xs underline"
                    onClick={() => { setPinnedTopId(null); setPinnedBottomId(null); setPinnedShoesId(null); }}>
                    Clear all
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="rounded-full border border-black/10 px-4 py-2 text-sm text-neutral-500">
                {items.length} items
              </div>
              <button type="button"
                className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-black/85 transition"
                onClick={handleRegenerate} disabled={loading || !canGenerate}>
                ✨ Generate
              </button>
              <button type="button"
                className="rounded-full border border-black/15 px-4 py-2.5 text-sm disabled:opacity-40 hover:bg-neutral-50 transition"
                onClick={refresh} disabled={loading}>
                ↺ Refresh
              </button>
            </div>
          </div>

          {/* ONBOARDING */}
          <OnboardingBanner
            hasTops={counts.tops > 0}
            hasBottoms={counts.bottoms > 0}
            hasShoes={counts.shoes > 0}
          />

          {/* WEATHER */}
          <div className="rounded-2xl border border-black/8 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {weather ? (
                <>
                  <span className="text-2xl">{weatherLabel(weather.tempC, weather.isRaining).split(" ")[0]}</span>
                  <div>
                    <div className="font-medium text-sm">
                      {Math.round(weather.tempC)}°C · {weatherLabel(weather.tempC, weather.isRaining).split(" ").slice(1).join(" ")}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {weatherEnabled ? "Filtering unsuitable clothes" : "Weather filter off"}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-neutral-400">
                  {weatherLoading ? "Getting location..." : weatherError ? `⚠️ ${weatherError}` : "Enable weather-aware outfits"}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {weather && (
                <button type="button"
                  className={"rounded-full border px-4 py-2 text-sm font-medium transition " +
                    (weatherEnabled ? "bg-black text-white border-black" : "border-black/15 hover:bg-neutral-50")}
                  onClick={() => { setWeatherEnabled((v) => !v); setGenerated(false); setSeed(null); }}>
                  {weatherEnabled ? "✓ On" : "Off"}
                </button>
              )}
              <button type="button"
                className="rounded-full border border-black/15 px-4 py-2 text-sm hover:bg-neutral-50 transition disabled:opacity-40"
                onClick={fetchWeatherData} disabled={weatherLoading}>
                {weatherLoading ? "Loading..." : weather ? "Refresh" : "Get Weather"}
              </button>
            </div>
          </div>

          {/* STATUS */}
          {status && (
            <div className={`rounded-xl px-4 py-3 text-sm ${status.includes("✅") || status.includes("👍") ? "bg-green-50 text-green-700 border border-green-200" : "border"}`}>
              {status}
            </div>
          )}

          {/* OUTFITS */}
          <div className="grid gap-4 lg:grid-cols-3">
            {generated && outfits ? (
              outfits.map((o: any) => (
                <div key={o.label} className="flex flex-col gap-2">
                  <OutfitCard outfit={o} />
                  <div className="flex gap-2">
                    <button type="button"
                      className="flex-1 rounded-xl border border-black/10 px-3 py-2.5 text-sm hover:bg-neutral-50 transition"
                      onClick={() => onVote(o, "up")}>👍 Like</button>
                    <button type="button"
                      className="flex-1 rounded-xl border border-black/10 px-3 py-2.5 text-sm hover:bg-neutral-50 transition"
                      onClick={() => onVote(o, "down")}>👎 Skip</button>
                    <button type="button"
                      className="flex-1 rounded-xl bg-black text-white px-3 py-2.5 text-sm hover:bg-black/85 transition"
                      onClick={() => setShareOutfit(o)}>📤 Share</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center lg:col-span-3">
                <p className="text-neutral-400 text-sm">
                  {canGenerate
                    ? "Select an occasion above and click ✨ Generate"
                    : "Add at least 1 top, 1 bottom, and 1 shoes to start."}
                </p>
              </div>
            )}
          </div>

          {/* MISSING PIECE */}
          {missingPiece && items.length >= 3 && (
            <MissingPieceCard piece={missingPiece} />
          )}

          {/* ADD + LIST */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Add Item */}
            <div className="rounded-2xl border border-black/8 p-6">
              <h2 className="text-lg font-semibold">Add Item</h2>
              <p className="text-sm text-neutral-400 mt-0.5">Add clothes from your wardrobe</p>

              <div className="mt-5 grid gap-5">

                {/* Category - 3 butona */}
                <div>
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Category</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {CATEGORIES.map((c) => (
                      <button key={c} type="button"
                        className={"rounded-xl border py-3 text-sm font-medium transition " +
                          (category === c ? "bg-black text-white border-black" : "border-black/10 hover:bg-neutral-50")}
                        onClick={() => { setCategory(c); setType(""); }}>
                        {c === "top" ? "👕 Top" : c === "bottom" ? "👖 Bottom" : "👟 Shoes"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type - dropdown */}
                <div>
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Type</label>
                  <select className="mt-2 w-full rounded-xl border border-black/10 px-3 py-3.5 bg-white text-sm"
                    value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="">— select type —</option>
                    {TYPE_OPTIONS[category].map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>

                {/* Color - pills */}
                <div>
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Color</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {COLOR_FAMILIES.map((c) => (
                      <button key={c} type="button"
                        className={"rounded-full border px-3 py-1.5 text-xs font-medium transition capitalize " +
                          (colorFamily === c ? "bg-black text-white border-black" : "border-black/10 hover:bg-neutral-50")}
                        onClick={() => setColorFamily(c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo - mobile friendly */}
                <div>
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Photo (optional)</label>
                  <div className="mt-2">
                    <PhotoUpload file={photoFile} onChange={setPhotoFile} />
                  </div>
                </div>

                <button type="button"
                  className="rounded-xl bg-black px-4 py-4 text-sm font-semibold text-white disabled:opacity-40 hover:bg-black/85 transition"
                  onClick={onSaveItem} disabled={loading || !type}>
                  {loading ? "Saving..." : "Add to Wardrobe"}
                </button>
              </div>
            </div>

            {/* Item List */}
            <div className="rounded-2xl border border-black/8 p-6">
              <div>
                <h2 className="text-lg font-semibold">Your Items</h2>
                <p className="text-sm text-neutral-400 mt-0.5">
                  {counts.tops}T · {counts.bottoms}B · {counts.shoes}S
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2 max-h-[560px] overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/15 px-4 py-8 text-center text-sm text-neutral-400">
                    No items yet.<br />Add your first top, bottom, and shoes.
                  </div>
                ) : (
                  items.map((it: any) => {
                    const isPinnedTop = pinnedTopId === it.id;
                    const isPinnedBottom = pinnedBottomId === it.id;
                    const isPinnedShoes = pinnedShoesId === it.id;
                    const isPinned = isPinnedTop || isPinnedBottom || isPinnedShoes;
                    const isFilteredOut = weatherEnabled && weather && !filteredItems.find((f) => f.id === it.id);

                    return (
                      <div key={it.id}
                        className={"flex items-center justify-between gap-3 rounded-xl border px-3 py-3 transition " +
                          (isPinned ? "border-black bg-neutral-50" : "border-black/8 hover:border-black/20") +
                          (isFilteredOut ? " opacity-40" : "")}>
                        <div className="min-w-0 flex items-center gap-3">
                          {it.image_url ? (
                            <img src={it.image_url} alt={String(it.type)}
                              className="h-14 w-14 rounded-xl object-cover border border-black/8 flex-shrink-0" />
                          ) : (
                            <div className="h-14 w-14 rounded-xl border border-black/8 bg-neutral-100 flex items-center justify-center text-lg flex-shrink-0">
                              {it.category === "top" ? "👕" : it.category === "bottom" ? "👖" : "👟"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-sm flex items-center gap-1 truncate">
                              {isPinned && <span className="text-xs">🔒</span>}
                              {isFilteredOut && <span className="text-xs" title="Hidden by weather">🌡️</span>}
                              {String(it.type).replace(/_/g, " ")}
                            </div>
                            <div className="text-xs text-neutral-400 capitalize mt-0.5">
                              {it.category} · {it.color_family ?? "neutral"}
                            </div>
                            <button type="button"
                              className={"mt-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition " +
                                (isPinned ? "bg-black text-white border-black" : "border-black/10 hover:bg-neutral-50")}
                              onClick={() => {
                                if (it.category === "top") setPinnedTopId(isPinnedTop ? null : it.id);
                                if (it.category === "bottom") setPinnedBottomId(isPinnedBottom ? null : it.id);
                                if (it.category === "shoes") setPinnedShoesId(isPinnedShoes ? null : it.id);
                              }}>
                              {isPinned ? "🔒 Pinned" : "Pin"}
                            </button>
                          </div>
                        </div>
                        <button type="button"
                          className="rounded-lg px-2.5 py-2 text-xs text-neutral-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                          onClick={() => onDeleteItem(it.id)}>
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {shareOutfit && (
        <ShareCard outfit={shareOutfit} onClose={() => setShareOutfit(null)} />
      )}
      <AIStyleAssistant items={items} />
    </AppShell>
  );
}