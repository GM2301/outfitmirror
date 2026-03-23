"use client";

import * as React from "react";
import type { Item } from "@/lib/engine/types";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  items: Item[];
};

function buildWardrobeContext(items: Item[]): string {
  if (items.length === 0) return "The user has no items in their wardrobe yet.";

  const tops = items.filter((i) => i.category === "top");
  const bottoms = items.filter((i) => i.category === "bottom");
  const shoes = items.filter((i) => i.category === "shoes");

  const fmt = (arr: Item[]) =>
    arr.map((i) => `${i.type} (${i.color_family})`).join(", ");

  return `
Tops: ${tops.length > 0 ? fmt(tops) : "none"}
Bottoms: ${bottoms.length > 0 ? fmt(bottoms) : "none"}
Shoes: ${shoes.length > 0 ? fmt(shoes) : "none"}
Total: ${items.length} items
  `.trim();
}

const SUGGESTIONS = [
  "What should I wear to a job interview?",
  "How do I look more put-together?",
  "What's missing from my wardrobe?",
  "Best outfit for a first date?",
];

export default function AIStyleAssistant({ items }: Props) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hey! I'm your AI style assistant. I know your wardrobe and I'm here to help you dress better. What's on your mind?",
      }]);
    }
  }, [open]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function sendMessage(text?: string) {
    const userText = text ?? input.trim();
    if (!userText || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const wardrobeContext = buildWardrobeContext(items);

      const response = await fetch("/api/style-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          wardrobeContext,
        }),
      });

      const data = await response.json();
      const reply = data.reply ?? "Sorry, I couldn't process that. Try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg transition-all ${
          open ? "bg-neutral-700" : "bg-black hover:bg-black/85"
        } text-white flex items-center justify-center text-xl`}
        title="AI Style Assistant"
      >
        {open ? "✕" : "✨"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[340px] sm:w-[380px] rounded-3xl border border-black/10 bg-white shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "70vh" }}>

          {/* Header */}
          <div className="bg-black text-white px-5 py-4 flex items-center gap-3 flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-sm">✨</div>
            <div>
              <p className="font-semibold text-sm">AI Style Assistant</p>
              <p className="text-xs text-white/50">Knows your wardrobe · Premium</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-black text-white rounded-br-sm"
                    : "bg-neutral-100 text-neutral-800 rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="space-y-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button"
                    onClick={() => sendMessage(s)}
                    className="w-full text-left rounded-xl border border-black/8 px-3 py-2.5 text-xs text-neutral-600 hover:bg-neutral-50 hover:border-black/20 transition">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-black/8 p-3 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your style..."
              className="flex-1 rounded-xl border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-black text-white px-4 py-2.5 text-sm font-medium disabled:opacity-40 hover:bg-black/85 transition"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}