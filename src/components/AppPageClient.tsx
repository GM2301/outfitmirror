"use client";

import * as React from "react";
import { Sparkles, Shirt, Plus, User, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Item, Category, ItemType, Gender, VotedItemIds } from "@/lib/engine/types";
import { generateOutfits } from "@/lib/engine/generate";
import { getBrowserLocation, fetchWeather } from "@/lib/weather";
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
import OutfitOfTheWeek from "@/components/OutfitOfTheWeek";
import CoupleMode from "@/components/CoupleMode";
import Link from "next/link";

type Occasion = "work" | "date" | "casual" | "night_out" | "travel" | "gym";
type Plan = "free" | "pro";
type Props = { initialItems?: Item[] };

const OCCASIONS: Occasion[] = ["work", "date", "casual", "night_out", "travel", "gym"];
const CATEGORIES = ["top", "bottom", "shoes", "accessory"] as const;

const COLOR_FAMILIES = [
  "neutral","earth","black","white","blue","bright",
  "green","red","pink","purple","orange","yellow",
];

const TYPE_OPTIONS_MALE: Record<string, string[]> = {
  top:    ["tee","polo","shirt","sweater","hoodie","jacket","blazer","tank","henley","crewneck"],
  bottom: ["jeans","chinos","trousers","shorts","joggers","sweatpants","cargo"],
  shoes:  ["sneakers","running_shoes","boots","dress_shoes","loafers","sandals","chelsea_boots"],
  accessory: ["watch","belt","cap","sunglasses","bag","scarf","bracelet"],
};

const TYPE_OPTIONS_FEMALE: Record<string, string[]> = {
  top:    ["blouse","tee","crop_top","shirt","knit","blazer","tank","cardigan","bodysuit"],
  bottom: ["jeans","trousers","midi_skirt","mini_skirt","leggings","shorts","wide_leg_pants"],
  shoes:  ["sneakers","heels","boots","ankle_boots","ballet_flats","loafers","mules","sandals"],
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
};

const COLOR_DOT: Record<string, string> = {
  black: "bg-neutral-900", white: "bg-white border border-black/15",
  neutral: "bg-stone-300", earth: "bg-amber-300", blue: "bg-sky-400",
  bright: "bg-violet-400", green: "bg-emerald-400", red: "bg-red-400",
  pink: "bg-pink-400", purple: "bg-purple-400", orange: "bg-orange-400", yellow: "bg-yellow-300",
};

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
  return items.filter(item => {
    const type = String(item.type).toLowerCase();
    const t = weather.tempC;
    if (t > 28 && (type.includes("hoodie") || type.includes("sweater") || type.includes("jacket"))) return false;
    if (t < 12 && (type.includes("tank") || type.includes("shorts") || type.includes("sandal"))) return false;
    if (weather.isRaining && type.includes("sandal")) return false;
    return true;
  });
}

function getCostPerWear(item: Item): string | null {
  if (!item.price || !item.wear_count || item.wear_count === 0) return null;
  const cpw = item.price / item.wear_count;
  return cpw < 1 ? `$${cpw.toFixed(2)}` : `$${Math.round(cpw)}`;
}

// ════════════════════════════════════════════════════════════════════════════
// V12 STORAGE HELPERS — vote per-item
// ════════════════════════════════════════════════════════════════════════════
function loadVotedItemIds(): VotedItemIds {
  if (typeof window === "undefined") return { liked: [], disliked: [] };
  try {
    const raw = localStorage.getItem("om_voted_items");
    if (!raw) return { liked: [], disliked: [] };
    const parsed = JSON.parse(raw);
    return {
      liked: Array.isArray(parsed.liked) ? parsed.liked : [],
      disliked: Array.isArray(parsed.disliked) ? parsed.disliked : [],
    };
  } catch {
    return { liked: [], disliked: [] };
  }
}

function saveVotedItemIds(v: VotedItemIds) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem("om_voted_items", JSON.stringify(v)); } catch {}
}

function loadRecentItemIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("om_recent_items");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch {
    return [];
  }
}

