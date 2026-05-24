"use client";

import * as React from "react";
import { Pin, Heart, X, RefreshCw, ChevronDown } from "lucide-react";
import type { Item } from "@/lib/engine/types";
import { generateOutfits } from "@/lib/engine/generate";

type OutfitLike = {
  label: "Safe" | "Colorful" | "Bold";
  score: number;
  why?: string;
  breakdown: { occasion: number; harmony: number; variety: number; balance: number; explanation?: string };
  picks?: { top: Item; bottom: Item; shoes: Item; outer?: Item };
  top?: Item; bottom?: Item; shoes?: Item;
};

type SwapCategory = "top" | "bottom" | "shoes" | "outer";

function pretty(s?: string) {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

// ─── PREMIUM COLOR BACKGROUNDS (ultra soft, no harsh tones) ────────────────
const COLOR_BG: Record<string, string> = {
  black: "#F0F0EE", white: "#FAFAF8", neutral: "#F4F2EE",
  earth: "#F4EFE7", blue: "#EEF2F8", bright: "#F1EDF7",
  green: "#EDF3EE", red: "#F8EEED", pink: "#F8EEF3",
  purple: "#F1EDF7", orange: "#F8F0ED", yellow: "#F8F5ED",
  brown: "#F1ECE5", navy: "#EDF0F5", grey: "#F2F2F0",
  burgundy: "#F4EBEC", khaki: "#F3EFE6", denim: "#EDF1F6",
  beige: "#F5EFE6", cream: "#F8F4EC",
};

const MALE_EMOJI: Record<string, string> = { top: "👕", bottom: "👖", shoes: "👟" };
const FEMALE_EMOJI: Record<string, string> = { top: "👚", bottom: "👗", shoes: "👠" };

// ════════════════════════════════════════════════════════════════════════════
// Smart Swap via engine (preserved from V1)
// ════════════════════════════════════════════════════════════════════════════
function smartSwapViaEngine(
  cat: "top" | "bottom" | "shoes",
  current: { top: Item; bottom: Item; shoes: Item },
  allItems: Item[],
  occasion: string,
  style: string,
  gender: "male" | "female",
  tempC: number,
): Item | null {
  const pinnedItemIds: string[] = [];
  if (cat !== "top")    pinnedItemIds.push(current.top.id);
  if (cat !== "bottom") pinnedItemIds.push(current.bottom.id);
  if (cat !== "shoes")  pinnedItemIds.push(current.shoes.id);

  const opts: any = { gender, style, tempC, includeAccessories: false, pinnedItemIds };

  for (let i = 0; i < 8; i++) {
    const seed = Date.now() + i * 1000 + Math.floor(Math.random() * 10000);
    const outfits = generateOutfits(allItems, occasion as any, seed, opts);
    for (const o of outfits) {
      const newItem = o.picks[cat];
      if (newItem && newItem.id !== current[cat].id && newItem.id !== "missing" && newItem.id !== "wardrobe-gap" && !newItem.id.startsWith("gap-")) {
        return newItem;
      }
    }
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
// BentoItemCard — kartë premium pa vija, me Pin icon overlay
// ════════════════════════════════════════════════════════════════════════════
function BentoItemCard({
  item, gender, isPinned, isSwapping, onDoubleTap, onTogglePin, aspectClass,
}: {
  item: Item;
  gender: "male" | "female";
  isPinned: boolean;
  isSwapping: boolean;
  onDoubleTap: () => void;
  onTogglePin: () => void;
  aspectClass: string;
}) {
  const lastTap = React.useRef<number>(0);
  const color = String(item.color_family ?? "neutral").toLowerCase();
  const bg = COLOR_BG[color] ?? "#F4F2EE";
  const emojiMap = gender === "female" ? FEMALE_EMOJI : MALE_EMOJI;
  const emoji = emojiMap[item.category] ?? "👕";

  function handleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap detected
      onDoubleTap();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }

  return (
    <div
      onClick={handleTap}
      className={`relative ${aspectClass} cursor-pointer group overflow-hidden`}
      style={{
        background: bg,
        borderRadius: "20px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isSwapping ? "scale(0.96)" : "scale(1)",
        opacity: isSwapping ? 0.7 : 1,
      }}
    >
      {/* Pin icon overlay — top right corner */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all"
        style={{
          background: isPinned ? "#1A1A1A" : "rgba(255,255,255,0.7)",
          backdropFilter: "blur(8px)",
          opacity: isPinned ? 1 : 0.55,
        }}
      >
        <Pin
          size={14}
          strokeWidth={1.8}
          style={{
            color: isPinned ? "#FFFFFF" : "#1A1A1A",
            transform: isPinned ? "rotate(0deg)" : "rotate(0deg)",
            fill: isPinned ? "#FFFFFF" : "transparent",
          }}
        />
      </button>

      {/* Image or placeholder */}
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={String(item.type)}
          className="w-full h-full object-contain p-4"
          style={{ transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 opacity-50">
          <span style={{ fontSize: "2.5rem" }}>{emoji}</span>
          <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">
            {pretty(item.type)}
          </span>
        </div>
      )}

      {/* Type label — discrete, bottom */}
      <div
        className="absolute bottom-2.5 left-2.5 text-[9px] uppercase tracking-widest font-semibold"
        style={{ color: "#9A958C", letterSpacing: "0.12em" }}
      >
        {pretty(item.type)}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — OutfitFlatLay v2 (Bento Premium)
// ════════════════════════════════════════════════════════════════════════════
export default function OutfitFlatLay({ outfit, onVote, onShare, gender = "male", allItems = [] }: {
  outfit: OutfitLike;
  onVote: (vote: "up" | "down") => void;
  onShare: () => void;
  gender?: "male" | "female";
  allItems?: Item[];
}) {
  const [showWhy, setShowWhy] = React.useState(false);
  const [swapping, setSwapping] = React.useState<SwapCategory | null>(null);
  const [currentPicks, setCurrentPicks] = React.useState<{ top: Item; bottom: Item; shoes: Item } | null>(null);
  const [pinnedSlots, setPinnedSlots] = React.useState<Set<SwapCategory>>(new Set());
  const [swapMsg, setSwapMsg] = React.useState<string | null>(null);
  const [voted, setVoted] = React.useState<"up" | "down" | null>(null);

  const occasion = typeof window !== "undefined" ? localStorage.getItem("om_occasion") ?? "casual" : "casual";
  const style    = typeof window !== "undefined" ? localStorage.getItem("om_style")    ?? "minimal" : "minimal";
  const tempC    = typeof window !== "undefined" ? parseFloat(localStorage.getItem("om_weather_temp") ?? "20") : 20;

  const originalPicks = React.useMemo(() =>
    outfit.picks ??
    (outfit.top && outfit.bottom && outfit.shoes
      ? { top: outfit.top, bottom: outfit.bottom, shoes: outfit.shoes }
      : null),
  [outfit]);

  const picks = currentPicks ?? originalPicks;
  const isColorful = outfit.label === "Colorful";

  if (!picks) return null;
  const { top, bottom, shoes } = picks;
  const outer = (picks as any).outer as Item | undefined;
  const whyText = outfit.why ?? outfit.breakdown?.explanation;
  const occPct  = Math.round((outfit.breakdown.occasion / 50) * 100);
  const harmPct = Math.round((outfit.breakdown.harmony  / 50) * 100);

  function handleSwapWithHaptic(cat: "top" | "bottom" | "shoes") {
    if (typeof navigator !== "undefined" && (navigator as any).vibrate) {
      (navigator as any).vibrate(8);
    }
    const next = smartSwapViaEngine(cat, picks!, allItems, occasion, style, gender, tempC);
    if (!next) {
      setSwapMsg("No alternative found");
      setTimeout(() => setSwapMsg(null), 2200);
      return;
    }
    setSwapping(cat);
    setTimeout(() => {
      setCurrentPicks(p => ({ ...(p ?? picks!), [cat]: next }));
      setSwapping(null);
    }, 300);
  }

  function togglePin(cat: SwapCategory) {
    if (typeof navigator !== "undefined" && (navigator as any).vibrate) {
      (navigator as any).vibrate(8);
    }
    setPinnedSlots(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function handleVote(v: "up" | "down") {
    if (typeof navigator !== "undefined" && (navigator as any).vibrate) {
      (navigator as any).vibrate(v === "up" ? 12 : 8);
    }
    setVoted(v);
    onVote(v);
    setTimeout(() => setVoted(null), 1200);
  }

  return (
    <div
      style={{
        background: "#FDFDFB",
        borderRadius: "28px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* ─── TOP META BAR — label + score, minimal ─────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
      >
        <span
          className="text-[10px] uppercase font-bold tracking-[0.15em]"
          style={{ color: isColorful ? "#A16207" : "#1A1A1A" }}
        >
          {outfit.label}
        </span>
        <div className="flex items-baseline gap-1">
          <span
            style={{
              fontFamily: "'Cormorant', Georgia, serif",
              fontSize: "20px",
              fontWeight: 500,
              color: "#1A1A1A",
              lineHeight: 1,
            }}
          >
            {outfit.score}
          </span>
          <span className="text-[10px] text-neutral-400">/100</span>
        </div>
      </div>

      {/* ─── BENTO GRID — ASYMMETRIC ─────────────────────────────────────────
           Layout:
           - Row 1: TOP (large) + OUTER (small, optional) — peshë vizuale kryesore
                    OSE TOP (full width) nese nuk ka outer
           - Row 2: BOTTOM (large)
           - Row 3: SHOES (full width, lower)
      ────────────────────────────────────────────────────────────────────── */}
      <div className="p-3" style={{ background: "#FDFDFB" }}>
        {outer ? (
          // Layout me outer: Top + Outer ne grid 2:1
          <div className="grid grid-cols-3 gap-2.5 mb-2.5">
            <div className="col-span-2">
              <BentoItemCard
                item={top}
                gender={gender}
                isPinned={pinnedSlots.has("top")}
                isSwapping={swapping === "top"}
                onDoubleTap={() => handleSwapWithHaptic("top")}
                onTogglePin={() => togglePin("top")}
                aspectClass="aspect-[4/3]"
              />
            </div>
            <div className="col-span-1">
              <BentoItemCard
                item={outer}
                gender={gender}
                isPinned={pinnedSlots.has("outer")}
                isSwapping={swapping === "outer"}
                onDoubleTap={() => {}}
                onTogglePin={() => togglePin("outer")}
                aspectClass="aspect-[4/3]"
              />
            </div>
          </div>
        ) : (
          // Layout pa outer: Top full width
          <div className="mb-2.5">
            <BentoItemCard
              item={top}
              gender={gender}
              isPinned={pinnedSlots.has("top")}
              isSwapping={swapping === "top"}
              onDoubleTap={() => handleSwapWithHaptic("top")}
              onTogglePin={() => togglePin("top")}
              aspectClass="aspect-[16/9]"
            />
          </div>
        )}

        {/* Row 2: BOTTOM */}
        <div className="mb-2.5">
          <BentoItemCard
            item={bottom}
            gender={gender}
            isPinned={pinnedSlots.has("bottom")}
            isSwapping={swapping === "bottom"}
            onDoubleTap={() => handleSwapWithHaptic("bottom")}
            onTogglePin={() => togglePin("bottom")}
            aspectClass="aspect-[16/9]"
          />
        </div>

        {/* Row 3: SHOES */}
        <BentoItemCard
          item={shoes}
          gender={gender}
          isPinned={pinnedSlots.has("shoes")}
          isSwapping={swapping === "shoes"}
          onDoubleTap={() => handleSwapWithHaptic("shoes")}
          onTogglePin={() => togglePin("shoes")}
          aspectClass="aspect-[16/9]"
        />

        {/* Swap message toast */}
        {swapMsg && (
          <div className="flex justify-center mt-2">
            <span
              className="text-[10px] uppercase tracking-widest font-medium px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(26,26,26,0.85)",
                color: "white",
                letterSpacing: "0.1em",
              }}
            >
              {swapMsg}
            </span>
          </div>
        )}
      </div>

      {/* ─── SCORE BAR (subtle, no harsh) ─────────────────────────────────── */}
      <div className="px-4 mt-1">
        <div style={{ height: "1.5px", background: "#F0EEEA", borderRadius: "1px", overflow: "hidden" }}>
          <div
            style={{
              height: "1.5px",
              background: isColorful ? "#C29F4A" : "#1A1A1A",
              width: `${outfit.score}%`,
              transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </div>
      </div>

      {/* ─── WHY IT WORKS (expandable, subtle) ───────────────────────────── */}
      <button
        type="button"
        onClick={() => setShowWhy(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <span
          className="text-[10px] uppercase font-semibold tracking-[0.15em]"
          style={{ color: "#9A958C" }}
        >
          Why this works
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          style={{
            color: "#9A958C",
            transform: showWhy ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </button>

      {showWhy && (
        <div
          className="mx-4 mb-3 p-4 rounded-2xl"
          style={{
            background: "#F7F5F0",
            transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {whyText && (
            <p
              style={{
                fontFamily: "'Cormorant', Georgia, serif",
                fontSize: "14px",
                fontStyle: "italic",
                color: "#5C5750",
                lineHeight: 1.6,
                marginBottom: "12px",
              }}
            >
              {whyText}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {[
              { label: "Occasion fit", pct: occPct },
              { label: "Color harmony", pct: harmPct },
            ].map(bar => (
              <div key={bar.label} className="flex items-center gap-3">
                <span
                  className="text-[10px] uppercase tracking-widest font-medium"
                  style={{ color: "#9A958C", width: "100px", flexShrink: 0 }}
                >
                  {bar.label}
                </span>
                <div className="flex-1 h-[2px] rounded-full" style={{ background: "#E5E2DC" }}>
                  <div
                    className="h-[2px] rounded-full"
                    style={{
                      background: "#1A1A1A",
                      width: `${bar.pct}%`,
                      transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: "#9A958C", width: "32px", textAlign: "right" }}
                >
                  {bar.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── FLOATING VOTE BUTTONS — Heart / X (no text, premium) ──────────── */}
      <div className="flex items-center justify-center gap-4 px-4 pb-5 pt-2">
        <button
          type="button"
          onClick={() => handleVote("down")}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: voted === "down" ? "#1A1A1A" : "#FFFFFF",
            boxShadow: voted === "down"
              ? "0 4px 16px rgba(0,0,0,0.25)"
              : "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.06)",
            transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <X
            size={20}
            strokeWidth={1.5}
            style={{ color: voted === "down" ? "#FFFFFF" : "#9A958C" }}
          />
        </button>

        {/* Share button (subtle, middle) */}
        <button
          type="button"
          onClick={onShare}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: "transparent",
            border: "1px solid rgba(0,0,0,0.08)",
            transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <RefreshCw size={14} strokeWidth={1.5} style={{ color: "#9A958C" }} />
        </button>

        <button
          type="button"
          onClick={() => handleVote("up")}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: voted === "up" ? "#1A1A1A" : "#FFFFFF",
            boxShadow: voted === "up"
              ? "0 4px 16px rgba(0,0,0,0.25)"
              : "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.06)",
            transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <Heart
            size={20}
            strokeWidth={1.5}
            style={{
              color: voted === "up" ? "#FFFFFF" : "#1A1A1A",
              fill: voted === "up" ? "#FFFFFF" : "transparent",
            }}
          />
        </button>
      </div>
    </div>
  );
}