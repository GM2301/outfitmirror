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

function isImageFile(file: File) {
  return file.type.startsWith("image/");
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

    if (tempC > 28) {
      if (type.includes("hoodie") || type.includes("sweater") || type.includes("jacket")) return false;
    }
    if (tempC < 12) {
      if (type.includes("tank") || type.includes("shorts") || type.includes("sandals")) return false;
    }
    if (weather.isRaining) {
      if (type.includes("sandals")) return false;
    }

    return true;
  });
}

export default function AppPageClient({ initialItems }: Props) {
  const supabase = React.useMemo(() => createClient(), []);

  const [items, setItems] = React.useState<Item[]>(initialItems ?? []);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const [occasion, setOccasion] = React.useState<Occasion>("work");
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
  // Missing Piece - analizon garderobën origjinale
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
    if (!isImageFile(photoFile)) throw new Error("File must be an image.");
    const safeName = norm(photoFile.name).replace(/[^a-z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}_${safeName}`;
    const { error: upErr } = await supabase.storage.from("wardrobe").upload(path, photoFile, { upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data } = supabase.storage.from("wardrobe").getPublicUrl(path);
    return data?.publicUrl ?? null;
  }, [supabase, photoFile]);

  const onSaveItem = React.useCallback(async () => {
    setStatus(null);
    if (!type) { setStatus("Type is required."); return; }
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
    setStatus(vote === "up" ? "Saved 👍" : "Saved 👎");
  }, [supabase, occasion]);

  function handleRegenerate() {
    if (!canGenerate) { setStatus("Add at least 1 top + 1 bottom + 1 shoes first."); return; }
    setSeed(Date.now()); setGenerated(true); setStatus(null);
  }

  return (
    <AppShell title="OutfitMirror">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold">Your Closet</h1>
              <p className="mt-1 text-sm text-neutral-500">Add items, pick occasion, then generate outfits.</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {OCCASIONS.map((o) => (
                  <button key={o} type="button"
                    className={"rounded-full border px-4 py-2 text-sm transition " + (o === occasion ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-50")}
                    onClick={() => { setOccasion(o); setGenerated(false); setSeed(null); }}>
                    {occasionLabel(o)}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-neutral-500">Pins:</span>
                {(["top", "bottom", "shoes"] as const).map((cat) => {
                  const pinned = cat === "top" ? pinnedTop : cat === "bottom" ? pinnedBottom : pinnedShoes;
                  return (
                    <span key={cat} className={"rounded-full border px-3 py-1 " + (pinned ? "bg-black text-white border-black" : "")}>
                      {pinned ? `🔒 ${String(pinned.type).replace(/_/g, " ")}` : `${cat.charAt(0).toUpperCase() + cat.slice(1)}: —`}
                    </span>
                  );
                })}
                {(pinnedTopId || pinnedBottomId || pinnedShoesId) && (
                  <button type="button" className="rounded-full border px-3 py-1 text-neutral-500 hover:bg-neutral-50"
                    onClick={() => { setPinnedTopId(null); setPinnedBottomId(null); setPinnedShoesId(null); }}>
                    Clear Pins
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border px-4 py-2 text-sm">
                {items.length} items • {counts.tops}T • {counts.bottoms}B • {counts.shoes}S
              </div>
              <button type="button"
                className="rounded-full bg-black px-5 py-2 text-sm text-white disabled:opacity-50 hover:bg-black/90 transition"
                onClick={handleRegenerate} disabled={loading}>
                ✨ Generate
              </button>
              <button type="button"
                className="rounded-full border px-4 py-2 text-sm disabled:opacity-50 hover:bg-neutral-50 transition"
                onClick={refresh} disabled={loading}>
                Refresh
              </button>
            </div>
          </div>

          {/* ONBOARDING */}
          <OnboardingBanner
            hasTops={counts.tops > 0}
            hasBottoms={counts.bottoms > 0}
            hasShoes={counts.shoes > 0}
          />

          {/* WEATHER BANNER */}
          <div className="rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {weather ? (
                <>
                  <span className="text-2xl">{weatherLabel(weather.tempC, weather.isRaining).split(" ")[0]}</span>
                  <div>
                    <div className="font-medium text-sm">
                      {Math.round(weather.tempC)}°C · {weatherLabel(weather.tempC, weather.isRaining).split(" ").slice(1).join(" ")}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {weatherEnabled ? "Outfit filter: ON — unsuitable clothes hidden" : "Outfit filter: OFF"}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-neutral-500">
                  {weatherLoading ? "Getting weather..." : weatherError ? `⚠️ ${weatherError}` : "Get weather for smarter outfit suggestions"}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {weather && (
                <button type="button"
                  className={"rounded-full border px-4 py-2 text-sm transition " + (weatherEnabled ? "bg-black text-white border-black" : "hover:bg-neutral-50")}
                  onClick={() => { setWeatherEnabled((v) => !v); setGenerated(false); setSeed(null); }}>
                  {weatherEnabled ? "✓ Filter On" : "Filter Off"}
                </button>
              )}
              <button type="button"
                className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50 transition disabled:opacity-50"
                onClick={fetchWeatherData} disabled={weatherLoading}>
                {weatherLoading ? "Loading..." : weather ? "Refresh Weather" : "Get Weather"}
              </button>
            </div>
          </div>

          {status && <div className="rounded-xl border px-4 py-3 text-sm">{status}</div>}

          {/* OUTFITS */}
          <div className="grid gap-4 lg:grid-cols-3">
            {generated && outfits ? (
              outfits.map((o: any) => (
                <div key={o.label} className="flex flex-col gap-2">
                  <OutfitCard outfit={o} />
                  <div className="flex gap-2">
                    <button type="button" className="flex-1 rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50 transition" onClick={() => onVote(o, "up")}>👍 Like</button>
                    <button type="button" className="flex-1 rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50 transition" onClick={() => onVote(o, "down")}>👎 Dislike</button>
                    <button type="button" className="flex-1 rounded-xl bg-black text-white px-3 py-2 text-sm hover:bg-black/90 transition" onClick={() => setShareOutfit(o)}>📤 Share</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border p-6 text-sm text-neutral-600 lg:col-span-3">
                {canGenerate ? "Pick an occasion above, then click ✨ Generate." : "Add at least 1 top, 1 bottom, and 1 shoes to start."}
              </div>
            )}
          </div>

          {/* MISSING PIECE */}
          {missingPiece && items.length >= 3 && (
            <MissingPieceCard piece={missingPiece} />
          )}

          {/* ADD + LIST */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border p-6">
              <h2 className="text-lg font-semibold">Add Item</h2>
              <div className="mt-4 grid gap-4">
                <div>
                  <label className="text-sm text-neutral-600">Category</label>
                  <select className="mt-2 w-full rounded-xl border px-3 py-3 bg-white" value={category}
                    onChange={(e) => { setCategory(e.target.value as Category); setType(""); }}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-neutral-600">Type</label>
                  <select className="mt-2 w-full rounded-xl border px-3 py-3 bg-white" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="">— select type —</option>
                    {TYPE_OPTIONS[category].map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-neutral-600">Color family</label>
                  <select className="mt-2 w-full rounded-xl border px-3 py-3 bg-white" value={colorFamily} onChange={(e) => setColorFamily(e.target.value)}>
                    {COLOR_FAMILIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-neutral-600">Photo (optional)</label>
                  <input className="mt-2 w-full rounded-xl border px-3 py-3" type="file" accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
                  {photoFile && <div className="mt-2 text-xs text-neutral-500">Selected: {photoFile.name}</div>}
                </div>
                <button type="button"
                  className="mt-2 rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50 hover:bg-black/90 transition"
                  onClick={onSaveItem} disabled={loading || !type}>
                  {loading ? "Saving..." : "Save item"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border p-6">
              <h2 className="text-lg font-semibold">Your Items</h2>
              <div className="mt-4 flex flex-col gap-3 max-h-[600px] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="rounded-xl border px-4 py-3 text-sm text-neutral-600">No items yet. Add your first 3 (top / bottom / shoes).</div>
                ) : (
                  items.map((it: any) => {
                    const isPinnedTop = pinnedTopId === it.id;
                    const isPinnedBottom = pinnedBottomId === it.id;
                    const isPinnedShoes = pinnedShoesId === it.id;
                    const isPinned = isPinnedTop || isPinnedBottom || isPinnedShoes;
                    const isFilteredOut = weatherEnabled && weather && !filteredItems.find((f) => f.id === it.id);

                    return (
                      <div key={it.id}
                        className={"flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition " + (isPinned ? "border-black bg-neutral-50 " : "") + (isFilteredOut ? "opacity-40" : "")}>
                        <div className="min-w-0 flex items-center gap-3">
                          {it.image_url ? (
                            <img src={it.image_url} alt={String(it.type)} className="h-12 w-12 rounded-lg object-cover border flex-shrink-0" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg border bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 flex-shrink-0">
                              {String(it.category)[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-medium flex items-center gap-1">
                              {isPinned && <span>🔒</span>}
                              {isFilteredOut && <span title="Hidden by weather">🌡️</span>}
                              {String(it.type).replace(/_/g, " ")}
                            </div>
                            <div className="text-xs text-neutral-500">{String(it.category)} • {it.color_family ?? "neutral"}</div>
                            <div className="mt-2">
                              {it.category === "top" && (
                                <button type="button"
                                  className={"rounded-full border px-3 py-1 text-xs transition " + (isPinnedTop ? "bg-black text-white border-black" : "hover:bg-neutral-50")}
                                  onClick={() => setPinnedTopId(isPinnedTop ? null : it.id)}>
                                  {isPinnedTop ? "🔒 Pinned" : "Pin Top"}
                                </button>
                              )}
                              {it.category === "bottom" && (
                                <button type="button"
                                  className={"rounded-full border px-3 py-1 text-xs transition " + (isPinnedBottom ? "bg-black text-white border-black" : "hover:bg-neutral-50")}
                                  onClick={() => setPinnedBottomId(isPinnedBottom ? null : it.id)}>
                                  {isPinnedBottom ? "🔒 Pinned" : "Pin Bottom"}
                                </button>
                              )}
                              {it.category === "shoes" && (
                                <button type="button"
                                  className={"rounded-full border px-3 py-1 text-xs transition " + (isPinnedShoes ? "bg-black text-white border-black" : "hover:bg-neutral-50")}
                                  onClick={() => setPinnedShoesId(isPinnedShoes ? null : it.id)}>
                                  {isPinnedShoes ? "🔒 Pinned" : "Pin Shoes"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <button type="button"
                          className="rounded-lg border px-3 py-2 text-sm hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition flex-shrink-0"
                          onClick={() => onDeleteItem(it.id)}>
                          Delete
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
    </AppShell>
  );
}