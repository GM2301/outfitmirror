// src/components/PhotoUpload.tsx
"use client";

import * as React from "react";

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
};

export default function PhotoUpload({ file, onChange }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    onChange(f);
  }

  function handleRemove() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {/* Input i fshehur - hap kamerën/galerinë në mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {preview ? (
        /* Preview */
        <div className="rounded-2xl overflow-hidden border border-black/10">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          <div className="p-3 bg-white border-t border-black/8 flex gap-2">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="flex-1 rounded-xl border border-black/10 py-2.5 text-sm font-medium hover:bg-neutral-50 transition">
              📷 Change
            </button>
            <button type="button" onClick={handleRemove}
              className="rounded-xl border border-black/10 px-4 py-2.5 text-sm text-neutral-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition">
              ✕
            </button>
          </div>
        </div>
      ) : (
        /* Buton i madh */
        <button type="button" onClick={() => inputRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-black/15 py-8 flex flex-col items-center gap-3 hover:bg-neutral-50 hover:border-black/25 transition active:scale-95">
          <div className="h-14 w-14 rounded-full bg-neutral-100 flex items-center justify-center text-2xl">
            📷
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm text-neutral-800">Add Photo</p>
            <p className="text-xs text-neutral-400 mt-0.5">Take a photo or choose from gallery</p>
          </div>
        </button>
      )}
    </div>
  );
}