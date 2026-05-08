"use client";

import * as React from "react";

export type AIAnalysis = {
  category: "top" | "bottom" | "shoes" | "accessory";
  type: string;
  color_family: string;
};

export type BulkItem = {
  id: string;
  file: File;
  preview: string;
  cleanPreview?: string;
  status: "pending" | "analyzing" | "removing_bg" | "done" | "error";
  analysis: AIAnalysis | null;
  cleanBlob?: Blob;
  error?: string;
};

type Props = {
  onComplete: (items: BulkItem[]) => void;
  onClose: () => void;
};

const CONCURRENCY = 5; // 5 foto njëherësh paralel

async function compressToBlob(file: File): Promise<{ base64: string; mimeType: string; blob: Blob }> {
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
        // Revoke pas blob
        URL.revokeObjectURL(img.src);
        resolve({ base64, mimeType: "image/jpeg", blob });
      }, "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("Failed to load")); };
    img.src = URL.createObjectURL(file);
  });
}

async function analyzePhoto(base64: string, mimeType: string): Promise<AIAnalysis | null> {
  try {
    const res = await fetch("/api/analyze-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    });
    const data = await res.json();
    if (data.error || !data.category) return null;
    return data as AIAnalysis;
  } catch {
    return null;
  }
}

async function removeBg(blob: Blob): Promise<Blob | null> {
  try {
    const formData = new FormData();
    formData.append("image_file", new File([blob], "image.jpg", { type: "image/jpeg" }));
    const res = await fetch("/api/remove-bg", { method: "POST", body: formData });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

async function processOne(item: BulkItem, onUpdate: (id: string, update: Partial<BulkItem>) => void): Promise<void> {
  try {
    // 1. Compress + base64
    onUpdate(item.id, { status: "analyzing" });
    const { base64, mimeType, blob } = await compressToBlob(item.file);

    // 2. AI analysis + background removal paralel
    const [analysis, cleanBlob] = await Promise.all([
      analyzePhoto(base64, mimeType),
      removeBg(blob),
    ]);

    if (!analysis) {
      onUpdate(item.id, { status: "error", error: "Could not analyze" });
      return;
    }

    // 3. Clean preview nëse background u hoq
    let cleanPreview: string | undefined;
    if (cleanBlob) {
      const buffer = await cleanBlob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      bytes.forEach(b => binary += String.fromCharCode(b));
      cleanPreview = `data:image/png;base64,${btoa(binary)}`;
    }

    onUpdate(item.id, {
      status: "done",
      analysis,
      cleanBlob: cleanBlob ?? undefined,
      cleanPreview,
    });
  } catch {
    onUpdate(item.id, { status: "error", error: "Processing failed" });
  }
}

export default function BulkUpload({ onComplete, onClose }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [items, setItems] = React.useState<BulkItem[]>([]);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const abortRef = React.useRef(false);

  function handleFiles(files: FileList) {
    const newItems: BulkItem[] = Array.from(files).map((file, i) => ({
      id: `${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
      analysis: null,
    }));
    setItems(prev => [...prev, ...newItems]);
    setDone(false);
  }

  function updateItem(id: string, update: Partial<BulkItem>) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...update } : it));
  }

  async function startAnalysis() {
    abortRef.current = false;
    setAnalyzing(true);
    setDone(false);

    const pending = items.filter(it => it.status === "pending" || it.status === "error");

    // Process in batches of CONCURRENCY
    for (let i = 0; i < pending.length; i += CONCURRENCY) {
      if (abortRef.current) break;
      const batch = pending.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(item => processOne(item, updateItem)));
    }

    setAnalyzing(false);
    setDone(true);
  }

  function handleAdd() {
    // Kalo clean blob nëse ekziston, përndryshe file origjinal
    const readyItems = items
      .filter(it => it.status === "done" && it.analysis)
      .map(it => ({
        ...it,
        // Nëse ka clean blob, zëvendëso file me PNG të pastruar
        file: it.cleanBlob
          ? new File([it.cleanBlob], it.file.name.replace(/\.[^.]+$/, ".png"), { type: "image/png" })
          : it.file,
      }));
    onComplete(readyItems);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id));
  }

  function retryErrors() {
    setItems(prev => prev.map(it =>
      it.status === "error" ? { ...it, status: "pending" } : it
    ));
    setDone(false);
    setTimeout(startAnalysis, 100);
  }

  const totalCount = items.length;
  const doneCount = items.filter(it => it.status === "done").length;
  const errorCount = items.filter(it => it.status === "error").length;
  const analyzingCount = items.filter(it => it.status === "analyzing" || it.status === "removing_bg").length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const CATEGORY_EMOJI: Record<string, string> = {
    top: "👕", bottom: "👖", shoes: "👟", accessory: "💍",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        style={{ background: "#FAF8F5" }}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between">
          <div>
            <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: "22px", fontWeight: 400, color: "#1A1A1A" }}>
              Bulk Upload
            </h2>
            <p style={{ fontSize: "12px", color: "#8A8580", marginTop: "2px" }}>
              {totalCount === 0
                ? "Select all your wardrobe photos at once"
                : analyzing
                  ? `Processing ${analyzingCount > 0 ? analyzingCount : "..."} photos · ${doneCount}/${totalCount} done`
                  : done
                    ? `${doneCount} ready · ${errorCount > 0 ? `${errorCount} failed` : "all good ✓"}`
                    : `${totalCount} photos selected`}
            </p>
          </div>
          <button onClick={() => { abortRef.current = true; onClose(); }}
            style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.07)", cursor: "pointer", fontSize: "14px" }}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Upload zone */}
          {!analyzing && (
            <button onClick={() => inputRef.current?.click()}
              style={{
                width: "100%", borderRadius: "16px", border: "2px dashed rgba(0,0,0,0.12)",
                padding: "20px", display: "flex", flexDirection: "column", alignItems: "center",
                gap: "8px", background: "white", cursor: "pointer", marginBottom: "12px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}>
              <span style={{ fontSize: "28px" }}>📷</span>
              <p style={{ fontWeight: 700, fontSize: "13px", color: "#1A1A1A" }}>
                {totalCount > 0 ? "Add more photos" : "Select Photos"}
              </p>
              <p style={{ fontSize: "11px", color: "#8A8580" }}>
                Any number of photos — AI analyzes + background removed automatically
              </p>
            </button>
          )}

          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)} />

          {/* Progress bar */}
          {analyzing && totalCount > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8A8580", marginBottom: "6px" }}>
                <span>✨ AI analyzing + removing background...</span>
                <span style={{ fontWeight: 700, color: "#1A1A1A" }}>{doneCount}/{totalCount}</span>
              </div>
              <div style={{ height: "6px", background: "rgba(0,0,0,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{
                  height: "6px", background: "#1A1A1A", borderRadius: "3px",
                  width: `${progress}%`, transition: "width .3s ease",
                }} />
              </div>
              <p style={{ fontSize: "10px", color: "#8A8580", marginTop: "4px", textAlign: "center" }}>
                Processing {CONCURRENCY} photos at a time — do not close this window
              </p>
            </div>
          )}

          {/* Items grid */}
          {items.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px" }}>
              {items.map(item => (
                <div key={item.id} style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "1", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <img
                    src={item.cleanPreview ?? item.preview}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "contain", padding: item.cleanPreview ? "4px" : "0" }}
                  />

                  {/* Analyzing overlay */}
                  {(item.status === "analyzing" || item.status === "removing_bg") && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Done overlay */}
                  {item.status === "done" && item.analysis && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", padding: "3px 5px", display: "flex", alignItems: "center", gap: "3px" }}>
                      <span style={{ fontSize: "10px" }}>{CATEGORY_EMOJI[item.analysis.category] ?? "✨"}</span>
                      <p style={{ fontSize: "9px", color: "white", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.analysis.type.replace(/_/g, " ")}
                      </p>
                      {item.cleanPreview && <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.6)", marginLeft: "auto" }}>✓ bg</span>}
                    </div>
                  )}

                  {/* Error overlay */}
                  {item.status === "error" && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(220,38,38,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "18px" }}>⚠️</span>
                    </div>
                  )}

                  {/* Remove button */}
                  {!analyzing && (
                    <button onClick={() => removeItem(item.id)}
                      style={{ position: "absolute", top: "3px", right: "3px", width: "18px", height: "18px", borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "white", border: "none", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {done && (
            <div style={{ marginTop: "12px", borderRadius: "12px", background: "white", border: "1px solid rgba(0,0,0,0.08)", padding: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "16px" }}>✅</span>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "#1A1A1A" }}>Analysis complete</p>
              </div>
              <p style={{ fontSize: "12px", color: "#8A8580" }}>
                {doneCount} items ready to add to your wardrobe
                {errorCount > 0 && ` · ${errorCount} failed`}
              </p>
              {errorCount > 0 && (
                <button onClick={retryErrors}
                  style={{ marginTop: "8px", fontSize: "11px", color: "#1A1A1A", fontWeight: 600, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Retry {errorCount} failed photos
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: "10px" }}>
          {!analyzing && !done && items.length > 0 && (
            <button onClick={startAnalysis}
              style={{ flex: 1, borderRadius: "12px", background: "#1A1A1A", color: "white", padding: "14px", fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", letterSpacing: "0.02em" }}>
              ✨ Analyze {totalCount} Photos
            </button>
          )}

          {analyzing && (
            <div style={{ flex: 1, borderRadius: "12px", background: "rgba(0,0,0,0.08)", padding: "14px", fontSize: "13px", fontWeight: 600, textAlign: "center", color: "#8A8580" }}>
              {doneCount}/{totalCount} done · please wait...
            </div>
          )}

          {done && doneCount > 0 && (
            <>
              {errorCount > 0 && (
                <button onClick={() => { setDone(false); }}
                  style={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.12)", padding: "14px 16px", fontSize: "13px", fontWeight: 600, background: "white", cursor: "pointer", color: "#6B6B6B" }}>
                  Back
                </button>
              )}
              <button onClick={handleAdd}
                style={{ flex: 1, borderRadius: "12px", background: "#1A1A1A", color: "white", padding: "14px", fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                Add {doneCount} Items to Wardrobe
              </button>
            </>
          )}

          {items.length === 0 && (
            <button onClick={onClose}
              style={{ flex: 1, borderRadius: "12px", border: "1px solid rgba(0,0,0,0.12)", padding: "14px", fontSize: "13px", fontWeight: 600, background: "white", cursor: "pointer", color: "#6B6B6B" }}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}