function pushRecentItemIds(itemIds: string[]) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadRecentItemIds();
    const merged = [...itemIds, ...existing.filter(id => !itemIds.includes(id))].slice(0, 30);
    localStorage.setItem("om_recent_items", JSON.stringify(merged));
  } catch {}
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
  const icons = gender === "female"
    ? { top: "👚", bottom: "👗", shoes: "👠" }
    : { top: "👕", bottom: "👖", shoes: "👟" };
  return (
    <div className={`aspect-square ${bg} flex flex-col items-center justify-center gap-1`}>
      <span className="text-3xl">{icons[item.category as keyof typeof icons] ?? "👕"}</span>
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

function FeatureLock({ title, desc, requiredPlan }: { title: string; desc: string; requiredPlan: "pro" | "premium" }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-black/10 p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-2xl mx-auto mb-4">🔒</div>
      <p className="font-display font-black text-base mb-1">{title}</p>
      <p className="text-xs text-neutral-500 mb-4 leading-relaxed">{desc}</p>
      <Link href="/pricing"
        className="inline-block rounded-full bg-black text-white px-5 py-2 text-xs font-bold hover:bg-black/85 transition">
        Upgrade →
      </Link>
    </div>
  );
}

function AppSettingsDrawer({ open, onClose, gender, weatherEnabled, onGenderChange, onWeatherToggle, onOpenOnboarding }: {
  open: boolean; onClose: () => void;
  gender: Gender; weatherEnabled: boolean;
  onGenderChange: (g: Gender) => void;
  onWeatherToggle: () => void;
  onOpenOnboarding: () => void;
}) {
  const [scheduleEnabled, setScheduleEnabled] = React.useState(false);
  const [scheduleTime, setScheduleTime] = React.useState("07:30");
  const [scheduleOccasion, setScheduleOccasion] = React.useState("work");

  const SCHEDULE_OCCASIONS = [
    { v: "work", e: "💼" }, { v: "casual", e: "☀️" }, { v: "date", e: "🌹" },
    { v: "night_out", e: "🌑" }, { v: "travel", e: "✈️" }, { v: "gym", e: "💪" },
  ];

  React.useEffect(() => {
    setScheduleEnabled(localStorage.getItem("om_schedule_enabled") === "1");
    setScheduleTime(localStorage.getItem("om_schedule_time") || "07:30");
    setScheduleOccasion(localStorage.getItem("om_schedule_occasion") || "work");
  }, [open]);

  async function handleScheduleSave() {
    if ("Notification" in window && Notification.permission !== "granted") {
      const p = await Notification.requestPermission();
      if (p !== "granted") return;
    }
    localStorage.setItem("om_schedule_enabled", "1");
    localStorage.setItem("om_schedule_time", scheduleTime);
    localStorage.setItem("om_schedule_occasion", scheduleOccasion);
    setScheduleEnabled(true);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Occaswear ✨", {
        body: `Daily outfit set for ${scheduleTime}. See you tomorrow!`,
        icon: "/icon-192.png",
      });
    }
    onClose();
  }

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

          <div className="border-t border-black/6 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-sm">Daily Outfit</p>
                <p className="text-xs text-neutral-400 mt-0.5">Get a notification with your outfit every day</p>
              </div>
              {scheduleEnabled && <span className="text-xs text-green-600 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> On</span>}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">Time</label>
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                  className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-black/8" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">Occasion</label>
                <div className="flex flex-wrap gap-1.5">
                  {SCHEDULE_OCCASIONS.map(o => (
                    <button key={o.v} type="button" onClick={() => setScheduleOccasion(o.v)}
                      className={"rounded-full w-8 h-8 text-sm border-2 transition " +
                        (scheduleOccasion === o.v ? "border-black bg-black" : "border-black/10")}>
                      {o.e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button type="button" onClick={handleScheduleSave}
              className="w-full rounded-xl bg-black text-white py-3 text-sm font-bold hover:bg-black/85 transition active:scale-[0.98]">
              {scheduleEnabled ? "Update Schedule" : "Enable Daily Outfit"}
            </button>
            {scheduleEnabled && (
              <button type="button" onClick={() => { setScheduleEnabled(false); localStorage.setItem("om_schedule_enabled","0"); }}
                className="w-full rounded-xl border border-black/10 py-2.5 text-sm text-neutral-500 mt-2 hover:bg-neutral-50 transition">
                Disable
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const TAG_CONFIG = {
  Essential: { bg: "bg-black",       text: "text-white" },
  Versatile: { bg: "bg-neutral-800", text: "text-white" },
  Upgrade:   { bg: "bg-neutral-100", text: "text-neutral-700" },
  Color:     { bg: "bg-amber-50",    text: "text-amber-700" },
};

const CATEGORY_EMOJI: Record<string, string> = {
  top: "👕", bottom: "👖", shoes: "👟", accessory: "💍",
};

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
        <MissingPieceCard key={i} piece={piece} gender={gender} />
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

      <p className="text-xs text-neutral-300 text-center">Affiliate links — we may earn a small commission</p>
    </div>
  );
}

export default function AppPageClient({ initialItems }: Props) {
  const supabase = React.useMemo(() => createClient(), []);

  const [plan, setPlan] = React.useState<Plan>(() => {
    if (typeof window === "undefined") return "free";
    const p = localStorage.getItem("om_plan");
    return (p === "pro" ? "pro" : "free") as Plan;
  });

  const [gender, setGender] = React.useState<Gender>(() => {
    if (typeof window === "undefined") return "male";
    return (localStorage.getItem("om_gender") as Gender) ?? "male";
  });
  const [style] = React.useState<string>(() => {
    if (typeof window === "undefined") return "minimal";
    return localStorage.getItem("om_style") ?? "minimal";
  });
  const [showOnboarding, setShowOnboarding] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("om_onboarding_done") !== "1";
  });
  const [showSettings, setShowSettings] = React.useState(false);

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
  const [wardrobeTab, setWardrobeTab] = React.useState<"top" | "bottom" | "shoes" | "accessory">("top");
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
  function handleGenderChange(g: Gender) {
    setGender(g); localStorage.setItem("om_gender", g);
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

  const pinnedItems = React.useMemo(() =>
    items.filter(i => pinnedItemIds.includes(i.id)),
  [items, pinnedItemIds]);

  const outfits = React.useMemo(() => {
    if (!generated || seed === null || !canGenerate) return null;
    return generateOutfits(filteredItems, occasion as any, seed, {
      pinnedItemIds,
      votedItemIds,
      recentItemIds: loadRecentItemIds(),
      gender,
      style,
      tempC: weather?.tempC,
    });
  }, [filteredItems, occasion, generated, seed, canGenerate, pinnedItemIds, votedItemIds, gender, style, weather]);

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

  function saveToHistory(outfit: any) {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      occasion, label: outfit.label, score: outfit.score,
      top: outfit.picks?.top?.type, bottom: outfit.picks?.bottom?.type, shoes: outfit.picks?.shoes?.type,
    };
    const updated = [entry, ...outfitHistory].slice(0, 30);
    setOutfitHistory(updated);
    localStorage.setItem("om_outfit_history", JSON.stringify(updated));
  }

  const uploadPhotoIfAny = React.useCallback(async (userId: string): Promise<string | null> => {
    if (!photoFile) return null;
    const fileToUpload = cleanBlob
      ? new File([cleanBlob], photoFile.name.replace(/\.[^.]+$/, ".png"), { type: "image/png" })
      : photoFile;
    const ext = cleanBlob ? ".png" : photoFile.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${Date.now()}_clean.${ext}`;
    const { error } = await supabase.storage.from("wardrobe").upload(path, fileToUpload, { upsert: true });
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
    setLoading(true);
    await supabase.from("items").delete().eq("id", id);
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
  }, [supabase]);

  const onVote = React.useCallback(async (outfit: any, vote: "up" | "down") => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;

    const itemIds: string[] = [];
    if (outfit?.picks?.top?.id) itemIds.push(outfit.picks.top.id);
    if (outfit?.picks?.bottom?.id) itemIds.push(outfit.picks.bottom.id);
    if (outfit?.picks?.shoes?.id) itemIds.push(outfit.picks.shoes.id);
    if (outfit?.picks?.outer?.id) itemIds.push(outfit.picks.outer.id);

    const realIds = itemIds.filter(id => id && !id.startsWith("gap-") && id !== "missing" && id !== "wardrobe-gap" && id !== "no-recipe");

    if (vote === "up") {
      saveToHistory(outfit);
      pushRecentItemIds(realIds);
      setVotedItemIds(prev => {
        const next: VotedItemIds = {
          liked: Array.from(new Set([...prev.liked, ...realIds])),
          disliked: prev.disliked.filter(id => !realIds.includes(id)),
        };
        saveVotedItemIds(next);
        return next;
      });
    } else {
      setVotedItemIds(prev => {
        const next: VotedItemIds = {
          liked: prev.liked.filter(id => !realIds.includes(id)),
          disliked: Array.from(new Set([...prev.disliked, ...realIds])),
        };
        saveVotedItemIds(next);
        return next;
      });
    }

    await supabase.from("feedback").insert({
      user_id: u.id, occasion, outfit_hash: outfit?.outfit_hash ?? null, vote,
      top_id: outfit?.picks?.top?.id ?? null, bottom_id: outfit?.picks?.bottom?.id ?? null, shoes_id: outfit?.picks?.shoes?.id ?? null,
    });
    setStatus(vote === "up" ? "Saved 👍" : "Noted 👎");
  }, [supabase, occasion, outfitHistory]);

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
        const path = `${u.id}/${Date.now()}_${b.file.name.replace(/[^a-z0-9._-]/gi, "_").toLowerCase()}`;
        await supabase.storage.from("wardrobe").upload(path, b.file, { upsert: true });
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

  const PLAN_LABEL: Record<Plan, { label: string; color: string }> = {
    free: { label: "Free", color: "bg-neutral-100 text-neutral-600" },
    pro:  { label: "Pro",  color: "bg-black text-white" },
  };

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
        onGenderChange={handleGenderChange}
        onWeatherToggle={handleWeatherToggle}
        onOpenOnboarding={() => { setShowSettings(false); setShowOnboarding(true); }}
      />

      <div className="mx-auto w-full max-w-2xl px-4 pb-32">

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

            <div style={{position:"relative", marginBottom:"16px"}}>
              <button type="button" onClick={handleRegenerate}
                disabled={loading || !canGenerate || generating}
                style={{
                  width:"100%", borderRadius:"14px", padding:"16px",
                  background: canGenerate ? "#1A1A1A" : "rgba(0,0,0,0.12)",
                  color:"white", border:"none", cursor: canGenerate ? "pointer" : "default",
                  fontSize:"13px", fontWeight:700, letterSpacing:"0.04em",
                  boxShadow: canGenerate ? "0 4px 20px rgba(0,0,0,0.25)" : "none",
                  transition:"all .2s cubic-bezier(0.16,1,0.3,1)",
                  opacity: (loading || generating) ? 0.8 : 1,
                }}>
                {generating ? (
                  <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:"10px"}}>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Styling you...</span>
                  </span>
                ) : !canGenerate ? "Add top, bottom & shoes to start" : "✨ Generate Outfits"}
              </button>
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

            {generated && outfits && (
              <div className="mt-2">
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px"}}>
                  <p style={{fontSize:"10px", fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"#8A8580"}}>Your Outfits</p>
                  <p style={{fontSize:"11px", color:"#8A8580"}}>{outfits.length} looks · swipe →</p>
                </div>
                <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "8px", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {outfits.map((o: any, i: number) => (
                    <AnimatedOutfit key={`${outfitKey}-${o.label}`} index={i} triggerKey={outfitKey}>
                      <div style={{ scrollSnapAlign: "start", width: "82vw", maxWidth: "320px", minWidth: "260px", flexShrink: 0 }}>
                        <OutfitFlatLay outfit={o} onVote={vote => onVote(o, vote)} onShare={() => setShareOutfit(o)} gender={gender} allItems={items} />
                      </div>
                    </AnimatedOutfit>
                  ))}
                </div>
                <div className="flex justify-center gap-2 mt-3">
                  {outfits.map((_: any, i: number) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-black/20" />)}
                </div>
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
            <OutfitOfTheWeek />
            <CoupleMode myItems={items} myGender={gender} />

            {plan === "pro" && (
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
                  {items.filter(i=>i.category==="top").length}T · {items.filter(i=>i.category==="bottom").length}B · {items.filter(i=>i.category==="shoes").length}S · {items.filter(i=>i.category==="accessory").length}A
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

            {plan === "free" && items.length >= 8 && items.length <= 10 && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-xs text-amber-800 font-medium">{items.length}/10 items · Free plan limit</p>
                <Link href="/pricing" className="rounded-full bg-black text-white px-3 py-1.5 text-xs font-bold">Upgrade</Link>
              </div>
            )}

            <div style={{display:"flex", gap:"6px", marginBottom:"16px", overflowX:"auto", paddingBottom:"4px", scrollbarWidth:"none"}}>
              {([
                { id: "top",       label: "Tops",        emoji: gender === "female" ? "👚" : "👕", count: items.filter(i=>i.category==="top").length },
                { id: "bottom",    label: "Bottoms",     emoji: gender === "female" ? "👗" : "👖", count: items.filter(i=>i.category==="bottom").length },
                { id: "shoes",     label: "Shoes",       emoji: gender === "female" ? "👠" : "👟", count: items.filter(i=>i.category==="shoes").length },
                { id: "accessory", label: "Accessories", emoji: "💍",                               count: items.filter(i=>i.category==="accessory").length },
              ] as const).map(tab => (
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
                    <p className="text-2xl mb-2">
                      {wardrobeTab === "top" ? (gender === "female" ? "👚" : "👕") :
                       wardrobeTab === "bottom" ? (gender === "female" ? "👗" : "👖") :
                       wardrobeTab === "shoes" ? (gender === "female" ? "👠" : "👟") : "💍"}
                    </p>
                    <p className="font-bold text-sm mb-1">No {wardrobeTab}s yet</p>
                    <p className="text-xs text-neutral-400 mb-4">Add your first {wardrobeTab} to get started</p>
                    <button type="button" onClick={() => setView("add")}
                      className="rounded-full bg-black text-white px-4 py-2 text-xs font-bold">
                      + Add {wardrobeTab}
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

            {plan === "free" && items.length >= 10 ? (
              <FeatureLock
                title="Wardrobe limit reached"
                desc="Free plan allows up to 10 items. Upgrade to Pro for unlimited wardrobe items."
                requiredPlan="pro"
              />
            ) : (
              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} type="button"
                        className={"rounded-xl border-2 py-4 text-sm font-bold transition active:scale-[0.96] " +
                          (category === c ? "bg-black text-white border-black" : "border-black/10 hover:border-black/20")}
                        onClick={() => { setCategory(c); setType(""); }}>
                        {c === "top" ? "👕 Top" : c === "bottom" ? "👖 Bottom" : c === "shoes" ? "👟 Shoes" : "💍 Accessory"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">Type</label>
                  <select className="w-full rounded-xl border-2 border-black/10 px-4 py-3.5 bg-white text-sm focus:outline-none focus:border-black/25"
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
              <p style={{fontSize:"12px", color:"#8A8580"}}>Your account & subscription</p>
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
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">Subscription</p>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm capitalize">{plan} Plan</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PLAN_LABEL[plan].color}`}>
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {plan === "free" ? "10 items · 3 generations/day" :
                     plan === "pro"  ? "Unlimited items · Weather-aware" :
                     "Everything · Trip Planner · AI Assistant"}
                  </p>
                </div>
                {plan === "free" && (
                  <Link href="/pricing"
                    className="rounded-full bg-black text-white px-4 py-2 text-xs font-bold hover:bg-black/85 transition">
                    Upgrade →
                  </Link>
                )}
              </div>

              <div className="space-y-2">
                {[
                  { label: "Wardrobe items",    free: "10", pro: "∞" },
                  { label: "Outfit generations",free: "3/day", pro: "∞" },
                  { label: "Weather filtering", free: "✓",    pro: "✓" },
                  { label: "AI Style Assistant",free: "—",    pro: "✓" },
                  { label: "Trip Planner",       free: "—",    pro: "✓" },
                  { label: "Share cards",        free: "—",    pro: "✓" },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between py-1.5 border-b border-black/4 last:border-0">
                    <span className="text-xs text-neutral-500">{f.label}</span>
                    <span className={`text-xs font-bold ${
                      (plan === "free" ? f.free : (f as any).pro) === "—"
                        ? "text-neutral-300" : "text-black"
                    }`}>
                      {plan === "free" ? f.free : (f as any).pro}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-black/6 divide-y divide-black/5">
              <Link href="/pricing" className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition">
                <span className="text-sm font-medium">View all plans</span>
                <span className="text-neutral-400 text-sm">→</span>
              </Link>
              <Link href="/trip" className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition">
                <span className="text-sm font-medium">✈️ Trip Planner</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${plan === "pro" ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>
                  {plan === "pro" ? "Active" : "Premium"}
                </span>
              </Link>
            </div>

            <div className="rounded-2xl bg-white border border-black/6 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-1">Plan Preview</p>
              <p className="text-xs text-neutral-400 mb-3">Test how the app looks with each plan</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { p: "free", icon: "🔓", label: "Free" },
                  { p: "pro",  icon: "⚡", label: "Pro $4.99" },
                ] as const).map(item => (
                  <button key={item.p} type="button"
                    onClick={() => { localStorage.setItem("om_plan", item.p); window.location.reload(); }}
                    className={"rounded-xl border-2 py-3 text-xs font-bold transition active:scale-[0.95] " +
                      (plan === item.p ? "border-black bg-black text-white" : "border-black/10 hover:border-black/20")}>
                    <span className="block text-lg mb-0.5">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-neutral-300 py-2">Occaswear v1.0 · Web PWA</p>
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

      {shareOutfit       && <ShareCard outfit={shareOutfit} onClose={() => setShareOutfit(null)} />}
      {showBulkUpload    && <BulkUpload onComplete={handleBulkComplete} onClose={() => setShowBulkUpload(false)} />}
      {showLocationModal && <LocationModal onAllow={handleLocationAllow} onDeny={handleLocationDeny} />}
      {<AISupport />}
      {plan === "pro" && <AIStyleCoach items={items} />}
    </div>
  );
}