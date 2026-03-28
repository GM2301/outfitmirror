// src/components/LocationModal.tsx
"use client";

type Props = {
  onAllow: () => void;
  onDeny: () => void;
};

export default function LocationModal({ onAllow, onDeny }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
        
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-2xl mx-auto">
          🌤️
        </div>

        {/* Text */}
        <div className="mt-4 text-center">
          <h2 className="text-lg font-black">Weather-aware outfits</h2>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
            OutfitMirror uses your location to check the weather and filter out clothes that don't fit the conditions.
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Your location is never stored or shared.
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={onAllow}
            className="w-full rounded-xl bg-black text-white py-3.5 text-sm font-semibold hover:bg-black/85 transition">
            Allow Location
          </button>
          <button type="button" onClick={onDeny}
            className="w-full rounded-xl border border-black/10 py-3.5 text-sm font-medium text-neutral-500 hover:bg-neutral-50 transition">
            Don't Allow
          </button>
        </div>
      </div>
    </div>
  );
}