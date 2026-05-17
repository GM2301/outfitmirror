// src/app/api/analyze-photo/route.ts
import { NextRequest, NextResponse } from "next/server";

const OPENAI_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  if (!OPENAI_KEY) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

  try {
    const body = await req.json();
    const { imageBase64, mimeType = "image/jpeg" } = body;
    if (!imageBase64) return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });

    const prompt = `You are a professional fashion stylist tagging ONE clothing item for a wardrobe app.

Analyze the photo carefully and return ONLY valid JSON, no markdown, no explanation:

{
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

═══ CATEGORY ═══
- top: shirt, polo, tee, tank, crop, henley, blouse, sweater, hoodie, sweatshirt, cardigan
- bottom: jeans, chinos, trousers, joggers, sweatpants, shorts, cargo, leggings, skirt, midi_skirt, mini_skirt
- shoes: sneakers, running_shoes, leather_sneakers, loafers, oxford, derby, chelsea_boots, ankle_boots, heels, flats, sandals, flip_flops
- outerwear: blazer, jacket, coat, parka, trench, bomber, peacoat
- accessory: belt, watch, scarf, hat, cap, beanie, sunglasses, bag, backpack, tote, tie, necklace, bracelet

═══ TYPE — PRECISION CRITICAL ═══
For BOTTOMS distinguish by FABRIC + CUFF + WAISTBAND:
- jeans: denim weave with rivets, contrast stitching, 5-pocket layout
- chinos: cotton twill smooth weave, no rivets
- trousers: polished structured fabric, creased, formal
- joggers: elastic cuffs + drawstring waist, fleece/cotton
- sweatpants: elastic cuffs + drawstring, fleece (similar to joggers)
- track_pants: synthetic fabric with side stripes, athletic branding
- cargo: side leg pockets, utility look
- leggings: stretchy form-fitting
- shorts: above knee
- mini_skirt: very short skirt
- midi_skirt: mid-calf skirt

For TOPS distinguish by NECK + HOOD + FABRIC:
- tee: simple t-shirt crew neck
- tank: no sleeves
- polo: short collar with button placket (1-3 buttons)
- shirt: full button-down with collar (FORMAL cotton, NO hood)
- blouse: feminine flowing shirt
- hoodie: HAS HOOD, athletic fleece
- sweatshirt: pullover, NO hood, fleece (athletic)
- sweater: KNITTED warm fabric, no hood, DRESSY
- crewneck: refined crewneck sweater (knit) — NOT a sweatshirt
- cardigan: open-front knit
- henley: tee with button placket at neckline

═══ FORMALITY_TIER (1-5) ═══
1 = ATHLETIC / LOUNGEWEAR
   joggers, sweatpants, track_pants, hoodie, sweatshirt, athletic tank, running_shoes, athletic_shorts
2 = CASUAL
   tee, jeans, denim, canvas_sneakers, white_sneakers, shorts, light_jacket, bomber, basic_tee
3 = SMART CASUAL
   shirt, polo, sweater, knit, cardigan, chinos, leather_sneakers, chelsea_boots, ankle_boots, henley
4 = BUSINESS
   blazer, dress_trousers, oxford, derby, loafers, heels, dress_shirt, blouse_formal, trench_coat
5 = FORMAL
   tuxedo, dress_shoes with tie

═══ IS_LAYER (boolean) — CRITICAL ═══
TRUE if this item is designed to be worn OVER another top:
- blazer, jacket, coat, parka, trench, bomber, peacoat
- cardigan, hoodie, sweatshirt
- sweater, crewneck (knit) — yes can be layered over tee

FALSE for: tee, polo, shirt, tank, blouse, crop, henley, bodysuit

═══ IS_INNER (boolean) — STRICTEST RULE ═══
TRUE ONLY for base layers worn directly on skin:
- tee, polo, shirt, blouse, tank, henley, bodysuit, crop, longsleeve

FALSE STRICTLY for:
- HOODIE → FALSE (NEVER under another piece, bulky athletic)
- SWEATSHIRT → FALSE (NEVER inner, athletic)
- BLAZER, JACKET, COAT, PARKA, TRENCH, BOMBER → FALSE (outerwear)
- Thick sweater/cardigan → FALSE
- Thin sweater → TRUE (can go under blazer/coat)

**ABSOLUTE RULE: hoodie/sweatshirt IS NEVER inner. is_inner = false ALWAYS.**

═══ MIN_TEMP / MAX_TEMP (Celsius) — PRECISION ═══
| Item | min_temp | max_temp |
|------|----------|----------|
| Tank top | 22 | 40 |
| T-shirt | 18 | 35 |
| Polo | 16 | 32 |
| Long sleeve | 10 | 28 |
| Shirt (button-down) | 10 | 28 |
| Blouse | 12 | 28 |
| Henley | 10 | 24 |
| Hoodie | 5 | 20 |
| Sweatshirt | 5 | 20 |
| Sweater / knit / cardigan | 0 | 20 |
| Blazer | 8 | 24 |
| Light jacket / bomber | 5 | 18 |
| Heavy jacket | -5 | 12 |
| Coat / overcoat / trench | -10 | 12 |
| Parka | -20 | 5 |
| Shorts | 20 | 40 |
| Mini skirt | 18 | 35 |
| Jeans / chinos / denim | -10 | 28 |
| Trousers | 5 | 28 |
| Joggers / sweatpants | 0 | 22 |
| Leggings | 0 | 22 |
| Midi skirt | 8 | 28 |
| Sandals / flip flops | 22 | 45 |
| Sneakers | -5 | 30 |
| Boots | -15 | 16 |
| Heels / loafers / dress shoes | 5 | 28 |

Accessory: min_temp=null, max_temp=null EXCEPT scarf: min=-20, max=15

═══ COLOR_FAMILY ═══
ONE OF: neutral, black, white, earth, grey, beige, brown, navy, denim, blue, green, red, orange, yellow, pink, purple, teal, coral, tan, khaki, burgundy

Guidelines:
- denim → blue
- charcoal → grey
- olive → green
- burgundy → red or burgundy
- navy is its OWN family (not blue)
- cream/ivory → white
- camel/tan → tan or beige

═══ STYLE_TAGS ═══
Pick 1-3 from: ["athletic", "casual", "smart", "formal", "sporty", "streetwear", "elegant", "minimal"]

═══ OUTPUT ═══
Return ONLY the JSON object. No preamble. No markdown fences. No explanation.`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ]},
        ],
        max_tokens: 350,
        temperature: 0.1,
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

    // ─── VALIDATION + SAFETY OVERRIDES ───────────────────────────────────────
    const VALID_CATEGORIES = ["top", "bottom", "shoes", "outerwear", "accessory"];
    if (!VALID_CATEGORIES.includes(parsed.category)) parsed.category = "top";

    parsed.type = String(parsed.type ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "_") || "tee";
    parsed.color_family = String(parsed.color_family ?? "neutral").toLowerCase();
    parsed.formality_tier = Math.min(5, Math.max(1, Number(parsed.formality_tier) || 2));

    const typeL = parsed.type.toLowerCase();

    // SAFETY OVERRIDE 1: hoodie/sweatshirt/zip_up — JAMË kurrë inner
    if (typeL.includes("hoodie") || typeL.includes("sweatshirt") || typeL.includes("zip_up") || typeL.includes("zipup")) {
      parsed.is_inner = false;
      parsed.is_layer = true;
      // Force athletic temp range
      if (parsed.min_temp === null || parsed.min_temp === undefined) parsed.min_temp = 5;
      if (parsed.max_temp === null || parsed.max_temp === undefined) parsed.max_temp = 20;
    }

    // SAFETY OVERRIDE 2: outerwear category — always layer, never inner
    if (parsed.category === "outerwear") {
      parsed.is_layer = true;
      parsed.is_inner = false;
    }

    // SAFETY OVERRIDE 3: blazer/coat/jacket/parka/trench/bomber — always layer
    if (typeL.includes("blazer") || typeL.includes("coat") || typeL.includes("parka") ||
        typeL.includes("trench") || typeL.includes("bomber") ||
        (typeL.includes("jacket") && !typeL.includes("track"))) {
      parsed.is_layer = true;
      parsed.is_inner = false;
    }

    // SAFETY OVERRIDE 4: bottom/shoes/accessory — never layer, never inner
    if (parsed.category === "bottom" || parsed.category === "shoes" || parsed.category === "accessory") {
      parsed.is_layer = false;
      parsed.is_inner = false;
    }

    // SAFETY OVERRIDE 5: tee/polo/tank/blouse/shirt — always inner
    if ((typeL === "tee" || typeL === "t_shirt" || typeL === "tshirt" || typeL.includes("polo") ||
         typeL.includes("tank") || typeL.includes("blouse") ||
         (typeL.includes("shirt") && !typeL.includes("sweatshirt"))) && parsed.category === "top") {
      parsed.is_inner = true;
    }

    // Boolean coercion
    parsed.is_layer = Boolean(parsed.is_layer);
    parsed.is_inner = Boolean(parsed.is_inner);

    // Min/max temp validation
    if (parsed.min_temp !== null && parsed.min_temp !== undefined) {
      parsed.min_temp = Math.min(40, Math.max(-30, Number(parsed.min_temp)));
    } else parsed.min_temp = null;

    if (parsed.max_temp !== null && parsed.max_temp !== undefined) {
      parsed.max_temp = Math.min(45, Math.max(-25, Number(parsed.max_temp)));
    } else parsed.max_temp = null;

    if (!Array.isArray(parsed.style_tags)) parsed.style_tags = ["casual"];

    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error("[analyze-photo] Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}