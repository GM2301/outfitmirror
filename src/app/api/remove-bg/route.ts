import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = (formData.get("image_file") ?? formData.get("image")) as File;

    if (!imageFile) {
      console.error("[remove-bg] No image provided");
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    console.log("[remove-bg] Image received:", imageFile.size, "bytes");

    const { Client } = await import("@gradio/client");
    console.log("[remove-bg] Connecting to BiRefNet...");

    const app = await Client.connect("ZhengPeng7/BiRefNet");
    console.log("[remove-bg] Connected. Predicting...");

    const result: any = await app.predict("/image", [imageFile]);
    console.log("[remove-bg] Prediction done. Result keys:", Object.keys(result?.data?.[0] ?? {}));

    const resultImage = result.data?.[0];
    if (!resultImage?.url) {
      console.error("[remove-bg] No URL in result:", JSON.stringify(result.data));
      return NextResponse.json({ error: "No result from BiRefNet" }, { status: 500 });
    }

    console.log("[remove-bg] Fetching result image from:", resultImage.url);
    const imgRes = await fetch(resultImage.url);
    if (!imgRes.ok) {
      console.error("[remove-bg] Failed to fetch result:", imgRes.status);
      return NextResponse.json({ error: "Failed to fetch result image" }, { status: 500 });
    }

    const buffer = await imgRes.arrayBuffer();
    console.log("[remove-bg] Success! Size:", buffer.byteLength);

    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });

  } catch (e: any) {
    console.error("[remove-bg] ERROR:", e.message, e.stack);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}