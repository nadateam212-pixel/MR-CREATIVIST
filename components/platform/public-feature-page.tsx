import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";

type PublicFeaturePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  highlights: string[];
  workflow?: string[];
  resourceTitle?: string;
};

export function PublicFeaturePage({
  eyebrow,
  title,
  primaryHref = "/register",
  primaryLabel = "Get started",
  secondaryHref = "/search",
  secondaryLabel = "Search platform",
  highlights,
  resourceTitle = "Included capabilities"
}: PublicFeaturePageProps) {
  return (
    <PageShell eyebrow={eyebrow} title={title}>
      <div className="mb-5 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={primaryHref}>
            {primaryLabel}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={secondaryHref}>{secondaryLabel}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-[hsl(var(--primary))]" />
            <CardTitle>{resourceTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {highlights.map((item) => (
            <div key={item} className="flex gap-3 rounded-md border border-[hsl(var(--border))] p-4 text-sm leading-6">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[hsl(var(--primary))]" />
              <span>{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
