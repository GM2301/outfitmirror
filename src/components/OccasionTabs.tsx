"use client";

import * as React from "react";
import type { Occasion } from "@/lib/engine/types";

const OPTIONS: { key: Occasion; label: string }[] = [
  { key: "work", label: "work" },
  { key: "date", label: "date" },
  { key: "casual", label: "casual" },
  { key: "night_out", label: "night out" },
  { key: "travel", label: "travel" },
  { key: "gym", label: "gym" },
];

export function OccasionTabs({
  value,
  onChange,
}: {
  value: Occasion;
  onChange: (v: Occasion) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={
              "rounded-full border px-4 py-2 text-sm transition " +
              (active
                ? "bg-black text-white border-black"
                : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ✅ KJO e mbyll punën: lejon edhe default import edhe named import
export default OccasionTabs;
