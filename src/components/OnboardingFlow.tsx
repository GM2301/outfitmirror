"use client";

import * as React from "react";
import type { Gender } from "@/lib/engine/types";

type Step = 1 | 2 | 3 | 4;

type Props = {
  onComplete: (gender: Gender) => void;
};

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
  const [step, setStep] = React.useState<Step>(1);
  const [gender, setGender] = React.useState<Gender | null>(null);
  const [visible, setVisible] = React.useState(true);

  function transition(nextStep: Step) {
    setVisible(false);
    setTimeout(() => {
      setStep(nextStep);
      setVisible(true);
    }, 250);
  }

  function handleGenderSelect(g: Gender) {
    setGender(g);
    transition(2);
  }

  function handleComplete() {
    if (!gender) return;
    localStorage.setItem("om_gender", gender);
    localStorage.setItem("om_onboarding_done", "1");
    onComplete(gender);
  }

  const features = gender === "female" ? FEMALE_FEATURES : MALE_FEATURES;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">

      {/* Progress bar */}
      <div className="h-0.5 bg-white/10 w-full">
        <div
          className="h-0.5 bg-white transition-all duration-500 ease-out"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div
        className={`flex-1 flex flex-col items-center justify-center px-6 text-white transition-all duration-250 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}>

        {/* STEP 1 — Welcome */}
        {step === 1 && (
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl mx-auto mb-8">
              ✨
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">OutfitMirror</p>
            <h1 className="font-display text-4xl font-black leading-tight mb-4">
              Your wardrobe.<br />
              <span className="text-white/30">Reimagined.</span>
            </h1>
            <p className="text-sm text-white/50 leading-relaxed mb-10">
              AI that knows your clothes and styles you in seconds. Let's set you up.
            </p>
            <button
              onClick={() => transition(2)}
              className="w-full rounded-full bg-white text-black py-4 text-sm font-bold hover:bg-white/90 transition btn-press">
              Begin →
            </button>
          </div>
        )}

        {/* STEP 2 — Gender */}
        {step === 2 && (
          <div className="w-full max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-3 text-center">Step 1 of 3</p>
            <h2 className="font-display text-3xl font-black text-center mb-2">I dress as a</h2>
            <p className="text-sm text-white/40 text-center mb-8">This helps us apply the right styling rules</p>

            <div className="grid grid-cols-2 gap-3">
              {/* Man */}
              <button onClick={() => handleGenderSelect("male")}
                className="rounded-2xl border-2 border-white/15 p-6 text-left hover:border-white/40 hover:bg-white/5 transition-all btn-press group">
                <div className="text-4xl mb-4">👔</div>
                <p className="font-display text-xl font-black mb-1">Man</p>
                <p className="text-xs text-white/40 leading-tight">Menswear rules & occasions</p>
              </button>

              {/* Woman */}
              <button onClick={() => handleGenderSelect("female")}
                className="rounded-2xl border-2 border-white/15 p-6 text-left hover:border-white/40 hover:bg-white/5 transition-all btn-press group">
                <div className="text-4xl mb-4">👗</div>
                <p className="font-display text-xl font-black mb-1">Woman</p>
                <p className="text-xs text-white/40 leading-tight">Womenswear rules & occasions</p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — What you get */}
        {step === 3 && (
          <div className="w-full max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-3 text-center">Step 2 of 3</p>
            <h2 className="font-display text-3xl font-black text-center mb-2">Here's what you get</h2>
            <p className="text-sm text-white/40 text-center mb-8">
              Personalized for {gender === "female" ? "women" : "men"}
            </p>

            <div className="space-y-3 mb-10">
              {features.map((f, i) => (
                <div
                  key={f.text}
                  className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/8 px-4 py-3.5"
                  style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="text-xl flex-shrink-0">{f.icon}</span>
                  <p className="text-sm text-white/70">{f.text}</p>
                </div>
              ))}
            </div>

            <button onClick={() => transition(4)}
              className="w-full rounded-full bg-white text-black py-4 text-sm font-bold hover:bg-white/90 transition btn-press">
              Continue →
            </button>
          </div>
        )}

        {/* STEP 4 — Upload CTA */}
        {step === 4 && (
          <div className="w-full max-w-sm text-center">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center text-4xl">
                📷
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-black text-sm font-bold shadow-lg">
                AI
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-3">Step 3 of 3</p>
            <h2 className="font-display text-3xl font-black mb-3">
              Upload 3 photos.<br />
              <span className="text-white/30">AI does the rest.</span>
            </h2>
            <p className="text-sm text-white/50 leading-relaxed mb-3">
              Take a photo of any top, bottom, and shoes. AI reads the type and color automatically — no manual entry needed.
            </p>
            <div className="rounded-xl bg-white/6 border border-white/10 px-4 py-3 mb-8 text-left">
              <div className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0 mt-0.5">💡</span>
                <p className="text-xs text-white/45 leading-relaxed">
                  Lay clothes flat or hang them up. Natural light works best. No special setup needed.
                </p>
              </div>
            </div>

            <button onClick={handleComplete}
              className="w-full rounded-full bg-white text-black py-4 text-sm font-bold hover:bg-white/90 transition btn-press mb-3">
              Open My Wardrobe →
            </button>
            <button onClick={handleComplete}
              className="w-full rounded-full border border-white/15 py-3 text-sm text-white/50 hover:bg-white/5 transition">
              Skip for now
            </button>
          </div>
        )}
      </div>

      {/* Bottom step dots */}
      <div className="flex justify-center gap-1.5 pb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-1 rounded-full transition-all ${
            s === step ? "w-6 bg-white" : s < step ? "w-2 bg-white/40" : "w-2 bg-white/15"
          }`} />
        ))}
      </div>
    </div>
  );
}