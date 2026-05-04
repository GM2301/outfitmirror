"use client";

import * as React from "react";
import type { Item } from "@/lib/engine/types";

type Message = { role: "user" | "assistant"; content: string };
type Props = { items: Item[] };

function buildContext(items: Item[]): string {
  const gender = typeof window !== "undefined" ? localStorage.getItem("om_gender") ?? "male" : "male";
  const style  = typeof window !== "undefined" ? localStorage.getItem("om_style")  ?? "minimal" : "minimal";
  const history = typeof window !== "undefined" ? localStorage.getItem("om_outfit_history") ?? "[]" : "[]";

  const tops    = items.filter(i => i.category === "top");
  const bottoms = items.filter(i => i.category === "bottom");
  const shoes   = items.filter(i => i.category === "shoes");
  const fmt = (arr: Item[]) => arr.map(i => `${i.type} (${i.color_family})`).join(", ") || "none";

  let savedOutfits = "";
  try {
    const hist = JSON.parse(history).slice(0, 5);
    savedOutfits = hist.map((h: any) => `${h.occasion}: ${h.top} + ${h.bottom} + ${h.shoes}`).join(", ");
  } catch { savedOutfits = "none"; }

  return `Gender: ${gender}
Style preference: ${style}
Tops (${tops.length}): ${fmt(tops)}
Bottoms (${bottoms.length}): ${fmt(bottoms)}
Shoes (${shoes.length}): ${fmt(shoes)}
Total items: ${items.length}
Recent saved outfits: ${savedOutfits || "none yet"}`;
}

const SUGGESTIONS_MALE = [
  "What outfit fits my style best?",
  "How can I look more put-together?",
  "What should I wear for a job interview?",
  "How to dress better without buying more?",
];

const SUGGESTIONS_FEMALE = [
  "What outfit fits my style best?",
  "How can I elevate my everyday look?",
  "What should I wear to brunch?",
  "How to dress better without buying more?",
];

export default function AIStyleCoach({ items }: Props) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputRef  = React.useRef<HTMLInputElement>(null);

  const gender = typeof window !== "undefined" ? localStorage.getItem("om_gender") ?? "male" : "male";
  const style  = typeof window !== "undefined" ? localStorage.getItem("om_style")  ?? "minimal" : "minimal";
  const SUGGESTIONS = gender === "female" ? SUGGESTIONS_FEMALE : SUGGESTIONS_MALE;

  const SYSTEM = `You are a personal AI style coach inside the Occaswear app. You know this user's wardrobe, gender, and style preference intimately.

User context:
${buildContext(items)}

Your role:
- Give personalized style advice based on what they ACTUALLY own
- Suggest specific combinations from their wardrobe
- Teach them style rules that match their chosen style: ${style}
- Remember their preferences throughout the conversation
- Be direct, specific, and encouraging — not generic
- Suggest what to buy ONLY when their wardrobe truly lacks something important
- Answer in the same language the user writes in

Never give generic advice. Always reference their specific items.`;

  React.useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = gender === "female"
        ? `Hi! I'm your personal style coach. I've analyzed your wardrobe and your ${style} style. What would you like to work on today?`
        : `Hey! I'm your personal style coach. I know your wardrobe and your ${style} style. What do you want to level up today?`;
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [open]);

  React.useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  React.useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  async function sendMessage(text?: string) {
    const userText = text ?? input.trim();
    if (!userText || loading) return;
    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/style-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          wardrobeContext: buildContext(items),
          systemOverride: SYSTEM,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply ?? "Sorry, try again." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <>
      <div className="fixed bottom-[72px] right-4 z-40">
        <button type="button" onClick={() => setOpen(v => !v)}
          className={`h-10 rounded-full shadow-md transition-all flex items-center gap-1.5 px-3 text-xs font-bold ${
            open ? "bg-neutral-800 text-white" : "bg-black text-white hover:bg-black/85"
          }`}>
          <span className="text-sm">{open ? "✕" : "✨"}</span>
          {!open && <span>Style Coach</span>}
        </button>
      </div>

      {open && (
        <div className="fixed bottom-[120px] right-4 z-40 w-[320px] sm:w-[360px] rounded-2xl border border-black/10 bg-white shadow-2xl flex flex-col overflow-hidden drawer-enter"
          style={{ maxHeight: "65vh" }}>
          <div className="bg-black text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-xs">✨</div>
            <div>
              <p className="font-bold text-sm">Style Coach</p>
              <p className="text-xs text-white/40">Knows your wardrobe · {style}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)}
              className="ml-auto text-white/40 hover:text-white transition text-lg leading-none">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-black text-white rounded-br-sm" : "bg-neutral-100 text-neutral-800 rounded-bl-sm"
                }`}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0,150,300].map(d => (
                      <span key={d} className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {messages.length === 1 && (
              <div className="space-y-1.5 pt-1">
                {SUGGESTIONS.map(s => (
                  <button key={s} type="button" onClick={() => sendMessage(s)}
                    className="w-full text-left rounded-xl border border-black/8 px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50 transition">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-black/8 p-2.5 flex gap-2 flex-shrink-0">
            <input ref={inputRef} type="text" value={input}
              onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Ask your style coach..."
              className="flex-1 rounded-xl border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/8"
              disabled={loading} />
            <button type="button" onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-black text-white px-3 py-2.5 text-sm font-bold disabled:opacity-40 hover:bg-black/85 transition">
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}