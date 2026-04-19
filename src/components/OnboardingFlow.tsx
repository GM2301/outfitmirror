"use client";

import * as React from "react";
import type { Gender } from "@/lib/engine/types";

type Style = "minimal" | "streetwear" | "smart_casual" | "classic" | "sporty";
type Props = { onComplete: (gender: Gender, style: Style) => void; };

const STYLES: { id: Style; emoji: string; label: string; desc: string }[] = [
  { id: "minimal",      emoji: "◻️", label: "Minimal",      desc: "Clean, simple, effortless" },
  { id: "streetwear",   emoji: "🧢", label: "Streetwear",   desc: "Bold, urban, expressive" },
  { id: "smart_casual", emoji: "👔", label: "Smart Casual", desc: "Polished but relaxed" },
  { id: "classic",      emoji: "🎩", label: "Classic",      desc: "Timeless, refined, sharp" },
  { id: "sporty",       emoji: "⚡", label: "Sporty",       desc: "Athletic, functional, fresh" },
];

const MALE_FEATURES = [
  { icon: "💼", text: "Work, Date, Casual, Gym, Travel, Night Out" },
  { icon: "🌤️", text: "Weather-aware outfit filtering" },
  { icon: "🧩", text: "Missing Piece — the one item that unlocks more" },
  { icon: "✈️", text: "Trip Planner for multi-day travel" },
];

const FEMALE_FEATURES = [
  { icon: "👗", text: "Work, Date, Brunch, Gala, Casual, Gym" },
  { icon: "🌤️", text: "Weather-aware outfit filtering" },
  { icon: "🧩", text: "Missing Piece — find what your wardrobe needs" },
  { icon: "✈️", text: "Trip Planner for multi-day travel" },
];

