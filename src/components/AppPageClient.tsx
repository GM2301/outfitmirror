"use client";

import * as React from "react";
import { Sparkles, Shirt, Plus, User, Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Item, Category, ItemType, Gender, VotedItemIds, Outfit, OutfitPicks } from "@/lib/engine/types";
import { generateOutfits, isWeatherAppropriate, MILD_DEFAULT_TEMP } from "@/lib/engine/generate";
import { getBrowserLocation, fetchWeather } from "@/lib/weather";
import { loadVotedItemIds, saveVotedItemIds, loadRecentItemIds, pushRecentItemIds } from "@/lib/userPrefs";
import type { WeatherContext } from "@/lib/weather";
import OutfitFlatLay from "@/components/OutfitFlatLay";
import StyleHistory from "@/components/StyleHistory";
import MissingPieceCard from "@/components/MissingPieceCard";
import { getMissingPieces } from "@/lib/engine/missingPiece";
import ShareCard from "@/components/ShareCard";
import AIStyleCoach from "@/components/AIStyleCoach";
import AISupport from "@/components/AISupport";
import PhotoUpload, { type AIAnalysis } from "@/components/PhotoUpload";
import LocationModal from "@/components/LocationModal";
import BulkUpload, { type BulkItem } from "@/components/BulkUpload";
import OnboardingFlow from "@/components/OnboardingFlow";
import CoupleMode from "@/components/CoupleMode";
import { shrinkPhoto, extensionFor, PHOTO_CACHE_CONTROL } from "@/lib/image";
import Link from "next/link";

type Occasion = "work" | "date" | "casual" | "night_out" | "travel" | "gym";
type Props = { initialItems?: Item[] };

const OCCASIONS: Occasion[] = ["work", "date", "casual", "night_out", "travel", "gym"];
const CATEGORIES = ["top", "bottom", "shoes", "outerwear", "accessory"] as const;
type WardrobeCategory = (typeof CATEGORIES)[number];

const CATEGORY_LABEL: Record<WardrobeCategory, { one: string; many: string }> = {
  top: { one: "top", many: "Tops" },
  bottom: { one: "bottom", many: "Bottoms" },
  shoes: { one: "pair of shoes", many: "Shoes" },
  outerwear: { one: "jacket or coat", many: "Outerwear" },
  accessory: { one: "accessory", many: "Accessories" },
};

// Same color names the photo AI assigns (see api/analyze-photo), so items
// added by hand and by photo are treated identically by the outfit engine.
const COLOR_FAMILIES = [
  "black","white","grey","beige","brown","navy","blue","green",
  "red","burgundy","orange","yellow","pink","purple","neutral",
];

// Jackets/coats/blazers are "outerwear": the engine layers them over a top.
// They used to sit in the top list, which made them a top instead.
const TYPE_OPTIONS_MALE: Record<string, string[]> = {
  top:    ["tee","polo","shirt","sweater","hoodie","sweatshirt","tank","henley","crewneck"],
  bottom: ["jeans","chinos","trousers","shorts","joggers","sweatpants","cargo"],
  shoes:  ["sneakers","running_shoes","boots","dress_shoes","loafers","sandals","chelsea_boots"],
  outerwear: ["jacket","blazer","coat","bomber","denim_jacket","puffer","trench","windbreaker"],
  accessory: ["watch","belt","cap","sunglasses","bag","scarf","bracelet"],
};

const TYPE_OPTIONS_FEMALE: Record<string, string[]> = {
  top:    ["blouse","tee","crop_top","shirt","knit","tank","cardigan","bodysuit","sweater"],
  bottom: ["jeans","trousers","midi_skirt","mini_skirt","leggings","shorts","wide_leg_pants"],
  shoes:  ["sneakers","heels","boots","ankle_boots","ballet_flats","loafers","mules","sandals"],
  outerwear: ["jacket","blazer","coat","trench","denim_jacket","puffer","leather_jacket"],
  accessory: ["bag","tote","clutch","sunglasses","scarf","hat","jewelry","belt"],
};

const OCCASION_CONFIG: Record<string, { emoji: string; label: string; desc: string }> = {
  work:      { emoji: "💼", label: "Work",      desc: "Professional" },
  date:      { emoji: "🌹", label: "Date",      desc: "Stylish"      },
  casual:    { emoji: "☀️", label: "Casual",    desc: "Relaxed"      },
  night_out: { emoji: "🌑", label: "Night Out", desc: "Sharp"        },
  travel:    { emoji: "✈️", label: "Travel",    desc: "Versatile"    },
  gym:       { emoji: "💪", label: "Gym",       desc: "Athletic"     },
};

const COLOR_PLACEHOLDER: Record<string, string> = {
  black: "bg-neutral-800", white: "bg-neutral-100", neutral: "bg-stone-200",
  earth: "bg-amber-100", blue: "bg-sky-100", bright: "bg-violet-100",
  green: "bg-emerald-100", red: "bg-red-100", pink: "bg-pink-100",
  purple: "bg-purple-100", orange: "bg-orange-100", yellow: "bg-yellow-100",
  grey: "bg-neutral-200", beige: "bg-amber-50", brown: "bg-amber-200",
  navy: "bg-blue-100", burgundy: "bg-rose-100", tan: "bg-amber-100", teal: "bg-teal-100",
};

const COLOR_DOT: Record<string, string> = {
  black: "bg-neutral-900", white: "bg-white border border-black/15",
  neutral: "bg-stone-300", earth: "bg-amber-300", blue: "bg-sky-400",
  bright: "bg-violet-400", green: "bg-emerald-400", red: "bg-red-400",
  pink: "bg-pink-400", purple: "bg-purple-400", orange: "bg-orange-400", yellow: "bg-yellow-300",
  grey: "bg-neutral-400", beige: "bg-amber-100 border border-black/10", brown: "bg-amber-800",
  navy: "bg-blue-900", burgundy: "bg-rose-800", tan: "bg-amber-400", teal: "bg-teal-500",
};

function categoryEmoji(c: string, gender: Gender): string {
  if (c === "top") return gender === "female" ? "👚" : "👕";
  if (c === "bottom") return gender === "female" ? "👗" : "👖";
  if (c === "shoes") return gender === "female" ? "👠" : "👟";
  if (c === "outerwear") return "🧥";
  return "💍";
}

function norm(s: string) { return s.trim().toLowerCase().replace(/\s+/g, "_"); }

function weatherLabel(tempC: number, isRaining: boolean): string {
  if (isRaining) return "🌧️ Raining";
  if (tempC <= 5) return "🥶 Very Cold";
  if (tempC <= 12) return "🧥 Cold";
  if (tempC <= 20) return "🌤️ Mild";
  if (tempC <= 28) return "☀️ Warm";
  return "🔥 Hot";
}

