import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error("Missing REPLICATE_API_TOKEN in environment");
      return NextResponse.json({ error: "API key missing" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = (formData.get("file") || formData.get("image_file")) as File;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    // Perdorim modelin BiRefNet te Replicate
    const output = await replicate.run(
      "cjwbw/birefnet:232236d082fc024f210a623063f1396b7bf26668700302b1f03f7a6f21226168",
      {
        input: {
          image: dataUri,
        },
      }
    );

    let resultUrl = "";
    if (typeof output === "string") {
      resultUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      resultUrl = String(output[0]);
    } else if (output && typeof output === "object" && "url" in output) {
      resultUrl = String((output as any).url);
    }

    if (!resultUrl) {
      console.error("Replicate output unexpected format:", output);
      return NextResponse.json({ error: "Invalid response from AI model" }, { status: 500 });
    }

    return NextResponse.json({ processedImageUrl: resultUrl });
  } catch (error: any) {
    console.error("Error in remove-bg route:", error);
    return NextResponse.json({ error: error?.message || "Failed to remove background" }, { status: 500 });
  }
}