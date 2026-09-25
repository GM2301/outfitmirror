import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { consumeQuota } from "@/lib/quota";

export const maxDuration = 60;

// Largest side of the stored image. Cards never render wider than ~640 CSS px,
// so 1024 stays sharp on retina screens while keeping files around 50-150 KB.
const MAX_SIDE = 1024;
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      console.error("[remove-bg] Missing REPLICATE_API_TOKEN");
      return NextResponse.json({ error: "Background removal is not configured" }, { status: 500 });
    }

    // This proxies to a paid Replicate call - without an auth check anyone
    // who finds the URL (trivial via devtools) can spend the app's
    // Replicate budget with unlimited, untraceable requests.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const quota = await consumeQuota(user.id, "bg");
    if (!quota.ok) return NextResponse.json({ error: quota.message }, { status: 429 });

    const formData = await req.formData();
    const file = (formData.get("file") || formData.get("image_file")) as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Image is too large" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    const replicate = new Replicate({ auth: token });

    // 851-labs/background-remover: model aktiv, i mirembajtur, pjese e koleksionit
    // zyrtar "remove-backgrounds" te Replicate. Modelet e meparshme ("danielgatis/rembg",
    // "lucataco/remove-bg", "cjwbw/birefnet") deshtonin me "Invalid version or not
    // permitted" - ose hash i pasakte/i shpikur, ose version i deprecated nga Replicate.
    const output: any = await replicate.run(
      "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
      { input: { image: dataUri } }
    );

    let processedImageUrl = "";
    if (typeof output === "string") {
      processedImageUrl = output;
    } else if (output && typeof output.url === "function") {
      processedImageUrl = String(output.url());
    } else if (output && output.url) {
      processedImageUrl = String(output.url);
    } else if (Array.isArray(output) && output.length > 0) {
      const first = output[0];
      if (typeof first === "string") processedImageUrl = first;
      else if (first && typeof first.url === "function") processedImageUrl = String(first.url());
      else if (first && first.url) processedImageUrl = String(first.url);
    }

    if (!processedImageUrl) {
      return NextResponse.json({ error: "Invalid response format from AI" }, { status: 500 });
    }

    // Replicate returns a full-resolution PNG (often 2-8 MB) on a URL that
    // expires. Storing that directly is what made wardrobe images load slowly,
    // so shrink it and convert to WebP (keeps transparency) before returning.
    const pngRes = await fetch(processedImageUrl);
    if (!pngRes.ok) {
      return NextResponse.json({ error: "Could not download processed image" }, { status: 502 });
    }
    const webp = await sharp(Buffer.from(await pngRes.arrayBuffer()))
      .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, alphaQuality: 90 })
      .toBuffer();

    return new NextResponse(new Uint8Array(webp), {
      status: 200,
      headers: { "Content-Type": "image/webp", "Cache-Control": "no-store" },
    });
  } catch (error: any) {
    console.error("[remove-bg] Error processing image:", error);
    return NextResponse.json({ error: "Failed to remove background" }, { status: 500 });
  }
}
