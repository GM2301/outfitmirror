"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Pin, Heart, X, RefreshCw, Share2 } from "lucide-react";
import type { Item, Occasion, Outfit, OutfitPicks, VotedItemIds } from "@/lib/engine/types";
import { suggestReplacements, isDress } from "@/lib/engine/generate";

type Slot = "top" | "bottom" | "shoes" | "outer" | "inner";

export type LookContext = { occasion: Occasion; tempC: number; isRaining?: boolean };

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
  beige: "#F5EFE6", cream: "#F8F4EC", tan: "#F3EFE6", teal: "#ECF4F3",
};

function emojiFor(item: Item, gender: "male" | "female"): string {
  if (isDress(item)) return "👗";
  if (item.category === "outerwear") return "🧥";
  if (item.category === "accessory") return "💍";
  const map = gender === "female"
    ? { top: "👚", bottom: "👖", shoes: "👠" }
    : { top: "👕", bottom: "👖", shoes: "👟" };
  return map[item.category as keyof typeof map] ?? "👕";
}

function ItemImage({ item, gender, padding = "p-4", big = true }: { item: Item; gender: "male" | "female"; padding?: string; big?: boolean }) {
  return item.image_url ? (
    // Lazy + async decode: a look has up to 6 photos and most are off-screen in lists.
    <img src={item.image_url} alt={pretty(item.type)} loading="lazy" decoding="async"
      className={`w-full h-full object-contain ${padding}`} />
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 opacity-50">
      <span style={{ fontSize: big ? "2.5rem" : "1.5rem" }}>{emojiFor(item, gender)}</span>
      {big && <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">{pretty(item.type)}</span>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// One piece of the look: photo, pin (keeps it in future looks) and swap.
// ════════════════════════════════════════════════════════════════════════════
function PieceCard({ item, gender, isPinned, onTogglePin, onSwap, aspectClass, compact = false }: {
  item: Item;
  gender: "male" | "female";
  isPinned: boolean;
  onTogglePin: () => void;
  onSwap: () => void;
  aspectClass: string;
  compact?: boolean; // narrow side cards: icon-only swap, no type label
}) {
  const bg = COLOR_BG[String(item.color_family ?? "neutral").toLowerCase()] ?? "#F4F2EE";
  return (
    <div className={`relative ${aspectClass} overflow-hidden`}
      style={{ background: bg, borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)" }}>
      <button type="button" onClick={onTogglePin}
        aria-label={isPinned ? "Unpin this piece" : "Pin this piece to keep it in new looks"}
        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all"
        style={{ background: isPinned ? "#1A1A1A" : "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)", opacity: isPinned ? 1 : 0.7 }}>
        <Pin size={14} strokeWidth={1.8} style={{ color: isPinned ? "#FFFFFF" : "#1A1A1A", fill: isPinned ? "#FFFFFF" : "transparent" }} />
      </button>
      <button type="button" onClick={onSwap} aria-label={`Swap the ${pretty(item.type)}`}
        className={`absolute bottom-2.5 right-2.5 z-10 h-8 ${compact ? "w-8" : "px-2.5"} flex items-center gap-1 justify-center rounded-full transition-all`}
        style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)" }}>
        <RefreshCw size={12} strokeWidth={1.8} style={{ color: "#1A1A1A" }} />
        {!compact && <span className="text-[10px] font-semibold text-neutral-700">Swap</span>}
      </button>
      <ItemImage item={item} gender={gender} padding={compact ? "p-2" : "p-4"} big={!compact} />
      {!compact && <div className="absolute bottom-3 left-3 text-[9px] uppercase tracking-widest font-semibold" style={{ color: "#9A958C", letterSpacing: "0.12em" }}>
        {pretty(item.type)}
      </div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Swap sheet: the engine's best alternatives for one piece, with photos.
// ════════════════════════════════════════════════════════════════════════════
function SwapSheet({ slot, options, gender, allowRemove, onPick, onRemove, onClose }: {
  slot: Slot;
  options: Item[];
  gender: "male" | "female";
  allowRemove: boolean;
  onPick: (it: Item) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const title = { top: "Swap top", bottom: "Swap bottom", shoes: "Swap shoes", outer: "Swap jacket", inner: "Swap layer underneath" }[slot];
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm overlay-enter" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[80vh] overflow-y-auto drawer-enter"
        style={{ background: "#FAF8F5", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-neutral-200" /></div>
        <div className="px-5 pb-8 pt-2 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: "24px", fontWeight: 400, color: "#1A1A1A" }}>{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close"
              className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition">✕</button>
          </div>
          <p className="text-xs text-neutral-400 mb-4">Best matches for the rest of this look, from your wardrobe</p>
          {options.length === 0 && !allowRemove ? (
            <p className="text-sm text-neutral-500 text-center py-8">Nothing else in your wardrobe fits this look and the weather.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {allowRemove && (
                <button type="button" onClick={onRemove}
                  className="aspect-square rounded-2xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center gap-1 text-neutral-500 hover:bg-white transition">
                  <span className="text-xl">∅</span>
                  <span className="text-[11px] font-semibold">{slot === "outer" ? "No jacket" : "Nothing"}</span>
                </button>
              )}
              {options.map(it => (
                <button key={it.id} type="button" onClick={() => onPick(it)}
                  className="rounded-2xl overflow-hidden bg-white text-left hover:ring-2 hover:ring-black/20 transition active:scale-[0.97]"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div className="aspect-square" style={{ background: COLOR_BG[String(it.color_family).toLowerCase()] ?? "#F4F2EE" }}>
                    <ItemImage item={it} gender={gender} padding="p-2" big={false} />
                  </div>
                  <p className="px-2 py-1.5 text-[10px] font-semibold capitalize truncate text-neutral-700">
                    {String(it.color_family)} {pretty(it.type).toLowerCase()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// The look card. One look at a time; "Another look" lives in the parent.
// ════════════════════════════════════════════════════════════════════════════
export default function OutfitFlatLay({
  outfit, context, allItems, gender = "male", votedItemIds, pinnedItemIds = [], onTogglePin,
  onLike, onSkip, onShare, onPicksChange, position,
}: {
  outfit: Outfit;
  context: LookContext;
  allItems: Item[];
  gender?: "male" | "female";
  votedItemIds?: VotedItemIds;
  pinnedItemIds?: string[];
  onTogglePin?: (itemId: string) => void;
  onLike: (picks: OutfitPicks) => void;
  onSkip?: () => void;
  onShare: (picks: OutfitPicks) => void;
  onPicksChange?: (picks: OutfitPicks) => void; // e.g. Trip Planner packing list follows swaps
  position?: { index: number; total: number };
}) {
  // Edits made with Swap. Reset whenever a different look arrives.
  const [picks, setPicks] = React.useState<OutfitPicks>(outfit.picks);
  const [swapSlot, setSwapSlot] = React.useState<Slot | null>(null);
  const [liked, setLiked] = React.useState(false);
  React.useEffect(() => { setPicks(outfit.picks); setLiked(false); setSwapSlot(null); }, [outfit]);

  const edited = picks !== outfit.picks;
  const why = edited ? null : outfit.why;
  const { top, bottom, shoes, inner, outer, accessories } = picks;
  const dress = isDress(top);

  const swapOptions = React.useMemo(() => {
    if (!swapSlot) return [];
    return suggestReplacements(allItems, picks, swapSlot, {
      occasion: context.occasion, tempC: context.tempC, isRaining: context.isRaining, votedItemIds,
    });
  }, [swapSlot, allItems, picks, context, votedItemIds]);

  function vibrate(ms: number) {
    if (typeof navigator !== "undefined" && (navigator as any).vibrate) (navigator as any).vibrate(ms);
  }

  function applySwap(slot: Slot, it: Item | undefined) {
    vibrate(8);
    const next: OutfitPicks = { ...picks, [slot]: it };
    if (slot === "top") {
      // A tee under the old hoodie makes no sense under a tee or a dress.
      const midLayer = /hoodie|sweatshirt|zip|cardigan|sweater|knit|pullover|crewneck|fleece/.test(String(it?.type));
      if (!midLayer || (it && isDress(it))) next.inner = undefined;
    }
    setPicks(next);
    onPicksChange?.(next);
    setSwapSlot(null);
  }

  const pin = (it: Item) => onTogglePin && (() => { vibrate(8); onTogglePin(it.id); });
  const card = (it: Item, slot: Slot, aspect: string, compact = false) => (
    <PieceCard item={it} gender={gender} aspectClass={aspect} compact={compact}
      isPinned={pinnedItemIds.includes(it.id)}
      onTogglePin={pin(it) ?? (() => {})}
      onSwap={() => setSwapSlot(slot)} />
  );

  const side = ([["inner", inner], ["outer", outer]] as const).filter((e): e is readonly ["inner" | "outer", Item] => !!e[1]);

  return (
    <div style={{ background: "#FDFDFB", borderRadius: "28px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
        <span className="text-[10px] uppercase font-bold tracking-[0.15em]" style={{ color: "#1A1A1A" }}>
          {pretty(context.occasion)} look
        </span>
        {position && position.total > 1 && (
          <span className="text-[10px] font-semibold text-neutral-400">{position.index + 1} of {position.total}</span>
        )}
      </div>

      <div className="p-3" style={{ background: "#FDFDFB" }}>
        {side.length > 0 ? (
          <div className={`grid ${side.length === 2 ? "grid-cols-4" : "grid-cols-3"} gap-2.5 mb-2.5`}>
            <div className="col-span-2">{card(top, "top", dress ? "aspect-[2/3]" : "aspect-[4/3]")}</div>
            {side.map(([slot, it]) => (
              <div key={slot} className="col-span-1">{card(it, slot, dress ? "aspect-[1/3]" : "aspect-[2/3]", side.length === 2)}</div>
            ))}
          </div>
        ) : (
          <div className="mb-2.5">{card(top, "top", dress ? "aspect-[4/5]" : "aspect-[16/9]")}</div>
        )}

        {bottom && <div className="mb-2.5">{card(bottom, "bottom", "aspect-[16/9]")}</div>}

        {card(shoes, "shoes", "aspect-[16/9]")}

        {!outer && context.tempC < 18 && allItems.some(i => i.category === "outerwear") && (
          <button type="button" onClick={() => setSwapSlot("outer")}
            className="mt-2.5 w-full rounded-2xl border border-dashed border-black/10 py-2.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 transition">
            🧥 Add a jacket
          </button>
        )}

        {accessories && accessories.length > 0 && (
          <div className="mt-2.5 flex gap-2">
            {accessories.map(a => (
              <div key={a.id} className="flex items-center gap-2 rounded-xl bg-white px-2 py-1.5 border border-black/5">
                <div className="w-8 h-8 rounded-lg overflow-hidden" style={{ background: COLOR_BG[String(a.color_family).toLowerCase()] ?? "#F4F2EE" }}>
                  <ItemImage item={a} gender={gender} padding="p-0.5" big={false} />
                </div>
                <span className="text-[10px] font-semibold capitalize text-neutral-600">{pretty(a.type).toLowerCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {why && (
        <p className="px-5 pt-1 pb-2" style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: "15px", fontStyle: "italic", color: "#5C5750", lineHeight: 1.55 }}>
          {why}
        </p>
      )}

      <div className="flex items-center justify-center gap-4 px-4 pb-5 pt-2">
        {onSkip && (
          <button type="button" onClick={() => { vibrate(8); onSkip(); }} aria-label="Not this one"
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: "#FFFFFF", boxShadow: "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <X size={20} strokeWidth={1.5} style={{ color: "#9A958C" }} />
          </button>
        )}
        <button type="button" onClick={() => onShare(picks)} aria-label="Share this look"
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "transparent", border: "1px solid rgba(0,0,0,0.08)" }}>
          <Share2 size={14} strokeWidth={1.5} style={{ color: "#9A958C" }} />
        </button>
        <button type="button" onClick={() => { if (liked) return; vibrate(12); setLiked(true); onLike(picks); }}
          aria-label={liked ? "Saved" : "Save this look"}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: liked ? "#1A1A1A" : "#FFFFFF",
            boxShadow: liked ? "0 4px 16px rgba(0,0,0,0.25)" : "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}>
          <Heart size={20} strokeWidth={1.5} style={{ color: liked ? "#FFFFFF" : "#1A1A1A", fill: liked ? "#FFFFFF" : "transparent" }} />
        </button>
      </div>

      {swapSlot && typeof document !== "undefined" && createPortal(
        <SwapSheet slot={swapSlot} options={swapOptions} gender={gender}
          allowRemove={swapSlot === "outer" ? !!outer : swapSlot === "inner"}
          onPick={it => applySwap(swapSlot, it)}
          onRemove={() => applySwap(swapSlot, undefined)}
          onClose={() => setSwapSlot(null)} />,
        // Rendered at the page root: inside the animated card, `fixed` was
        // trapped under the nav bar and the Style Coach button.
        document.body
      )}
    </div>
  );
}
