// src/app/api/analyze-photo/route.ts
import { NextRequest, NextResponse } from "next/server";

const OPENAI_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  if (!OPENAI_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { imageBase64, mimeType = "image/jpeg" } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });
    }

    const prompt = `You are a professional fashion stylist tagging ONE clothing item for a wardrobe app.

Analyze the photo carefully and return ONLY a JSON object with these EXACT fields:

{
  "category": "top" | "bottom" | "shoes" | "outerwear" | "accessory",
  "type": "specific_garment_type",
  "color_family": "color",
  "formality_tier": 1-5,
  "is_layer": true | false,
  "is_inner": true | false,
  "min_temp": number,
  "max_temp": number,
  "style_tags": ["tag1", "tag2"]
}

═══ CATEGORY ═══
- top: shirt, polo, tee, tank, crop, henley, blouse, sweater, hoodie, sweatshirt, cardigan
- bottom: jeans, chinos, trousers, joggers, sweatpants, shorts, cargo, leggings, skirt
- shoes: sneakers, running_shoes, leather_sneakers, loafers, oxford, derby, chelsea, boots, heels, sandals
- outerwear: blazer, jacket, coat, parka, trench, bomber, peacoat
- accessory: belt, watch, scarf, hat, cap, sunglasses, bag, tie, jewelry

═══ TYPE (be precise) ═══
For BOTTOMS — distinguish carefully by fabric + cuff + waistband:
- jeans: denim with rivets, 5-pocket
- chinos: cotton twill, smooth
- trousers: polished, formal
- joggers / sweatpants: elastic cuffs, drawstring, fleece
- track_pants: synthetic, athletic stripes
- cargo: side pockets
- leggings: stretch fabric
- shorts: above knee

For TOPS — distinguish carefully:
- tee: simple t-shirt, crew neck
- tank: no sleeves
- polo: short collar with button placket
- shirt: full button-down (formal cotton)
- blouse: feminine flowing
- hoodie: HAS HOOD (athletic)
- sweatshirt: pullover NO hood, fleece (athletic)
- sweater / knit: knitted, warm, DRESSY
- cardigan: open front knit
- crewneck: refined crewneck sweater
- henley: tee with button placket

═══ FORMALITY_TIER (1-5) ═══
1 = athletic / loungewear: joggers, sweatpants, hoodie, sweatshirt, athletic tank, running shoes
2 = casual: tee, jeans, canvas sneakers, shorts, basic jacket
3 = smart casual: shirt, polo, sweater, knit, chinos, leather sneakers, chelsea boots, cardigan
4 = business: blazer, dress trousers, oxford, loafers, heels, dress shirt, blouse, trench coat
5 = formal: tuxedo, dress shoes with tie

═══ IS_LAYER (boolean) ═══
**true** if this item goes OVER another top:
- blazer, jacket, coat, parka, trench, bomber, peacoat
- cardigan, hoodie, sweatshirt
- sweater, knit (if thick)

**false** for: tee, polo, shirt, tank, blouse, crop, henley, bodysuit

═══ IS_INNER (boolean) — CRITICAL ═══
**true** ONLY for base layers worn directly on skin:
- tee, polo, shirt, blouse, tank, henley, bodysuit, crop, longsleeve

**false** STRICTLY for:
- HOODIE → false (NEVER inner — too bulky, athletic)
- SWEATSHIRT → false (NEVER inner — athletic)
- BLAZER, JACKET, COAT, PARKA, TRENCH, BOMBER → false (outerwear)
- Thick sweater / cardigan → false (unless very thin)

Thin sweater / knit → true (can be inner under blazer/coat)
Cardigan → false (it's a layer)

**RULE: A hoodie is NEVER worn under another piece. is_inner MUST be false for hoodies and sweatshirts.**

═══ MIN_TEMP / MAX_TEMP (Celsius) ═══
- Tank top: min 22, max 40
- T-shirt: min 18, max 35
- Polo: min 16, max 32
- Long sleeve / shirt: min 10, max 28
- Henley: min 10, max 24
- Hoodie / sweatshirt: min 5, max 20
- Sweater / cardigan: min 0, max 20
- Blazer: min 8, max 24
- Light jacket / bomber: min 5, max 18
- Heavy jacket: min -5, max 12
- Coat / overcoat: min -10, max 12
- Parka: min -20, max 5
- Shorts: min 20, max 40
- Jeans / chinos / denim: min -10, max 28
- Trousers: min 5, max 28
- Joggers / sweatpants: min 0, max 22
- Leggings: min 0, max 22
- Mini skirt: min 18, max 35
- Midi skirt: min 8, max 28
- Sandals / flip flops: min 22, max 45
- Sneakers: min -5, max 30
- Boots: min -15, max 16
- Heels / loafers / dress shoes: min 5, max 28

Accessory: min_temp=null, max_temp=null EXCEPT scarf: min=-20, max=15

═══ COLOR_FAMILY ═══
ONE of: neutral, black, white, earth, grey, beige, brown, navy, denim, blue, green, red, orange, yellow, pink, purple, teal, coral

Note: denim → blue, charcoal → grey, olive → green, burgundy → red, navy is its own family

═══ STYLE_TAGS ═══
1-3 tags from: ["athletic", "casual", "smart", "formal", "sporty", "streetwear", "elegant", "minimal"]

═══ OUTPUT ═══
Return ONLY the JSON object, no markdown, no explanation, no preamble.`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
            ],
          },
        ],
        max_tokens: 350,
        temperature: 0.1, // i ulet per consistency
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[analyze-photo] OpenAI error:", errText);
      return NextResponse.json({ error: "OpenAI error" }, { status: 500 });
    }

    const data = await resp.json();
    let content = data.choices?.[0]?.message?.content ?? "{}";
    content = content.replace(/```json|```/g, "").trim();

    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("[analyze-photo] Parse error:", content);
      return NextResponse.json({ error: "Parse error" }, { status: 500 });
    }

    // ─── VALIDATION + SAFETY OVERRIDE ────────────────────────────────────────
    const VALID_CATEGORIES = ["top", "bottom", "shoes", "outerwear", "accessory"];
    if (!VALID_CATEGORIES.includes(parsed.category)) parsed.category = "top";

    parsed.type = String(parsed.type ?? "").toLowerCase() || "tee";
    parsed.color_family = String(parsed.color_family ?? "neutral").toLowerCase();
    parsed.formality_tier = Math.min(5, Math.max(1, Number(parsed.formality_tier) || 2));

    // SAFETY OVERRIDE — hoodie/sweatshirt NEVER is_inner=true
    // Edhe nese AI thote ndryshe, KETU rregullohet
    const typeL = parsed.type.toLowerCase();
    if (typeL.includes("hoodie") || typeL.includes("sweatshirt") || typeL.includes("zip_up")) {
      parsed.is_inner = false;
      parsed.is_layer = true;
    } else {
      parsed.is_layer = Boolean(parsed.is_layer);
      parsed.is_inner = Boolean(parsed.is_inner);
    }

    // Outerwear ALWAYS layer, NEVER inner
    if (parsed.category === "outerwear") {
      parsed.is_layer = true;
      parsed.is_inner = false;
    }

    // Blazer/coat/jacket/parka/trench/bomber → ALWAYS layer, NEVER inner
    if (typeL.includes("blazer") || typeL.includes("coat") || typeL.includes("parka") ||
        typeL.includes("trench") || typeL.includes("bomber") ||
        (typeL.includes("jacket") && !typeL.includes("track"))) {
      parsed.is_layer = true;
      parsed.is_inner = false;
    }

    // Bottom/shoes/accessory: layer=false, inner=false
    if (parsed.category === "bottom" || parsed.category === "shoes" || parsed.category === "accessory") {
      parsed.is_layer = false;
      parsed.is_inner = false;
    }

    // Min/max temp validation
    if (parsed.min_temp !== null && parsed.min_temp !== undefined) {
      parsed.min_temp = Math.min(40, Math.max(-30, Number(parsed.min_temp)));
    } else {
      parsed.min_temp = null;
    }
    if (parsed.max_temp !== null && parsed.max_temp !== undefined) {
      parsed.max_temp = Math.min(45, Math.max(-25, Number(parsed.max_temp)));
    } else {
      parsed.max_temp = null;
    }

    if (!Array.isArray(parsed.style_tags)) parsed.style_tags = ["casual"];

    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error("[analyze-photo] Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}