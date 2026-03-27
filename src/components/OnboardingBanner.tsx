// src/components/OnboardingBanner.tsx
"use client";

type Props = {
  hasTops: boolean;
  hasBottoms: boolean;
  hasShoes: boolean;
};

export default function OnboardingBanner({ hasTops, hasBottoms, hasShoes }: Props) {
  const allDone = hasTops && hasBottoms && hasShoes;
  if (allDone) return null;

  const steps = [
    { id: 1, label: "Top", description: "Shirt, polo, tee, sweater — anything on top.", emoji: "👕", done: hasTops },
    { id: 2, label: "Bottom", description: "Jeans, chinos, trousers — any pants.", emoji: "👖", done: hasBottoms },
    { id: 3, label: "Shoes", description: "Sneakers, boots, loafers — your go-to pair.", emoji: "👟", done: hasShoes },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const currentStep = steps.find(s => !s.done);

  return (
    <div className="rounded-2xl bg-black text-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
            Getting Started
          </p>
          <h2 className="mt-1 text-base font-bold">
            {completedCount === 0
              ? "Add 3 items to generate your first outfit"
              : completedCount === 1
              ? "2 more items to go"
              : "One more item — almost ready!"}
          </h2>
        </div>
        <span className="text-2xl font-black text-white/30">{completedCount}/3</span>
      </div>

      {/* Progress */}
      <div className="h-1 w-full rounded-full bg-white/10 mb-5">
        <div
          className="h-1 rounded-full bg-white transition-all duration-500"
          style={{ width: `${(completedCount / 3) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-3">
        {steps.map((step) => {
          const isActive = step.id === currentStep?.id;
          return (
            <div key={step.id}
              className={`rounded-xl p-3.5 transition ${
                step.done ? "bg-white/10 opacity-50" :
                isActive ? "bg-white text-black" :
                "bg-white/5 opacity-30"
              }`}>
              <span className="text-lg">{step.done ? "✅" : step.emoji}</span>
              <p className={`mt-2 text-xs font-bold ${isActive ? "text-black" : "text-white"}`}>
                {step.label}
              </p>
              <p className={`mt-0.5 text-xs leading-relaxed ${isActive ? "text-black/60" : "text-white/50"}`}>
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {currentStep && (
        <p className="mt-4 text-xs text-white/50">
          👇 Use <span className="font-semibold text-white">Add Item</span> below to add your {currentStep.label.toLowerCase()}.
        </p>
      )}
    </div>
  );
}