"use client";

import * as React from "react";

export type AIAnalysis = {
  category: "top" | "bottom" | "shoes";
  type: string;
  color_family: string;
};

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  onAnalysis?: (result: AIAnalysis) => void;
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoUpload({ file, onChange, onAnalysis }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AIAnalysis | null>(null);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setPreview(null);
      setAnalysisResult(null);
      setAnalysisError(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    analyzePhoto(file);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function analyzePhoto(f: File) {
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const base64 = await fileToBase64(f);
      const mimeType = f.type || "image/jpeg";

      const res = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      const data = await res.json();

      if (data.error) {
        setAnalysisError("Could not analyze. Please fill manually.");
        return;
      }

      setAnalysisResult(data);
      onAnalysis?.(data);
    } catch {
      setAnalysisError("Analysis failed. Please fill manually.");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    onChange(f);
  }

  function handleRemove() {
    onChange(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {preview ? (
        <div className="rounded-2xl overflow-hidden border border-black/10">
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full h-48 object-cover" />

            {/* AI analyzing overlay */}
            {analyzing && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <p className="text-white text-xs font-medium">AI analyzing...</p>
              </div>
            )}
          </div>

          {/* AI Result */}
          {analysisResult && !analyzing && (
            <div className="px-4 py-3 bg-green-50 border-t border-green-100">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-sm">✓</span>
                <p className="text-xs font-semibold text-green-700">AI detected:</p>
              </div>
              <p className="text-xs text-green-600 mt-0.5">
                {analysisResult.category} · {analysisResult.type.replace(/_/g, " ")} · {analysisResult.color_family}
              </p>
              <p className="text-xs text-green-500 mt-0.5">Fields filled automatically ↓</p>
            </div>
          )}

          {analysisError && !analyzing && (
            <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-600">{analysisError}</p>
            </div>
          )}

          {/* Actions */}
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
        <button type="button" onClick={() => inputRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-black/15 py-8 flex flex-col items-center gap-3 hover:bg-neutral-50 hover:border-black/25 transition active:scale-95">
          <div className="h-14 w-14 rounded-full bg-neutral-100 flex items-center justify-center text-2xl">
            📷
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm text-neutral-800">Add Photo</p>
            <p className="text-xs text-neutral-400 mt-0.5">AI will detect type & color automatically</p>
          </div>
        </button>
      )}
    </div>
  );
}