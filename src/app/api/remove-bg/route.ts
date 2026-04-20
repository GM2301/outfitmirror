import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image_file") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const rembgUrl = process.env.REMBG_URL;
    if (!rembgUrl) {
      return NextResponse.json({ error: "REMBG_URL not configured" }, { status: 500 });
    }

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