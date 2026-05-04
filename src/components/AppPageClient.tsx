"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { Item, Category, ItemType, Gender } from "@/lib/engine/types";
import { generateOutfits } from "@/lib/engine/generate";
import { getBrowserLocation, fetchWeather } from "@/lib/weather";
import type { WeatherContext } from "@/lib/weather";
import OutfitCard from "@/components/OutfitCard";
import OutfitFlatLay from "@/components/OutfitFlatLay";
import StyleHistory from "@/components/StyleHistory";
import WardrobeAnalytics from "@/components/WardrobeAnalytics";
import MissingPieceCard from "@/components/MissingPieceCard";
import { getMissingPiece } from "@/lib/engine/missingPiece";
import ShareCard from "@/components/ShareCard";
import AIStyleAssistant from "@/components/AIStyleAssistant";
import PhotoUpload, { type AIAnalysis } from "@/components/PhotoUpload";
import LocationModal from "@/components/LocationModal";
import BulkUpload, { type BulkItem } from "@/components/BulkUpload";
import OnboardingFlow from "@/components/OnboardingFlow";
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
        borderRadius: "18px", overflow: "hidden",
        border: isPinned ? "2px solid #000" : "1.5px solid rgba(0,0,0,0.08)",
        opacity: isFilteredOut ? 0.4 : 1, background: "white",
        transform: hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? "0 16px 40px rgba(0,0,0,0.13), 0 4px 12px rgba(0,0,0,0.07)"
          : "0 2px 10px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s ease",
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
      <div className="px-3 pt-2.5 pb-3" style={{ background: "white" }}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorDot}`} />
          <p className="font-bold text-xs capitalize truncate flex-1">{String(it.type).replace(/_/g, " ")}</p>
        </div>
        <p className="text-xs text-neutral-400 capitalize mb-2.5">{it.category}{cpw ? ` · ${cpw}/wear` : ""}</p>
        {unavailable && (
          <div className="mb-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-center">
            <p className="text-xs text-amber-700 font-medium">🧺 In the wash</p>
          </div>
        )}
        <div className="flex gap-1.5">
          <button type="button" onClick={onPin}
            className={"flex-1 rounded-xl py-2 text-xs font-bold transition border active:scale-[0.94] " +
              (isPinned ? "bg-black text-white border-black" : "border-black/10 hover:bg-neutral-50")}>
            {isPinned ? "🔒 Pinned" : "Pin"}
          </button>
          <button type="button" onClick={toggleUnavailable}
            className={"rounded-xl px-2.5 py-2 text-xs transition border active:scale-[0.94] " +
              (unavailable ? "bg-amber-50 text-amber-600 border-amber-200" : "text-neutral-400 hover:text-amber-500 hover:bg-amber-50 border-black/8")}>
            🧺
          </button>
          <button type="button" onClick={onDelete}
            className="rounded-xl px-2.5 py-2 text-xs text-neutral-400 hover:text-red-500 hover:bg-red-50 transition border border-black/8">✕</button>
        </div>
      </div>
    </div>
  );
}

// ── Feature Lock — për free users ────────────────────────────────────────────
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

// ── App Settings Drawer ───────────────────────────────────────────────────────
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-200" />
        </div>
        <div className="px-5 pb-8 pt-2">
          <h2 className="font-display font-black text-xl mb-5">App Settings</h2>

          {/* Gender */}
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Style</p>
            <div className="grid grid-cols-2 gap-2">
              {(["male","female"] as Gender[]).map(g => (
                <button key={g} type="button" onClick={() => { onGenderChange(g); }}
                  className={"rounded-xl border-2 py-3 text-sm font-bold transition active:scale-[0.96] " +
                    (gender === g ? "border-black bg-black text-white" : "border-black/10 hover:border-black/20")}>
                  {g === "male" ? "👔 Menswear" : "👗 Womenswear"}
                </button>
              ))}
            </div>
          </div>

          {/* Weather */}
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

          {/* Daily Outfit Schedule */}
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


// ── Missing Piece Drawer Content ─────────────────────────────────────────────
function MissingPieceDrawerContent({ items, gender }: { items: Item[]; gender: Gender }) {
  const tops    = items.filter(i => i.category === "top");
  const bottoms = items.filter(i => i.category === "bottom");
  const shoes   = items.filter(i => i.category === "shoes");
  const topTypes    = tops.map(i => String(i.type).toLowerCase());
  const bottomTypes = bottoms.map(i => String(i.type).toLowerCase());
  const shoeTypes   = shoes.map(i => String(i.type).toLowerCase());
  const allColors   = items.map(i => String(i.color_family).toLowerCase());
  const hasOnlyNeutrals = !allColors.some(c => !["neutral","black","white","earth"].includes(c));

  function amazonUrl(q: string) {
    return `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=outfitmirror-20`;
  }

  const suggestions: { title: string; reason: string; url: string; emoji: string }[] = [];

  if (gender === "female") {
    if (!shoeTypes.some(t => t.includes("boot") || t.includes("ankle")))
      suggestions.push({ title: "Ankle Boots", emoji: "👢",
        reason: "Works with jeans, skirts, midi dresses — the most versatile shoe.",
        url: amazonUrl("ankle boots women black") });
    if (!topTypes.some(t => t.includes("blazer")))
      suggestions.push({ title: "Oversized Blazer", emoji: "🧥",
        reason: "Elevates any outfit instantly — over a tee, dress, or trousers.",
        url: amazonUrl("oversized blazer women beige") });
    if (!bottomTypes.some(t => t.includes("midi")))
      suggestions.push({ title: "Midi Skirt", emoji: "👗",
        reason: "The most versatile bottom in womenswear. Dress up or down.",
        url: amazonUrl("midi skirt women neutral") });
    if (!shoeTypes.some(t => t.includes("heel") || t.includes("mule")))
      suggestions.push({ title: "Block Heel Mules", emoji: "👠",
        reason: "Elevates any look without the discomfort of stilettos.",
        url: amazonUrl("block heel mules women beige") });
    if (!topTypes.some(t => t.includes("knit") || t.includes("cardigan")))
      suggestions.push({ title: "Fitted Knit", emoji: "🧶",
        reason: "Layers over everything, works year-round.",
        url: amazonUrl("fitted knit top women neutral") });
    if (hasOnlyNeutrals && items.length >= 5)
      suggestions.push({ title: "Color Accent Piece", emoji: "🎨",
        reason: "Your wardrobe is all neutrals — one color piece adds variety.",
        url: amazonUrl("colorful top women") });
  } else {
    if (!shoeTypes.some(t => t.includes("dress") || t.includes("loafer") || t.includes("chelsea") || t.includes("boot")))
      suggestions.push({ title: "Chelsea Boots", emoji: "👞",
        reason: "No smart shoes. Chelsea boots unlock work, date & night out looks.",
        url: amazonUrl("chelsea boots men black") });
    if (!topTypes.some(t => t.includes("blazer")))
      suggestions.push({ title: "Navy Blazer", emoji: "🧥",
        reason: "Elevates every outfit you already own. Wear over tee or shirt.",
        url: amazonUrl("navy blazer men slim fit") });
    if (!shoeTypes.some(t => t.includes("sneaker")))
      suggestions.push({ title: "White Sneakers", emoji: "👟",
        reason: "Works with everything casual — jeans, chinos, shorts.",
        url: amazonUrl("white leather sneakers men") });
    if (!bottomTypes.some(t => t.includes("chino") || t.includes("trouser")))
      suggestions.push({ title: "Slim Chinos", emoji: "👖",
        reason: "Bridges casual and smart. More range than jeans alone.",
        url: amazonUrl("slim chinos men khaki") });
    if (!topTypes.some(t => t.includes("shirt") || t.includes("polo")))
      suggestions.push({ title: "White Oxford Shirt", emoji: "👔",
        reason: "The most versatile top in menswear. Works for everything.",
        url: amazonUrl("white oxford shirt men slim fit") });
    if (!topTypes.some(t => t.includes("sweater") || t.includes("crewneck")))
      suggestions.push({ title: "Crewneck Sweater", emoji: "🧣",
        reason: "Grey, beige, or navy — works for every occasion layered or alone.",
        url: amazonUrl("crewneck sweater men neutral beige") });
    if (hasOnlyNeutrals && items.length >= 5)
      suggestions.push({ title: "Olive Chinos", emoji: "🌿",
        reason: "Your wardrobe is all neutrals. Olive adds variety without clashing.",
        url: amazonUrl("olive chinos men slim") });
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-3">✅</p>
        <p className="font-bold text-sm">Your wardrobe is well-rounded!</p>
        <p className="text-xs text-neutral-400 mt-1">No major gaps found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {suggestions.map((s, i) => (
        <div key={i} className="rounded-2xl border border-black/8 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{s.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{s.title}</p>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{s.reason}</p>
            </div>
          </div>
          <a href={s.url} target="_blank" rel="noopener noreferrer"
            className="mt-3 flex items-center justify-between rounded-xl bg-black text-white px-4 py-2.5 hover:bg-black/85 transition active:scale-[0.98]">
            <span className="text-xs font-bold">Shop on Amazon</span>
            <span className="text-xs">→</span>
          </a>
        </div>
      ))}
      <p className="text-xs text-neutral-300 text-center pt-1">Affiliate links — we may earn a small commission</p>
    </div>
  );
}

export default function AppPageClient({ initialItems }: Props) {
  const supabase = React.useMemo(() => createClient(), []);

  // Plan — lexo nga localStorage (do integrohet me Paddle më vonë)
  const [plan, setPlan] = React.useState<Plan>(() => {
    if (typeof window === "undefined") return "free";
    const p = localStorage.getItem("om_plan");
    return (p === "pro" ? "pro" : "free") as Plan;
  });

  const [gender, setGender] = React.useState<Gender>(() => {
    if (typeof window === "undefined") return "male";
    return (localStorage.getItem("om_gender") as Gender) ?? "male";
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

  const [category, setCategory] = React.useState<string>("top");
  const [type, setType] = React.useState("");
  const [colorFamily, setColorFamily] = React.useState("neutral");
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [shareOutfit, setShareOutfit] = React.useState<any>(null);
  const [showLocationModal, setShowLocationModal] = React.useState(false);
  const [showBulkUpload, setShowBulkUpload] = React.useState(false);
  const [showMissingPiece, setShowMissingPiece] = React.useState(false);
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
      setWeather(await fetchWeather(lat, lon));
      setWeatherEnabled(true);
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

  const pinnedTop = React.useMemo(() => pinnedTopId ? items.find(x => x.id === pinnedTopId) : null, [items, pinnedTopId]);
  const pinnedBottom = React.useMemo(() => pinnedBottomId ? items.find(x => x.id === pinnedBottomId) : null, [items, pinnedBottomId]);
  const pinnedShoes = React.useMemo(() => pinnedShoesId ? items.find(x => x.id === pinnedShoesId) : null, [items, pinnedShoesId]);

  const outfits = React.useMemo(() => {
    if (!generated || seed === null || !canGenerate) return null;
    return generateOutfits(filteredItems, occasion as any, seed, { pinnedTopId, pinnedBottomId, pinnedShoesId, gender });
  }, [filteredItems, occasion, generated, seed, canGenerate, pinnedTopId, pinnedBottomId, pinnedShoesId, gender]);

  const [dismissedPieces, setDismissedPieces] = React.useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("om_mp_dismissed") ?? "[]"); } catch { return []; }
  });
  const [havePieces, setHavePieces] = React.useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("om_mp_have") ?? "[]"); } catch { return []; }
  });

  const missingPiece = React.useMemo(() => {
    // Gjenero të gjitha sugjerimet dhe filtro të dismissuarat
    const piece = getMissingPiece(items, gender);
    if (!piece) return null;
    if (dismissedPieces.includes(piece.title) || havePieces.includes(piece.title)) return null;
    return piece;
  }, [items, gender, dismissedPieces, havePieces]);

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

  function handlePinWithHaptic(cat: "top" | "bottom" | "shoes", id: string, isPinned: boolean) {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
    if (cat === "top") setPinnedTopId(isPinned ? null : id);
    if (cat === "bottom") setPinnedBottomId(isPinned ? null : id);
    if (cat === "shoes") setPinnedShoesId(isPinned ? null : id);
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
    const path = `${userId}/${Date.now()}_${norm(photoFile.name).replace(/[^a-z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("wardrobe").upload(path, photoFile, { upsert: true });
    if (error) throw new Error(error.message);
    return supabase.storage.from("wardrobe").getPublicUrl(path).data?.publicUrl ?? null;
  }, [supabase, photoFile]);

  const onSaveItem = React.useCallback(async () => {
    setStatus(null);
    if (!type) { setStatus("Please select a type."); return; }
    setLoading(true);
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) { setLoading(false); setStatus("Not logged in."); return; }
    let uploadedUrl: string | null = null;
    try { uploadedUrl = await uploadPhotoIfAny(u.id); }
    catch (e: any) { setLoading(false); setStatus(e.message ?? "Upload failed."); return; }
    const { data, error } = await supabase.from("items").insert({
      user_id: u.id, category, type: norm(type), color_family: norm(colorFamily || "neutral"), image_url: uploadedUrl,
    }).select("id").single();
    if (error) { setLoading(false); setStatus(error.message); return; }
    setItems(prev => [{ id: data.id, category: category as Category, type: norm(type) as ItemType, color_family: norm(colorFamily || "neutral") as any, image_url: uploadedUrl }, ...prev]);
    setType(""); setColorFamily("neutral"); setPhotoFile(null);
    setGenerated(false); setSeed(null); setLoading(false); setStatus("Saved ✅"); setView("wardrobe");
  }, [supabase, category, type, colorFamily, uploadPhotoIfAny]);

  const onDeleteItem = React.useCallback(async (id: string) => {
    setLoading(true);
    await supabase.from("items").delete().eq("id", id);
    setItems(prev => prev.filter(x => x.id !== id));
    setPinnedTopId(v => v === id ? null : v);
    setPinnedBottomId(v => v === id ? null : v);
    setPinnedShoesId(v => v === id ? null : v);
    setGenerated(false); setSeed(null); setLoading(false);
  }, [supabase]);

  const onVote = React.useCallback(async (outfit: any, vote: "up" | "down") => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    if (vote === "up") saveToHistory(outfit);
    await supabase.from("feedback").insert({
      user_id: u.id, occasion, outfit_hash: outfit?.outfit_hash ?? null, vote,
      top_id: outfit?.picks?.top?.id ?? null, bottom_id: outfit?.picks?.bottom?.id ?? null, shoes_id: outfit?.picks?.shoes?.id ?? null,
    });
    setStatus(vote === "up" ? "Saved 👍" : "Noted 👎");
  }, [supabase, occasion]);

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
        const { data } = await supabase.from("items").insert({
          user_id: u.id, category: b.analysis.category, type: norm(b.analysis.type),
          color_family: norm(b.analysis.color_family), image_url: url,
        }).select("id").single();
        if (data) saved.push({ id: data.id, category: b.analysis.category as Category, type: norm(b.analysis.type) as ItemType, color_family: norm(b.analysis.color_family) as any, image_url: url });
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

  // ── Bottom nav tabs ───────────────────────────────────────────────────────
  const NAV_TABS = [
    { id: "outfits",  label: "Outfits",  icon: "✨" },
    { id: "wardrobe", label: "Wardrobe", icon: gender === "female" ? "👗" : "👔" },
    { id: "add",      label: "Add",      icon: "+" },
    { id: "profile",  label: "Profile",  icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}

      {/* App Settings Drawer */}
      <AppSettingsDrawer
        open={showSettings} onClose={() => setShowSettings(false)}
        gender={gender} weatherEnabled={weatherEnabled}
        onGenderChange={handleGenderChange}
        onWeatherToggle={handleWeatherToggle}
        onOpenOnboarding={() => { setShowSettings(false); setShowOnboarding(true); }}
      />

      <div className="mx-auto w-full max-w-2xl px-4 pb-28">

        {/* ── APP HEADER ── */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <div>
            <p className="text-xs tracking-[0.2em] text-neutral-400 uppercase font-semibold">Occaswear</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Weather strip */}
            {weather && (
              <button type="button" onClick={handleWeatherToggle}
                className={"rounded-full px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 " +
                  (weatherEnabled ? "bg-black text-white" : "bg-neutral-100 text-neutral-500")}>
                <span>{weatherLabel(weather.tempC, weather.isRaining).split(" ")[0]}</span>
                <span>{Math.round(weather.tempC)}°C</span>
              </button>
            )}
            {weatherLoading && <div className="w-3 h-3 border border-black/20 border-t-black rounded-full animate-spin" />}
            {/* Settings button */}
            <button type="button" onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition text-base">
              ⚙️
            </button>
          </div>
        </div>

        {/* ── OUTFITS VIEW ── */}
        {view === "outfits" && (
          <div className="mt-1">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="font-display text-2xl font-black">Your Closet</h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {items.length} items · {gender === "female" ? "Womenswear" : "Menswear"}
                </p>
              </div>
              <button type="button" onClick={() => setShowBulkUpload(true)}
                className="text-xs font-bold border border-black/15 rounded-full px-3 py-1.5 hover:bg-neutral-50 transition">
                📷 Bulk
              </button>
            </div>

            {/* Occasion Cards */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {OCCASIONS.map(o => {
                const cfg = OCCASION_CONFIG[o];
                const active = o === occasion;
                return (
                  <button key={o} type="button"
                    onClick={() => { setOccasion(o); setGenerated(false); setSeed(null); }}
                    className={"rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.95] " +
                      (active ? "border-black bg-black text-white" : "border-black/8 bg-white hover:border-black/25")}>
                    <span className="text-xl block mb-1 leading-none">{cfg.emoji}</span>
                    <p className={"text-xs font-bold leading-none " + (active ? "text-white" : "text-black")}>{cfg.label}</p>
                    <p className={"text-xs mt-1 " + (active ? "text-white/55" : "text-neutral-400")}>{cfg.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Generate Button */}
            <div className="relative rounded-2xl overflow-hidden mb-4">
              <button type="button" onClick={handleRegenerate}
                disabled={loading || !canGenerate || generating}
                className={"w-full bg-black text-white py-4 text-sm font-bold transition-all disabled:opacity-30 " +
                  (generating ? "" : "hover:bg-black/85 active:scale-[0.98]")}>
                {generating ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                    <span className="font-display">Styling you...</span>
                  </span>
                ) : !canGenerate ? "Add top, bottom & shoes to start" : "✨ Generate Outfits"}
              </button>
              {generating && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-white/50 rounded-full transition-all duration-200"
                  style={{ width: `${genProgress}%` }} />
              )}
            </div>

            {/* Pins */}
            {(pinnedTopId || pinnedBottomId || pinnedShoesId) && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-neutral-400">Locked:</span>
                {(["top", "bottom", "shoes"] as const).map(cat => {
                  const pinned = cat === "top" ? pinnedTop : cat === "bottom" ? pinnedBottom : pinnedShoes;
                  if (!pinned) return null;
                  return (
                    <span key={cat} className="rounded-full bg-black text-white px-3 py-1 flex items-center gap-1 text-xs">
                      🔒 {String(pinned.type).replace(/_/g, " ")}
                      <button type="button" className="ml-1 opacity-60 hover:opacity-100"
                        onClick={() => { if (cat === "top") setPinnedTopId(null); if (cat === "bottom") setPinnedBottomId(null); if (cat === "shoes") setPinnedShoesId(null); }}>×</button>
                    </span>
                  );
                })}
                <button type="button" className="text-xs text-neutral-400 underline"
                  onClick={() => { setPinnedTopId(null); setPinnedBottomId(null); setPinnedShoesId(null); }}>Clear</button>
              </div>
            )}

            {/* Status */}
            {status && (
              <div className={`mb-3 rounded-xl px-4 py-3 text-sm ${
                status.includes("✅") || status.includes("👍") ? "bg-green-50 text-green-700 border border-green-100" : "bg-neutral-50 border border-black/6 text-neutral-600"
              }`}>{status}</div>
            )}

            {/* Outfits */}
            {generated && outfits && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">Your Outfits</p>
                  <p className="text-xs text-neutral-400">{outfits.length} looks · swipe →</p>
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

            {/* Empty */}
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



            {/* Style History */}
            <div className="mt-4"><StyleHistory /></div>



            {/* Trip Planner — vetëm nëse premium */}
            {plan === "pro" && (
              <div className="mt-4">
                <Link href="/trip"
                  className="flex items-center justify-between rounded-2xl bg-black text-white px-5 py-4 hover:bg-black/85 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✈️</span>
                    <div>
                      <p className="font-bold text-sm">Trip Planner</p>
                      <p className="text-xs text-white/50">Plan outfits for your next trip</p>
                    </div>
                  </div>
                  <span className="text-white/50 text-sm">→</span>
                </Link>
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
                <p className="text-xs text-neutral-400 mt-0.5">{counts.tops}T · {counts.bottoms}B · {counts.shoes}S</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowMissingPiece(true)}
                  className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-bold hover:bg-neutral-50 transition">
                  🧩
                </button>
                <button type="button" onClick={() => setShowBulkUpload(true)}
                  className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-bold hover:bg-neutral-50 transition">📷 Bulk</button>
                <button type="button" onClick={() => setView("add")}
                  className="rounded-full bg-black text-white px-3 py-1.5 text-xs font-bold hover:bg-black/85 transition">+ Add</button>
              </div>
            </div>

            {/* Free plan limit warning */}
            {plan === "free" && items.length >= 8 && items.length <= 10 && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-xs text-amber-800 font-medium">
                  {items.length}/10 items used · Free plan limit
                </p>
                <Link href="/pricing" className="rounded-full bg-black text-white px-3 py-1.5 text-xs font-bold">
                  Upgrade
                </Link>
              </div>
            )}

            {items.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-black/8 p-10 text-center">
                <p className="text-3xl mb-3">{gender === "female" ? "👗" : "👔"}</p>
                <p className="font-bold text-sm mb-1">No items yet</p>
                <p className="text-xs text-neutral-400">Start by adding your clothes</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {items.map((it: any, idx: number) => {
                  const isPinnedTop = pinnedTopId === it.id;
                  const isPinnedBottom = pinnedBottomId === it.id;
                  const isPinnedShoes = pinnedShoesId === it.id;
                  const isPinned = isPinnedTop || isPinnedBottom || isPinnedShoes;
                  const isFilteredOut = weatherEnabled && weather && !filteredItems.find(f => f.id === it.id);
                  return (
                    <WardrobeCard key={it.id} it={it} idx={idx} isPinned={isPinned}
                      isFilteredOut={!!isFilteredOut} cpw={getCostPerWear(it)} gender={gender}
                      colorDot={COLOR_DOT[it.color_family] ?? "bg-neutral-300"}
                      onPin={() => handlePinWithHaptic(it.category, it.id, isPinned)}
                      onDelete={() => onDeleteItem(it.id)} />
                  );
                })}
              </div>
            )}

            {/* Wardrobe Analytics */}
            <div className="mt-4">
              <WardrobeAnalytics items={items} />
            </div>
          </div>
        )}

        {/* ── ADD VIEW ── */}
        {view === "add" && (
          <div className="mt-4">
            <h2 className="font-display font-black text-xl mb-1">Add Item</h2>
            <p className="text-xs text-neutral-400 mb-6">Add a piece from your wardrobe</p>

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
                  <PhotoUpload file={photoFile} onChange={setPhotoFile}
                    onAnalysis={(r: AIAnalysis) => { setCategory(r.category); setType(r.type); setColorFamily(r.color_family); }} />
                </div>
                {status && (
                  <div className={`rounded-xl px-4 py-3 text-sm ${status.includes("✅") ? "bg-green-50 text-green-700 border border-green-100" : "bg-neutral-50 border border-black/8 text-neutral-600"}`}>
                    {status}
                  </div>
                )}
                <button type="button" onClick={onSaveItem} disabled={loading || !type}
                  className="rounded-xl bg-black text-white py-4 text-sm font-bold disabled:opacity-40 hover:bg-black/85 transition active:scale-[0.98]">
                  {loading ? "Saving..." : "Add to Wardrobe"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE VIEW ── */}
        {view === "profile" && (
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <h2 className="font-display font-black text-xl mb-1">Profile</h2>
              <p className="text-xs text-neutral-400">Your account & subscription</p>
            </div>

            {/* Account card */}
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

            {/* Plan card */}
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

              {/* Plan features comparison */}
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

            {/* Quick links */}
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

            {/* Plan Switcher — testing */}
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

            {/* Version */}
            <p className="text-center text-xs text-neutral-300 py-2">Occaswear v1.0 · Web PWA</p>
          </div>
        )}
      </div>

      {/* Missing Piece Drawer */}
      {showMissingPiece && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={() => setShowMissingPiece(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
            style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-200" />
            </div>
            <div className="px-5 pb-8 pt-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display font-black text-xl">Missing Pieces</h2>
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

      {/* ── BOTTOM NAV 4 TABS ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-black/8 z-30">
        <div className="mx-auto max-w-2xl grid grid-cols-4 gap-0.5 px-2 py-2">
          {NAV_TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setView(tab.id as any)}
              className={"rounded-xl py-2.5 flex flex-col items-center gap-0.5 transition active:scale-[0.94] " +
                (view === tab.id ? "bg-black text-white" : "text-neutral-400 hover:bg-neutral-50")}>
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {shareOutfit       && <ShareCard outfit={shareOutfit} onClose={() => setShareOutfit(null)} />}
      {showBulkUpload    && <BulkUpload onComplete={handleBulkComplete} onClose={() => setShowBulkUpload(false)} />}
      {showLocationModal && <LocationModal onAllow={handleLocationAllow} onDeny={handleLocationDeny} />}
      {plan === "pro" && <AIStyleAssistant items={items} />}
    </div>
  );
}