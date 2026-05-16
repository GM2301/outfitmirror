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
        max_tokens: 120,
        messages: [{
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "low" },
            },
            {
              type: "text",
              text: `You are a professional fashion stylist tagging a garment for a wardrobe app.
Respond ONLY with valid JSON. No prose, no markdown, no commentary.

EXAMPLE OUTPUT: {"category":"bottom","type":"joggers","color_family":"black"}

CATEGORY (pick ONE):
- "top": tee, shirt, blouse, polo, tank, crop_top, hoodie, sweatshirt, sweater, cardigan, knit, blazer, jacket, coat, parka, henley, crewneck
- "bottom": jeans, chinos, trousers, dress_pants, shorts, cargo_shorts, joggers, sweatpants, track_pants, athletic_pants, leggings, midi_skirt, mini_skirt
- "shoes": sneakers, running_shoes, leather_sneakers, canvas_sneakers, boots, chelsea_boots, ankle_boots, dress_shoes, oxford, loafers, derby, sandals, flip_flops, heels, mules, ballet_flats
- "accessory": watch, sunglasses, belt, bag, backpack, hat, cap, beanie, scarf, tie, necklace, bracelet, ring, earrings

CRITICAL: watches, sunglasses, bags, belts, hats, jewelry, scarves, ties => ALWAYS "accessory" (never "top"/"bottom"/"shoes").

TYPE — pick MOST SPECIFIC. Use a stylist's eye to distinguish:

BOTTOMS — look at FABRIC, CUFF, WAISTBAND:
- jeans: denim weave, rivets, contrast stitching, belt loops, button+zipper fly
- chinos: cotton twill, smooth, no rivets, structured but soft, belt loops, button+zipper fly
- trousers / dress_pants: dressy wool/synthetic, creased front, no rivets, polished finish
- joggers / sweatpants: elasticized/ribbed cuffs at ankle, drawstring waist, soft jersey/fleece
- track_pants / athletic_pants: technical synthetic fabric (poly/nylon), often with side stripes or athletic branding, elastic or drawstring waist
- leggings: tight, stretchy, no fly, no pockets typically
- cargo_shorts / cargo: visible side cargo pockets
- shorts: above-knee, no cargo pockets

TOPS — look at NECK, HOOD, SLEEVES, FABRIC:
- tee: short sleeves, crew/v-neck, soft cotton
- tank: NO sleeves, regular length, casual
- crop_top: cropped at waist (shows midriff)
- polo: collar + 2-3 button placket, knit fabric
- shirt / dress_shirt: full button front, woven (not knit), collar
- blouse: women's shirt, often flowy/silky
- hoodie: HAS hood (drawstring), pullover or zip
- sweatshirt: pullover, athletic fleece, NO hood, crew neck
- sweater / knit: knit fabric, no hood, can be cable/cardigan/crewneck pattern
- blazer: structured shoulders, lapels, dressy
- jacket: casual outerwear (denim, bomber, leather, windbreaker)

SHOES:
- running_shoes: athletic mesh, performance sole, often colorful/branded (Nike/Adidas running)
- leather_sneakers: smooth leather, minimal, clean (Common Projects style)
- canvas_sneakers: canvas upper (Converse/Vans), flat sole
- sneakers: generic athletic casual if unclear
- dress_shoes / oxford / derby: polished leather, lace-up, formal
- chelsea_boots: ankle-high, elastic side panel, no laces
- loafers: slip-on, leather, no laces, dressy-casual

COLOR_FAMILY — pick ONE: black | white | neutral | earth | blue | green | red | pink | purple | orange | yellow | bright

COLOR NOTES:
- denim/jean blue => "blue"
- beige/tan/khaki/camel => "earth"
- grey/gray => "neutral"
- navy => "blue"
- olive => "green"
- burgundy/wine => "red"
- multi-color or hard to tell => "neutral"

Return ONLY the JSON object:`,
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