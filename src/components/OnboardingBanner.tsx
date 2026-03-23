// src/components/OnboardingBanner.tsx
"use client";

type Props = {
  hasTops: boolean;
  hasBottoms: boolean;
  hasShoes: boolean;
};

type Step = {
  id: number;
  label: string;
  description: string;
  emoji: string;
  done: boolean;
};

export default function OnboardingBanner({ hasTops, hasBottoms, hasShoes }: Props) {
  const allDone = hasTops && hasBottoms && hasShoes;

  // Nëse garderoba është e plotë, mos e trego
  if (allDone) return null;

  const steps: Step[] = [
    {
      id: 1,
      label: "Add a Top",
      description: "T-shirt, polo, shirt, hoodie — anything you wear on top.",
      emoji: "👕",
      done: hasTops,
    },
    {
      id: 2,
      label: "Add a Bottom",
      description: "Jeans, chinos, trousers — any pants or shorts.",
      emoji: "👖",
      done: hasBottoms,
    },
    {
      id: 3,
      label: "Add Shoes",
      description: "Sneakers, boots, loafers — your go-to pair.",
      emoji: "👟",
      done: hasShoes,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const currentStep = steps.find((s) => !s.done);

  return (
    <div className="rounded-2xl border-2 border-black bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
            Getting Started
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {completedCount === 0
              ? "Add 3 items to generate your first outfit"
              : completedCount === 1
              ? "2 more items to go!"
              : "Almost there — 1 more item!"}
          </h2>
        </div>
        <div className="text-2xl font-bold text-white/80">
          {completedCount}/3
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 w-full rounded-full bg-white/20">
        <div
          className="h-1.5 rounded-full bg-white transition-all duration-500"
          style={{ width: `${(completedCount / 3) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={
              "rounded-xl p-4 transition " +
              (step.done
                ? "bg-white/10 opacity-60"
                : step.id === currentStep?.id
                ? "bg-white text-black"
                : "bg-white/5 opacity-40")
            }
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{step.done ? "✅" : step.emoji}</span>
              <span className="font-semibold text-sm">{step.label}</span>
            </div>
            <p className={
              "mt-1 text-xs leading-relaxed " +
              (step.id === currentStep?.id ? "text-black/60" : "text-white/60")
            }>
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Current action */}
      {currentStep && (
        <p className="mt-4 text-sm text-white/70">
          👇 Use the <span className="font-semibold text-white">Add Item</span> form below to add your first {currentStep.label.replace("Add a ", "").replace("Add ", "").toLowerCase()}.
        </p>
      )}
    </div>
  );
}