// src/app/api/remove-bg/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    // Prano si "image_file" (nga PhotoUpload) ose "image" (nga Railway)
    const imageFile = (formData.get("image_file") ?? formData.get("image")) as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const rembgUrl = process.env.REMBG_URL;
    if (!rembgUrl) {
      // Fallback — provo Clipdrop nëse ka
      const clipdropKey = process.env.CLIPDROP_API_KEY;
      if (clipdropKey) {
        const body = new FormData();
        body.append("image_file", imageFile);
        const res = await fetch("https://clipdrop-api.co/remove-background/v1", {
          method: "POST",
          headers: { "x-api-key": clipdropKey },
          body,
        });
        if (!res.ok) return NextResponse.json({ error: "Clipdrop failed" }, { status: res.status });
        const buffer = await res.arrayBuffer();
        return new NextResponse(buffer, { status: 200, headers: { "Content-Type": "image/png" } });
      }
      return NextResponse.json({ error: "No background removal service configured" }, { status: 500 });
    }

    // Railway rembg
    const body = new FormData();
    body.append("image", imageFile);

    const res = await fetch(`${rembgUrl}/remove-bg`, {
      method: "POST",
      body,
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}