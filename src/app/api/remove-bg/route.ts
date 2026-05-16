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
    console.log("[remove-bg] Connecting with HF_TOKEN...");

    // Lidhu me Token per quota te pakufizuar
    const app = await Client.connect("ZhengPeng7/BiRefNet", {
      hf_token: (process.env.HF_TOKEN ?? "") as any,
    } as any);
    console.log("[remove-bg] Connected. Predicting...");

    const result: any = await app.predict("/image", [imageFile]);

    // Log struktura per debug
    console.log("[remove-bg] Result structure:", JSON.stringify(result.data).substring(0, 300));

    // Rregullimi: Modeli kthen [[ { url } ]] ose [ { url } ]
    let finalUrl: string | null = null;
    if (result.data && result.data[0]) {
      if (Array.isArray(result.data[0])) {
        finalUrl = result.data[0][0]?.url ?? null;
      } else {
        finalUrl = result.data[0]?.url ?? null;
      }
    }

    if (!finalUrl) {
      console.error("[remove-bg] No URL found:", result.data);
      return NextResponse.json({ error: "No result URL" }, { status: 500 });
    }

    console.log("[remove-bg] Fetching from:", finalUrl);
    const imgRes = await fetch(finalUrl);
    if (!imgRes.ok) {
      console.error("[remove-bg] Failed fetch:", imgRes.status);
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