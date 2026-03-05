"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bot, Send, Sparkles, User } from "lucide-react";
import { useRouter } from "next/navigation";

function Dots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:120ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:240ms]" />
    </div>
  );
}

export default function ChatMessages() {
  const router = useRouter();

  const [messages, setMessages] = useState([
    {
      id: "m1",
      sender: "bot",
      text: "Hi 👋 Welcome to BiteGo Support. Tell me what’s wrong — I’ll fix it fast.",
      ts: Date.now(),
    },
  ]);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  const quickActions = useMemo(
    () => ["Track my order", "Payment issue", "Cancel order", "Talk to restaurant"],
    []
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getBotReply = async (userText) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data?.reply || data?.message || "";
        if (reply) return reply;
      }
    } catch {}

    const t = userText.toLowerCase();
    if (t.includes("track")) return "Sure ✅ Share your Order ID and I’ll track it instantly.";
    if (t.includes("payment"))
      return "Payment issues happen. Tell me the method (UPI/Card) + last 4 digits/time.";
    if (t.includes("cancel")) return "I can help cancel. Send the Order ID and I’ll guide you.";
    if (t.includes("restaurant"))
      return "Got it. Which restaurant? Also share Order ID if it’s about a delay.";
    return "Thanks! I’ve noted that. Share Order ID (if any) so I can assist faster 🚀";
  };

  const sendMessage = async (text) => {
    const cleaned = (text ?? input).trim();
    if (!cleaned) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: "user", text: cleaned, ts: Date.now() },
    ]);
    setInput("");
    setTyping(true);

    const reply = await getBotReply(cleaned);

    setTyping(false);
    setMessages((prev) => [
      ...prev,
      { id: `b-${Date.now()}`, sender: "bot", text: reply, ts: Date.now() },
    ]);
  };

  return (
    // ✅ IMPORTANT: add pb to account for BottomNav
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-white flex flex-col pb-[calc(72px+env(safe-area-inset-bottom))]">
      {/* HEADER */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center"
              aria-label="Back"
              type="button"
            >
              <ArrowLeft size={18} className="text-gray-700" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Bot size={18} />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-gray-900">BiteGo Support</h1>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                    Online
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-500">
                  Instant help • Fast responses
                </p>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-2 rounded-2xl">
            <Sparkles size={14} />
            Smart Support
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      {/* ✅ IMPORTANT: extra bottom padding so last message never hides under the input */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-40">
          {messages.map((m) => {
            const isUser = m.sender === "user";
            return (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                    <Bot size={16} className="text-orange-500" />
                  </div>
                )}

                <div
                  className={[
                    "max-w-[78%] px-4 py-3 rounded-3xl shadow-sm text-sm font-semibold leading-relaxed",
                    isUser
                      ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-br-xl"
                      : "bg-white border border-gray-100 text-gray-800 rounded-bl-xl",
                  ].join(" ")}
                >
                  {m.text}
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-sm">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {typing && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-9 h-9 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                <Bot size={16} className="text-orange-500" />
              </div>
              <div className="bg-white border border-gray-100 rounded-3xl rounded-bl-xl px-4 py-3 shadow-sm">
                <Dots />
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="max-w-3xl mx-auto w-full px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {quickActions.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="flex-shrink-0 bg-white border border-gray-100 px-4 py-2 rounded-2xl text-xs font-black text-gray-700 shadow-sm hover:bg-orange-50 hover:border-orange-100 transition"
              type="button"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT */}
      {/* ✅ IMPORTANT: sticky keeps it in flow + avoids fighting BottomNav */}
      <div className="sticky bottom-0 z-40 border-t bg-white/95 backdrop-blur-xl">
        <div
          className="max-w-3xl mx-auto px-4 py-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-3xl px-3 py-2 shadow-sm">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message… (Order ID helps!)"
              className="flex-1 bg-transparent outline-none text-sm font-semibold text-gray-800 placeholder:text-gray-400 px-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />

            <button
              onClick={() => sendMessage()}
              className="w-11 h-11 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 transition text-white flex items-center justify-center shadow-lg shadow-orange-500/25"
              type="button"
              aria-label="Send"
              title="Send"
            >
              <Send size={18} />
            </button>
          </div>

          <p className="mt-2 text-[10px] font-bold text-gray-400">
            Tip: Try coupon codes like <span className="text-gray-600">WELCOME50</span>,{" "}
            <span className="text-gray-600">FREEDEL</span>, <span className="text-gray-600">EAT30</span>.
          </p>
        </div>
      </div>
    </div>
  );
}