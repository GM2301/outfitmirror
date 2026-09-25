"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import type { Item, Category, Occasion, OutfitPicks } from "@/lib/engine/types";
import { generateCoupleLooks, isDress, type CouplePair } from "@/lib/engine/generate";
import { loadVotedItemIds } from "@/lib/userPrefs";

type Gender = "male" | "female";

// Server-side state (see supabase/2026-09-25_couple_links.sql). A code is only
// an invitation: it expires after 7 days, works once, and nobody sees anyone's
// wardrobe until the other person accepts. Either side can disconnect.
type Status =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "pending"; code: string; expiresAt: string }
  | { kind: "active"; partnerName: string; partnerGender: Gender };

const OCCASIONS: { v: Occasion; e: string; l: string }[] = [
  { v: "casual", e: "☀️", l: "Casual" },
  { v: "date", e: "🌹", l: "Date" },
  { v: "night_out", e: "🌑", l: "Night out" },
  { v: "travel", e: "✈️", l: "Travel" },
  { v: "work", e: "💼", l: "Work" },
];

const ERRORS: Record<string, string> = {
  "invalid code": "That code doesn't work. It may be mistyped, already used, or older than 7 days.",
  "own code": "That's your own code — send it to your partner instead.",
  "already connected": "One of you is already connected to someone. Disconnect first to connect again.",
};
function friendlyError(message?: string): string {
  const key = Object.keys(ERRORS).find(k => (message ?? "").includes(k));
  return key ? ERRORS[key] : "Something went wrong. Please try again.";
}

function toItem(r: any): Item {
  return {
    id: r.id, category: r.category as Category, type: r.type, color_family: r.color_family ?? "neutral",
    image_url: r.image_url ?? null, formality_tier: r.formality_tier, is_layer: r.is_layer, is_inner: r.is_inner,
    min_temp: r.min_temp, max_temp: r.max_temp, style_tags: r.style_tags,
  };
}

function placeholderEmoji(p: Item): string {
  if (isDress(p)) return "👗";
  return ({ top: "👕", bottom: "👖", shoes: "👟", outerwear: "🧥", accessory: "💍" } as Record<string, string>)[p.category] ?? "👕";
}

