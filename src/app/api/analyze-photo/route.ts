import { NextRequest, NextResponse } from "next/server";

const OPENAI_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  if (!OPENAI_KEY) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

  try {
    const body = await req.json();
    const { imageBase64, mimeType = "image/jpeg" } = body;
    if (!imageBase64) return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });

    const prompt = `You are an expert fashion stylist. Look at the image and analyze the clothing item step by step.
    
    You must output a JSON object with the following structure:
    {
      "analysis": "Brief 1-sentence description of what you visually detect to anchor your logic",
      "category": "top" | "bottom" | "shoes" | "outerwear" | "accessory",
      "type": "specific_garment_type",
      "color_family": "single_color_name",
      "formality_tier": 1-5,
      "is_layer": boolean,
      "is_inner": boolean,
      "min_temp": number,
      "max_temp": number,
      "style_tags": ["tag1", "tag2"]
    }

    CRITICAL TAXONOMY RULES:
    - category: top, bottom, shoes, outerwear, accessory.
    - type precision: 
      * For BOTTOMS: jeans (denim, 5-pocket), chinos (smooth cotton twill), joggers/sweatpants (cuffs+drawstring), trousers (formal, structured).
      * For TOPS: tee (t-shirt), polo (collar+buttons), shirt (button-down dress shirt), hoodie (with hood), sweatshirt (pullover, no hood), sweater (knitted).
    - formality_tier: 1=Athletic/Lounge, 2=Casual (jeans/tee), 3=Smart Casual (chinos/polo/sweater), 4=Business (blazer/trousers), 5=Formal.
    - is_layer: true for outerwear, hoodies, sweatshirts, blazers, cardigans, sweaters. False for tees, shirts, polos.
    - is_inner: true ONLY for base layers worn directly on skin (tee, polo, shirt, tank). HOODIE/SWEATSHIRT/JACKET ARE NEVER INNER (always false).
    - color_family: neutral, black, white, earth, grey, beige, brown, navy, blue, green, red, orange, yellow, pink, purple, teal, tan, burgundy. (denim goes to blue, charcoal to grey, cream to white).

    TEMPERATURE REFERENCE:
    Tank: 22 to 40 | Tee: 18 to 35 | Polo/Shirt: 10 to 30 | Hoodie/Sweatshirt: 5 to 20 | Sweater: 0 to 20 | Blazer/Light Jacket: 5 to 22 | Coat/Trench: -10 to 12 | Jeans/Chinos: -10 to 28 | Shorts: 20 to 40.`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${OPENAI_KEY}` 
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" }, 
        messages: [
          { role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ]},
        ],
        max_tokens: 450,
        temperature: 0.1,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[analyze-photo] OpenAI error:", errText);
      return NextResponse.json({ error: "OpenAI error" }, { status: 500 });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    
    let parsed: any = JSON.parse(content);

    const VALID_CATEGORIES = ["top", "bottom", "shoes", "outerwear", "accessory"];
    if (!VALID_CATEGORIES.includes(parsed.category)) parsed.category = "top";

    parsed.type = String(parsed.type ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "_") || "tee";
    parsed.color_family = String(parsed.color_family ?? "neutral").toLowerCase();
    parsed.formality_tier = Math.min(5, Math.max(1, Number(parsed.formality_tier) || 2));

    const typeL = parsed.type;

    if (typeL.includes("hoodie") || typeL.includes("sweatshirt") || typeL.includes("zip")) {
      parsed.is_inner = false;
      parsed.is_layer = true;
      if (!parsed.min_temp) parsed.min_temp = 5;
      if (!parsed.max_temp) parsed.max_temp = 20;
    }

    if (parsed.category === "outerwear" || typeL.includes("blazer") || typeL.includes("coat") || typeL.includes("jacket")) {
      parsed.is_layer = true;
      parsed.is_inner = false;
    }

    if (["bottom", "shoes", "accessory"].includes(parsed.category)) {
      parsed.is_layer = false;
      parsed.is_inner = false;
    }

    if (["tee", "t_shirt", "tshirt", "polo", "tank", "blouse", "shirt"].includes(typeL) && parsed.category === "top") {
      parsed.is_inner = true;
    }

    parsed.is_layer = Boolean(parsed.is_layer);
    parsed.is_inner = Boolean(parsed.is_inner);

    parsed.min_temp = parsed.min_temp !== null && parsed.min_temp !== undefined ? Math.min(40, Math.max(-30, Number(parsed.min_temp))) : null;
    parsed.max_temp = parsed.max_temp !== null && parsed.max_temp !== undefined ? Math.min(45, Math.max(-25, Number(parsed.max_temp))) : null;

    if (!Array.isArray(parsed.style_tags)) parsed.style_tags = ["casual"];

    delete parsed.analysis;

    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error("[analyze-photo] Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}