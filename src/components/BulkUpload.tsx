"use client";

import * as React from "react";

export type AIAnalysis = {
  category: "top" | "bottom" | "shoes";
  type: string;
  color_family: string;
};

export type BulkItem = {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "analyzing" | "done" | "error";
  analysis: AIAnalysis | null;
  error?: string;
};

type Props = {
  onComplete: (items: BulkItem[]) => void;
  onClose: () => void;
};

async function compressAndBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 800;
      let { width, height } = img;
      if (width > height) {
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      } else {
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas error")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve({ base64: canvas.toDataURL("image/jpeg", 0.7).split(",")[1], mimeType: "image/jpeg" });
    };
    img.onerror = () => reject(new Error("Failed"));
    img.src = url;
  });
}

async function analyzeOne(file: File): Promise<AIAnalysis | null> {
  try {
    const { base64, mimeType } = await compressAndBase64(file);
    const res = await fetch("/api/analyze-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    });
    const data = await res.json();
    if (data.error) return null;
    return data as AIAnalysis;
  } catch {
    return null;
  }
}

export default function BulkUpload({ onComplete, onClose }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [items, setItems] = React.useState<BulkItem[]>([]);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [done, setDone] = React.useState(false);

  function handleFiles(files: FileList) {
    const newItems: BulkItem[] = Array.from(files).map((file, i) => ({
      id: `${Date.now()}_${i}`,
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
      analysis: null,
    }));
    setItems(prev => [...prev, ...newItems]);
  }

  async function startAnalysis() {
    setAnalyzing(true);
    setDone(false);

    for (let i = 0; i < items.length; i++) {
      if (items[i].status === "done") continue;

      setItems(prev => prev.map((it, idx) =>
        idx === i ? { ...it, status: "analyzing" } : it
      ));

      const result = await analyzeOne(items[i].file);

      setItems(prev => prev.map((it, idx) =>
        idx === i ? {
          ...it,
          status: result ? "done" : "error",
          analysis: result,
          error: result ? undefined : "Could not analyze",
        } : it
      ));
    }

    setAnalyzing(false);
    setDone(true);
  }

  function handleAdd() {
    const readyItems = items.filter(it => it.status === "done" && it.analysis);
    onComplete(readyItems);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id));
  }

  const pendingCount = items.filter(it => it.status === "pending").length;
  const doneCount = items.filter(it => it.status === "done").length;
  const errorCount = items.filter(it => it.status === "error").length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg">Add Multiple Items</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Select all your wardrobe photos at once</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-neutral-50 transition text-neutral-400">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Upload zone */}
          {!analyzing && (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-black/15 py-6 flex flex-col items-center gap-2 hover:bg-neutral-50 hover:border-black/25 transition mb-4">
              <span className="text-3xl">📷</span>
              <p className="font-semibold text-sm">Select Photos</p>
              <p className="text-xs text-neutral-400">Tap to choose multiple photos from your gallery</p>
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          {/* Progress bar when analyzing */}
          {analyzing && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
                <span>Analyzing photos...</span>
                <span>{doneCount}/{items.length}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-100">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-300"
                  style={{ width: `${items.length > 0 ? (doneCount / items.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Items grid */}
          {items.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {items.map((item) => (
                <div key={item.id} className="relative rounded-xl overflow-hidden aspect-square border border-black/8">
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />

                  {/* Status overlay */}
                  {item.status === "analyzing" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  {item.status === "done" && (
                    <div className="absolute inset-0 bg-black/30 flex items-end">
                      <div className="w-full px-1.5 py-1 bg-green-500/90">
                        <p className="text-white text-xs font-medium truncate">
                          {item.analysis?.type.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  )}
                  {item.status === "error" && (
                    <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                      <span className="text-white text-lg">⚠️</span>
                    </div>
                  )}

                  {/* Remove button */}
                  {!analyzing && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary after analysis */}
          {done && (
            <div className="mt-4 rounded-xl bg-neutral-50 border border-black/8 p-4">
              <p className="text-sm font-semibold">Analysis complete</p>
              <p className="text-xs text-neutral-400 mt-1">
                ✅ {doneCount} ready to add
                {errorCount > 0 && ` · ⚠️ ${errorCount} could not be analyzed`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/8 flex gap-3">
          {!done && !analyzing && items.length > 0 && (
            <button
              onClick={startAnalysis}
              className="flex-1 rounded-xl bg-black text-white py-3.5 text-sm font-semibold hover:bg-black/85 transition">
              ✨ Analyze {items.length} Photos
            </button>
          )}
          {analyzing && (
            <div className="flex-1 rounded-xl bg-neutral-100 py-3.5 text-sm font-semibold text-center text-neutral-400">
              Analyzing... {doneCount}/{items.length}
            </div>
          )}
          {done && doneCount > 0 && (
            <button
              onClick={handleAdd}
              className="flex-1 rounded-xl bg-black text-white py-3.5 text-sm font-semibold hover:bg-black/85 transition">
              Add {doneCount} Items to Wardrobe
            </button>
          )}
          {items.length === 0 && (
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-black/10 py-3.5 text-sm font-medium hover:bg-neutral-50 transition">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}