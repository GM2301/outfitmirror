import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: "low",
                },
              },
              {
                type: "text",
                text: `Analyze this clothing item and respond ONLY with a JSON object, no other text:
{
  "category": "top" | "bottom" | "shoes",
  "type": one of: tee, polo, shirt, sweater, hoodie, jacket, blazer, tank, henley, crewneck, jeans, chinos, trousers, shorts, joggers, sweatpants, cargo, sneakers, running_shoes, boots, dress_shoes, loafers, sandals, chelsea_boots,
  "color_family": one of: neutral, earth, black, white, blue, bright, green, red, pink, purple, orange, yellow
}

Rules:
- category must be exactly: top, bottom, or shoes
- type must be the closest match from the list
- color_family must be the dominant color from the list
- Respond ONLY with the JSON, nothing else`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }

    const text = data.choices?.[0]?.message?.content ?? "";

    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ error: "Could not parse response" }, { status: 500 });
    }

  } catch (error) {
    console.error("Photo analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}