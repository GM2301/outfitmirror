"use client";

import * as React from "react";
import type { Item } from "@/lib/engine/types";

type OutfitLike = {
  label: "Safe" | "Colorful" | "Bold";
  score: number;
  why?: string;
  breakdown: { occasion: number; harmony: number; variety: number; balance: number; explanation?: string };
  picks?: { top: Item; bottom: Item; shoes: Item };
  top?: Item; bottom?: Item; shoes?: Item;
};

type SwapCategory = "top" | "bottom" | "shoes";

function pretty(s?: string) {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

const LABEL_CONFIG = {
  Safe:     { badge: "bg-white/90 text-neutral-700",   accent: "#1a1a1a" },
  Colorful: { badge: "bg-amber-100/90 text-amber-800", accent: "#d97706" },
  Bold:     { badge: "bg-black/80 text-white",          accent: "#ffffff" },
};

const COLOR_BG: Record<string, string> = {
  black: "#e8e8e8", white: "#f5f5f5", neutral: "#efefef",
  earth: "#f5efe8", blue: "#eef4fb", bright: "#f3eefb",
  green: "#eef5f0", red: "#fbeeed", pink: "#fbeef4",
  purple: "#f2eefb", orange: "#fbf0ee", yellow: "#fbf8ee",
};

const MALE_EMOJI: Record<string, string> = { top: "👕", bottom: "👖", shoes: "👟" };
const FEMALE_EMOJI: Record<string, string> = { top: "👚", bottom: "👗", shoes: "👠" };

const POSITIONS = {
  top:    { top: "5%",  left: "4%",  width: "44%", zIndex: 3 },
  bottom: { top: "20%", left: "38%", width: "54%", zIndex: 2 },
  shoes:  { top: "62%", left: "6%",  width: "40%", zIndex: 3 },
};

function FlatLayItem({ item, position, gender = "male", isSwapping, onClick }: {
  item: Item; position: typeof POSITIONS.top; gender?: string;
  isSwapping?: boolean; onClick?: () => void;
}) {
  const color = String(item.color_family ?? "neutral").toLowerCase();
  const bg    = COLOR_BG[color] ?? "#efefef";
  const emojiMap = gender === "female" ? FEMALE_EMOJI : MALE_EMOJI;
  const emoji = emojiMap[item.category] ?? "👕";

  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute", top: position.top, left: position.left,
        width: position.width, zIndex: position.zIndex,
        filter: isSwapping
          ? "drop-shadow(0 0 8px rgba(0,0,0,0.4))"
          : "drop-shadow(0 8px 20px rgba(0,0,0,0.18)) drop-shadow(0 2px 6px rgba(0,0,0,0.10))",
        cursor: onClick ? "pointer" : "default",
        transition: "filter 0.2s ease, transform 0.2s ease",
        transform: isSwapping ? "scale(0.95)" : "scale(1)",
      }}>
      {item.image_url ? (
        <img src={item.image_url} alt={String(item.type)} style={{
          width: "100%", height: "auto", aspectRatio: "1",
          objectFit: "contain", borderRadius: "12px", background: bg, padding: "8px",
        }} />
      ) : (
        <div style={{
          width: "100%", aspectRatio: "1", background: bg, borderRadius: "12px",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem",
        }}>{emoji}</div>
      )}
      {/* Swap indicator */}
      {isSwapping && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.7)", borderRadius: "999px",
          padding: "4px 8px", fontSize: "10px", color: "white", fontWeight: 700,
          whiteSpace: "nowrap",
        }}>🔄 Tap to swap</div>
      )}
    </div>
  );
}

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

  const originalPicks = React.useMemo(() =>
    outfit.picks ??
    (outfit.top && outfit.bottom && outfit.shoes
      ? { top: outfit.top, bottom: outfit.bottom, shoes: outfit.shoes }
      : null),
  [outfit]);

  const picks = currentPicks ?? originalPicks;

  const label    = outfit.label as keyof typeof LABEL_CONFIG;
  const config   = LABEL_CONFIG[label] ?? LABEL_CONFIG.Safe;
  const whyText  = outfit.why ?? outfit.breakdown?.explanation;
  const occPct   = Math.round((outfit.breakdown.occasion / 50) * 100);
  const harmPct  = Math.round((outfit.breakdown.harmony  / 38) * 100);
  const isColorful = label === "Colorful";

  if (!picks) return null;
  const { top, bottom, shoes } = picks;

  // Swap logic — merr item tjetër nga allItems
  function handleSwap(cat: SwapCategory) {
    if (swapping === cat) {
      // Zgjidh item tjetër random nga ajo kategori
      const available = allItems.filter(i => i.category === cat && i.id !== picks![cat].id);
      if (available.length === 0) { setSwapping(null); return; }
      const next = available[Math.floor(Math.random() * available.length)];
      setCurrentPicks({ ...picks!, [cat]: next });
      setSwapping(null);
    } else {
      setSwapping(cat);
    }
  }

  return (
    <div style={{
      borderRadius: "24px", overflow: "hidden", background: "white", flexShrink: 0,
      boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.07)",
    }}>
      {/* FLAT LAY */}
      <div style={{
        position: "relative", width: "100%", paddingBottom: "105%",
        background: "linear-gradient(145deg, #f0f0f0 0%, #e8e8e8 100%)", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }} />

        {/* Label */}
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", padding: "5px 10px",
            borderRadius: "999px", fontSize: "11px", fontWeight: 700,
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          }} className={config.badge}>{outfit.label}</span>
        </div>

        {/* Score */}
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
          <div style={{
            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)", borderRadius: "999px", padding: "4px 10px",
            display: "flex", alignItems: "baseline", gap: "2px",
          }}>
            <span style={{ fontSize: "18px", fontWeight: 900, color: "#000", fontFamily: "Georgia, serif" }}>{outfit.score}</span>
            <span style={{ fontSize: "10px", color: "#999" }}>/100</span>
          </div>
        </div>

        {/* Items */}
        <div style={{ position: "absolute", inset: 0 }}>
          <FlatLayItem item={top}    position={POSITIONS.top}    gender={gender}
            isSwapping={swapping === "top"}    onClick={() => handleSwap("top")} />
          <FlatLayItem item={bottom} position={POSITIONS.bottom} gender={gender}
            isSwapping={swapping === "bottom"} onClick={() => handleSwap("bottom")} />
          <FlatLayItem item={shoes}  position={POSITIONS.shoes}  gender={gender}
            isSwapping={swapping === "shoes"}  onClick={() => handleSwap("shoes")} />
        </div>

        {/* Labels poshtë */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "32px 12px 12px",
          background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)",
          display: "flex", gap: "6px", flexWrap: "wrap" as const, zIndex: 5,
        }}>
          {[{ l: "Top", i: top }, { l: "Bottom", i: bottom }, { l: "Shoes", i: shoes }].map(({ l, i }) => (
            <span key={l} style={{
              background: "rgba(255,255,255,0.20)", backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)", borderRadius: "999px",
              padding: "3px 8px", fontSize: "10px", color: "white", fontWeight: 600,
            }}>{l}: {pretty(i.type)}</span>
          ))}
        </div>

        {/* Swap hint */}
        {!swapping && allItems.length > 3 && (
          <div style={{
            position: "absolute", bottom: 48, right: 10, zIndex: 6,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
            borderRadius: "999px", padding: "3px 8px",
            fontSize: "9px", color: "white", fontWeight: 600,
          }}>Tap item to swap 🔄</div>
        )}
      </div>

      {/* BOTTOM */}
      <div style={{ padding: "12px 14px 14px", background: "white" }}>
        {/* Score bar */}
        <div style={{ height: "2px", background: "#f0f0f0", borderRadius: "1px", marginBottom: "10px" }}>
          <div style={{
            height: "2px", borderRadius: "1px",
            background: isColorful ? "#f59e0b" : "#111",
            width: `${outfit.score}%`,
            transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
          }} />
        </div>

        {/* Swap buttons */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
          {(["top", "bottom", "shoes"] as const).map(cat => (
            <button key={cat} type="button" onClick={() => handleSwap(cat)} style={{
              flex: 1, padding: "6px 4px", borderRadius: "10px", border: "none",
              background: swapping === cat ? "#000" : "#f5f5f5",
              color: swapping === cat ? "white" : "#666",
              fontSize: "10px", fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s",
            }}>
              🔄 {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Why it works */}
        <button type="button" onClick={() => setShowWhy(v => !v)} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 0", background: "none", border: "none", cursor: "pointer",
          fontSize: "12px", fontWeight: 600, color: "#999",
        }}>
          <span>Why it works</span>
          <span style={{ transform: showWhy ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>↓</span>
        </button>

        {showWhy && (
          <div style={{ background: "#f9f9f9", borderRadius: "12px", padding: "10px 12px", marginTop: "6px", marginBottom: "8px" }}>
            {whyText && <p style={{ fontSize: "12px", color: "#666", lineHeight: 1.6, marginBottom: "8px" }}>{whyText}</p>}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
              {[{ label: "Occasion fit", pct: occPct }, { label: "Color harmony", pct: harmPct }].map(bar => (
                <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#aaa", width: "80px", flexShrink: 0 }}>{bar.label}</span>
                  <div style={{ flex: 1, height: "3px", background: "#eee", borderRadius: "2px" }}>
                    <div style={{ height: "3px", borderRadius: "2px", background: isColorful ? "#f59e0b" : "#111", width: `${bar.pct}%`, transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ fontSize: "11px", color: "#aaa", width: "28px", textAlign: "right" }}>{bar.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button type="button" onClick={() => onVote("up")} style={{
            flex: 1, padding: "10px", borderRadius: "12px",
            border: "1.5px solid rgba(0,0,0,0.10)", background: "white",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}>👍 Save</button>
          <button type="button" onClick={() => onVote("down")} style={{
            flex: 1, padding: "10px", borderRadius: "12px",
            border: "1.5px solid rgba(0,0,0,0.10)", background: "white",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}>👎 Skip</button>
          <button type="button" onClick={onShare} style={{
            padding: "10px 16px", borderRadius: "12px",
            background: "#000", color: "white", fontSize: "13px", cursor: "pointer", border: "none",
          }}>📤</button>
        </div>
      </div>
    </div>
  );
}