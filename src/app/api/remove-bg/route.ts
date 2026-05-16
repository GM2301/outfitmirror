import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

// Background removal me strategji multi-path:
//   1. PRIMARY: HF Inference API direkte (briaai/RMBG-1.4) — më i shpejtë, më i besueshëm
//   2. FALLBACK: Gradio Space `not-lain/background-removal` (kur HF Inference fjet/timeout)
//
// HF Inference API ndonjëherë kthen 503 "model is loading" — bëjmë retry me backoff.

const HF_INFERENCE_URL = "https://api-inference.huggingface.co/models/briaai/RMBG-1.4";
const HF_MAX_RETRIES = 3;
const HF_RETRY_DELAYS_MS = [1500, 3000, 6000]; // exponential-ish

async function tryHFInference(buffer: ArrayBuffer, token: string): Promise<ArrayBuffer | null> {
  for (let attempt = 0; attempt < HF_MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(HF_INFERENCE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
          "Accept": "image/png",
        },
        body: buffer,
      });

      if (res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        if (ct.startsWith("image/")) {
          return await res.arrayBuffer();
        }
        // JSON response = error përgjegj  jashtë image
        const txt = await res.text();
        console.warn("[remove-bg/HF] Unexpected non-image response:", txt.substring(0, 300));
        return null;
      }

      // 503 = model loading; retry
      if (res.status === 503) {
        console.log(`[remove-bg/HF] Model loading, retrying in ${HF_RETRY_DELAYS_MS[attempt]}ms (attempt ${attempt + 1}/${HF_MAX_RETRIES})...`);
        await new Promise(r => setTimeout(r, HF_RETRY_DELAYS_MS[attempt]));
        continue;
      }

      // 401/403 = auth issue → mos retry, kalo te fallback
      if (res.status === 401 || res.status === 403) {
        console.warn("[remove-bg/HF] Auth issue:", res.status);
        return null;
      }

      // 429 = rate limit; retry me delay
      if (res.status === 429) {
        console.log(`[remove-bg/HF] Rate limited, retrying in ${HF_RETRY_DELAYS_MS[attempt]}ms...`);
        await new Promise(r => setTimeout(r, HF_RETRY_DELAYS_MS[attempt]));
        continue;
      }

      console.warn("[remove-bg/HF] Unexpected status:", res.status);
      return null;
    } catch (e: any) {
      console.warn(`[remove-bg/HF] Attempt ${attempt + 1} error:`, e.message);
      if (attempt < HF_MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, HF_RETRY_DELAYS_MS[attempt]));
      }
    }
  }
  return null;
}

async function tryGradioSpace(imageFile: File, token: string): Promise<ArrayBuffer | null> {
  try {
    const { Client } = await import("@gradio/client");
    console.log("[remove-bg/Gradio] Connecting to not-lain/background-removal...");

    const app = await Client.connect("not-lain/background-removal", {
      hf_token: token as any,
    } as any);

    const result: any = await app.predict("/image", { image: imageFile });

    let finalUrl: string | null = null;
    let imgData = result.data?.[0];
    if (Array.isArray(imgData)) imgData = imgData[0];

    if (typeof imgData === "string") {
      finalUrl = imgData;
    } else if (imgData?.url) {
      finalUrl = imgData.url;
    } else if (imgData?.path) {
      finalUrl = `https://not-lain-background-removal.hf.space/file=${imgData.path}`;
    }

    if (!finalUrl) {
      console.error("[remove-bg/Gradio] No URL in result:", JSON.stringify(result.data).substring(0, 300));
      return null;
    }

    const imgRes = await fetch(finalUrl);
    if (!imgRes.ok) {
      console.error("[remove-bg/Gradio] Failed to fetch result image:", imgRes.status);
      return null;
    }
    return await imgRes.arrayBuffer();
  } catch (e: any) {
    console.error("[remove-bg/Gradio] Error:", e.message);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = (formData.get("image_file") ?? formData.get("image")) as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const token = process.env.HF_TOKEN ?? "";
    console.log("[remove-bg] Image received:", imageFile.size, "bytes, token:", token ? "yes" : "no");

    // Primary: HF Inference API direkte
    let buffer: ArrayBuffer | null = null;
    if (token) {
      const imgBytes = await imageFile.arrayBuffer();
      buffer = await tryHFInference(imgBytes, token);
      if (buffer) {
        console.log("[remove-bg] Success via HF Inference. Size:", buffer.byteLength);
      }
    }

    // Fallback: Gradio Space
    if (!buffer) {
      console.log("[remove-bg] Falling back to Gradio Space...");
      buffer = await tryGradioSpace(imageFile, token);
      if (buffer) {
        console.log("[remove-bg] Success via Gradio. Size:", buffer.byteLength);
      }
    }

    if (!buffer) {
      return NextResponse.json(
        { error: "Background removal failed via both providers. Please try again." },
        { status: 502 },
      );
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[remove-bg] FATAL:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
