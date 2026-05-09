"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { Item, Category } from "@/lib/engine/types";
import { generateOutfits } from "@/lib/engine/generate";

type Gender = "male" | "female";

type CoupleOutfit = {
  person1: { top: string; bottom: string; shoes: string; colors: string[] };
  person2: { top: string; bottom: string; shoes: string; colors: string[] };
  harmony: number;
  occasion: string;
};

const OCCASIONS = [
  { v: "casual", e: "☀️", l: "Casual" },
  { v: "date",   e: "🌹", l: "Date"   },
  { v: "work",   e: "💼", l: "Work"   },
  { v: "travel", e: "✈️", l: "Travel" },
];

const COLOR_DOT: Record<string, string> = {
  black: "#1a1a1a", white: "#f5f5f5", neutral: "#d4d0c8",
  earth: "#c8a870", blue: "#6b9bc8", bright: "#a07bc8",
  green: "#7bc8a0", red: "#c87b7b", pink: "#c87ba8",
  purple: "#9b7bc8", orange: "#c8a07b", yellow: "#c8c87b",
};

function pretty(s?: string) {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function colorHarmony(c1: string, c2: string): number {
  const neutral = new Set(["neutral", "black", "white", "earth"]);
  if (neutral.has(c1) || neutral.has(c2)) return 90;
  if (c1 === c2) return 85;
  const cool = new Set(["blue", "green", "purple"]);
  const warm = new Set(["red", "orange", "yellow", "pink"]);
  if (cool.has(c1) && cool.has(c2)) return 80;
  if (warm.has(c1) && warm.has(c2)) return 75;
  return 60;
}

export default function CoupleMode({ myItems, myGender }: {
  myItems: Item[];
  myGender: Gender;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"connect" | "outfits">("connect");
  const [myCode, setMyCode] = React.useState<string | null>(null);
  const [partnerCode, setPartnerCode] = React.useState("");
  const [connected, setConnected] = React.useState(false);
  const [partnerItems, setPartnerItems] = React.useState<Item[]>([]);
  const [partnerGender, setPartnerGender] = React.useState<Gender>("female");
  const [occasion, setOccasion] = React.useState("casual");
  const [outfits, setOutfits] = React.useState<CoupleOutfit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Kontrollo nëse kemi kod ekzistues
  React.useEffect(() => {
    if (!open) return;
    const saved = localStorage.getItem("om_couple_code");
    if (saved) setMyCode(saved);
  }, [open]);

  async function handleCreateCode() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus("Not logged in."); setLoading(false); return; }

    const code = generateCode();

    // Ruaj te Supabase — couples tabela
    const { error } = await supabase.from("couples").upsert({
      code,
      user_id: user.id,
      gender: myGender,
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Nëse tabela nuk ekziston, ruaj vetëm lokalisht
      console.warn("couples table not found, saving locally");
    }

    setMyCode(code);
    localStorage.setItem("om_couple_code", code);
    setLoading(false);
  }

  async function handleConnect() {
    if (!partnerCode.trim()) { setStatus("Enter your partner's code."); return; }
    setLoading(true); setStatus(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Kërko partnerin te Supabase
    const { data: partnerData } = await supabase
      .from("couples")
      .select("user_id, gender")
      .eq("code", partnerCode.trim().toUpperCase())
      .single();

    if (partnerData) {
      // Merr items e partnerit
      const { data: items } = await supabase
        .from("items")
        .select("id, category, type, color_family, image_url")
        .eq("user_id", partnerData.user_id);

      if (items && items.length > 0) {
        setPartnerItems(items.map((r: any) => ({
          id: r.id, category: r.category as Category,
          type: r.type, color_family: r.color_family ?? "neutral",
          image_url: r.image_url ?? null,
        })));
        setPartnerGender(partnerData.gender ?? "female");
        setConnected(true);
        setTab("outfits");
        generateCoupleOutfits(items, partnerData.gender ?? "female");
      } else {
        setStatus("Partner found but has no wardrobe items yet.");
      }
    } else {
      // Demo mode — simulo partner me items të thjeshta
      setStatus("Code not found. Using demo mode.");
      const demoItems: Item[] = [
        { id: "d1", category: "top", type: "blouse", color_family: "white" as any, image_url: null },
        { id: "d2", category: "bottom", type: "midi_skirt", color_family: "neutral" as any, image_url: null },
        { id: "d3", category: "shoes", type: "ankle_boots", color_family: "black" as any, image_url: null },
      ];
      setPartnerItems(demoItems);
      setPartnerGender("female");
      setConnected(true);
      setTab("outfits");
      generateCoupleOutfits(demoItems, "female");
    }
    setLoading(false);
  }

  function generateCoupleOutfits(pItems: Item[], pGender: Gender) {
    const tempC = typeof window !== "undefined" ? parseFloat(localStorage.getItem("om_weather_temp") ?? "20") : 20;
    const style = typeof window !== "undefined" ? localStorage.getItem("om_style") ?? "minimal" : "minimal";
    const myOutfits = generateOutfits(myItems, occasion as any, Date.now(), { gender: myGender, tempC, style });
    const partnerOutfitsList = generateOutfits(pItems, occasion as any, Date.now() + 1, { gender: pGender, tempC, style });

    if (!myOutfits || !partnerOutfitsList) return;

    const result: CoupleOutfit[] = myOutfits.slice(0, 2).map((myO: any, i: number) => {
      const pO = partnerOutfitsList[i] ?? partnerOutfitsList[0];
      const myPicks = myO.picks ?? {};
      const pPicks = pO?.picks ?? {};

      const myColors = [myPicks.top?.color_family, myPicks.bottom?.color_family, myPicks.shoes?.color_family].filter(Boolean);
      const pColors = [pPicks?.top?.color_family, pPicks?.bottom?.color_family, pPicks?.shoes?.color_family].filter(Boolean);

      // Harmony score bazuar në ngjyra
      let harmonyTotal = 0;
      let count = 0;
      myColors.forEach(c1 => {
        pColors.forEach(c2 => {
          harmonyTotal += colorHarmony(c1, c2);
          count++;
        });
      });
      const harmony = count > 0 ? Math.round(harmonyTotal / count) : 70;

      return {
        person1: {
          top: pretty(myPicks.top?.type),
          bottom: pretty(myPicks.bottom?.type),
          shoes: pretty(myPicks.shoes?.type),
          colors: myColors,
        },
        person2: {
          top: pretty(pPicks?.top?.type),
          bottom: pretty(pPicks?.bottom?.type),
          shoes: pretty(pPicks?.shoes?.type),
          colors: pColors,
        },
        harmony,
        occasion,
      };
    });

    setOutfits(result);
  }

  function handleCopyCode() {
    if (!myCode) return;
    navigator.clipboard.writeText(myCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleOccasionChange(occ: string) {
    setOccasion(occ);
    if (connected && partnerItems.length > 0) {
      generateCoupleOutfits(partnerItems, partnerGender);
    }
  }

  return (
    <>
      {/* Entry button */}
      <button type="button" onClick={() => setOpen(true)}
        className="w-full mt-4 rounded-2xl border border-black/8 p-4 text-left hover:bg-neutral-50 transition active:scale-[0.98]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">💑</span>
            <div>
              <p className="font-bold text-sm">Couple Mode</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {connected ? "Connected · Coordinated outfits" : "Coordinate outfits with your partner"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connected && <span className="w-2 h-2 rounded-full bg-green-500" />}
            <span className="text-neutral-400 text-sm">→</span>
          </div>
        </div>
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm overlay-enter" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[90vh] overflow-y-auto drawer-enter"
            style={{ background:"#FAF8F5", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-200" />
            </div>
            <div className="px-5 pb-10 pt-2">

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 style={{fontFamily:"'Cormorant', Georgia, serif", fontSize:"22px", fontWeight:400, color:"#1A1A1A"}}>💑 Couple Mode</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {connected ? "You're connected" : "Share your code to connect"}
                  </p>
                </div>
                <button type="button" onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition">✕</button>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {[
                  { id: "connect", label: "🔗 Connect" },
                  { id: "outfits", label: "👗 Outfits" },
                ].map(t => (
                  <button key={t.id} type="button" onClick={() => setTab(t.id as any)}
                    className={"rounded-xl py-2.5 text-sm font-bold border-2 transition " +
                      (tab === t.id ? "border-black bg-black text-white" : "border-black/10 text-neutral-500")}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB — Connect */}
              {tab === "connect" && (
                <div className="flex flex-col gap-5">

                  {/* My Code */}
                  <div className="rounded-2xl border border-black/8 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-3">Your Code</p>
                    {myCode ? (
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1 bg-neutral-50 rounded-xl px-4 py-3 text-center">
                            <p className="font-display font-black text-3xl tracking-[0.2em]">{myCode}</p>
                          </div>
                          <button type="button" onClick={handleCopyCode}
                            className={"rounded-xl px-4 py-3 text-sm font-bold border transition " +
                              (copied ? "bg-green-50 border-green-200 text-green-700" : "border-black/10 hover:bg-neutral-50")}>
                            {copied ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                        <p className="text-xs text-neutral-400 text-center">Send this code to your partner</p>
                      </div>
                    ) : (
                      <button type="button" onClick={handleCreateCode} disabled={loading}
                        className="w-full rounded-xl bg-black text-white py-3 text-sm font-bold disabled:opacity-40 hover:bg-black/85 transition">
                        {loading ? "Creating..." : "Generate My Code"}
                      </button>
                    )}
                  </div>

                  {/* Partner Code */}
                  <div className="rounded-2xl border border-black/8 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-3">Partner's Code</p>
                    {connected ? (
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                        <p className="text-sm font-bold text-green-700">Connected! {partnerItems.length} items loaded.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          value={partnerCode}
                          onChange={e => setPartnerCode(e.target.value.toUpperCase())}
                          placeholder="e.g. ABC123"
                          maxLength={6}
                          className="w-full rounded-xl border border-black/10 px-4 py-3 text-center text-lg font-bold tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-black/8 uppercase"
                        />
                        <button type="button" onClick={handleConnect} disabled={loading || !partnerCode.trim()}
                          className="w-full rounded-xl bg-black text-white py-3 text-sm font-bold disabled:opacity-40 hover:bg-black/85 transition">
                          {loading ? "Connecting..." : "Connect with Partner"}
                        </button>
                      </div>
                    )}
                  </div>

                  {status && (
                    <p className="text-sm text-neutral-500 text-center">{status}</p>
                  )}

                  <div className="rounded-xl bg-neutral-50 border border-black/6 px-4 py-3">
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      💡 Both you and your partner need to generate a code. Share yours and enter theirs to see coordinated outfit suggestions from both wardrobes.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB — Outfits */}
              {tab === "outfits" && (
                <div className="flex flex-col gap-5">
                  {!connected ? (
                    <div className="text-center py-10">
                      <p className="text-3xl mb-3">🔗</p>
                      <p className="font-bold text-sm mb-1">Not connected yet</p>
                      <p className="text-xs text-neutral-400 mb-4">Connect with your partner first</p>
                      <button type="button" onClick={() => setTab("connect")}
                        className="rounded-full bg-black text-white px-5 py-2.5 text-xs font-bold">
                        Go to Connect →
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Occasion selector */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2">Occasion</p>
                        <div className="grid grid-cols-4 gap-2">
                          {OCCASIONS.map(o => (
                            <button key={o.v} type="button" onClick={() => handleOccasionChange(o.v)}
                              className={"rounded-xl border-2 py-2 text-center transition " +
                                (occasion === o.v ? "border-black bg-black text-white" : "border-black/10")}>
                              <span className="block text-lg">{o.e}</span>
                              <span className="text-xs font-bold">{o.l}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Couple outfits */}
                      {outfits.map((outfit, i) => (
                        <div key={i} className="rounded-2xl border border-black/8 overflow-hidden">
                          {/* Harmony score */}
                          <div className="bg-black text-white px-5 py-3 flex items-center justify-between">
                            <p className="font-bold text-sm">Look {i + 1}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-white/50">Harmony</span>
                              <span className="font-display font-black text-lg">{outfit.harmony}</span>
                              <span className="text-xs text-white/40">/100</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 divide-x divide-black/8">
                            {/* Person 1 — Me */}
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm">{myGender === "male" ? "👔" : "👗"}</span>
                                <p className="text-xs font-bold text-neutral-500">You</p>
                              </div>
                              <div className="flex gap-1.5 mb-3">
                                {outfit.person1.colors.map((c, ci) => (
                                  <div key={ci} className="w-6 h-6 rounded-full border border-black/10"
                                    style={{ background: COLOR_DOT[c] ?? "#ccc" }} />
                                ))}
                              </div>
                              <div className="flex flex-col gap-1">
                                <p className="text-xs font-medium">{outfit.person1.top}</p>
                                <p className="text-xs text-neutral-400">{outfit.person1.bottom}</p>
                                <p className="text-xs text-neutral-400">{outfit.person1.shoes}</p>
                              </div>
                            </div>

                            {/* Person 2 — Partner */}
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm">{partnerGender === "male" ? "👔" : "👗"}</span>
                                <p className="text-xs font-bold text-neutral-500">Partner</p>
                              </div>
                              <div className="flex gap-1.5 mb-3">
                                {outfit.person2.colors.map((c, ci) => (
                                  <div key={ci} className="w-6 h-6 rounded-full border border-black/10"
                                    style={{ background: COLOR_DOT[c] ?? "#ccc" }} />
                                ))}
                              </div>
                              <div className="flex flex-col gap-1">
                                <p className="text-xs font-medium">{outfit.person2.top}</p>
                                <p className="text-xs text-neutral-400">{outfit.person2.bottom}</p>
                                <p className="text-xs text-neutral-400">{outfit.person2.shoes}</p>
                              </div>
                            </div>
                          </div>

                          {/* Harmony bar */}
                          <div className="px-5 pb-4 pt-2">
                            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-1.5 bg-black rounded-full transition-all duration-700"
                                style={{ width: `${outfit.harmony}%` }} />
                            </div>
                            <p className="text-xs text-neutral-400 mt-2 text-center">
                              {outfit.harmony >= 85 ? "Perfect match 💑" :
                               outfit.harmony >= 75 ? "Great coordination 👌" :
                               "Good combination ✓"}
                            </p>
                          </div>
                        </div>
                      ))}

                      <button type="button" onClick={() => generateCoupleOutfits(partnerItems, partnerGender)}
                        className="rounded-xl border border-black/15 py-3 text-sm font-bold hover:bg-neutral-50 transition">
                        🔄 Generate New Looks
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}