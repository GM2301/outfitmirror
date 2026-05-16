import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = (formData.get("image_file") ?? formData.get("image")) as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Dynamic import per @gradio/client
    const { client } = await import("@gradio/client");

    // Lidhu me BiRefNet ne Hugging Face
    const app = await client("ZhengPeng7/BiRefNet");

    // Ekzekuto modelin
    const result = await app.predict("/image", [imageFile]) as any;

    const resultImage = result.data?.[0];
    if (!resultImage?.url) {
      return NextResponse.json({ error: "No result from BiRefNet" }, { status: 500 });
    }

    // Shkarko imazhin e pastruar dhe ktheje si PNG
    const imgRes = await fetch(resultImage.url);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Failed to fetch result image" }, { status: 500 });
    }

    const buffer = await imgRes.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });

  } catch (e: any) {
    console.error("remove-bg error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}