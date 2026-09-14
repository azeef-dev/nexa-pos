"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, open]);

    async function handleSend() {
        const text = input.trim();
        if (!text || sending) return;

        const nextMessages = [...messages, { role: "user", content: text }];
        setMessages(nextMessages);
        setInput("");
        setSending(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: nextMessages }),
            });
            const result = await res.json();

            if (!res.ok) {
                setMessages([...nextMessages, { role: "assistant", content: result.error || "Something went wrong." }]);
                return;
            }

            setMessages([...nextMessages, { role: "assistant", content: result.reply }]);
        } catch {
            setMessages([...nextMessages, { role: "assistant", content: "Couldn't reach the assistant — check your connection." }]);
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {open && (
                <div className="mb-3 flex h-96 w-80 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">Business Assistant</p>
                        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
                        {messages.length === 0 && (
                            <p className="pt-8 text-center text-xs text-muted-foreground">
                                Ask about your sales, stock, or customer credit — e.g. &quot;aaj kitni sale hui?&quot;
                            </p>
                        )}
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                                    m.role === "user"
                                        ? "ml-auto bg-primary text-primary-foreground"
                                        : "bg-secondary text-secondary-foreground"
                                )}
                            >
                                {m.content}
                            </div>
                        ))}
                        {sending && <p className="text-xs text-muted-foreground">Thinking...</p>}
                    </div>

                    <div className="flex items-center gap-2 border-t border-border p-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Ask a question..."
                            className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                        />
                        <Button size="sm" onClick={handleSend} disabled={sending || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setOpen((o) => !o)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90"
            >
                {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
            </button>
        </div>
    );
}