export default function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = React.useState(1);
  const [gender, setGender] = React.useState<Gender | null>(null);
  const [style, setStyle] = React.useState<Style | null>(null);

  function handleGenderSelect(g: Gender) {
    setGender(g);
    setStep(3);
  }

  function handleStyleSelect(s: Style) {
    setStyle(s);
    setStep(4);
  }

  function handleComplete() {
    const g = gender ?? "male";
    const s = style ?? "smart_casual";
    localStorage.setItem("om_gender", g);
    localStorage.setItem("om_style", s);
    localStorage.setItem("om_onboarding_done", "1");
    onComplete(g, s);
  }

  const features = gender === "female" ? FEMALE_FEATURES : MALE_FEATURES;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {/* Progress bar */}
      <div className="h-0.5 bg-white/10 w-full flex-shrink-0">
        <div className="h-0.5 bg-white transition-all duration-500"
          style={{ width: `${(step / 5) * 100}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-white overflow-y-auto">

        {/* STEP 1 — Welcome */}
        {step === 1 && (
          <div className="w-full max-w-sm text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl mx-auto mb-8">✨</div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">OutfitMirror</p>
            <h1 className="font-display text-4xl font-black leading-tight mb-4">
              Your wardrobe.<br />
              <span className="text-white/30">Reimagined.</span>
            </h1>
            <p className="text-sm text-white/50 leading-relaxed mb-10">
              AI that knows your clothes and styles you in seconds.
            </p>
            <button onClick={() => setStep(2)}
              className="w-full rounded-full bg-white text-black py-4 text-sm font-bold hover:bg-white/90 transition active:scale-[0.98]">
              Begin →
            </button>
          </div>
        )}

        {/* STEP 2 — Gender */}
        {step === 2 && (
          <div className="w-full max-w-sm py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-3 text-center">Step 1 of 4</p>
            <h2 className="font-display text-3xl font-black text-center mb-2">I dress as a</h2>
            <p className="text-sm text-white/40 text-center mb-8">This helps us apply the right styling rules</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => handleGenderSelect("male")}
                className="rounded-2xl border-2 border-white/15 p-6 text-left hover:border-white/50 hover:bg-white/5 active:scale-[0.97] transition-all cursor-pointer">
                <div className="text-4xl mb-4">👔</div>
                <p className="font-display text-xl font-black mb-1">Man</p>
                <p className="text-xs text-white/40 leading-tight">Menswear rules</p>
              </button>
              <button type="button" onClick={() => handleGenderSelect("female")}
                className="rounded-2xl border-2 border-white/15 p-6 text-left hover:border-white/50 hover:bg-white/5 active:scale-[0.97] transition-all cursor-pointer">
                <div className="text-4xl mb-4">👗</div>
                <p className="font-display text-xl font-black mb-1">Woman</p>
                <p className="text-xs text-white/40 leading-tight">Womenswear rules</p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Style */}
        {step === 3 && (
          <div className="w-full max-w-sm py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-3 text-center">Step 2 of 4</p>
            <h2 className="font-display text-3xl font-black text-center mb-2">My style is</h2>
            <p className="text-sm text-white/40 text-center mb-6">We'll tailor outfit scoring to your vibe</p>
            <div className="flex flex-col gap-2.5">
              {STYLES.map(s => (
                <button key={s.id} type="button" onClick={() => handleStyleSelect(s.id)}
                  className={"rounded-2xl border-2 px-5 py-4 flex items-center gap-4 text-left transition-all active:scale-[0.97] " +
                    (style === s.id ? "border-white bg-white/10" : "border-white/15 hover:border-white/35 hover:bg-white/5")}>
                  <span className="text-2xl flex-shrink-0">{s.emoji}</span>
                  <div>
                    <p className="font-bold text-sm">{s.label}</p>
                    <p className="text-xs text-white/40">{s.desc}</p>
                  </div>
                  {style === s.id && <span className="ml-auto text-white">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4 — Features */}
        {step === 4 && (
          <div className="w-full max-w-sm py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-3 text-center">Step 3 of 4</p>
            <h2 className="font-display text-3xl font-black text-center mb-2">Here's what you get</h2>
            <p className="text-sm text-white/40 text-center mb-8">
              Personalized for {gender === "female" ? "women" : "men"}
            </p>
            <div className="space-y-3 mb-10">
              {features.map(f => (
                <div key={f.text} className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/8 px-4 py-3.5">
                  <span className="text-xl flex-shrink-0">{f.icon}</span>
                  <p className="text-sm text-white/70">{f.text}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(5)}
              className="w-full rounded-full bg-white text-black py-4 text-sm font-bold hover:bg-white/90 transition active:scale-[0.98]">
              Continue →
            </button>
          </div>
        )}

        {/* STEP 5 — Upload CTA */}
        {step === 5 && (
          <div className="w-full max-w-sm text-center py-8">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-4xl">📷</div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-black text-xs font-black shadow-lg">AI</div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-3">Step 4 of 4</p>
            <h2 className="font-display text-3xl font-black mb-3">
              Upload 3 photos.<br />
              <span className="text-white/30">AI does the rest.</span>
            </h2>
            <p className="text-sm text-white/50 leading-relaxed mb-3">
              Take a photo of any top, bottom, and shoes. AI reads type and color automatically.
            </p>
            <div className="rounded-xl bg-white/6 border border-white/10 px-4 py-3 mb-8 text-left">
              <p className="text-xs text-white/40 leading-relaxed">
                💡 Lay clothes flat or hang them. Natural light works best.
              </p>
            </div>
            <button onClick={handleComplete}
              className="w-full rounded-full bg-white text-black py-4 text-sm font-bold hover:bg-white/90 transition active:scale-[0.98] mb-3">
              Open My Wardrobe →
            </button>
            <button onClick={handleComplete}
              className="w-full rounded-full border border-white/15 py-3 text-sm text-white/50 hover:bg-white/5 transition">
              Skip for now
            </button>
          </div>
        )}
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5 pb-8 flex-shrink-0">
        {[1,2,3,4,5].map(s => (
          <div key={s} className={`h-1 rounded-full transition-all duration-300 ${
            s === step ? "w-6 bg-white" : s < step ? "w-2 bg-white/40" : "w-2 bg-white/15"
          }`} />
        ))}
      </div>
    </div>
  );
}