// src/app/api/remove-bg/route.ts
// v3 — BiRefNet (cilesi me e larte per accessories) + RMBG-1.4 fallback + Gradio fallback

import { NextRequest, NextResponse } from "next/server";

const HF_TOKEN = process.env.HF_TOKEN;

// Provider 1: BiRefNet — model i ri, me i sakte per cope te imeta (orë, brez, etj)
async function tryBiRefNet(blob: Blob): Promise<Blob | null> {
  if (!HF_TOKEN) return null;
  const url = "https://api-inference.huggingface.co/models/ZhengPeng7/BiRefNet";

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        body: arrayBuffer,
      });

      if (res.status === 503) { await new Promise(r => setTimeout(r, 2000 + attempt * 1500)); continue; }
      if (res.status === 429) { await new Promise(r => setTimeout(r, 3000)); continue; }
      if (res.status === 401 || res.status === 403) {
        console.error("[remove-bg] BiRefNet auth error");
        return null;
      }
      if (!res.ok) {
        console.error("[remove-bg] BiRefNet status:", res.status);
        return null;
      }

      const result = await res.blob();
      if (result.size > 100) return result;
      return null;
    } catch (e) {
      console.error("[remove-bg] BiRefNet error:", e);
      if (attempt === 2) return null;
    }
  }
  return null;
}

// Provider 2: RMBG-1.4 — fallback
async function tryRMBG(blob: Blob): Promise<Blob | null> {
  if (!HF_TOKEN) return null;
  const url = "https://api-inference.huggingface.co/models/briaai/RMBG-1.4";

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        body: arrayBuffer,
      });

      if (res.status === 503) { await new Promise(r => setTimeout(r, 2000 + attempt * 1500)); continue; }
      if (res.status === 429) { await new Promise(r => setTimeout(r, 3000)); continue; }
      if (res.status === 401 || res.status === 403) return null;
      if (!res.ok) return null;

      const result = await res.blob();
      if (result.size > 100) return result;
      return null;
    } catch (e) {
      console.error("[remove-bg] RMBG error:", e);
      if (attempt === 2) return null;
    }
  }
  return null;
}

// Provider 3: Gradio Space — fallback i fundit
async function tryGradioSpace(blob: Blob): Promise<Blob | null> {
  try {
    const fd = new FormData();
    fd.append("files", new File([blob], "image.jpg", { type: "image/jpeg" }));

    const uploadRes = await fetch("https://not-lain-background-removal.hf.space/upload", {
      method: "POST",
      body: fd,
    });

    if (!uploadRes.ok) return null;
    const uploadResult = await uploadRes.json();
    const uploadedPath = uploadResult?.[0];
    if (!uploadedPath) return null;

    const predRes = await fetch("https://not-lain-background-removal.hf.space/run/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{ path: uploadedPath, meta: { _type: "gradio.FileData" } }],
        fn_index: 0,
      }),
    });

    if (!predRes.ok) return null;
    const predResult = await predRes.json();
    const resultPath = predResult?.data?.[0]?.url;
    if (!resultPath) return null;

    const imageRes = await fetch(resultPath);
    if (!imageRes.ok) return null;
    return await imageRes.blob();
  } catch (e) {
    console.error("[remove-bg] Gradio error:", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image_file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image_file provided" }, { status: 400 });
    }

    const blob = file as unknown as Blob;

    console.log("[remove-bg] Trying BiRefNet...");
    let result = await tryBiRefNet(blob);

    if (!result) {
      console.log("[remove-bg] BiRefNet failed, trying RMBG-1.4...");
      result = await tryRMBG(blob);
    }

    if (!result) {
      console.log("[remove-bg] RMBG failed, trying Gradio Space...");
      result = await tryGradioSpace(blob);
    }

    if (!result) {
      return NextResponse.json(
        { error: "All background removal providers failed" },
        { status: 502 }
      );
    }

    return new NextResponse(result, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e: any) {
    console.error("[remove-bg] Error:", e);
    return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500 });
  }
}