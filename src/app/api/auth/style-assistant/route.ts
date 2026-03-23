import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, wardrobeContext } = await req.json();

    const systemPrompt = `You are a personal men's style assistant inside OutfitMirror app. You are direct, practical, and confident — like a knowledgeable friend who knows fashion.

The user's current wardrobe:
${wardrobeContext}

Rules:
- Always give specific, actionable advice based on their actual wardrobe
- Keep responses concise (2-4 sentences max unless asked for more)
- Be encouraging but honest
- Focus on men's style specifically
- If they ask about outfits, reference their actual clothes
- Never be generic — always personalize to their wardrobe`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status });
    }

    const reply = data.content?.[0]?.text ?? "Sorry, I couldn't process that.";
    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Style assistant error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}