function filterItemsByWeather(items: Item[], weather: WeatherContext): Item[] {
  // Delegates to the engine's own isWeatherAppropriate() instead of a
  // separately maintained blacklist - this used to be the ONLY place with
  // rain-awareness (a plain sandal/temp check), so Trip Planner - which
  // calls generateOutfits() directly without ever going through this
  // function - had zero rain-awareness at all despite having isRaining per
  // day. Moving the real logic into generate.ts and keeping this as a thin
  // wrapper means both callers now see identical weather behavior.
  return items.filter(item => isWeatherAppropriate(item, weather.tempC, weather.isRaining));
}

function getCostPerWear(item: Item): string | null {
  if (!item.price || !item.wear_count || item.wear_count === 0) return null;
  const cpw = item.price / item.wear_count;
  return cpw < 1 ? `$${cpw.toFixed(2)}` : `$${Math.round(cpw)}`;
}

function AnimatedOutfit({ children, index, triggerKey }: {
  children: React.ReactNode; index: number; triggerKey: number;
}) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    setShow(false);
    const t = setTimeout(() => setShow(true), 60 + index * 160);
    return () => clearTimeout(t);
  }, [triggerKey, index]);
  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)",
    }}>{children}</div>
  );
}

function ItemPlaceholder({ item, gender }: { item: any; gender: Gender }) {
  const color = item.color_family ?? "neutral";
  const bg = COLOR_PLACEHOLDER[color] ?? "bg-neutral-100";
  const isBlack = color === "black";
  return (
    <div className={`aspect-square ${bg} flex flex-col items-center justify-center gap-1`}>
      <span className="text-3xl">{categoryEmoji(item.category, gender)}</span>
      <span className={`text-xs font-medium capitalize ${isBlack ? "text-white/60" : "text-black/30"}`}>
        {String(item.type).replace(/_/g, " ")}
      </span>
    </div>
  );
}

