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
        max_tokens: 150,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType ?? "image/jpeg", data: imageBase64 },
            },
            {
              type: "text",
              text: `Analyze this clothing/fashion item and classify it.

CATEGORY (pick one):
- "top": shirts, t-shirts, polo, blouse, sweater, hoodie, jacket, blazer, coat, tank, crop top, cardigan, vest
- "bottom": jeans, trousers, pants, shorts, skirt, leggings, joggers, sweatpants, cargo
- "shoes": sneakers, boots, heels, sandals, loafers, oxfords, mules, flats
- "accessory": watch, belt, hat, cap, sunglasses, bag, handbag, backpack, scarf, jewelry, bracelet, necklace, ring, earrings, wallet

IMPORTANT: Accessories (watch, glasses, bag, belt, jewelry) = always "accessory", never "top" or "bottom".

TYPE (most specific):
- top: tee, polo, shirt, sweater, hoodie, jacket, blazer, coat, tank, crop_top, cardigan, bodysuit, blouse, knit, henley, crewneck
- bottom: jeans, chinos, trousers, shorts, joggers, sweatpants, cargo, midi_skirt, mini_skirt, leggings, wide_leg_pants
- shoes: sneakers, running_shoes, boots, dress_shoes, loafers, sandals, chelsea_boots, heels, ankle_boots, ballet_flats, mules
- accessory: watch, belt, cap, sunglasses, bag, scarf, bracelet, jewelry, hat, backpack, wallet

COLOR_FAMILY (pick one): black, white, neutral, earth, blue, green, red, pink, purple, orange, yellow, bright

Respond ONLY with JSON: {"category":"top","type":"shirt","color_family":"white"}`,
            },
          ],
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data }, { status: response.status });

    const text = data.content?.[0]?.text?.trim() ?? "";
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Parse error" }, { status: 500 });

    const result = JSON.parse(jsonMatch[0]);

    const validCategories = ["top", "bottom", "shoes", "accessory"];
    const validColors = ["black","white","neutral","earth","blue","green","red","pink","purple","orange","yellow","bright"];

    if (!validCategories.includes(result.category)) result.category = "top";
    if (!validColors.includes(result.color_family)) result.color_family = "neutral";
    if (!result.type) result.type = result.category === "top" ? "tee" : result.category === "bottom" ? "jeans" : result.category === "shoes" ? "sneakers" : "watch";

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}