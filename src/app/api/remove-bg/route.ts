import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = (formData.get("image_file") ?? formData.get("image")) as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    console.log("[remove-bg] Image received:", imageFile.size, "bytes");

    const { Client } = await import("@gradio/client");
    console.log("[remove-bg] Connecting to not-lain/background-removal...");

    // Lidhemi me Space-in duke përdorur Token-in nga Environment Variables
    const app = await Client.connect("not-lain/background-removal", {
      hf_token: (process.env.HF_TOKEN ?? "") as any,
    } as any);
    
    console.log("[remove-bg] Connected. Predicting...");

    // KORRIGJIMI 1: Kalimi i parametrit si Array [imageFile] për siguri maksimale në Gradio
    const result: any = await app.predict("/image", [imageFile]);
    console.log("[remove-bg] Result:", JSON.stringify(result.data).substring(0, 400));

    let finalUrl: string | null = null;
    let imgData = result.data?.[0];

    // Përpunimi i matricës së thyer [[ ]]
    if (Array.isArray(imgData)) imgData = imgData[0];

    if (typeof imgData === "string") {
      finalUrl = imgData;
    } else if (imgData?.url) {
      finalUrl = imgData.url;
    } else if (imgData?.path) {
      // KORRIGJIMI 2: Shtimi i /gradio_api/ nëse duhet si fallback
      finalUrl = `https://not-lain-background-removal.hf.space/gradio_api/file=${imgData.path}`;
    }

    if (!finalUrl) {
      console.error("[remove-bg] No URL found:", JSON.stringify(result.data));
      return NextResponse.json({ error: "No result URL" }, { status: 500 });
    }

    console.log("[remove-bg] Fetching from HF:", finalUrl);
    const imgRes = await fetch(finalUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Failed to fetch image from HuggingFace" }, { status: 500 });
    }

    const buffer = await imgRes.arrayBuffer();
    console.log("[remove-bg] Success! Binary size:", buffer.byteLength);

    // Kthen imazhin e pastër si PNG direkt te frontend-i yt
    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });

  } catch (e: any) {
    console.error("[remove-bg] ERROR:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}