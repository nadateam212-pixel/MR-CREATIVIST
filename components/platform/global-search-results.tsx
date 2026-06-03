"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Building2, Bot, GraduationCap, Loader2, Newspaper, Search, ShoppingBag, UserRoundCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  href: string;
  image?: string;
};

const typeIcons = {
  course: GraduationCap,
  product: ShoppingBag,
  consulting: UserRoundCheck,
  job: BriefcaseBusiness,
  business: Building2,
  freelancer: UserRoundCheck,
  blog: Newspaper,
  "ai-tool": Bot
};

function resultIcon(type: string) {
  return typeIcons[type as keyof typeof typeIcons] ?? Search;
}

export function GlobalSearchResults({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(Boolean(initialQuery));
  const [message, setMessage] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();

    for (const result of results) {
      map.set(result.type, [...(map.get(result.type) ?? []), result]);
    }

    return Array.from(map.entries());
  }, [results]);

  useEffect(() => {
    const controller = new AbortController();

    async function search() {
      setLoading(true);
      setMessage("");

      try {
        const params = new URLSearchParams();
        if (submittedQuery.trim()) params.set("q", submittedQuery.trim());
        const response = await fetch(`/api/search?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal
        });
        const payload = await response.json();

        if (!response.ok) throw new Error(payload.error ?? "Search failed.");

        setResults(payload.results ?? []);
        setMessage(payload.results?.length ? "" : "No results matched that search.");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setMessage(error instanceof Error ? error.message : "Search failed.");
        }
      } finally {
        setLoading(false);
      }
    }

    void search();

    return () => controller.abort();
  }, [submittedQuery]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <section className="grid gap-4 border-b border-[hsl(var(--border))] pb-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Search</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Platform records</h1>
        </div>
        <form
          className="grid gap-3 sm:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedQuery(query);
          }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-12 pl-12"
              placeholder="Search courses, products, jobs, people, businesses, articles..."
            />
          </div>
          <Button type="submit" className="h-12">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Search
          </Button>
        </form>
      </section>

      <section className="mt-8 space-y-8">
        {loading ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-sm text-[hsl(var(--muted-foreground))]">
              <Loader2 className="size-4 animate-spin" />
              Searching platform records
            </CardContent>
          </Card>
        ) : null}

        {message && !loading ? (
          <Card>
            <CardContent className="p-6 text-sm text-[hsl(var(--muted-foreground))]">{message}</CardContent>
          </Card>
        ) : null}

        {!loading && grouped.map(([type, items]) => {
          const Icon = resultIcon(type);

          return (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="size-5 text-[hsl(var(--primary))]" />
                <h2 className="text-xl font-semibold capitalize">{type.replace("-", " ")}</h2>
                <Badge>{items.length}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-colors hover:bg-[hsl(var(--muted))]/45"
                  >
                    <div className="flex gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--primary))]">
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{result.title}</span>
                        {result.subtitle ? (
                          <span className="mt-1 block truncate text-xs text-[hsl(var(--muted-foreground))]">{result.subtitle}</span>
                        ) : null}
                        {result.description ? (
                          <span className="mt-2 line-clamp-2 block text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                            {result.description}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
