import Link from "next/link";
import { ArrowRight, CheckCircle2, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  description,
  primaryHref = "/register",
  primaryLabel = "Get started",
  secondaryHref = "/search",
  secondaryLabel = "Search platform",
  highlights,
  workflow = [],
  resourceTitle = "Included capabilities"
}: PublicFeaturePageProps) {
  return (
    <PageShell eyebrow={eyebrow} title={title} description={description}>
      <div className="mb-8 flex flex-wrap gap-3">
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

      <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle>{resourceTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item} className="flex gap-3 rounded-md border border-[hsl(var(--border))] p-4 text-sm leading-6">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[hsl(var(--primary))]" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Search className="size-5 text-[hsl(var(--primary))]" />
                <CardTitle>Discovery</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              <p>Search, filtering, categories, recommendations, saved items, and workflow-specific checkout paths.</p>
              <div className="flex flex-wrap gap-2">
                <Badge>SEO</Badge>
                <Badge>Filters</Badge>
                <Badge>Responsive</Badge>
                <Badge>Accessible</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-[hsl(var(--primary))]" />
                <CardTitle>Operations</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Clear account access, trusted payments, wallet activity, notifications, media uploads, reports, and helpful support workflows.
            </CardContent>
          </Card>
        </div>
      </div>

      {workflow.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Workflow</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {workflow.map((step, index) => (
              <div key={step} className="flex gap-3 text-sm leading-6">
                <Badge className="mt-0.5 shrink-0">{String(index + 1).padStart(2, "0")}</Badge>
                <span>{step}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </PageShell>
  );
}
