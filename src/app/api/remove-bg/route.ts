import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

// I japim serverit te Vercel deri ne 60 sekonda per te prit ne Replicate
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      console.error("[remove-bg] REPLICATE_API_TOKEN is not defined in environment variables.");
      return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
    }

    const replicate = new Replicate({ auth: token });

    const formData = await req.formData();
    const file = (formData.get("file") || formData.get("image_file")) as File;

    if (!file) {
      console.error("[remove-bg] No image file provided in request");
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    console.log("[remove-bg] Sending request to Replicate BiRefNet model...");

    // Ekzekutojme modelin BiRefNet te Replicate
    const output: any = await replicate.run(
      "cjwbw/birefnet:232236d082fc024f210a623063f1396b7bf26668700302b1f03f7a6f21226168",
      {
        input: {
          image: dataUri,
        },
      }
    );

    console.log("[remove-bg] Replicate raw response:", output);

    // Marrja e URL-se nga objekti FileOutput ose String i Replicate SDK
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
    } else if (output) {
      processedImageUrl = String(output);
    }

    if (!processedImageUrl || processedImageUrl === "[object Object]") {
      console.error("[remove-bg] Failed to extract image URL from Replicate response");
      return NextResponse.json({ error: "Invalid response from AI model" }, { status: 500 });
    }

    console.log("[remove-bg] Success! Processed Image URL:", processedImageUrl);
    return NextResponse.json({ processedImageUrl });
  } catch (error: any) {
    console.error("[remove-bg] Error processing image:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to remove background" },
      { status: 500 }
    );
  }
}