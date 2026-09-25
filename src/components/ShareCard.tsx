"use client";

import * as React from "react";
import type { Item, Outfit } from "@/lib/engine/types";

type Props = {
  outfit: Outfit;
  onClose: () => void;
  gender?: "male" | "female";
};

const occasionEmoji: Record<string, string> = {
  work: "💼", date: "🌹", casual: "☀️", night_out: "🌙", travel: "✈️", gym: "💪",
};

function pretty(s?: string) {
  return String(s ?? "").replace(/_/g, " ");
}

export default function ShareCard({ outfit, onClose, gender = "male" }: Props) {
  const [copied, setCopied] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);

  const emoji = occasionEmoji[outfit.occasion] ?? "✨";
  const occasionLabel = outfit.occasion.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://occaswear.com";
  const genderTag = gender === "female" ? "#WomensFashion" : "#MensFashion";

  const { outer, top, inner, bottom, shoes } = outfit.picks;
  const pieces = [outer, top, inner, bottom, shoes].filter((x): x is Item => !!x);

  const shareText = `${emoji} My ${occasionLabel.toLowerCase()} look — styled by Occaswear\n\n${pieces
    .map(p => `• ${p.color_family} ${pretty(p.type)}`)
    .join("\n")}\n\n#Occaswear #OOTD ${genderTag}`;

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  }

  async function handleShare() {
    if (navigator.share) {
      setSharing(true);
      try {
        await navigator.share({ title: "My Occaswear Look", text: shareText, url: shareUrl });
      } catch { } finally { setSharing(false); }
    } else {
      handleCopyText();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm">
        <div className="relative overflow-hidden rounded-3xl p-6 text-white max-h-[70vh] flex flex-col gap-5" style={{ backgroundColor: "#0a0a0a" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Occaswear</p>
            <p className="text-xs text-white/50">{emoji} {occasionLabel}</p>
          </div>

          <p className="text-3xl font-black leading-tight">My {occasionLabel.toLowerCase()}<br />look</p>

          <div className="grid grid-cols-3 gap-2 overflow-y-auto">
            {pieces.map(p => (
              <div key={p.id} className="rounded-2xl overflow-hidden bg-white/[0.06]">
                <div className="aspect-square flex items-center justify-center">
                  {p.image_url
                    ? <img src={p.image_url} alt={pretty(p.type)} className="w-full h-full object-contain p-2" />
                    : <span className="text-2xl opacity-60">👕</span>}
                </div>
                <p className="px-2 pb-2 text-[10px] capitalize text-white/60 truncate">{p.color_family} {pretty(p.type)}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-white/40">{shareUrl.replace(/^https?:\/\//, "")} · #Occaswear #OOTD</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black hover:bg-white/90 transition"
            onClick={handleCopyText} type="button">
            {copied ? "✅ Copied!" : "📋 Copy Text"}
          </button>
          <button className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black hover:bg-white/90 transition disabled:opacity-50"
            onClick={handleShare} disabled={sharing} type="button">
            {sharing ? "Sharing..." : "📤 Share"}
          </button>
        </div>

        <button className="mt-3 w-full rounded-xl border border-white/20 px-4 py-3 text-sm text-white hover:bg-white/10 transition"
          onClick={onClose} type="button">
          Close
        </button>
      </div>
    </div>
  );
}
