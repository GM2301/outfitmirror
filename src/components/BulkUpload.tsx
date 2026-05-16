"use client";

import * as React from "react";

export type AIAnalysis = {
  category: "top" | "bottom" | "shoes" | "outerwear" | "accessory";
  type: string;
  color_family: string;
  formality_tier?: number;
  is_layer?: boolean;
  is_inner?: boolean;
  min_temp?: number;
  max_temp?: number;
  style_tags?: string[];
};

export type BulkItem = {
  id: string;
  file: File;
  preview: string;
  cleanPreview?: string;
  status: "pending" | "analyzing" | "done" | "error";
  analysis: AIAnalysis | null;
  cleanBlob?: Blob;
  error?: string;
};

type Props = {
  onComplete: (items: BulkItem[]) => void;
  onClose: () => void;
};

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
        URL.revokeObjectURL(img.src);
        resolve({ base64, mimeType: "image/jpeg", blob });
      }, "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("Load failed")); };
    img.src = URL.createObjectURL(file);
  });
}

async function removeBg(blob: Blob | File): Promise<Blob | null> {
  try {
    const fd = new FormData();
    fd.append("image_file", new File([blob], "image.jpg", { type: "image/jpeg" }));
    const res = await fetch("/api/remove-bg", { method: "POST", body: fd });
    if (!res.ok) return null;
    return await res.blob();
  } catch (e) {
    console.error("BG removal error:", e);
    return null;
  }
}

