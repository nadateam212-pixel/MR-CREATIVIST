"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import {
  Bot,
  BookOpen,
  Code2,
  Copy,
  Download,
  FileText,
  ImageIcon,
  Loader2,
  Mail,
  Search,
  Share2,
  ShoppingCart,
  Sparkles,
  Video,
  Wand2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";

type ToolInput = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
};

type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  icon: typeof Bot;
  color: string;
  category: string;
  inputs: ToolInput[];
};

type AIOutput = {
  error?: string;
  url?: string;
  revised_prompt?: string;
  output?: string;
  [key: string]: unknown;
};

const tools: ToolDefinition[] = [
  {
    id: "text",
    name: "AI Chat",
    description: "Generate text, answers, and creative content",
    icon: Bot,
    color: "from-blue-500 to-cyan-500",
    category: "text",
    inputs: [{ name: "prompt", label: "What do you want to generate?", type: "textarea", placeholder: "Ask anything..." }]
  },
  {
    id: "blog",
    name: "Blog Post Generator",
    description: "Create full blog posts with SEO optimization",
    icon: FileText,
    color: "from-purple-500 to-pink-500",
    category: "writing",
    inputs: [
      { name: "topic", label: "Blog Topic", type: "text", placeholder: "Enter a topic..." },
      {
        name: "keywords",
        label: "Keywords (comma-separated, optional)",
        type: "text",
        placeholder: "keyword1, keyword2, keyword3"
      }
    ]
  },
  {
    id: "social",
    name: "Social Media Content",
    description: "Generate posts for all social platforms",
    icon: Share2,
    color: "from-orange-500 to-red-500",
    category: "writing",
    inputs: [
      { name: "topic", label: "Content Topic", type: "text", placeholder: "What should I post about?" },
      {
        name: "platform",
        label: "Platform (optional)",
        type: "select",
        options: ["linkedin", "twitter", "instagram", "facebook", "tiktok"]
      }
    ]
  },
  {
    id: "image",
    name: "AI Image Generator",
    description: "Generate real production images with MrCreativist.AI",
    icon: ImageIcon,
    color: "from-indigo-500 to-purple-500",
    category: "image",
    inputs: [
      { name: "prompt", label: "Describe the image you want", type: "textarea", placeholder: "Be specific about subject, style, colors, and mood..." },
      {
        name: "size",
        label: "Image Size",
        type: "select",
        options: ["1024x1024", "1792x1024", "1024x1792"]
      }
    ]
  },
  {
    id: "code",
    name: "Code Generator",
    description: "Generate code in any programming language",
    icon: Code2,
    color: "from-green-500 to-emerald-500",
    category: "development",
    inputs: [
      { name: "description", label: "What code do you need?", type: "textarea", placeholder: "Describe the code..." },
      {
        name: "language",
        label: "Programming Language",
        type: "text",
        placeholder: "TypeScript, Python, JavaScript, etc."
      }
    ]
  },
  {
    id: "course",
    name: "Course Outline Generator",
    description: "Create complete course structures",
    icon: BookOpen,
    color: "from-yellow-500 to-orange-500",
    category: "education",
    inputs: [
      { name: "topic", label: "Course Topic", type: "text", placeholder: "What course to create?" },
      {
        name: "level",
        label: "Difficulty Level",
        type: "select",
        options: ["beginner", "intermediate", "advanced"]
      }
    ]
  },
  {
    id: "seo",
    name: "SEO Optimizer",
    description: "Optimize content for search engines",
    icon: Search,
    color: "from-rose-500 to-pink-500",
    category: "marketing",
    inputs: [
      { name: "content", label: "Your Content", type: "textarea", placeholder: "Paste your content here..." },
      {
        name: "targetKeywords",
        label: "Target Keywords (comma-separated, optional)",
        type: "text",
        placeholder: "keyword1, keyword2"
      }
    ]
  },
  {
    id: "email",
    name: "Email Template Generator",
    description: "Create professional email templates",
    icon: Mail,
    color: "from-cyan-500 to-blue-500",
    category: "marketing",
    inputs: [
      { name: "purpose", label: "Email Purpose", type: "text", placeholder: "Newsletter, welcome, promotional..." },
      { name: "brand", label: "Brand Name (optional)", type: "text", placeholder: "Your brand name" }
    ]
  },
  {
    id: "product",
    name: "Product Description",
    description: "Write compelling product descriptions",
    icon: ShoppingCart,
    color: "from-teal-500 to-cyan-500",
    category: "ecommerce",
    inputs: [
      { name: "productName", label: "Product Name", type: "text", placeholder: "Enter product name..." },
      {
        name: "features",
        label: "Key Features (comma-separated)",
        type: "text",
        placeholder: "feature1, feature2, feature3"
      }
    ]
  },
  {
    id: "video",
    name: "Video Script Generator",
    description: "Create professional video scripts",
    icon: Video,
    color: "from-violet-500 to-purple-500",
    category: "content",
    inputs: [
      { name: "topic", label: "Video Topic", type: "text", placeholder: "What's the video about?" },
      {
        name: "videoLength",
        label: "Duration (optional)",
        type: "text",
        placeholder: "60 seconds, 5 minutes, etc."
      }
    ]
  }
];

