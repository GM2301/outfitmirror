// src/app/api/chat/route.ts
// Backs both chat widgets: the Style Coach and in-app Support.
//
// The system prompt is built here, never taken from the browser - the old
// route accepted a "systemOverride" from the client, which let any signed-in
// user turn the app's paid AI key into a free general-purpose chatbot.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consumeQuota } from "@/lib/quota";

const MODEL = "gpt-4o-mini";
const MAX_MESSAGES = 16;
const MAX_MESSAGE_CHARS = 1500;

const STYLES = new Set(["minimal", "streetwear", "smart_casual", "classic", "sporty"]);

const SUPPORT_PROMPT = `You are Occaswear's in-app support assistant. Help people use the app. Be brief, friendly and accurate.

What the app actually does:
- Add clothes by photo (AI detects category, type and color and removes the background), by bulk photo upload, or manually.
- Wardrobe categories: tops, bottoms, shoes, outerwear (jackets, coats, blazers) and accessories.
- "Style me" picks the best look from your own clothes for Work, Date, Casual, Night Out, Travel or Gym, with a short explanation of why it works. "Another look" shows the next best alternative; ✕ skips a look; ♥ saves it to Saved looks.
- Tap Swap on any piece to choose a replacement from the best matches in your wardrobe (with photos). Tap the pin on a piece (or Pin in the Wardrobe) to keep it in your next looks.
- Dresses and jumpsuits are supported as complete looks.
- Weather-aware outfits use your location's current weather (can be turned off in Settings).
- Trip Planner: enter a destination and dates, get a look for each day based on that city's forecast, plus a packing list. The last trip stays saved.
- Missing Piece: suggests items that would add the most new combinations to your wardrobe.
- Couple Mode: connect with a partner using a code to see outfits for both of you.
- Style Coach: a chat that gives advice based on your wardrobe.
- Every feature is free during early access; paid plans will come later.
- Account deletion: Profile → Settings & account → Delete Account. Support email: contact@occaswear.com.

Rules:
- Only describe features listed above. If something isn't listed, say the app doesn't do that yet - never invent features, prices or dates.
- For bugs, billing or account problems, point people to contact@occaswear.com.
- Reply in the language of the user's latest message (English if unsure).`;

function coachPrompt(gender: string, style: string, wardrobe: string): string {
  return `You are the personal style coach inside the Occaswear app. You know this person's wardrobe.

Person: dresses in ${gender === "female" ? "womenswear" : "menswear"}, preferred style: ${style.replace("_", " ")}.

Their wardrobe:
${wardrobe}

Rules:
- Give specific advice using pieces they actually own; name the pieces.
- Keep answers short (2-5 sentences) unless they ask for more.
- Suggest buying something only when their wardrobe truly lacks it.
- Be direct and encouraging, never generic.
- Only talk about style, clothes and the Occaswear app; politely decline anything unrelated.
- Reply in the language of the user's latest message (English if unsure).`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[chat] Missing OPENAI_API_KEY");
      return NextResponse.json({ error: "Chat is not available right now." }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    const mode = body?.mode === "coach" ? "coach" : "support";

    // Only plain user/assistant turns, capped in number and length.
    const rawMessages: unknown[] = Array.isArray(body?.messages) ? body.messages : [];
    const messages = rawMessages
      .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
      .slice(-MAX_MESSAGES)
      .map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "No message" }, { status: 400 });
    }

    const quota = await consumeQuota(user.id, "chat");
    if (!quota.ok) return NextResponse.json({ reply: quota.message });

    let system = SUPPORT_PROMPT;
    if (mode === "coach") {
      const gender = body?.gender === "female" ? "female" : "male";
      const style = STYLES.has(body?.style) ? body.style : "minimal";
      // Read the wardrobe here (RLS limits it to this user) rather than trusting
      // a text blob from the browser.
      const { data: items } = await supabase
        .from("items")
        .select("category, type, color_family")
        .eq("user_id", user.id)
        .limit(300);
      const byCat: Record<string, string[]> = {};
      for (const it of items ?? []) {
        (byCat[it.category] ??= []).push(`${String(it.type).replace(/_/g, " ")} (${it.color_family ?? "neutral"})`);
      }
      const wardrobe = Object.keys(byCat).length
        ? Object.entries(byCat).map(([c, list]) => `${c} (${list.length}): ${list.join(", ")}`).join("\n")
        : "No items yet.";
      system = coachPrompt(gender, style, wardrobe);
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        temperature: 0.6,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("[chat] OpenAI error:", response.status, JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ error: "Chat is not available right now." }, { status: 502 });
    }

    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't process that.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[chat] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
