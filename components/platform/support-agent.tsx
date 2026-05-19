"use client";

import { useMemo, useState } from "react";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SupportMessage = {
  role: "user" | "agent";
  content: string;
};

const quickPrompts = [
  "I need help with my account role or validation.",
  "How do I publish my business listing?",
  "I need help with a course, certificate, or payment.",
  "I want to contact a freelancer or seller."
];

export function SupportAgent() {
  const clientId = useMemo(() => `support-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`, []);
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      role: "agent",
      content:
        "Hello. I am the MR Creativist support agent. Tell me what you need help with and I will guide you to the right page, action, or next step."
    }
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  async function askSupportAgent(prompt: string) {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || loading) return;

    setDraft("");
    setLoading(true);
    setMessages((current) => [...current, { role: "user", content: cleanPrompt }]);

    try {
      const response = await fetch("/api/ai-tools/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          conversationId,
          prompt: `You are the MR Creativist public support agent. Give practical steps, mention exact platform pages when useful, and keep the answer clear.\n\nSupport request: ${cleanPrompt}`
        })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Support agent is temporarily unavailable.");

      setConversationId(payload.conversationId);
      setMessages((current) => [...current, { role: "agent", content: payload.output }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          content:
            error instanceof Error
              ? error.message
              : "Support agent is temporarily unavailable. You can still use the contact options on this page."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
            <Bot className="size-5" />
          </span>
          <div>
            <CardTitle>AI agent support</CardTitle>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Ask about accounts, courses, jobs, businesses, marketplace, payments or messages.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void askSupportAgent(prompt)}
              className="rounded-md border border-[hsl(var(--border))] px-3 py-2 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/25 p-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-md p-3 text-sm leading-6 ${
                message.role === "user"
                  ? "ml-auto max-w-[85%] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "mr-auto max-w-[90%] border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
              }`}
            >
              {message.content}
            </div>
          ))}
          {loading ? (
            <div className="mr-auto flex max-w-[90%] items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-sm text-[hsl(var(--muted-foreground))]">
              <Loader2 className="size-4 animate-spin" />
              Support agent is thinking
            </div>
          ) : null}
        </div>

        <form
          className="grid gap-2 sm:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void askSupportAgent(draft);
          }}
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write your support question..."
            className="min-h-24 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          />
          <Button type="submit" disabled={loading || !draft.trim()} className="min-h-24">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send
          </Button>
        </form>

        <p className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <Sparkles className="size-3.5 text-[hsl(var(--primary))]" />
          Continued questions stay in the same support conversation while you remain on this page.
        </p>
      </CardContent>
    </Card>
  );
}