export function AIToolsGalleryPro() {
  const { t } = useI18n();
  const [selectedTool, setSelectedTool] = useState(tools[0]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<AIOutput>({});
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(() => {
    if (typeof window === "undefined") return "";
    const existingClientId = window.localStorage.getItem("mr-creativist-ai-client-id");
    const nextClientId = existingClientId || crypto.randomUUID();
    window.localStorage.setItem("mr-creativist-ai-client-id", nextClientId);
    return nextClientId;
  });
  const [conversationId, setConversationId] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("mr-creativist-ai-conversation-id") || ""
  );

  const filteredTools = tools;
  const SelectedIcon = selectedTool.icon;

  function handleInputChange(key: string, value: string) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  async function handleGenerate() {
    setLoading(true);
    setOutput({});

    try {
      const endpoint = `/api/ai-tools/${selectedTool.id}`;
      const body: Record<string, string | string[]> = { ...inputs };

      if (inputs.keywords) {
        body.keywords = inputs.keywords.split(",").map((keyword) => keyword.trim()).filter(Boolean);
      }
      if (inputs.targetKeywords) {
        body.targetKeywords = inputs.targetKeywords.split(",").map((keyword) => keyword.trim()).filter(Boolean);
      }
      if (inputs.features) {
        body.features = inputs.features.split(",").map((feature) => feature.trim()).filter(Boolean);
      }
      if (selectedTool.id !== "image") {
        if (clientId) {
          body.clientId = clientId;
        } else {
          const nextClientId = crypto.randomUUID();
          setClientId(nextClientId);
          window.localStorage.setItem("mr-creativist-ai-client-id", nextClientId);
          body.clientId = nextClientId;
        }
        if (conversationId) body.conversationId = conversationId;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (response.ok && selectedTool.id !== "image" && data.conversationId) {
        setConversationId(data.conversationId);
        window.localStorage.setItem("mr-creativist-ai-conversation-id", data.conversationId);
      }

      setOutput(response.ok ? data : { error: data.error || "Generation failed" });
    } catch (error) {
      setOutput({ error: error instanceof Error ? error.message : "An error occurred" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto grid max-w-7xl px-3 py-3 sm:px-6 lg:grid-cols-[18rem_1fr] lg:py-6">
        <aside className="hidden border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] pb-5 lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-5rem)] lg:border-b-0 lg:border-r lg:pr-4">
          <div className="flex items-center gap-3 px-1">
            <div className="flex size-10 items-center justify-center rounded-md bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-lg font-black">MrCreativist.AI Studio</p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">{t("ai.freeTier")}</p>
            </div>
          </div>

          <div className="mt-6 grid max-h-[68vh] gap-1 overflow-auto pr-1 lg:max-h-[calc(100vh-12rem)]">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = selectedTool.id === tool.id;

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    setSelectedTool(tool);
                    setInputs({});
                    setOutput({});
                  }}
                  className={cn(
                    "grid grid-cols-[2rem_1fr] gap-3 rounded-md border p-3 text-left transition-colors",
                    isSelected
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/12 text-[hsl(var(--foreground))]"
                      : "border-transparent text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/45 hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  <span className={cn("flex size-8 items-center justify-center rounded-md text-white", `bg-gradient-to-r ${tool.color}`)}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{tool.name}</span>
                    <span className="mt-1 block truncate text-xs text-[hsl(var(--muted-foreground))]">{tool.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 py-0 lg:pl-8">
          <section className="hidden gap-4 lg:grid lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-[hsl(var(--primary))]/25 bg-[hsl(var(--primary))]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                <Sparkles className="size-4 text-[hsl(var(--primary))]" />
                {t("ai.poweredBy")}
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">{t("ai.title")}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[hsl(var(--muted-foreground))]">
                {t("ai.subtitle")}
              </p>
            </div>
            <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
              <span className="font-semibold text-[hsl(var(--foreground))]">{filteredTools.length}</span> {t("ai.toolsReady").toLowerCase()}
            </div>
          </section>

          <Card
            className="mt-0 border-[hsl(var(--primary))]/30 bg-[hsl(var(--card))] shadow-xl lg:mt-8"
            style={{ boxShadow: "0 22px 70px hsl(var(--primary) / 0.1)" }}
          >
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-md p-3 text-white", `bg-gradient-to-r ${selectedTool.color}`)}>
                    <SelectedIcon className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-[hsl(var(--foreground))] sm:text-2xl">{selectedTool.name}</CardTitle>
                    <CardDescription className="mt-1 hidden text-[hsl(var(--muted-foreground))] sm:block">{selectedTool.description}</CardDescription>
                  </div>
                </div>
                <span className="w-fit rounded-md border border-[hsl(var(--primary))]/25 bg-[hsl(var(--primary))]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[hsl(var(--foreground))]">
                  {selectedTool.category}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-4 sm:space-y-6 sm:p-6">
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
                {filteredTools.map((tool) => {
                  const Icon = tool.icon;
                  const isSelected = selectedTool.id === tool.id;

                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => {
                        setSelectedTool(tool);
                        setInputs({});
                        setOutput({});
                      }}
                      className={cn(
                        "flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-black transition-colors",
                        isSelected
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                      )}
                    >
                      <Icon className="size-4" />
                      <span className="whitespace-nowrap">{tool.name.replace(" Generator", "").replace("AI ", "")}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-4">
                {selectedTool.inputs.map((input) => (
                  <label key={input.name} className="grid gap-2 text-sm font-semibold text-[hsl(var(--foreground))]">
                    {input.label}
                    {input.type === "textarea" ? (
                      <textarea
                        value={inputs[input.name] || ""}
                        onChange={(event) => handleInputChange(input.name, event.target.value)}
                        placeholder={input.placeholder}
                        disabled={loading}
                        className="min-h-36 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20 disabled:opacity-50"
                      />
                    ) : input.type === "select" ? (
                      <select
                        value={inputs[input.name] || ""}
                        onChange={(event) => handleInputChange(input.name, event.target.value)}
                        disabled={loading}
                        className="h-11 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-[hsl(var(--foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20 disabled:opacity-50"
                      >
                        <option value="">Select an option</option>
                        {input.options?.map((option) => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type="text"
                        value={inputs[input.name] || ""}
                        onChange={(event) => handleInputChange(input.name, event.target.value)}
                        placeholder={input.placeholder}
                        disabled={loading}
                        className="h-11 border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))]"
                      />
                    )}
                  </label>
                ))}
              </div>

              <Button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !Object.values(inputs).some((value) => value.trim())}
                className="h-12 w-full text-base font-bold disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    {t("ai.generating")}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 size-5" />
                    {t("ai.generateGemini")}
                  </>
                )}
              </Button>

              {output && Object.keys(output).length > 0 ? (
                <div className="space-y-4 rounded-md border border-[hsl(var(--primary))]/30 bg-[hsl(var(--background))] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{t("ai.output")}</h3>
                    <button type="button" onClick={() => setOutput({})} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" aria-label="Close output">
                      <X className="size-4" />
                    </button>
                  </div>

                  {output.error ? (
                    <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-red-300">{output.error}</div>
                  ) : selectedTool.id === "image" ? (
                    <div className="space-y-3">
                      {output.url ? (
                        <>
                          <img src={output.url} alt="Generated image" className="h-auto w-full rounded-md border border-[hsl(var(--border))]" />
                          <Button asChild className="w-full">
                            <a href={output.url} download>
                              <Download className="mr-2 size-4" />
                              {t("ai.download")}
                            </a>
                          </Button>
                        </>
                      ) : null}
                      {output.revised_prompt ? (
                        <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                          <strong>{t("ai.refinedPrompt")}:</strong> {output.revised_prompt}
                        </p>
                      ) : null}
                    </div>
                  ) : selectedTool.id === "text" ? (
                    <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md bg-[hsl(var(--muted))] p-4 font-mono text-sm text-[hsl(var(--foreground))]">
                      {String(output.output ?? "")}
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      <pre className="overflow-x-auto rounded-md bg-[hsl(var(--muted))] p-4 font-mono text-sm text-[hsl(var(--foreground))]">
                        {JSON.stringify(output, null, 2)}
                      </pre>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={() => {
                      const text = selectedTool.id === "text" ? String(output.output ?? "") : JSON.stringify(output, null, 2);
                      void navigator.clipboard.writeText(text);
                    }}
                    variant="outline"
                    className="w-full border-[hsl(var(--primary))]/30 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--primary))]/10"
                  >
                    <Copy className="mr-2 size-4" />
                    {t("ai.copy")}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
