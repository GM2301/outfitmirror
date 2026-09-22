import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      console.error("[remove-bg] Missing REPLICATE_API_TOKEN");
      return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
    }

    const replicate = new Replicate({ auth: token });

    const formData = await req.formData();
    const file = (formData.get("file") || formData.get("image_file")) as File;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    console.log("[remove-bg] Sending request to RemBG model...");

    // Modeli RemBG - versioni publik stabil
    const output: any = await replicate.run(
      "danielgatis/rembg:fb8238287e36173d09a85195ed0516d1491af39254d000766f12362030f2d93b",
      {
        input: {
          image: dataUri,
        },
      }
    );

    console.log("[remove-bg] Replicate response:", output);

    let processedImageUrl = "";

    if (typeof output === "string") {
      processedImageUrl = output;
    } else if (output && typeof output.url === "function") {
      processedImageUrl = output.url();
    } else if (output && output.url) {
      processedImageUrl = String(output.url);
    } else if (Array.isArray(output) && output.length > 0) {
      const first = output[0];
      if (typeof first === "string") processedImageUrl = first;
      else if (first && typeof first.url === "function") processedImageUrl = first.url();
      else if (first && first.url) processedImageUrl = String(first.url);
    }

    if (!processedImageUrl) {
      return NextResponse.json({ error: "Invalid response format from AI" }, { status: 500 });
    }

    console.log("[remove-bg] Success URL:", processedImageUrl);
    return NextResponse.json({ processedImageUrl });
  } catch (error: any) {
    console.error("[remove-bg] Error processing image:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to remove background" },
      { status: 500 }
    );
  }
}