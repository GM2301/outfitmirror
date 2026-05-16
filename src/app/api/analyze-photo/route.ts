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

    const prompt = `You are a professional fashion stylist tagging a single clothing item for a wardrobe app.

Analyze the photo and return a JSON object with these exact fields:

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
- top: anything worn on torso as primary or base layer (t-shirt, shirt, polo, blouse, tank, crop, henley, sweater, knit, hoodie, sweatshirt)
- bottom: pants/skirts/shorts (jeans, chinos, trousers, joggers, sweatpants, track_pants, athletic_pants, shorts, cargo, leggings, skirt, midi_skirt, mini_skirt)
- shoes: footwear (sneakers, running_shoes, leather_sneakers, canvas_sneakers, loafers, oxford, derby, chelsea, boots, ankle_boots, heels, pumps, flats, ballet, sandals, flip_flops, mules)
- outerwear: blazer, jacket, coat, parka, trench, bomber, cardigan, overcoat, peacoat
- accessory: belt, watch, scarf, hat, cap, beanie, sunglasses, bag, backpack, tie, necklace, bracelet, ring

═══ TYPE (be specific) ═══
For bottoms — DISTINGUISH BY FABRIC + CUFF + WAISTBAND:
- jeans: denim fabric, rivets, contrast stitching, classic 5-pocket
- chinos: cotton twill, no rivets, soft structure, smooth fabric
- trousers / dress_pants: polished, creased, formal
- joggers / sweatpants: elastic cuffs, drawstring waist, fleece/cotton
- track_pants / athletic_pants: synthetic, side stripes, athletic branding
- cargo: side pockets, utility look
- leggings: stretchy, form-fitting
- shorts: above knee

For tops — DISTINGUISH BY NECK + HOOD + FABRIC:
- tee: simple t-shirt, crew neck
- tank / sleeveless: no sleeves
- polo: collar with short placket buttons
- shirt: full button-down, collar (formal cotton)
- blouse: feminine shirt, flowing fabric
- hoodie: HAS hood
- sweatshirt: pullover, NO hood, casual fleece
- sweater / knit: knitted fabric, warm
- crewneck: crewneck sweatshirt OR fine knit
- henley: T-shirt with button placket at neck

For shoes:
- running_shoes: mesh/performance fabric, athletic branding
- leather_sneakers: smooth leather, minimal
- canvas_sneakers: Converse-style, Vans
- dress_shoes / oxford / derby: formal leather, smooth
- chelsea_boots: ankle leather boots, elastic side
- loafers: slip-on leather

═══ COLOR_FAMILY ═══
Pick ONE: neutral, black, white, earth, grey, beige, brown, navy, denim, blue, green, red, orange, yellow, pink, purple, teal, coral

Guidelines: denim → blue, beige → earth, charcoal → grey, olive → green, burgundy → red, navy is navy not blue.

═══ FORMALITY_TIER (1-5) ═══
1 = athletic / loungewear (joggers, sweatpants, hoodie, running shoes, tank, athletic tee)
2 = casual (tee, jeans, jacket, canvas sneakers, white sneakers, shorts)
3 = smart casual (shirt, polo, sweater, chinos, chelsea boots, leather sneakers, knit, cardigan)
4 = business (blazer, dress trousers, oxford, loafers, heels, dress shirt, blouse)
5 = formal (tuxedo, dress shoes, dress shirt with tie)

═══ IS_LAYER (true / false) ═══
true if this item is designed to be worn OVER another top (blazer, jacket, hoodie, sweater, coat, cardigan, parka, overshirt).
false otherwise.

═══ IS_INNER (true / false) ═══
true if this item works as a BASE LAYER (tee, polo, shirt, blouse, tank, henley, bodysuit, crop, knit).
false otherwise. Note: sweaters/cardigans can be true if thin.
Outerwear (blazer/coat/jacket/parka) = false (not inner).

═══ MIN_TEMP / MAX_TEMP (°C) ═══
Based on the item's fabric and weight:
- Tank top: min 22, max 40
- T-shirt: min 18, max 35
- Polo: min 16, max 32
- Long sleeve / shirt: min 12, max 28
- Henley / light knit: min 10, max 24
- Hoodie / sweatshirt: min 5, max 22
- Sweater / cardigan: min 0, max 20
- Blazer: min 8, max 25
- Light jacket / bomber: min 5, max 20
- Heavy jacket: min -5, max 15
- Coat / overcoat: min -10, max 12
- Parka / heavy winter: min -20, max 5
- Shorts: min 20, max 40
- Jeans / chinos: min -10, max 28
- Trousers: min 5, max 28
- Joggers: min 0, max 22
- Leggings: min 0, max 22
- Skirt (mini): min 18, max 35
- Skirt (midi): min 8, max 28
- Sandals / flip flops: min 22, max 40
- Sneakers: min -5, max 30
- Boots: min -15, max 18
- Heels / loafers: min 5, max 28

If accessory: leave min_temp=null, max_temp=null (except scarf: min=-20, max=15).

═══ STYLE_TAGS ═══
Pick 1-3 from: ["athletic", "casual", "smart", "formal", "sporty", "streetwear", "elegant", "minimal"]

═══ OUTPUT ═══
Return ONLY the JSON object, no markdown, no explanation.`;

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
        max_tokens: 300,
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

    // ─── DEFAULTS dhe validation ────────────────────────────────────────────
    const VALID_CATEGORIES = ["top", "bottom", "shoes", "outerwear", "accessory"];
    if (!VALID_CATEGORIES.includes(parsed.category)) parsed.category = "top";

    parsed.type = String(parsed.type ?? "").toLowerCase() || "tee";
    parsed.color_family = String(parsed.color_family ?? "neutral").toLowerCase();
    parsed.formality_tier = Math.min(5, Math.max(1, Number(parsed.formality_tier) || 2));
    parsed.is_layer = Boolean(parsed.is_layer);
    parsed.is_inner = Boolean(parsed.is_inner);

    // min/max temp validation
    if (parsed.min_temp !== null && parsed.min_temp !== undefined) {
      parsed.min_temp = Math.min(40, Math.max(-30, Number(parsed.min_temp)));
    }
    if (parsed.max_temp !== null && parsed.max_temp !== undefined) {
      parsed.max_temp = Math.min(45, Math.max(-25, Number(parsed.max_temp)));
    }

    // style_tags
    if (!Array.isArray(parsed.style_tags)) parsed.style_tags = ["casual"];

    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error("[analyze-photo] Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}