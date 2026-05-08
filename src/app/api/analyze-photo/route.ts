import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "No image" }, { status: 400 });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType ?? "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Look at this image carefully. What clothing or fashion item is this?

Reply ONLY with this exact JSON format, nothing else:
{"category":"top","type":"tee","color_family":"black"}

category must be one of: top, bottom, shoes, accessory
- top = shirt, tee, hoodie, sweater, jacket, blazer, coat, polo, tank, cardigan, blouse
- bottom = jeans, trousers, shorts, skirt, leggings, joggers, cargo
- shoes = sneakers, boots, heels, loafers, sandals
- accessory = watch, sunglasses, belt, bag, hat, jewelry, scarf, bracelet

type must be specific (e.g. "tee" not "top", "jeans" not "bottom")

color_family must be one of: black, white, neutral, earth, blue, green, red, pink, purple, orange, yellow, bright

JSON only, no explanation:`,
            },
          ],
        }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", JSON.stringify(data));
      return NextResponse.json({ error: "AI error" }, { status: 500 });
    }

    const text = (data.content?.[0]?.text ?? "").trim();
    console.log("AI response:", text);

    // Parse JSON
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.error("No JSON in response:", text);
      return NextResponse.json({ error: "Parse error" }, { status: 500 });
    }

    let result: any;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "JSON parse error" }, { status: 500 });
    }

    // Validate & fix
    const validCats = ["top", "bottom", "shoes", "accessory"];
    const validColors = ["black","white","neutral","earth","blue","green","red","pink","purple","orange","yellow","bright"];

    if (!validCats.includes(result.category)) result.category = "top";
    if (!validColors.includes(result.color_family)) result.color_family = "neutral";
    if (!result.type || result.type.length < 2) {
      const defaults: Record<string, string> = { top: "tee", bottom: "jeans", shoes: "sneakers", accessory: "watch" };
      result.type = defaults[result.category];
    }

    return NextResponse.json({
      category: result.category,
      type: result.type,
      color_family: result.color_family,
    });

  } catch (e: any) {
    console.error("analyze-photo crash:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}