import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Ju lutem ngarkoni një foto.' },
        { status: 400 }
      );
    }

    // Konvertojmë foton në formatin që e kupton modeli AI
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Thërrasim BiRefNet: Modeli top-level për heqjen e sfondit te veshjet
    const output = await replicate.run(
      "zhengpeng7/birefnet:4742b089c20d01804b4070a316b1859f518e1d52033c4118320c24a91a9f1a0e",
      {
        input: {
          image: base64Image,
        },
      }
    );

    // Kthejmë linkun e fotos me sfond 100% transparent PNG
    return NextResponse.json({ transparentImageUrl: output });
  } catch (error) {
    console.error('Replicate Remove BG Error:', error);
    return NextResponse.json(
      { error: 'Dështoi pastrimi i sfondit nga modeli BiRefNet.' },
      { status: 500 }
    );
  }
}