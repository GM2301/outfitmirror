import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      console.error("[remove-bg] Missing REPLICATE_API_TOKEN");
      return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
    }

    // This proxies to a paid Replicate call - without an auth check anyone
    // who finds the URL (trivial via devtools) can spend the app's
    // Replicate budget with unlimited, untraceable requests.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const replicate = new Replicate({ auth: token });

    const formData = await req.formData();
    const file = (formData.get("file") || formData.get("image_file")) as File;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    console.log("[remove-bg] Sending request to background-remover model...");

    // 851-labs/background-remover: model aktiv, i mirembajtur, pjese e koleksionit
    // zyrtar "remove-backgrounds" te Replicate. Modelet e meparshme ("danielgatis/rembg",
    // "lucataco/remove-bg", "cjwbw/birefnet") deshtonin me "Invalid version or not
    // permitted" - ose hash i pasakte/i shpikur, ose version i deprecated nga Replicate.
    const output: any = await replicate.run(
      "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
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