function LookColumn({ title, picks }: { title: string; picks: OutfitPicks }) {
  const pieces = [picks.outer, picks.top, picks.bottom, picks.shoes].filter(Boolean) as Item[];
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 truncate">{title}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {pieces.map(p => (
          <div key={p.id} className="rounded-xl bg-neutral-50 overflow-hidden">
            <div className="aspect-square flex items-center justify-center">
              {p.image_url
                ? <img src={p.image_url} alt={p.type} loading="lazy" className="w-full h-full object-contain p-1.5" />
                : <span className="text-xl opacity-50">{placeholderEmoji(p)}</span>}
            </div>
            <p className="px-1.5 pb-1.5 text-[10px] capitalize text-neutral-500 truncate">{p.color_family} {String(p.type).replace(/_/g, " ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CoupleMode({ myItems, myGender, tempC, isRaining }: {
  myItems: Item[];
  myGender: Gender;
  tempC?: number;
  isRaining?: boolean;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<Status>({ kind: "loading" });
  const [partnerItems, setPartnerItems] = React.useState<Item[]>([]);
  const [codeInput, setCodeInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [occasion, setOccasion] = React.useState<Occasion>("casual");
  const [seed, setSeed] = React.useState(() => Date.now());

  const refresh = React.useCallback(async () => {
    const { data, error } = await supabase.rpc("couple_status");
    if (error) { setStatus({ kind: "none" }); return; }
    const row = (data as any[])?.[0];
    if (!row) { setStatus({ kind: "none" }); setPartnerItems([]); return; }
    if (row.link_status === "pending") {
      setStatus({ kind: "pending", code: row.invite_code, expiresAt: row.invite_expires_at });
      setPartnerItems([]);
      return;
    }
    setStatus({ kind: "active", partnerName: row.partner_name || "your partner", partnerGender: row.partner_gender === "female" ? "female" : "male" });
    const { data: items } = await supabase.rpc("couple_partner_items");
    setPartnerItems(((items as any[]) ?? []).map(toItem));
  }, [supabase]);

  React.useEffect(() => { refresh(); }, [refresh]);
  React.useEffect(() => { if (open) refresh(); }, [open, refresh]);

  async function createInvite() {
    setBusy(true); setMessage(null);
    const { error } = await supabase.rpc("couple_create_invite", { p_gender: myGender });
    if (error) setMessage(friendlyError(error.message));
    await refresh();
    setBusy(false);
  }

  async function acceptInvite() {
    const code = codeInput.trim();
    if (!code) return;
    setBusy(true); setMessage(null);
    const { error } = await supabase.rpc("couple_accept_invite", { p_code: code, p_gender: myGender });
    if (error) setMessage(friendlyError(error.message));
    else setCodeInput("");
    await refresh();
    setBusy(false);
  }

  async function disconnect() {
    const text = status.kind === "active"
      ? `Disconnect from ${status.partnerName}? You'll both stop seeing each other's wardrobe.`
      : "Cancel this invitation?";
    if (!window.confirm(text)) return;
    setBusy(true);
    await supabase.rpc("couple_end");
    await refresh();
    setBusy(false);
  }

  async function shareCode(code: string) {
    const text = `Let's coordinate outfits on Occaswear 💑 Open the app → Couple Mode → "I have a code" and enter: ${code}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Occaswear Couple Mode", text }); return; }
      await navigator.clipboard.writeText(text);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const pairs: CouplePair[] = React.useMemo(() => {
    if (status.kind !== "active" || partnerItems.length === 0) return [];
    return generateCoupleLooks(myItems, partnerItems, occasion, seed, {
      tempC, isRaining, myGender, partnerGender: status.partnerGender, votedItemIds: loadVotedItemIds(),
    });
  }, [status, partnerItems, myItems, occasion, seed, tempC, isRaining, myGender]);

  const subtitle =
    status.kind === "active" ? `Connected with ${status.partnerName}`
    : status.kind === "pending" ? "Invitation sent · waiting for your partner"
    : "Coordinate outfits with your partner";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full mt-4 rounded-2xl border border-black/8 p-4 text-left hover:bg-neutral-50 transition active:scale-[0.98]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">💑</span>
            <div>
              <p className="font-bold text-sm">Couple Mode</p>
              <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status.kind === "active" && <span className="w-2 h-2 rounded-full bg-green-500" />}
            <span className="text-neutral-400 text-sm">→</span>
          </div>
        </div>
      </button>

      {/* Rendered at the page root: inside the animated outfits view, `fixed`
          was trapped under the nav bar and looked see-through. */}
      {open && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm overlay-enter" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[90vh] overflow-y-auto drawer-enter"
            style={{ background: "#FAF8F5", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-neutral-200" /></div>
            <div className="px-5 pb-10 pt-2 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: "22px", fontWeight: 400, color: "#1A1A1A" }}>💑 Couple Mode</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close"
                  className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition">✕</button>
              </div>

              {message && <p className="mb-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">{message}</p>}

              {status.kind === "loading" && (
                <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-black/15 border-t-black rounded-full animate-spin" /></div>
              )}

              {(status.kind === "none" || status.kind === "pending") && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl border border-black/8 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-3">Invite your partner</p>
                    {status.kind === "pending" ? (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1 bg-neutral-50 rounded-xl px-4 py-3 text-center">
                            <p className="font-display font-black text-2xl tracking-[0.2em]">{status.code}</p>
                          </div>
                          <button type="button" onClick={() => shareCode(status.code)}
                            className="rounded-xl bg-black text-white px-4 py-3 text-sm font-bold hover:bg-black/85 transition">
                            {copied ? "✓ Copied" : "Send"}
                          </button>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Your partner enters this code in their Couple Mode. It works once and expires on{" "}
                          {new Date(status.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.
                          Nothing is shared until they accept.
                        </p>
                        <button type="button" onClick={disconnect} disabled={busy}
                          className="mt-3 text-xs text-neutral-400 underline hover:text-black transition">Cancel invitation</button>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-neutral-500 leading-relaxed mb-3">
                          Create a one-time code and send it to your partner. Once they accept, you both get outfits that go together.
                        </p>
                        <button type="button" onClick={createInvite} disabled={busy}
                          className="w-full rounded-xl bg-black text-white py-3 text-sm font-bold disabled:opacity-40 hover:bg-black/85 transition">
                          {busy ? "Creating…" : "Create invite code"}
                        </button>
                      </>
                    )}
                  </div>

                  <div className="rounded-2xl border border-black/8 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-3">I have a code</p>
                    <div className="flex gap-2">
                      <input type="text" value={codeInput} maxLength={8}
                        onChange={e => setCodeInput(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ""))}
                        placeholder="e.g. 7F3A9C21"
                        className="flex-1 min-w-0 rounded-xl border border-black/10 px-4 py-3 text-center text-base font-bold tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-black/8 uppercase" />
                      <button type="button" onClick={acceptInvite} disabled={busy || codeInput.trim().length < 8}
                        className="rounded-xl bg-black text-white px-4 py-3 text-sm font-bold disabled:opacity-40 hover:bg-black/85 transition">
                        Connect
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed px-1">
                    🔒 Only the person who accepts your code can see your wardrobe, and either of you can disconnect at any time.
                  </p>
                </div>
              )}

              {status.kind === "active" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-5 gap-1.5">
                    {OCCASIONS.map(o => (
                      <button key={o.v} type="button" onClick={() => setOccasion(o.v)}
                        className={"rounded-xl border-2 py-2 text-center transition " + (occasion === o.v ? "border-black bg-black text-white" : "border-black/10 bg-white")}>
                        <span className="block text-base">{o.e}</span>
                        <span className="text-[10px] font-bold">{o.l}</span>
                      </button>
                    ))}
                  </div>

                  {partnerItems.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-6">{status.partnerName} hasn&apos;t added any clothes yet.</p>
                  ) : pairs.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-6">One of you needs at least a top, a bottom and shoes (or a dress and shoes) for this.</p>
                  ) : (
                    pairs.map((p, i) => (
                      <div key={`${p.mine.outfit_hash}-${p.theirs.outfit_hash}`} className="rounded-2xl border border-black/8 bg-white overflow-hidden">
                        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                          <p className="text-xs font-bold">Look {i + 1}</p>
                        </div>
                        <div className="px-4 py-2 flex gap-3">
                          <LookColumn title="You" picks={p.mine.picks} />
                          <div className="w-px bg-black/8" />
                          <LookColumn title={status.partnerName} picks={p.theirs.picks} />
                        </div>
                        <p className="px-4 pb-4 pt-1 text-xs text-neutral-500 leading-relaxed">{p.why}</p>
                      </div>
                    ))
                  )}

                  {pairs.length > 0 && (
                    <button type="button" onClick={() => setSeed(Date.now())}
                      className="rounded-xl border border-black/15 bg-white py-3 text-sm font-bold hover:bg-neutral-50 transition">
                      ↻ New pairings
                    </button>
                  )}

                  <button type="button" onClick={disconnect} disabled={busy}
                    className="text-xs text-neutral-400 underline hover:text-red-500 transition py-2">
                    Disconnect from {status.partnerName}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
