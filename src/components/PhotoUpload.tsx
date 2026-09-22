"use client";

import * as React from "react";

export type AIAnalysis = {
  category: "top" | "bottom" | "shoes" | "accessory";
  type: string;
  color_family: string;
};

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  onAnalysis?: (result: AIAnalysis) => void;
  onCleanBlob?: (blob: Blob) => void;
};

async function compressToBase64(file: File): Promise<{ base64: string; mimeType: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      else if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas error")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error("Blob error")); return; }
        URL.revokeObjectURL(img.src);
        resolve({ base64, mimeType: "image/jpeg", blob });
      }, "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("Load failed")); };
    img.src = URL.createObjectURL(file);
  });
}

async function removeBackgroundClient(blob: Blob): Promise<Blob | null> {
  try {
    const fd = new FormData();
    const imageFile = new File([blob], "image.jpg", { type: "image/jpeg" });
    fd.append("file", imageFile);
    fd.append("image_file", imageFile);

    const res = await fetch("/api/remove-bg", { method: "POST", body: fd });
    if (!res.ok) {
      console.error("Remove BG status error:", res.status);
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      console.log("Remove BG API Response:", data);
      const imageUrl = data.processedImageUrl || data.url || data.imageUrl || data.result;
      if (imageUrl) {
        const imgRes = await fetch(imageUrl);
        return await imgRes.blob();
      }
      return null;
    }

    return await res.blob();
  } catch (e) {
    console.error("BG removal client error:", e);
    return null;
  }
}

export default function PhotoUpload({ file, onChange, onAnalysis, onCleanBlob }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [removingBg, setRemovingBg] = React.useState(false);
  const [bgRemovedSuccess, setBgRemovedSuccess] = React.useState(false);
  const [bgRemovalFailed, setBgRemovalFailed] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AIAnalysis | null>(null);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);
  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    requestIdRef.current += 1;
    if (!file) { setPreview(null); setAnalysisResult(null); setAnalysisError(null); setBgRemovedSuccess(false); setBgRemovalFailed(false); return; }
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    analyzePhoto(file, requestIdRef.current);
  }, [file]);

  async function analyzePhoto(f: File, requestId: number) {
    setAnalyzing(true); setAnalysisError(null); setAnalysisResult(null); setBgRemovedSuccess(false); setBgRemovalFailed(false);
    try {
      const { base64, mimeType, blob } = await compressToBase64(f);
      if (requestIdRef.current !== requestId) return;

      const [aiRes] = await Promise.all([
        fetch("/api/analyze-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        }).then(r => r.json()).catch(() => null),
      ]);
      if (requestIdRef.current !== requestId) return;

      if (!aiRes || aiRes.error) {
        setAnalysisError("Could not analyze. Fill manually.");
      } else {
        setAnalysisResult(aiRes);
        onAnalysis?.(aiRes);
      }
      setAnalyzing(false);

      setRemovingBg(true);
      const cleanBlob = await removeBackgroundClient(blob);
      if (requestIdRef.current !== requestId) return;

      if (cleanBlob) {
        const url = URL.createObjectURL(cleanBlob);
        setPreview(url);
        setBgRemovedSuccess(true);
        onCleanBlob?.(cleanBlob);
      } else {
        console.warn("Background removal returned null");
        setBgRemovalFailed(true);
      }
    } catch {
      if (requestIdRef.current !== requestId) return;
      setAnalysisError("Analysis failed. Fill manually.");
    } finally {
      if (requestIdRef.current === requestId) {
        setAnalyzing(false);
        setRemovingBg(false);
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.files?.[0] ?? null);
  }

  function handleRemove() {
    onChange(null);
    setAnalysisResult(null); setAnalysisError(null); setBgRemovedSuccess(false); setBgRemovalFailed(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {preview ? (
        <div className="rounded-2xl overflow-hidden border border-black/8">
          <div className="relative bg-neutral-50">
            <img src={preview} alt="Preview"
              className={`w-full h-52 object-contain transition-all ${removingBg ? "opacity-60" : "opacity-100"}`} />
            {analyzing && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <p className="text-white text-xs font-semibold">AI analyzing...</p>
              </div>
            )}
            {removingBg && !analyzing && (
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                <p className="text-white text-xs">Removing background...</p>
              </div>
            )}
          </div>
          {analysisResult && !analyzing && (
            <div className="px-4 py-3 bg-green-50 border-t border-green-100">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-green-800">
                  AI detected {bgRemovedSuccess ? "· Background removed ✓" : ""}
                </p>
              </div>
              <p className="text-xs text-green-700 mt-1 capitalize">
                {analysisResult.category} · {analysisResult.type.replace(/_/g, " ")} · {analysisResult.color_family}
              </p>
            </div>
          )}
          {bgRemovalFailed && !removingBg && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-700">Background removal failed · using original photo</p>
            </div>
          )}
          {analysisError && !analyzing && (
            <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-700">{analysisError}</p>
            </div>
          )}
          <div className="p-3 bg-white border-t border-black/6 flex gap-2">
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
          className="w-full rounded-2xl border-2 border-dashed border-black/12 py-8 flex flex-col items-center gap-3 hover:bg-neutral-50 hover:border-black/20 transition active:scale-[0.98] bg-white">
          <div className="h-14 w-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-2xl">📷</div>
          <div className="text-center">
            <p className="font-bold text-sm text-neutral-800">Add Photo</p>
            <p className="text-xs text-neutral-400 mt-0.5">AI detects type & color · Background removed</p>
          </div>
        </button>
      )}
    </div>
  );
}