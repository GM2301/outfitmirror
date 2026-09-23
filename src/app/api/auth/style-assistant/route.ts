import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[style-assistant] Missing ANTHROPIC_API_KEY");
      return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 });
    }

    // This proxies to a paid Anthropic call - without an auth check anyone
    // who finds the URL (trivial via devtools) can spend the app's
    // Anthropic budget with unlimited, untraceable requests.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { messages, wardrobeContext, systemOverride } = await req.json();

    const systemPrompt = systemOverride || `You are a personal men's style assistant inside Occaswear app. You are direct, practical, and confident — like a knowledgeable friend who knows fashion.

The user's current wardrobe:
${wardrobeContext}

Rules:
- Always give specific, actionable advice based on their actual wardrobe
- Keep responses concise (2-4 sentences max unless asked for more)
- Be encouraging but honest
- Focus on men's style specifically
- If they ask about outfits, reference their actual clothes
- Never be generic — always personalize to their wardrobe`;

    // Some Anthropic API keys are org-level and not scoped to a single
    // workspace, which Anthropic rejects unless the workspace to bill is
    // named explicitly. This was silently breaking every single chat
    // request (both this and the support widget use this route) until
    // caught live - set ANTHROPIC_WORKSPACE_ID if the configured key needs
    // it (Anthropic Console -> Settings -> the workspace's ID).
    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        ...(workspaceId ? { "anthropic-workspace-id": workspaceId } : {}),
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[style-assistant] Anthropic API error:", response.status, JSON.stringify(data));
      return NextResponse.json({ error: data }, { status: response.status });
    }

    const reply = data.content?.[0]?.text ?? "Sorry, I couldn't process that.";
    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Style assistant error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}