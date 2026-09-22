import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Ju lutem siguroni URL-në e imazhit.' },
        { status: 400 }
      );
    }

    // Përdorim OpenRouter / OpenAI / Gemini me Vision për detektimin e vetive
    const prompt = `Analizo këtë veshje me sfond transparent. Kthe VETËM një JSON strikt pa asnjë tekst tjetër sipas këtij formati:
{
  "category": "Top" | "Bottom" | "Outerwear" | "Shoes" | "Accessory",
  "subCategory": "Këmishë" | "Bluzë" | "Xhinse" | "Pantallona" | "Atlete" | "Xhaketë" | "Tjerat",
  "primaryColor": "Ngjyra kryesore në shqip",
  "formality": "Casual" | "Smart Casual" | "Business" | "Formal",
  "season": ["Spring", "Summer", "Autumn", "Winter"]
}`;

    // Këtu thërrasim shërbimin Vision AI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analyze Garment Error:', error);
    // Në rast dështimi, kthejmë vlera fallback që të mos bllokohet përdoruesi
    return NextResponse.json({
      category: 'Top',
      subCategory: 'Bluzë',
      primaryColor: 'E zezë',
      formality: 'Casual',
      season: ['Spring', 'Summer', 'Autumn', 'Winter'],
    });
  }
}