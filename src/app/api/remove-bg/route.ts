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

    // Space-i i saktë me API publik (përdor BiRefNet brenda)
    const app = await Client.connect("briaai/BRIA-RMBG-1.4", {
      hf_token: (process.env.HF_TOKEN ?? "") as any,
    } as any);
    console.log("[remove-bg] Connected. Predicting...");

    const result: any = await app.predict("/image", { image: imageFile });
    console.log("[remove-bg] Result:", JSON.stringify(result.data).substring(0, 400));

    // Parse the result — could be nested [[ ]] or flat [ ]
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
      console.error("[remove-bg] No URL found:", JSON.stringify(result.data));
      return NextResponse.json({ error: "No result URL" }, { status: 500 });
    }

    console.log("[remove-bg] Fetching from:", finalUrl);
    const imgRes = await fetch(finalUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
    }

    const buffer = await imgRes.arrayBuffer();
    console.log("[remove-bg] Success! Size:", buffer.byteLength);

    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });

  } catch (e: any) {
    console.error("[remove-bg] ERROR:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}