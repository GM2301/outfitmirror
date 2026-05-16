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
    console.log("[remove-bg] Connecting to background-removal Space...");

    // Space-i i saktë me API publik për background removal
    const app = await Client.connect("not-lain/background-removal");
    console.log("[remove-bg] Connected. Predicting...");

    const result: any = await app.predict("/image", { image: imageFile });
    console.log("[remove-bg] Prediction done.");

    // Result është array — [0] është path/url i imazhit pa background
    const resultData = result.data?.[0];
    let imageUrl: string | null = null;

    if (typeof resultData === "string") {
      imageUrl = resultData;
    } else if (resultData?.url) {
      imageUrl = resultData.url;
    } else if (resultData?.path) {
      imageUrl = `https://not-lain-background-removal.hf.space/file=${resultData.path}`;
    }

    if (!imageUrl) {
      console.error("[remove-bg] No URL in result:", JSON.stringify(result.data));
      return NextResponse.json({ error: "No result image" }, { status: 500 });
    }

    console.log("[remove-bg] Fetching from:", imageUrl);
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      console.error("[remove-bg] Failed fetch:", imgRes.status);
      return NextResponse.json({ error: "Failed to fetch result" }, { status: 500 });
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