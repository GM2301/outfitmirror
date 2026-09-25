"use client";

import * as React from "react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How do I add clothes to my wardrobe?",
  "How does outfit generation work?",
  "What is Missing Piece?",
  "How do I use Trip Planner?",
  "Is Occaswear free?",
];

// The support instructions live on the server (api/chat) so they can't be
// swapped out from the browser.

// Opened from Profile → "Chat with support" rather than a floating button,
// so the outfit screen only has one floating action (the Style Coach).
export default function AISupport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputRef  = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: "Hi! I'm Occaswear support. How can I help you with the app?" }]);
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Drop the local greeting - the model only needs the real conversation.
        body: JSON.stringify({ mode: "support", messages: newMessages.slice(1) }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply ?? data.error ?? "Sorry, try again." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-[120px] left-4 right-4 sm:left-auto sm:right-4 z-50 sm:w-[360px] rounded-2xl border border-black/10 bg-white shadow-2xl flex flex-col overflow-hidden drawer-enter"
          style={{ maxHeight: "65vh" }}>
          <div className="bg-neutral-900 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-xs">💬</div>
            <div>
              <p className="font-bold text-sm">Occaswear Support</p>
              <p className="text-xs text-white/40">Here to help</p>
            </div>
            <button type="button" onClick={onClose}
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
              placeholder="How can I help?"
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