function WardrobeCard({ it, idx, isPinned, isFilteredOut, cpw, gender, colorDot, onPin, onDelete }: {
  it: any; idx: number; isPinned: boolean; isFilteredOut: boolean;
  cpw: string | null; gender: Gender; colorDot: string;
  onPin: () => void; onDelete: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState(() => {
    try {
      const list = JSON.parse(localStorage.getItem("om_unavailable") ?? "[]");
      return list.includes(it.id);
    } catch { return false; }
  });

  function toggleUnavailable() {
    const newVal = !unavailable;
    setUnavailable(newVal);
    try {
      const list = JSON.parse(localStorage.getItem("om_unavailable") ?? "[]");
      const updated = newVal ? [...list, it.id] : list.filter((x: string) => x !== it.id);
      localStorage.setItem("om_unavailable", JSON.stringify(updated));
    } catch {}
  }
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${idx * 35}ms both`,
        borderRadius: "16px", overflow: "hidden",
        border: isPinned ? "2px solid #1A1A1A" : "none",
        opacity: isFilteredOut ? 0.45 : 1, background: "white",
        transform: hovered ? "translateY(-3px) scale(1.01)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? "0 12px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)"
          : "0 1px 4px rgba(0,0,0,0.06), 0 0px 1px rgba(0,0,0,0.04)",
        transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease",
        position: "relative" as const,
      }}>
      {it.image_url ? (
        <div style={{ aspectRatio: "1", background: "#fafafa", overflow: "hidden", position: "relative" }}>
          <img src={it.image_url} alt={String(it.type)} style={{
            width: "100%", height: "100%", objectFit: "contain", padding: "10px",
            transform: hovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
          }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "32px", background: "linear-gradient(to top, rgba(0,0,0,0.04), transparent)" }} />
        </div>
      ) : <ItemPlaceholder item={it} gender={gender} />}
      {isPinned && <div style={{ position: "absolute", top: 8, right: 8 }} className="rounded-full bg-black/80 backdrop-blur-sm text-white px-2 py-0.5 text-xs">🔒</div>}
      {isFilteredOut && <div style={{ position: "absolute", top: 8, left: 8 }} className="rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-xs">🌡️</div>}
      <div style={{padding:"10px 12px 12px", background:"white"}}>
        <div style={{display:"flex", alignItems:"center", gap:"6px", marginBottom:"2px"}}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colorDot}`} />
          <p style={{fontWeight:600, fontSize:"12px", textTransform:"capitalize", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"#1A1A1A"}}>{String(it.type).replace(/_/g, " ")}</p>
        </div>
        <p style={{fontSize:"11px", color:"#8A8580", textTransform:"capitalize", marginBottom:"10px"}}>{it.category}{cpw ? ` · ${cpw}/wear` : ""}</p>
        {unavailable && (
          <div style={{marginBottom:"8px", borderRadius:"8px", background:"#FFFBEB", padding:"4px 8px", textAlign:"center"}}>
            <p style={{fontSize:"11px", color:"#92400E", fontWeight:500}}>🧺 In the wash</p>
          </div>
        )}
        <div style={{display:"flex", gap:"6px"}}>
          <button type="button" onClick={onPin}
            style={{
              flex:1, borderRadius:"8px", padding:"7px 4px", fontSize:"11px", fontWeight:700,
              border:"none", cursor:"pointer", transition:"all .15s",
              background: isPinned ? "#1A1A1A" : "rgba(0,0,0,0.05)",
              color: isPinned ? "white" : "#6B6B6B",
            }}>
            {isPinned ? "🔒 Pinned" : "Pin"}
          </button>
          <button type="button" onClick={toggleUnavailable}
            style={{
              borderRadius:"8px", padding:"7px 9px", fontSize:"11px", border:"none", cursor:"pointer", transition:"all .15s",
              background: unavailable ? "#FFFBEB" : "rgba(0,0,0,0.05)",
              color: unavailable ? "#92400E" : "#8A8580",
            }}>
            🧺
          </button>
          <button type="button" onClick={onDelete}
            style={{borderRadius:"8px", padding:"7px 9px", fontSize:"11px", background:"rgba(0,0,0,0.05)", color:"#8A8580", border:"none", cursor:"pointer", transition:"all .15s"}}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function AppSettingsDrawer({ open, onClose, gender, weatherEnabled, onWeatherToggle }: {
  open: boolean; onClose: () => void;
  gender: Gender; weatherEnabled: boolean;
  onWeatherToggle: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[85vh] overflow-y-auto"
        style={{ background:"#FAF8F5", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-200" />
        </div>
        <div className="px-5 pb-8 pt-2">
          <h2 style={{fontFamily:"'Cormorant', Georgia, serif", fontSize:"24px", fontWeight:400, color:"#1A1A1A", marginBottom:"20px"}}>App Settings</h2>

          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Style</p>
            <div className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3 bg-neutral-50">
              <div className="flex items-center gap-3">
                <span className="text-xl">{gender === "male" ? "👔" : "👗"}</span>
                <div>
                  <p className="text-sm font-bold">{gender === "male" ? "Menswear" : "Womenswear"}</p>
                  <p className="text-xs text-neutral-400">Set during onboarding</p>
                </div>
              </div>
              <Lock size={12} strokeWidth={1.5} style={{ color: "#D4D2CD" }} />
            </div>
          </div>

          <div className="mb-5 flex items-center justify-between py-3 border-t border-black/6">
            <div>
              <p className="font-semibold text-sm">Weather-aware outfits</p>
              <p className="text-xs text-neutral-400 mt-0.5">Filter clothes by current weather</p>
            </div>
            <button onClick={onWeatherToggle}
              className={`rounded-full w-12 h-6 transition-all relative flex-shrink-0 ${weatherEnabled ? "bg-black" : "bg-neutral-200"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${weatherEnabled ? "left-7" : "left-1"}`} />
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

function MissingPieceDrawerContent({ items, gender }: { items: Item[]; gender: Gender }) {
  const pieces = getMissingPieces(items, gender);

  if (pieces.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-3">✅</p>
        <p className="font-bold text-sm">Your wardrobe is well-rounded!</p>
        <p className="text-xs text-neutral-400 mt-1">No major gaps found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pieces.map((piece, i) => (
        <MissingPieceCard key={i} piece={piece} />
      ))}

      <div className="flex items-center gap-2 justify-center pt-1">
        {pieces.map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-black" : i === 1 ? "bg-neutral-400" : "bg-neutral-300"}`} />
            <span className="text-xs text-neutral-400">#{i+1} priority</span>
            {i < pieces.length - 1 && <div className="w-3 h-px bg-neutral-200 mx-1" />}
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-300 text-center">Links open a store search — Occaswear isn&apos;t paid for them</p>
    </div>
  );
}

export default function AppPageClient({ initialItems }: Props) {
  const supabase = React.useMemo(() => createClient(), []);
  const searchParams = useSearchParams();


  const [gender, setGender] = React.useState<Gender>(() => {
    if (typeof window === "undefined") return "male";
    return (localStorage.getItem("om_gender") as Gender) ?? "male";
  });
  const [style] = React.useState<string>(() => {
    if (typeof window === "undefined") return "minimal";
    return localStorage.getItem("om_style") ?? "minimal";
  });
  // Starts false on both server and client's first render so hydration
  // always matches - the full-screen OnboardingFlow overlay is a different
  // subtree than the normal page, so deciding this from localStorage inside
  // the initializer caused a "Hydration failed" mismatch + visible flash.
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  React.useEffect(() => {
    if (localStorage.getItem("om_onboarding_done") !== "1") setShowOnboarding(true);
  }, []);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showSupport, setShowSupport] = React.useState(false);

  const [items, setItems] = React.useState<Item[]>(initialItems ?? []);
  const [loading, setLoading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [genProgress, setGenProgress] = React.useState(0);
  const [outfitKey, setOutfitKey] = React.useState(0);
  const [status, setStatus] = React.useState<string | null>(null);
  const [occasion, setOccasion] = React.useState<Occasion>("casual");
  const [generated, setGenerated] = React.useState(false);
  const [seed, setSeed] = React.useState<number | null>(null);
  const [view, setView] = React.useState<"outfits" | "wardrobe" | "add" | "profile">("outfits");

  const [pinnedItemIds, setPinnedItemIds] = React.useState<string[]>([]);
  const [votedItemIds, setVotedItemIds] = React.useState<VotedItemIds>(() => loadVotedItemIds());

  const [weather, setWeather] = React.useState<WeatherContext | null>(null);
  const [weatherLoading, setWeatherLoading] = React.useState(false);
  const [weatherError, setWeatherError] = React.useState<string | null>(null);
  const [weatherEnabled, setWeatherEnabled] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("om_weather_enabled") === "1";
  });

  const [category, setCategory] = React.useState<string>("top");
  const [type, setType] = React.useState("");
  const [colorFamily, setColorFamily] = React.useState("neutral");
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [cleanBlob, setCleanBlob] = React.useState<Blob | null>(null);
  const [aiTags, setAiTags] = React.useState<AIAnalysis | null>(null);
  const [shareOutfit, setShareOutfit] = React.useState<any>(null);
  const [showLocationModal, setShowLocationModal] = React.useState(false);
  const [showBulkUpload, setShowBulkUpload] = React.useState(false);
  const [showMissingPiece, setShowMissingPiece] = React.useState(false);
  const [wardrobeTab, setWardrobeTab] = React.useState<WardrobeCategory>("top");
  const [user, setUser] = React.useState<any>(null);

  const [outfitHistory, setOutfitHistory] = React.useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("om_outfit_history") ?? "[]"); } catch { return []; }
  });

  const TYPE_OPTIONS = gender === "female" ? TYPE_OPTIONS_FEMALE : TYPE_OPTIONS_MALE;

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const denied = localStorage.getItem("om_location_denied");
    const wasEnabled = localStorage.getItem("om_weather_enabled") === "1";
    if (wasEnabled) fetchWeatherData();
    else if (!denied) setShowLocationModal(true);
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("om_weather_enabled", weatherEnabled ? "1" : "0");
  }, [weatherEnabled]);

  const fetchWeatherData = React.useCallback(async () => {
    setWeatherLoading(true); setWeatherError(null);
    try {
      const { lat, lon } = await getBrowserLocation();
      const w = await fetchWeather(lat, lon);
      setWeather(w);
      setWeatherEnabled(true);
      localStorage.setItem("om_weather_temp", String(w.tempC));
      localStorage.setItem("om_weather_raining", w.isRaining ? "1" : "0");
    } catch (e: any) {
      setWeatherError(e?.message ?? "Location denied"); setWeatherEnabled(false);
    } finally { setWeatherLoading(false); }
  }, []);

  function handleLocationAllow() { setShowLocationModal(false); localStorage.removeItem("om_location_denied"); fetchWeatherData(); }
  function handleLocationDeny() { setShowLocationModal(false); localStorage.setItem("om_location_denied", "1"); }
  function handleWeatherToggle() {
    const v = !weatherEnabled; setWeatherEnabled(v); setGenerated(false); setSeed(null);
    if (v && !weather) fetchWeatherData();
  }
  function handleOnboardingComplete(g: Gender, style?: string) {
    setGender(g); localStorage.setItem("om_gender", g);
    if (style) localStorage.setItem("om_style", style);
    setShowOnboarding(false);
  }
  const filteredItems = React.useMemo(() => {
    if (!weatherEnabled || !weather) return items;
    return filterItemsByWeather(items, weather);
  }, [items, weather, weatherEnabled]);

  const counts = React.useMemo(() => ({
    tops: filteredItems.filter(x => x.category === "top").length,
    bottoms: filteredItems.filter(x => x.category === "bottom").length,
    shoes: filteredItems.filter(x => x.category === "shoes").length,
  }), [filteredItems]);

  const canGenerate = counts.tops > 0 && counts.bottoms > 0 && counts.shoes > 0;

  // PWA manifest shortcuts (long-press the app icon) link to
  // /app?view=wardrobe and /app?action=generate - honor them once on load.
  React.useEffect(() => {
    const requestedView = searchParams.get("view");
    if (requestedView === "wardrobe" || requestedView === "add" || requestedView === "profile") {
      setView(requestedView);
    }
    if (searchParams.get("action") === "generate" && canGenerate) {
      setSeed(Date.now());
      setGenerated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally once-on-load only
  }, []);

  const pinnedItems = React.useMemo(() =>
    items.filter(i => pinnedItemIds.includes(i.id)),
  [items, pinnedItemIds]);

  // Pins and likes shape the next generation; they must not reshuffle the
  // look that's on screen while the user is tapping it.
  const pinnedRef = React.useRef(pinnedItemIds);
  pinnedRef.current = pinnedItemIds;
  const votedRef = React.useRef(votedItemIds);
  votedRef.current = votedItemIds;

  // The same weather goes to the engine and to the swap sheet.
  const lookTemp = weatherEnabled && weather ? weather.tempC : undefined;
  const lookRain = weatherEnabled && weather ? weather.isRaining : false;

  // One best look first, then alternatives for "Another look".
  const outfits = React.useMemo(() => {
    if (!generated || seed === null || !canGenerate) return null;
    return generateOutfits(filteredItems, occasion as any, seed, {
      pinnedItemIds: pinnedRef.current,
      votedItemIds: votedRef.current,
      recentItemIds: loadRecentItemIds(),
      gender,
      style,
      tempC: lookTemp,
      isRaining: lookRain,
    });
  }, [filteredItems, occasion, generated, seed, canGenerate, gender, style, lookTemp, lookRain]);

  const [lookIndex, setLookIndex] = React.useState(0);
  React.useEffect(() => { setLookIndex(0); }, [outfits]);
  const currentLook = outfits?.[lookIndex] ?? null;

  // Anti-repeat: record each look actually shown (only that one - the unseen
  // alternatives must not count as "worn").
  React.useEffect(() => {
    const p = currentLook?.picks;
    if (!p || currentLook?.outfit_hash === "empty") return;
    const ids = [p.top, p.bottom, p.shoes, p.inner, p.outer].filter(Boolean).map(it => it!.id);
    if (ids.length > 0) pushRecentItemIds(ids);
  }, [currentLook]);

  function showNextLook() {
    if (!outfits) return;
    if (lookIndex + 1 < outfits.length) { setLookIndex(i => i + 1); setOutfitKey(k => k + 1); }
    else { setSeed(Date.now()); setOutfitKey(k => k + 1); } // ran out: fresh set, shown looks now count as recent
  }

  async function handleRegenerate() {
    if (!canGenerate) { setStatus("Add at least 1 top, 1 bottom, and 1 shoes first."); return; }
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
    setGenerating(true); setGenProgress(0); setGenerated(false);
    for (const p of [15, 35, 55, 75, 90]) {
      await new Promise(r => setTimeout(r, 100));
      setGenProgress(p);
    }
    setSeed(Date.now()); setGenerated(true); setOutfitKey(k => k + 1); setStatus(null);
    setGenProgress(100);
    await new Promise(r => setTimeout(r, 300));
    setGenerating(false); setGenProgress(0);
  }

  function handlePinWithHaptic(itemId: string) {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
    setPinnedItemIds(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      }
      const item = items.find(i => i.id === itemId);
      if (!item) return [...prev, itemId];
      const filtered = prev.filter(id => {
        const existing = items.find(i => i.id === id);
        return !existing || existing.category !== item.category;
      });
      return [...filtered, itemId];
    });
  }

  function saveToHistory(picks: OutfitPicks) {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      occasion, label: "Look",
      top: picks.top?.type, bottom: picks.bottom?.type, shoes: picks.shoes?.type,
    };
    const updated = [entry, ...outfitHistory].slice(0, 30);
    setOutfitHistory(updated);
    localStorage.setItem("om_outfit_history", JSON.stringify(updated));
  }

  const uploadPhotoIfAny = React.useCallback(async (userId: string): Promise<string | null> => {
    if (!photoFile) return null;
    const blob = cleanBlob ?? await shrinkPhoto(photoFile).catch(() => photoFile);
    const ext = extensionFor(blob);
    const path = `${userId}/${Date.now()}_${cleanBlob ? "clean" : "photo"}.${ext}`;
    const { error } = await supabase.storage.from("wardrobe").upload(path, blob, {
      upsert: true, contentType: blob.type || "image/jpeg", cacheControl: PHOTO_CACHE_CONTROL,
    });
    if (error) throw new Error(error.message);
    return supabase.storage.from("wardrobe").getPublicUrl(path).data?.publicUrl ?? null;
  }, [supabase, photoFile, cleanBlob]);

  const onSaveItem = React.useCallback(async () => {
    setStatus(null);
    if (!type) { setStatus("Please select a type."); return; }
    setLoading(true);
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) { setLoading(false); setStatus("Not logged in."); return; }
    let uploadedUrl: string | null = null;
    try { uploadedUrl = await uploadPhotoIfAny(u.id); }
    catch (e: any) { setLoading(false); setStatus(e.message ?? "Upload failed."); return; }

    const insertPayload: any = {
      user_id: u.id,
      category,
      type: norm(type),
      color_family: norm(colorFamily || "neutral"),
      image_url: uploadedUrl,
    };
    const aiT = aiTags as any;
    if (aiT) {
      if (aiT.formality_tier !== undefined) insertPayload.formality_tier = aiT.formality_tier;
      if (aiT.is_layer !== undefined) insertPayload.is_layer = aiT.is_layer;
      if (aiT.is_inner !== undefined) insertPayload.is_inner = aiT.is_inner;
      if (aiT.min_temp !== undefined && aiT.min_temp !== null) insertPayload.min_temp = aiT.min_temp;
      if (aiT.max_temp !== undefined && aiT.max_temp !== null) insertPayload.max_temp = aiT.max_temp;
      if (aiT.style_tags) insertPayload.style_tags = aiT.style_tags;
    }

    const { data, error } = await supabase.from("items").insert(insertPayload).select("id").single();
    if (error) { setLoading(false); setStatus(error.message); return; }

    const newItem: Item = {
      id: data.id,
      category: category as Category,
      type: norm(type) as ItemType,
      color_family: norm(colorFamily || "neutral") as any,
      image_url: uploadedUrl,
      ...(aiT?.formality_tier !== undefined && { formality_tier: aiT.formality_tier }),
      ...(aiT?.is_layer !== undefined && { is_layer: aiT.is_layer }),
      ...(aiT?.is_inner !== undefined && { is_inner: aiT.is_inner }),
      ...(aiT?.min_temp !== undefined && aiT.min_temp !== null && { min_temp: aiT.min_temp }),
      ...(aiT?.max_temp !== undefined && aiT.max_temp !== null && { max_temp: aiT.max_temp }),
      ...(aiT?.style_tags && { style_tags: aiT.style_tags }),
    };
    setItems(prev => [newItem, ...prev]);

    setType(""); setColorFamily("neutral"); setPhotoFile(null); setCleanBlob(null); setAiTags(null);
    setGenerated(false); setSeed(null); setLoading(false); setStatus("Saved ✅"); setView("wardrobe");
  }, [supabase, category, type, colorFamily, uploadPhotoIfAny, aiTags]);

  const onDeleteItem = React.useCallback(async (id: string) => {
    if (!window.confirm("Remove this item from your wardrobe?")) return;
    setLoading(true);
    const imageUrl = items.find(x => x.id === id)?.image_url;
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) { setLoading(false); setStatus("Couldn't delete that item. Please try again."); return; }
    // Remove the photo too, otherwise every deleted item leaves a file behind.
    const marker = "/storage/v1/object/public/wardrobe/";
    if (imageUrl?.includes(marker)) {
      const path = decodeURIComponent(imageUrl.split(marker)[1].split("?")[0]);
      await supabase.storage.from("wardrobe").remove([path]);
    }
    setItems(prev => prev.filter(x => x.id !== id));
    setPinnedItemIds(prev => prev.filter(p => p !== id));
    setVotedItemIds(prev => {
      const next = {
        liked: prev.liked.filter(x => x !== id),
        disliked: prev.disliked.filter(x => x !== id),
      };
      saveVotedItemIds(next);
      return next;
    });
    setGenerated(false); setSeed(null); setLoading(false);
  }, [supabase, items]);

  // ♥ saves the look (as edited with Swap) and nudges its pieces up in future
  // looks. ✕ just moves on - it used to add every piece of the look to a
  // permanent "disliked" list, which quietly removed good clothes (your only
  // jeans, your everyday sneakers) from all future outfits.
  const recordFeedback = React.useCallback(async (look: Outfit, picks: OutfitPicks, vote: "up" | "down") => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    await supabase.from("feedback").insert({
      user_id: u.id, occasion, outfit_hash: look.outfit_hash ?? null, vote,
      top_id: picks.top?.id ?? null, bottom_id: picks.bottom?.id ?? null, shoes_id: picks.shoes?.id ?? null,
    });
  }, [supabase, occasion]);

  const onLike = React.useCallback((look: Outfit, picks: OutfitPicks) => {
    const ids = [picks.top, picks.bottom, picks.shoes, picks.inner, picks.outer].filter(Boolean).map(it => it!.id);
    saveToHistory(picks);
    setVotedItemIds(prev => {
      const next: VotedItemIds = {
        liked: Array.from(new Set([...prev.liked, ...ids])),
        disliked: prev.disliked.filter(id => !ids.includes(id)),
      };
      saveVotedItemIds(next);
      return next;
    });
    setStatus("Saved to your looks ♥");
    recordFeedback(look, picks, "up");
  }, [recordFeedback, outfitHistory]);

  const onSkip = React.useCallback((look: Outfit) => {
    recordFeedback(look, look.picks, "down");
    showNextLook();
  }, [recordFeedback, outfits, lookIndex]);

  const handleBulkComplete = React.useCallback(async (bulkItems: BulkItem[]) => {
    setShowBulkUpload(false);
    if (!bulkItems.length) return;
    setStatus(`Saving ${bulkItems.length} items...`);
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const saved: any[] = [];
    for (const b of bulkItems) {
      if (!b.analysis) continue;
      try {
        const blob = b.cleanBlob ?? await shrinkPhoto(b.file).catch(() => b.file);
        const path = `${u.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extensionFor(blob)}`;
        const { error: upErr } = await supabase.storage.from("wardrobe").upload(path, blob, {
          upsert: true, contentType: blob.type || "image/jpeg", cacheControl: PHOTO_CACHE_CONTROL,
        });
        if (upErr) continue;
        const url = supabase.storage.from("wardrobe").getPublicUrl(path).data?.publicUrl ?? null;

        const insertPayload: any = {
          user_id: u.id,
          category: b.analysis.category,
          type: norm(b.analysis.type),
          color_family: norm(b.analysis.color_family),
          image_url: url,
        };
        const ba = b.analysis as any;
        if (ba.formality_tier !== undefined) insertPayload.formality_tier = ba.formality_tier;
        if (ba.is_layer !== undefined) insertPayload.is_layer = ba.is_layer;
        if (ba.is_inner !== undefined) insertPayload.is_inner = ba.is_inner;
        if (ba.min_temp !== undefined && ba.min_temp !== null) insertPayload.min_temp = ba.min_temp;
        if (ba.max_temp !== undefined && ba.max_temp !== null) insertPayload.max_temp = ba.max_temp;
        if (ba.style_tags) insertPayload.style_tags = ba.style_tags;

        const { data } = await supabase.from("items").insert(insertPayload).select("id").single();
        if (data) {
          saved.push({
            id: data.id,
            category: b.analysis.category as Category,
            type: norm(b.analysis.type) as ItemType,
            color_family: norm(b.analysis.color_family) as any,
            image_url: url,
            ...(ba.formality_tier !== undefined && { formality_tier: ba.formality_tier }),
            ...(ba.is_layer !== undefined && { is_layer: ba.is_layer }),
            ...(ba.is_inner !== undefined && { is_inner: ba.is_inner }),
            ...(ba.min_temp !== undefined && ba.min_temp !== null && { min_temp: ba.min_temp }),
            ...(ba.max_temp !== undefined && ba.max_temp !== null && { max_temp: ba.max_temp }),
            ...(ba.style_tags && { style_tags: ba.style_tags }),
          });
        }
      } catch {}
    }
    setItems(prev => [...saved, ...prev]); setStatus(`✅ Added ${saved.length} items!`);
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  // ════════════════════════════════════════════════════════════════════════
  // PREMIUM NAV TABS — lucide icons instead of emojis
  // ════════════════════════════════════════════════════════════════════════
  const NAV_TABS = [
    { id: "outfits",  label: "Outfits",  Icon: Sparkles },
    { id: "wardrobe", label: "Wardrobe", Icon: Shirt },
    { id: "add",      label: "Add",      Icon: Plus },
    { id: "profile",  label: "Profile",  Icon: User },
  ];

  return (
    <div className="min-h-screen" style={{background:"#FAF8F5"}}>
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}

      <AppSettingsDrawer
        open={showSettings} onClose={() => setShowSettings(false)}
        gender={gender} weatherEnabled={weatherEnabled}
        onWeatherToggle={handleWeatherToggle}
      />

      <div className="mx-auto w-full max-w-2xl px-4 pb-48">

        <div className="flex items-center justify-between pt-5 pb-3">
          <div>
            <p style={{fontFamily:"'Cormorant', Georgia, serif", fontSize:"20px", fontWeight:300, letterSpacing:"0.15em", color:"#1A1A1A"}}>Occaswear</p>
          </div>
          <div className="flex items-center gap-2">
            {weather && (
              <button type="button" onClick={handleWeatherToggle}
                style={{
                  borderRadius:"999px", padding:"6px 12px", fontSize:"11px", fontWeight:600,
                  display:"flex", alignItems:"center", gap:"6px", border:"none", cursor:"pointer",
                  transition:"all .2s",
                  background: weatherEnabled ? "#1A1A1A" : "rgba(0,0,0,0.06)",
                  color: weatherEnabled ? "white" : "#6B6B6B",
                }}>
                <span>{weatherLabel(weather.tempC, weather.isRaining).split(" ")[0]}</span>
                <span>{Math.round(weather.tempC)}°C</span>
              </button>
            )}
            {weatherLoading && <div className="w-3 h-3 border border-black/20 border-t-black rounded-full animate-spin" />}
            {weatherError && !weatherLoading && !weather && (
              <span title={weatherError}
                style={{ borderRadius: "999px", padding: "6px 12px", fontSize: "11px", fontWeight: 600, background: "#FFFBEB", color: "#B45309" }}>
                ⚠ Weather unavailable
              </span>
            )}
            <button type="button" onClick={() => setShowSettings(true)}
              style={{width:"36px", height:"36px", borderRadius:"50%", border:"1px solid rgba(0,0,0,0.08)", background:"white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"14px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
              ⚙️
            </button>
          </div>
        </div>

        {view === "outfits" && (
          <div className="mt-1 page-enter">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 style={{fontFamily:"'Cormorant', Georgia, serif", fontSize:"28px", fontWeight:400, letterSpacing:"-0.01em", color:"#1A1A1A", lineHeight:1.1}}>Your Closet</h1>
                <p style={{fontSize:"12px", color:"#8A8580", marginTop:"2px"}}>
                  {items.length} items · {gender === "female" ? "Womenswear" : "Menswear"}
                </p>
              </div>
              <button type="button" onClick={() => setShowBulkUpload(true)}
                style={{fontSize:"11px", fontWeight:600, border:"1px solid rgba(0,0,0,0.1)", borderRadius:"999px", padding:"6px 14px", background:"white", cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
                📷 Bulk
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {OCCASIONS.map(o => {
                const cfg = OCCASION_CONFIG[o];
                const active = o === occasion;
                return (
                  <button key={o} type="button"
                    onClick={() => { setOccasion(o); setGenerated(false); setSeed(null); localStorage.setItem("om_occasion", o); }}
                    style={{
                      borderRadius:"14px", padding:"12px 10px", textAlign:"left", cursor:"pointer", border:"none",
                      background: active ? "#1A1A1A" : "white",
                      boxShadow: active ? "0 4px 16px rgba(0,0,0,0.18)" : "0 1px 4px rgba(0,0,0,0.06)",
                      transform: "translateY(0)",
                      transition:"all .2s cubic-bezier(0.16,1,0.3,1)",
                    }}>
                    <span style={{fontSize:"20px", display:"block", marginBottom:"6px", lineHeight:1}}>{cfg.emoji}</span>
                    <p style={{fontSize:"11px", fontWeight:700, lineHeight:1, color: active ? "white" : "#1A1A1A", letterSpacing:"0.01em"}}>{cfg.label}</p>
                    <p style={{fontSize:"10px", marginTop:"3px", color: active ? "rgba(255,255,255,0.5)" : "#8A8580"}}>{cfg.desc}</p>
                  </button>
                );
              })}
            </div>

            <div style={{position:"relative", marginBottom:"8px"}}>
              {(() => {
                const enabled = canGenerate;
                return (
                  <button type="button" onClick={handleRegenerate}
                    disabled={loading || !enabled || generating}
                    style={{
                      width:"100%", borderRadius:"14px", padding:"16px",
                      background: enabled ? "#1A1A1A" : "rgba(0,0,0,0.12)",
                      color:"white", border:"none", cursor: enabled ? "pointer" : "default",
                      fontSize:"13px", fontWeight:700, letterSpacing:"0.04em",
                      boxShadow: enabled ? "0 4px 20px rgba(0,0,0,0.25)" : "none",
                      transition:"all .2s cubic-bezier(0.16,1,0.3,1)",
                      opacity: (loading || generating) ? 0.8 : 1,
                    }}>
                    {generating ? (
                      <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:"10px"}}>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Styling you...</span>
                      </span>
                    ) : !canGenerate ? "Add top, bottom & shoes to start" : "✨ Style me"}
                  </button>
                );
              })()}
              {generating && (
                <div style={{position:"absolute", bottom:0, left:0, height:"2px", background:"rgba(255,255,255,0.5)", borderRadius:"2px", transition:"width .2s", width:`${genProgress}%`}} />
              )}
            </div>

            {pinnedItemIds.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-neutral-400">Locked:</span>
                {pinnedItems.map(p => (
                  <span key={p.id} className="rounded-full bg-black text-white px-3 py-1 flex items-center gap-1 text-xs">
                    🔒 {String(p.type).replace(/_/g, " ")}
                    <button type="button" className="ml-1 opacity-60 hover:opacity-100"
                      onClick={() => setPinnedItemIds(prev => prev.filter(id => id !== p.id))}>×</button>
                  </span>
                ))}
                <button type="button" className="text-xs text-neutral-400 underline"
                  onClick={() => setPinnedItemIds([])}>Clear</button>
              </div>
            )}

            {status && (
              <div style={{
                marginBottom:"12px", borderRadius:"12px", padding:"12px 16px", fontSize:"13px",
                background: (status.includes("✅") || status.includes("👍")) ? "#F0FDF4" : "white",
                color: (status.includes("✅") || status.includes("👍")) ? "#166534" : "#6B6B6B",
                boxShadow:"0 1px 3px rgba(0,0,0,0.06)",
              }}>{status}</div>
            )}

            {generated && currentLook && (
              <div className="mt-2">
                <AnimatedOutfit key={outfitKey} index={0} triggerKey={outfitKey}>
                  <OutfitFlatLay
                    outfit={currentLook}
                    context={{ occasion, tempC: lookTemp ?? MILD_DEFAULT_TEMP, isRaining: lookRain }}
                    allItems={filteredItems}
                    gender={gender}
                    votedItemIds={votedItemIds}
                    pinnedItemIds={pinnedItemIds}
                    onTogglePin={handlePinWithHaptic}
                    onLike={picks => onLike(currentLook, picks)}
                    onSkip={() => onSkip(currentLook)}
                    onShare={picks => setShareOutfit({ ...currentLook, picks })}
                    position={outfits && outfits.length > 1 ? { index: lookIndex, total: outfits.length } : undefined}
                  />
                </AnimatedOutfit>
                {outfits && currentLook.outfit_hash !== "empty" && (
                  <button type="button" onClick={showNextLook}
                    className="mt-3 w-full rounded-2xl border border-black/10 bg-white py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition active:scale-[0.98]">
                    ↻ Another look
                  </button>
                )}
              </div>
            )}

            {!canGenerate && items.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-black/8 p-8 text-center">
                <p className="text-2xl mb-3">{gender === "female" ? "👗" : "👔"}</p>
                <p className="font-bold text-sm mb-1">Your wardrobe is empty</p>
                <p className="text-xs text-neutral-400 mb-5">Add at least 1 top, 1 bottom, and 1 shoes</p>
                <div className="flex gap-2 justify-center">
                  <button type="button" onClick={() => setView("add")}
                    className="rounded-full bg-black text-white px-4 py-2.5 text-xs font-bold active:scale-[0.96]">Add Item</button>
                  <button type="button" onClick={() => setShowBulkUpload(true)}
                    className="rounded-full border border-black/15 px-4 py-2.5 text-xs font-semibold hover:bg-neutral-50 transition">📷 Bulk</button>
                </div>
              </div>
            )}

            <div className="mt-4"><StyleHistory /></div>
            <CoupleMode myItems={items} myGender={gender} />

            {(
              <div style={{marginTop:"16px"}}>
                <Link href="/trip" style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  borderRadius:"14px", background:"#1A1A1A", color:"white",
                  padding:"16px 20px", textDecoration:"none",
                  boxShadow:"0 4px 16px rgba(0,0,0,0.2)",
                }}>
                  <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
                    <span style={{fontSize:"20px"}}>✈️</span>
                    <div>
                      <p style={{fontWeight:700, fontSize:"13px"}}>Trip Planner</p>
                      <p style={{fontSize:"11px", color:"rgba(255,255,255,0.45)", marginTop:"2px"}}>Plan outfits for your next trip</p>
                    </div>
                  </div>
                  <span style={{color:"rgba(255,255,255,0.4)", fontSize:"16px"}}>→</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {view === "wardrobe" && (
          <div className="mt-4 page-enter">
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px"}}>
              <div>
                <h2 style={{fontFamily:"'Cormorant', Georgia, serif", fontSize:"28px", fontWeight:400, letterSpacing:"-0.01em", color:"#1A1A1A", lineHeight:1.1}}>Wardrobe</h2>
                <p style={{fontSize:"12px", color:"#8A8580", marginTop:"2px"}}>
                  {items.length} item{items.length === 1 ? "" : "s"}
                </p>
              </div>
              <div style={{display:"flex", gap:"8px"}}>
                <button type="button" onClick={() => setShowMissingPiece(true)}
                  style={{borderRadius:"999px", border:"1px solid rgba(0,0,0,0.1)", padding:"6px 12px", fontSize:"11px", fontWeight:600, background:"white", cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
                  🧩
                </button>
                <button type="button" onClick={() => setShowBulkUpload(true)}
                  style={{borderRadius:"999px", border:"1px solid rgba(0,0,0,0.1)", padding:"6px 12px", fontSize:"11px", fontWeight:600, background:"white", cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
                  📷 Bulk
                </button>
                <button type="button" onClick={() => setView("add")}
                  style={{borderRadius:"999px", border:"none", padding:"6px 14px", fontSize:"11px", fontWeight:700, background:"#1A1A1A", color:"white", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
                  + Add
                </button>
              </div>
            </div>

            <div style={{display:"flex", gap:"6px", marginBottom:"16px", overflowX:"auto", paddingBottom:"4px", scrollbarWidth:"none"}}>
              {CATEGORIES.map(c => ({
                id: c, label: CATEGORY_LABEL[c].many, emoji: categoryEmoji(c, gender),
                count: items.filter(i => i.category === c).length,
              })).map(tab => (
                <button key={tab.id} type="button"
                  onClick={() => setWardrobeTab(tab.id)}
                  style={{
                    display:"flex", alignItems:"center", gap:"6px", flexShrink:0,
                    borderRadius:"999px", padding:"8px 16px", border:"none", cursor:"pointer",
                    fontSize:"12px", fontWeight:700, whiteSpace:"nowrap",
                    transition:"all .2s cubic-bezier(0.16,1,0.3,1)",
                    background: wardrobeTab === tab.id ? "#1A1A1A" : "white",
                    color: wardrobeTab === tab.id ? "white" : "#6B6B6B",
                    boxShadow: wardrobeTab === tab.id ? "0 2px 10px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.06)",
                  }}>
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span style={{
                      borderRadius:"999px", padding:"1px 7px", fontSize:"10px", fontWeight:700,
                      background: wardrobeTab === tab.id ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.07)",
                      color: wardrobeTab === tab.id ? "white" : "#6B6B6B",
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {(() => {
              const filtered = items.filter(i => i.category === wardrobeTab);
              if (filtered.length === 0) {
                return (
                  <div className="rounded-2xl border-2 border-dashed border-black/8 p-8 text-center">
                    <p className="text-2xl mb-2">{categoryEmoji(wardrobeTab, gender)}</p>
                    <p className="font-bold text-sm mb-1">No {CATEGORY_LABEL[wardrobeTab].many.toLowerCase()} yet</p>
                    <p className="text-xs text-neutral-400 mb-4">Add your first {CATEGORY_LABEL[wardrobeTab].one} to get started</p>
                    <button type="button" onClick={() => { setCategory(wardrobeTab); setType(""); setView("add"); }}
                      className="rounded-full bg-black text-white px-4 py-2 text-xs font-bold">
                      + Add {CATEGORY_LABEL[wardrobeTab].one}
                    </button>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map((it: any, idx: number) => {
                    const isPinned = pinnedItemIds.includes(it.id);
                    const isFilteredOut = weatherEnabled && weather && !filteredItems.find(f => f.id === it.id);
                    return (
                      <WardrobeCard key={it.id} it={it} idx={idx} isPinned={isPinned}
                        isFilteredOut={!!isFilteredOut} cpw={getCostPerWear(it)} gender={gender}
                        colorDot={COLOR_DOT[it.color_family] ?? "bg-neutral-300"}
                        onPin={() => handlePinWithHaptic(it.id)}
                        onDelete={() => onDeleteItem(it.id)} />
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {view === "add" && (
          <div className="mt-4 page-enter">
            <h2 style={{fontFamily:"'Cormorant', Georgia, serif", fontSize:"28px", fontWeight:400, letterSpacing:"-0.01em", color:"#1A1A1A", lineHeight:1.1, marginBottom:"4px"}}>Add Item</h2>
            <p style={{fontSize:"12px", color:"#8A8580", marginBottom:"24px"}}>Add a piece from your wardrobe</p>

            {(
              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} type="button"
                        className={"rounded-xl border-2 py-4 text-sm font-bold transition active:scale-[0.96] " +
                          (category === c ? "bg-black text-white border-black" : "border-black/10 hover:border-black/20")}
                        onClick={() => { setCategory(c); setType(""); }}>
                        {categoryEmoji(c, gender)} {c === "outerwear" ? "Outerwear" : c[0].toUpperCase() + c.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">Type</label>
                  <select className="w-full rounded-xl border-2 border-black/10 px-4 py-3.5 bg-white text-sm focus:outline-none focus:border-black/25"
                    value={type} onChange={e => setType(e.target.value)}>
                    <option value="">— select type —</option>
                    {/* The photo AI can name a type that isn't in the short list (e.g.
                        "zip_hoodie") - show it instead of a blank select. */}
                    {type && !(TYPE_OPTIONS[category] ?? []).includes(type) && (
                      <option value={type}>{type.replace(/_/g, " ")}</option>
                    )}
                    {(TYPE_OPTIONS[category] ?? []).map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {(COLOR_FAMILIES.includes(colorFamily) ? COLOR_FAMILIES : [colorFamily, ...COLOR_FAMILIES]).map(c => (
                      <button key={c} type="button"
                        className={"rounded-full border-2 px-3 py-1.5 text-xs font-medium transition capitalize active:scale-[0.94] " +
                          (colorFamily === c ? "bg-black text-white border-black" : "border-black/10 hover:border-black/20")}
                        onClick={() => setColorFamily(c)}>{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">Photo (optional)</label>
                  <PhotoUpload file={photoFile} onChange={(f: File | null) => { setPhotoFile(f); if (!f) { setCleanBlob(null); setAiTags(null); } }}
                    onAnalysis={(r: AIAnalysis) => {
                      setCategory(r.category as any);
                      setType(r.type);
                      setColorFamily(r.color_family);
                      setAiTags(r);
                    }}
                    onCleanBlob={(blob: Blob) => setCleanBlob(blob)} />
                </div>
                {status && (
                  <div className={`rounded-xl px-4 py-3 text-sm ${status.includes("✅") ? "bg-green-50 text-green-700 border border-green-100" : "bg-neutral-50 border border-black/8 text-neutral-600"}`}>
                    {status}
                  </div>
                )}
                <button type="button" onClick={onSaveItem} disabled={loading || !type}
                  style={{borderRadius:"12px", background:"#1A1A1A", color:"white", padding:"16px", fontSize:"13px", fontWeight:700, border:"none", cursor:"pointer", width:"100%", boxShadow:"0 4px 16px rgba(0,0,0,0.2)", letterSpacing:"0.03em"}}>
                  {loading ? "Saving..." : "Add to Wardrobe"}
                </button>
              </div>
            )}
          </div>
        )}

        {view === "profile" && (
          <div className="mt-4 flex flex-col gap-3 page-enter">
            <div>
              <h2 style={{fontFamily:"'Cormorant', Georgia, serif", fontSize:"28px", fontWeight:400, letterSpacing:"-0.01em", color:"#1A1A1A", lineHeight:1.1, marginBottom:"4px"}}>Profile</h2>
              <p style={{fontSize:"12px", color:"#8A8580"}}>Your account</p>
            </div>

            <div className="rounded-2xl bg-white border border-black/6 p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-display text-lg font-black flex-shrink-0">
                  {user?.email?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="font-bold text-sm">{user?.email?.split("@")[0] ?? "—"}</p>
                  <p className="text-xs text-neutral-400">{user?.email}</p>
                </div>
              </div>
              <button onClick={handleSignOut}
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-medium hover:bg-neutral-50 transition text-left active:scale-[0.98]">
                Sign out
              </button>
            </div>

            <div className="rounded-2xl bg-white border border-black/6 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2">Early access</p>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Every feature is free while Occaswear is in early access. Paid plans will come later — you'll always be told before anything changes.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-black/6 divide-y divide-black/5">
              <Link href="/trip" className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition">
                <span className="text-sm font-medium">✈️ Trip Planner</span>
                <span className="text-neutral-400 text-sm">→</span>
              </Link>
              <Link href="/settings" className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition">
                <span className="text-sm font-medium">⚙️ Settings & account</span>
                <span className="text-neutral-400 text-sm">→</span>
              </Link>
              <button type="button" onClick={() => setShowSupport(true)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition text-left">
                <span className="text-sm font-medium">💬 Chat with support</span>
                <span className="text-neutral-400 text-sm">→</span>
              </button>
              <a href="mailto:contact@occaswear.com" className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition">
                <span className="text-sm font-medium">✉️ Email support</span>
                <span className="text-neutral-400 text-sm">→</span>
              </a>
            </div>

            <div className="flex justify-center gap-4 py-2 text-xs text-neutral-400">
              <Link href="/privacy" className="hover:text-black transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-black transition">Terms of Service</Link>
            </div>


          </div>
        )}
      </div>

      {showMissingPiece && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm overlay-enter" onClick={() => setShowMissingPiece(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[85vh] overflow-y-auto drawer-enter"
            style={{ background:"#FAF8F5", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-200" />
            </div>
            <div className="px-5 pb-8 pt-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 style={{fontFamily:"'Cormorant', Georgia, serif", fontSize:"24px", fontWeight:400, letterSpacing:"-0.01em", color:"#1A1A1A"}}>Missing Pieces</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Based on your wardrobe</p>
                </div>
                <button type="button" onClick={() => setShowMissingPiece(false)}
                  className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition">
                  ✕
                </button>
              </div>
              {items.length < 3 ? (
                <p className="text-sm text-neutral-400 text-center py-8">Add at least 3 items to see suggestions.</p>
              ) : (
                <MissingPieceDrawerContent items={items} gender={gender} />
              )}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          FLOATING ISLAND NAVIGATION — Premium Bar
          - mx-4 mb-6 margins (lundrues)
          - rounded-full (kapsule)
          - bg-white/80 + backdrop-blur-md
          - shadow-xl (premium soft shadow)
          - Lucide icons (jo emoji)
          - Active state: icon color black, dot poshtë (jo bllok bllok)
      ════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: 0,
          right: 0,
          zIndex: 40,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "8px",
            borderRadius: "9999px",
            background: "rgba(255, 255, 255, 0.78)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            boxShadow:
              "0 16px 48px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)",
            border: "1px solid rgba(255,255,255,0.6)",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {NAV_TABS.map(tab => {
            const isActive = view === tab.id;
            const Icon = tab.Icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id as any)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "3px",
                  padding: "10px 16px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  borderRadius: "9999px",
                  transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={{
                    color: isActive ? "#1A1A1A" : "#A8A39B",
                    transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                    transform: isActive ? "scale(1.08)" : "scale(1)",
                  }}
                />
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: "0.06em",
                    color: isActive ? "#1A1A1A" : "#A8A39B",
                    transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                    textTransform: "uppercase",
                  }}
                >
                  {tab.label}
                </span>
                {/* Active dot indicator */}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "3px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      background: "#1A1A1A",
                      transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {shareOutfit       && <ShareCard outfit={shareOutfit} onClose={() => setShareOutfit(null)} gender={gender} />}
      {showBulkUpload    && <BulkUpload onComplete={handleBulkComplete} onClose={() => setShowBulkUpload(false)} />}
      {showLocationModal && <LocationModal onAllow={handleLocationAllow} onDeny={handleLocationDeny} />}
      <AISupport open={showSupport} onClose={() => setShowSupport(false)} />
      <AIStyleCoach />
    </div>
  );
}