"use client";

import { useMemo, useState } from "react";
import { Bot, Code2, FileText, ImageIcon, Languages, Megaphone, Music, Sparkles, Video, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const iconMap = {
  bot: Bot,
  code: Code2,
  file: FileText,
  image: ImageIcon,
  languages: Languages,
  megaphone: Megaphone,
  music: Music,
  sparkles: Sparkles,
  video: Video,
  wand: WandSparkles
};

type AIToolItem = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon?: keyof typeof iconMap | string;
  demoUrl?: string;
  pricingPlan?: string;
  apiAvailable?: boolean;
  features?: string[];
};

export function AIToolsGallery({ tools }: { tools: AIToolItem[] }) {
  const [selectedSlug, setSelectedSlug] = useState(tools[0]?.slug ?? "");
  const [prompt, setPrompt] = useState("");
  const [demoOutput, setDemoOutput] = useState("");
  const [clientId] = useState(() => {
    if (typeof window === "undefined") return "";
    const existingClientId = window.localStorage.getItem("mr-creativist-ai-client-id");
    const nextClientId = existingClientId || crypto.randomUUID();
    window.localStorage.setItem("mr-creativist-ai-client-id", nextClientId);
    return nextClientId;
  });
  const [conversationId, setConversationId] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("mr-creativist-ai-conversation-id") || ""
  );
  const selectedTool = useMemo(() => tools.find((tool) => tool.slug === selectedSlug) ?? tools[0], [selectedSlug, tools]);

  async function runDemo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTool || !prompt.trim()) return;

    setDemoOutput("Running demo...");

    try {
      const response = await fetch("/api/ai-tools/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: selectedTool.id ?? selectedTool.slug,
          prompt,
          clientId: clientId || crypto.randomUUID(),
          conversationId
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(payload.error ?? "Demo failed.");

      if (payload.conversationId) {
        setConversationId(payload.conversationId);
        window.localStorage.setItem("mr-creativist-ai-conversation-id", payload.conversationId);
      }
      setDemoOutput(payload.output);
    } catch (error) {
      setDemoOutput(error instanceof Error ? error.message : "Demo failed.");
    }
  }

  if (tools.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Sparkles className="mx-auto mb-3 size-8 text-[hsl(var(--primary))]" />
            <h2 className="text-xl font-semibold">No AI tools yet</h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Create tools to publish them here.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = iconMap[(tool.icon as keyof typeof iconMap) ?? "sparkles"] ?? Sparkles;

          return (
            <Card key={tool.slug}>
              <CardHeader>
                <Icon className="mb-2 size-7 text-[hsl(var(--primary))]" />
                <CardTitle className="uppercase">{tool.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                <p>{tool.description}</p>
                <div className="flex flex-wrap gap-2">
                  {(tool.features ?? []).slice(0, 3).map((feature) => (
                    <span key={feature} className="rounded-full border border-[hsl(var(--border))] px-3 py-1 text-xs font-semibold">
                      {feature}
                    </span>
                  ))}
                </div>
                <Button type="button" variant="outline" className="w-full" onClick={() => setSelectedSlug(tool.slug)}>
                  Try demo
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Card>
            <CardHeader>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Live demo</p>
              <CardTitle>{selectedTool?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={runDemo}>
                <Input value={prompt} onChange={(event) => setPrompt(event.target.value)} required placeholder="Describe what you want this AI tool to create" />
                <Button type="submit">Run demo</Button>
              </form>
              {demoOutput ? (
                <div className="mt-5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 text-sm leading-6">
                  {demoOutput}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
