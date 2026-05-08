import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 100,
        messages: [{
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "low" },
            },
            {
              type: "text",
              text: `Analyze this clothing/fashion item. Respond ONLY with JSON, no other text.

{"category":"top","type":"tee","color_family":"black"}

category: "top" (shirt/tee/hoodie/jacket/blazer/sweater/coat/tank/cardigan) | "bottom" (jeans/trousers/shorts/skirt/leggings/joggers) | "shoes" (sneakers/boots/heels/loafers/sandals) | "accessory" (watch/sunglasses/belt/bag/hat/jewelry/scarf/bracelet)

IMPORTANT: watches, sunglasses, bags, belts, jewelry = always "accessory"

type - most specific: tee, polo, shirt, sweater, hoodie, jacket, blazer, coat, tank, crop_top, cardigan, blouse, knit, henley, crewneck, jeans, chinos, trousers, shorts, joggers, sweatpants, cargo, midi_skirt, mini_skirt, leggings, sneakers, running_shoes, boots, dress_shoes, loafers, sandals, chelsea_boots, heels, ankle_boots, mules, watch, sunglasses, belt, bag, hat, scarf, bracelet, jewelry

color_family: black | white | neutral | earth | blue | green | red | pink | purple | orange | yellow | bright

JSON only:`,
            },
          ],
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI error:", data);
      return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }

    const text = data.choices?.[0]?.message?.content ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[^}]+\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Parse error" }, { status: 500 });

    const parsed = JSON.parse(jsonMatch[0]);

    const validCats = ["top", "bottom", "shoes", "accessory"];
    const validColors = ["black","white","neutral","earth","blue","green","red","pink","purple","orange","yellow","bright"];
    if (!validCats.includes(parsed.category)) parsed.category = "top";
    if (!validColors.includes(parsed.color_family)) parsed.color_family = "neutral";
    if (!parsed.type) parsed.type = { top:"tee", bottom:"jeans", shoes:"sneakers", accessory:"watch" }[parsed.category as string] ?? "tee";

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Photo analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}