async function processOne(
  item: BulkItem,
  onUpdate: (id: string, u: Partial<BulkItem>) => void
) {
  onUpdate(item.id, { status: "analyzing" });
  try {
    const { base64, mimeType, blob } = await compressToBlob(item.file);

    const aiRes = await fetch("/api/analyze-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    }).then(r => r.json()).catch(() => null);

    const cleanBlob = await removeBg(blob);

    if (!aiRes || aiRes.error || !aiRes.category) {
      onUpdate(item.id, { status: "error", error: "AI failed" });
      return;
    }

    let cleanPreview: string | undefined;
    if (cleanBlob) {
      const buf = await cleanBlob.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      bytes.forEach(b => bin += String.fromCharCode(b));
      cleanPreview = `data:image/png;base64,${btoa(bin)}`;
    }

    onUpdate(item.id, {
      status: "done",
      analysis: aiRes as AIAnalysis,
      cleanBlob: cleanBlob ?? undefined,
      cleanPreview,
    });
  } catch {
    onUpdate(item.id, { status: "error", error: "Failed" });
  }
}

export default function BulkUpload({ onComplete, onClose }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [items, setItems] = React.useState<BulkItem[]>([]);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const stopRef = React.useRef(false);

  function updateItem(id: string, u: Partial<BulkItem>) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...u } : it));
  }

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

  async function startAnalysis() {
    stopRef.current = false;
    setAnalyzing(true);
    setDone(false);

    const pending = items.filter(it => it.status === "pending" || it.status === "error");

    const BATCH = 3;
    for (let i = 0; i < pending.length; i += BATCH) {
      if (stopRef.current) break;
      const batch = pending.slice(i, i + BATCH);
      await Promise.all(batch.map(item => processOne(item, updateItem)));
    }

    setAnalyzing(false);
    setDone(true);

    setItems(currentItems => {
      const ready = currentItems
        .filter(it => it.status === "done" && it.analysis)
        .map(it => ({
          ...it,
          file: it.cleanBlob
            ? new File([it.cleanBlob], it.file.name.replace(/\.[^.]+$/, ".png"), { type: "image/png" })
            : it.file,
        }));
      if (ready.length > 0) {
        setTimeout(() => onComplete(ready), 300);
      }
      return currentItems;
    });
  }

  const doneCount = items.filter(it => it.status === "done").length;
  const errorCount = items.filter(it => it.status === "error").length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const CAT_EMOJI: Record<string, string> = {
    top: "👕", bottom: "👖", shoes: "👟", outerwear: "🧥", accessory: "💍",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        style={{ background: "#FAF8F5" }}>

        <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: "22px", fontWeight: 400, color: "#1A1A1A" }}>
              Bulk Upload
            </h2>
            <p style={{ fontSize: "12px", color: "#8A8580", marginTop: "2px" }}>
              {analyzing
                ? `${doneCount}/${totalCount} done · processing...`
                : done
                  ? `${doneCount} ready${errorCount > 0 ? ` · ${errorCount} failed` : " ✓"}`
                  : totalCount > 0
                    ? `${totalCount} photos selected`
                    : "Select wardrobe photos"}
            </p>
          </div>
          <button onClick={() => { stopRef.current = true; onClose(); }}
            style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.07)", cursor: "pointer", fontSize: "14px" }}>
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">

          {!analyzing && (
            <button onClick={() => inputRef.current?.click()}
              style={{
                width: "100%", borderRadius: "14px", border: "2px dashed rgba(0,0,0,0.12)",
                padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center",
                gap: "8px", background: "white", cursor: "pointer", marginBottom: "12px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}>
              <span style={{ fontSize: "28px" }}>📷</span>
              <p style={{ fontWeight: 700, fontSize: "13px", color: "#1A1A1A" }}>
                {totalCount > 0 ? "Add more photos" : "Select Photos"}
              </p>
              <p style={{ fontSize: "11px", color: "#8A8580", textAlign: "center" }}>
                AI detects category & color · Background removed automatically
              </p>
            </button>
          )}

          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)} />

          {analyzing && totalCount > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8A8580", marginBottom: "6px" }}>
                <span>✨ Analyzing + removing background...</span>
                <span style={{ fontWeight: 700, color: "#1A1A1A" }}>{doneCount}/{totalCount}</span>
              </div>
              <div style={{ height: "5px", background: "rgba(0,0,0,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "5px", background: "#1A1A1A", borderRadius: "3px", width: `${progress}%`, transition: "width .3s ease" }} />
              </div>
            </div>
          )}

          {items.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px" }}>
              {items.map(item => (
                <div key={item.id} style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "1", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <img
                    src={item.cleanPreview ?? item.preview}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "contain", padding: item.cleanPreview ? "4px" : "0" }}
                  />

                  {item.status === "analyzing" && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}

                  {item.status === "done" && item.analysis && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.72)", padding: "3px 6px", display: "flex", alignItems: "center", gap: "3px" }}>
                      <span style={{ fontSize: "9px" }}>{CAT_EMOJI[item.analysis.category] ?? "✨"}</span>
                      <p style={{ fontSize: "9px", color: "white", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {item.analysis.type.replace(/_/g, " ")}
                      </p>
                      {item.cleanPreview && <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)" }}>✓</span>}
                    </div>
                  )}

                  {item.status === "error" && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(220,38,38,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "18px" }}>⚠️</span>
                    </div>
                  )}

                  {!analyzing && (
                    <button onClick={() => setItems(prev => prev.filter(it => it.id !== item.id))}
                      style={{ position: "absolute", top: "3px", right: "3px", width: "18px", height: "18px", borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "white", border: "none", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {done && errorCount > 0 && (
            <button onClick={() => {
              setItems(prev => prev.map(it => it.status === "error" ? { ...it, status: "pending" } : it));
              setDone(false);
              setTimeout(startAnalysis, 50);
            }} style={{ marginTop: "10px", width: "100%", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", padding: "10px", fontSize: "12px", fontWeight: 600, background: "white", cursor: "pointer", color: "#1A1A1A" }}>
              🔄 Retry {errorCount} failed photos
            </button>
          )}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: "8px", flexShrink: 0 }}>
          {!analyzing && !done && items.length > 0 && (
            <button onClick={startAnalysis}
              style={{ flex: 1, borderRadius: "12px", background: "#1A1A1A", color: "white", padding: "14px", fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
              ✨ Analyze {totalCount} Photos
            </button>
          )}

          {analyzing && (
            <div style={{ flex: 1, borderRadius: "12px", background: "rgba(0,0,0,0.07)", padding: "14px", fontSize: "13px", fontWeight: 600, textAlign: "center", color: "#8A8580" }}>
              {doneCount}/{totalCount} · please wait...
            </div>
          )}

          {done && doneCount > 0 && (
            <div style={{ flex: 1, borderRadius: "12px", background: "#15803D", color: "white", padding: "14px", fontSize: "13px", fontWeight: 700, textAlign: "center", boxShadow: "0 4px 16px rgba(21,128,61,0.25)" }}>
              ✓ {doneCount} items added · closing...
            </div>
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